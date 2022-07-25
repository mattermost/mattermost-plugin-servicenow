package main

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"

	"path/filepath"
	"runtime/debug"

	"github.com/Brightscout/mattermost-plugin-servicenow/server/constants"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/serializer"
	"github.com/gorilla/mux"
	"github.com/mattermost/mattermost-server/v5/model"
	"github.com/pkg/errors"
	"golang.org/x/oauth2"
)

// InitAPI initializes the REST API
func (p *Plugin) InitAPI() *mux.Router {
	r := mux.NewRouter()
	r.Use(p.withRecovery)

	p.handleStaticFiles(r)
	s := r.PathPrefix("/api/v1").Subrouter()

	// Add custom routes here
	s.HandleFunc(constants.PathOAuth2Connect, p.checkAuth(p.httpOAuth2Connect)).Methods(http.MethodGet)
	s.HandleFunc(constants.PathOAuth2Complete, p.checkAuth(p.httpOAuth2Complete)).Methods(http.MethodGet)
	s.HandleFunc(constants.PathDownloadUpdateSet, p.downloadUpdateSet).Methods(http.MethodGet)
	s.HandleFunc(constants.PathCreateSubscription, p.checkAuth(p.checkOAuth(p.createSubscription))).Methods(http.MethodPost)
	s.HandleFunc(constants.PathGetAllSubscriptions, p.checkAuth(p.checkOAuth(p.getAllSubscriptions))).Methods(http.MethodGet)
	s.HandleFunc(constants.PathDeleteSubscription, p.checkAuth(p.checkOAuth(p.deleteSubscription))).Methods(http.MethodDelete)
	s.HandleFunc(constants.PathEditSubscription, p.checkAuth(p.checkOAuth(p.editSubscription))).Methods(http.MethodPatch)

	// API for POC. TODO: Remove this endpoint later
	s.HandleFunc("/notification", p.checkAuthBySecret(p.handleNotification)).Methods(http.MethodPost)

	// 404 handler
	r.Handle("{anything:.*}", http.NotFoundHandler())
	return r
}

func (p *Plugin) checkAuth(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Header.Get(constants.HeaderMattermostUserID)
		if userID == "" {
			http.Error(w, "Not authorized", http.StatusUnauthorized)
			return
		}

		handler(w, r)
	}
}

func (p *Plugin) checkOAuth(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Header.Get(constants.HeaderMattermostUserID)
		user, err := p.GetUser(userID)
		if err != nil {
			if errors.Is(err, ErrNotFound) {
				http.Error(w, "You have not connected your Mattermost account to ServiceNow.", http.StatusUnauthorized)
			} else {
				p.API.LogError("Unable to get user", "Error", err.Error())
				http.Error(w, fmt.Sprintf("Something went wrong. Error: %s", err.Error()), http.StatusInternalServerError)
			}
			return
		}

		token, err := p.ParseAuthToken(user.OAuth2Token)
		if err != nil {
			p.API.LogError("Unable to parse oauth token", "Error", err.Error())
			http.Error(w, fmt.Sprintf("Something went wrong. Error: %s", err.Error()), http.StatusInternalServerError)
			return
		}

		ctx := context.WithValue(r.Context(), constants.ContextTokenKey, token)
		r = r.Clone(ctx)
		handler(w, r)
	}
}

// checkAuthBySecret verifies if provided request is performed by an authorized source.
func (p *Plugin) checkAuthBySecret(handleFunc http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if status, err := verifyHTTPSecret(p.getConfiguration().WebhookSecret, r.FormValue("secret")); err != nil {
			p.API.LogError("Invalid secret", "Error", err.Error())
			http.Error(w, fmt.Sprintf("Invalid Secret. Error: %s", err.Error()), status)
			return
		}

		handleFunc(w, r)
	}
}

func (p *Plugin) downloadUpdateSet(w http.ResponseWriter, r *http.Request) {
	bundlePath, err := p.API.GetBundlePath()
	if err != nil {
		p.API.LogError("Error in getting the bundle path", "Error", err.Error())
		http.Error(w, fmt.Sprintf("Error in getting the bundle path. Error: %s", err.Error()), http.StatusInternalServerError)
		return
	}

	xmlPath := filepath.Join(bundlePath, "assets", constants.UpdateSetFilename)
	fileBytes, err := ioutil.ReadFile(xmlPath)
	if err != nil {
		p.API.LogError("Error in reading the file", "Error", err.Error())
		http.Error(w, fmt.Sprintf("Error in reading the file. Error: %s", err.Error()), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", constants.UpdateSetFilename))
	w.Header().Set("Content-Type", http.DetectContentType(fileBytes))
	_, _ = w.Write(fileBytes)
}

func (p *Plugin) handleNotification(w http.ResponseWriter, r *http.Request) {
	v := make(map[string]string)
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&v); err != nil {
		p.API.LogError("Error in decoding body", "Error", err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	p.API.LogInfo(fmt.Sprintf("%+v", v))
	returnStatusOK(w, v)
}

func (p *Plugin) httpOAuth2Connect(w http.ResponseWriter, r *http.Request) {
	mattermostUserID := r.Header.Get(constants.HeaderMattermostUserID)
	redirectURL, err := p.InitOAuth2(mattermostUserID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	http.Redirect(w, r, redirectURL, http.StatusFound)
}

func (p *Plugin) httpOAuth2Complete(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "missing authorization code", http.StatusBadRequest)
		return
	}

	state := r.URL.Query().Get("state")
	if state == "" {
		http.Error(w, "missing authorization state", http.StatusBadRequest)
		return
	}

	mattermostUserID := r.Header.Get(constants.HeaderMattermostUserID)
	if err := p.CompleteOAuth2(mattermostUserID, code, state); err != nil {
		p.API.LogError("Unable to complete OAuth.", "UserID", mattermostUserID, "Error", err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	html := `
<!DOCTYPE html>
<html>
	<head>
		<script>
			window.close();
		</script>
	</head>
	<body>
		<p>Completed connecting to ServiceNow. Please close this window.</p>
	</body>
</html>
`

	w.Header().Set("Content-Type", "text/html")
	if _, err := w.Write([]byte(html)); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (p *Plugin) createSubscription(w http.ResponseWriter, r *http.Request) {
	subcription, err := serializer.SubscriptionFromJSON(r.Body)
	if err != nil {
		p.API.LogError("Error in unmarshalling the request body", "Error", err.Error())
		http.Error(w, fmt.Sprintf("Error in unmarshalling the request body. Error: %s", err.Error()), http.StatusBadRequest)
		return
	}

	if err = subcription.IsValidForCreation(p.getConfiguration().MattermostSiteURL); err != nil {
		p.API.LogError("Error in validating the request body", "Error", err.Error())
		http.Error(w, fmt.Sprintf("Error in validating the request body. Error: %s", err.Error()), http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	token := ctx.Value(constants.ContextTokenKey).(*oauth2.Token)
	client := p.NewClient(ctx, token)
	exists, statusCode, err := client.CheckForDuplicateSubscription(subcription)
	if err != nil {
		p.API.LogError("Error in checking for duplicate subscription", "Error", err.Error())
		http.Error(w, err.Error(), statusCode)
		return
	}

	if exists {
		http.Error(w, "Subscription already exists", http.StatusBadRequest)
		return
	}

	if statusCode, err = client.CreateSubscription(subcription); err != nil {
		p.API.LogError("Error in creating subscription", "Error", err.Error())
		http.Error(w, err.Error(), statusCode)
		return
	}

	w.WriteHeader(statusCode)
	returnStatusOK(w, make(map[string]string))
}

func (p *Plugin) getAllSubscriptions(w http.ResponseWriter, r *http.Request) {
	page, err := GetPaginationParamsFromRequest(r, constants.QueryParamPage)
	if err != nil {
		p.API.LogError("Invalid query param", "Query param", constants.QueryParamPage, "Error", err.Error())
		page = constants.DefaultPage
	}

	perPage, err := GetPaginationParamsFromRequest(r, constants.QueryParamPerPage)
	if err != nil {
		p.API.LogError("Invalid query param", "Query param", constants.QueryParamPerPage, "Error", err.Error())
		perPage = constants.DefaultPerPage
	} else if perPage > constants.MaxPerPage {
		perPage = constants.DefaultPerPage
	}

	channelID := r.URL.Query().Get(constants.QueryParamChannelID)
	if channelID != "" && !model.IsValidId(channelID) {
		p.API.LogError("Invalid query param", "Query param", constants.QueryParamChannelID)
		http.Error(w, "Query param channelID is not valid", http.StatusBadRequest)
		return
	}

	userID := r.URL.Query().Get(constants.QueryParamUserID)
	if userID != "" && !model.IsValidId(userID) {
		p.API.LogError("Invalid query param", "Query param", constants.QueryParamUserID)
		http.Error(w, "Query param userID is not valid", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	token := ctx.Value(constants.ContextTokenKey).(*oauth2.Token)
	client := p.NewClient(ctx, token)
	subscriptions, statusCode, err := client.GetAllSubscriptions(channelID, userID, fmt.Sprint(perPage), fmt.Sprint(page*perPage))
	if err != nil {
		p.API.LogError("Error in getting all subscriptions", "Error", err.Error())
		http.Error(w, fmt.Sprintf("Error in getting all subscriptions. Error: %s", err.Error()), statusCode)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	result, err := json.Marshal(subscriptions)
	if err != nil || string(result) == "null" {
		_, _ = w.Write([]byte("[]"))
	} else {
		_, _ = w.Write(result)
	}
}

func (p *Plugin) deleteSubscription(w http.ResponseWriter, r *http.Request) {
	pathParams := mux.Vars(r)
	subscriptionID := pathParams["subscription_id"]
	ctx := r.Context()
	token := ctx.Value(constants.ContextTokenKey).(*oauth2.Token)
	client := p.NewClient(ctx, token)
	if statusCode, err := client.DeleteSubscription(subscriptionID); err != nil {
		p.API.LogError("Error in deleting the subscription", "subscriptionID", subscriptionID, "Error", err.Error())
		responseMessage := "No record found"
		if statusCode != http.StatusNotFound {
			responseMessage = fmt.Sprintf("Error in deleting the subscription. Error: %s", err.Error())
		}
		http.Error(w, responseMessage, statusCode)
		return
	}

	returnStatusOK(w, make(map[string]string))
}

func (p *Plugin) editSubscription(w http.ResponseWriter, r *http.Request) {
	pathParams := mux.Vars(r)
	subscriptionID := pathParams["subscription_id"]
	subcription, err := serializer.SubscriptionFromJSON(r.Body)
	if err != nil {
		p.API.LogError("Error in unmarshalling the request body", "Error", err.Error())
		http.Error(w, fmt.Sprintf("Error in unmarshalling the request body. Error: %s", err.Error()), http.StatusBadRequest)
		return
	}

	if err = subcription.IsValidForUpdation(p.getConfiguration().MattermostSiteURL); err != nil {
		p.API.LogError("Error in validating the request body", "Error", err.Error())
		http.Error(w, fmt.Sprintf("Error in validating the request body. Error: %s", err.Error()), http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	token := ctx.Value(constants.ContextTokenKey).(*oauth2.Token)
	client := p.NewClient(ctx, token)
	if statusCode, err := client.EditSubscription(subscriptionID, subcription); err != nil {
		p.API.LogError("Error in editing the subscription", "subscriptionID", subscriptionID, "Error", err.Error())
		responseMessage := "No record found"
		if statusCode != http.StatusNotFound {
			responseMessage = fmt.Sprintf("Error in editing the subscription. Error: %s", err.Error())
		}
		http.Error(w, responseMessage, statusCode)
		return
	}

	returnStatusOK(w, make(map[string]string))
}

// TODO: Modify this function to work without taking a map in the params
func returnStatusOK(w http.ResponseWriter, m map[string]string) {
	w.Header().Set("Content-Type", "application/json")
	m[model.STATUS] = model.STATUS_OK
	_, _ = w.Write([]byte(model.MapToJson(m)))
}

// handleStaticFiles handles the static files under the assets directory.
func (p *Plugin) handleStaticFiles(r *mux.Router) {
	bundlePath, err := p.API.GetBundlePath()
	if err != nil {
		p.API.LogWarn("Failed to get bundle path.", "Error", err.Error())
		return
	}

	// This will serve static files from the 'assets' directory under '/static/<filename>'
	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir(filepath.Join(bundlePath, "assets")))))
}

// withRecovery allows recovery from panics
func (p *Plugin) withRecovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if x := recover(); x != nil {
				p.API.LogError("Recovered from a panic",
					"url", r.URL.String(),
					"error", x,
					"stack", string(debug.Stack()))
			}
		}()

		next.ServeHTTP(w, r)
	})
}

// Ref: mattermost plugin confluence(https://github.com/mattermost/mattermost-plugin-confluence/blob/3ee2aa149b6807d14fe05772794c04448a17e8be/server/controller/main.go#L97)
func verifyHTTPSecret(expected, got string) (status int, err error) {
	for {
		if subtle.ConstantTimeCompare([]byte(got), []byte(expected)) == 1 {
			break
		}

		unescaped, _ := url.QueryUnescape(got)
		if unescaped == got {
			return http.StatusForbidden, errors.New("request URL: secret did not match")
		}
		got = unescaped
	}

	return 0, nil
}
