package plugin

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"strings"
	"sync"

	"path/filepath"
	"runtime/debug"

	"github.com/Brightscout/mattermost-plugin-servicenow/server/constants"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/serializer"
	"github.com/gorilla/mux"
	"github.com/mattermost/mattermost-server/v5/model"
	"github.com/pkg/errors"
)

// InitAPI initializes the REST API
func (p *Plugin) InitAPI() *mux.Router {
	r := mux.NewRouter()
	r.Use(p.withRecovery)

	p.handleStaticFiles(r)
	s := r.PathPrefix(constants.PathPrefix).Subrouter()

	// Add custom routes here
	s.HandleFunc(constants.PathOAuth2Connect, p.checkAuth(p.httpOAuth2Connect)).Methods(http.MethodGet)
	s.HandleFunc(constants.PathOAuth2Complete, p.checkAuth(p.httpOAuth2Complete)).Methods(http.MethodGet)

	s.HandleFunc(constants.PathGetConnected, p.checkAuth(p.getConnected)).Methods(http.MethodGet)

	s.HandleFunc(constants.PathDownloadUpdateSet, p.downloadUpdateSet).Methods(http.MethodGet)
	s.HandleFunc(constants.PathCreateSubscription, p.checkAuth(p.checkOAuth(p.checkSubscriptionsConfigured(p.createSubscription)))).Methods(http.MethodPost)
	s.HandleFunc(constants.PathGetAllSubscriptions, p.checkAuth(p.checkOAuth(p.checkSubscriptionsConfigured(p.getAllSubscriptions)))).Methods(http.MethodGet)
	s.HandleFunc(constants.PathDeleteSubscription, p.checkAuth(p.checkOAuth(p.checkSubscriptionsConfigured(p.deleteSubscription)))).Methods(http.MethodDelete)
	s.HandleFunc(constants.PathEditSubscription, p.checkAuth(p.checkOAuth(p.checkSubscriptionsConfigured(p.editSubscription)))).Methods(http.MethodPatch)
	s.HandleFunc(constants.PathGetUserChannelsForTeam, p.checkAuth(p.getUserChannelsForTeam)).Methods(http.MethodGet)
	s.HandleFunc(constants.PathSearchRecords, p.checkAuth(p.checkOAuth(p.searchRecordsInServiceNow))).Methods(http.MethodGet)
	s.HandleFunc(constants.PathGetSingleRecord, p.checkAuth(p.checkOAuth(p.getRecordFromServiceNow))).Methods(http.MethodGet)
	s.HandleFunc(constants.PathShareRecord, p.checkAuth(p.checkOAuth(p.shareRecordInChannel))).Methods(http.MethodPost)
	s.HandleFunc(constants.PathCommentsForRecord, p.checkAuth(p.checkOAuth(p.getCommentsForRecord))).Methods(http.MethodGet)
	s.HandleFunc(constants.PathCommentsForRecord, p.checkAuth(p.checkOAuth(p.addCommentsOnRecord))).Methods(http.MethodPost)
	s.HandleFunc(constants.PathGetStatesForRecordType, p.checkAuth(p.checkOAuth(p.getStatesForRecordType))).Methods(http.MethodGet)
	s.HandleFunc(constants.PathUpdateStateOfRecord, p.checkAuth(p.checkOAuth(p.updateStateOfRecord))).Methods(http.MethodPatch)
	s.HandleFunc(constants.PathProcessNotification, p.checkAuthBySecret(p.handleNotification)).Methods(http.MethodPost)
	s.HandleFunc(constants.PathGetConfig, p.checkAuth(p.getConfig)).Methods(http.MethodGet)

	// 404 handler
	r.Handle("{anything:.*}", http.NotFoundHandler())
	return r
}

func (p *Plugin) handleAPIError(w http.ResponseWriter, apiErr *serializer.APIErrorResponse) {
	w.Header().Set("Content-Type", "application/json")
	errorBytes, err := json.Marshal(apiErr)
	if err != nil {
		p.API.LogError("Failed to marshal API error", "error", err.Error())
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.WriteHeader(apiErr.StatusCode)

	if _, err = w.Write(errorBytes); err != nil {
		p.API.LogError("Failed to write JSON response", "error", err.Error())
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}

func (p *Plugin) writeJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	b, err := json.Marshal(v)
	if err != nil {
		p.API.LogError("Failed to marshal JSON response", "error", err.Error())
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	if _, err = w.Write(b); err != nil {
		p.API.LogError("Failed to write JSON response", "error", err.Error())
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}

func (p *Plugin) checkAuth(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Header.Get(constants.HeaderMattermostUserID)
		if userID == "" {
			p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusUnauthorized, Message: constants.ErrorNotAuthorized})
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
				p.handleAPIError(w, &serializer.APIErrorResponse{ID: constants.APIErrorIDNotConnected, StatusCode: http.StatusUnauthorized, Message: constants.APIErrorNotConnected})
			} else {
				p.API.LogError("Unable to get the user", "Error", err.Error())
				p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusInternalServerError, Message: fmt.Sprintf("%s Error: %s", constants.ErrorGeneric, err.Error())})
			}
			return
		}

		token, err := p.ParseAuthToken(user.OAuth2Token)
		if err != nil {
			p.API.LogError("Unable to parse oauth token", "Error", err.Error())
			p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusInternalServerError, Message: fmt.Sprintf("%s Error: %s", constants.ErrorGeneric, err.Error())})
			return
		}

		ctx := context.WithValue(r.Context(), constants.ContextTokenKey, token)
		r = r.Clone(ctx)
		handler(w, r)
	}
}

func (p *Plugin) checkSubscriptionsConfigured(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		client := p.GetClientFromRequest(r)
		if _, err := client.ActivateSubscriptions(); err != nil {
			if strings.EqualFold(err.Error(), constants.APIErrorIDSubscriptionsNotConfigured) {
				p.handleAPIError(w, &serializer.APIErrorResponse{ID: constants.APIErrorIDSubscriptionsNotConfigured, StatusCode: http.StatusBadRequest, Message: constants.APIErrorSubscriptionsNotConfigured})
				return
			}

			if strings.EqualFold(err.Error(), constants.APIErrorIDSubscriptionsNotAuthorized) {
				p.handleAPIError(w, &serializer.APIErrorResponse{ID: constants.APIErrorIDSubscriptionsNotAuthorized, StatusCode: http.StatusUnauthorized, Message: constants.APIErrorSubscriptionsNotAuthorized})
				return
			}

			p.API.LogError("Unable to check or activate subscriptions in ServiceNow.", "Error", err.Error())
			p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusInternalServerError, Message: err.Error()})
			return
		}

		handler(w, r)
	}
}

func (p *Plugin) getConfig(w http.ResponseWriter, r *http.Request) {
	p.writeJSON(w, p.getConfiguration())
}

func (p *Plugin) getConnected(w http.ResponseWriter, r *http.Request) {
	resp := &serializer.ConnectedResponse{
		Connected: false,
	}

	userID := r.Header.Get(constants.HeaderMattermostUserID)
	if _, err := p.GetUser(userID); err == nil {
		resp.Connected = true
	}

	p.writeJSON(w, resp)
}

// checkAuthBySecret verifies if provided request is performed by an authorized source.
func (p *Plugin) checkAuthBySecret(handleFunc http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if status, err := verifyHTTPSecret(p.getConfiguration().WebhookSecret, r.FormValue("secret")); err != nil {
			p.API.LogError("Invalid secret", "Error", err.Error())
			p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: status, Message: fmt.Sprintf("Invalid Secret. Error: %s", err.Error())})
			return
		}

		handleFunc(w, r)
	}
}

func (p *Plugin) downloadUpdateSet(w http.ResponseWriter, r *http.Request) {
	bundlePath, err := p.API.GetBundlePath()
	if err != nil {
		p.API.LogError("Error in getting the bundle path", "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusInternalServerError, Message: fmt.Sprintf("Error in getting the bundle path. Error: %s", err.Error())})
		return
	}

	xmlPath := filepath.Join(bundlePath, "assets", constants.UpdateSetFilename)
	fileBytes, err := ioutil.ReadFile(xmlPath)
	if err != nil {
		p.API.LogError("Error in reading the file", "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusInternalServerError, Message: fmt.Sprintf("Error in reading the file. Error: %s", err.Error())})
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", constants.UpdateSetFilename))
	w.Header().Set("Content-Type", http.DetectContentType(fileBytes))
	_, _ = w.Write(fileBytes)
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
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: "Missing authorization code"})
		return
	}

	state := r.URL.Query().Get("state")
	if state == "" {
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: "Missing authorization state"})
		return
	}

	mattermostUserID := r.Header.Get(constants.HeaderMattermostUserID)
	if err := p.CompleteOAuth2(mattermostUserID, code, state); err != nil {
		p.API.LogError("Unable to complete OAuth.", "UserID", mattermostUserID, "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusInternalServerError, Message: err.Error()})
		return
	}

	p.API.PublishWebSocketEvent(
		constants.WSEventConnect,
		nil,
		&model.WebsocketBroadcast{UserId: mattermostUserID},
	)

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
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusInternalServerError, Message: err.Error()})
	}
}

func (p *Plugin) createSubscription(w http.ResponseWriter, r *http.Request) {
	subscription, err := serializer.SubscriptionFromJSON(r.Body)
	if err != nil {
		p.API.LogError("Error in unmarshalling the request body", "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("Error in unmarshalling the request body. Error: %s", err.Error())})
		return
	}

	if err = subscription.IsValidForCreation(p.getConfiguration().MattermostSiteURL); err != nil {
		p.API.LogError("Error in validating the request body", "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("Error in validating the request body. Error: %s", err.Error())})
		return
	}

	client := p.GetClientFromRequest(r)
	exists, statusCode, err := client.CheckForDuplicateSubscription(subscription)
	if err != nil {
		p.API.LogError("Error in checking for duplicate subscription", "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: statusCode, Message: err.Error()})
		return
	}

	if exists {
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: "Subscription already exists"})
		return
	}

	if statusCode, err = client.CreateSubscription(subscription); err != nil {
		p.API.LogError("Error in creating subscription", "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: statusCode, Message: err.Error()})
		return
	}

	// Here, we are setting the Content-Type header even when it is being set in the "returnStatusOK" function
	// because after "WriteHeader" is called, no headers can be set, so we have to set it before the call to "WriteHeader"
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	returnStatusOK(w)
}

func (p *Plugin) getAllSubscriptions(w http.ResponseWriter, r *http.Request) {
	channelID := r.URL.Query().Get(constants.QueryParamChannelID)
	if channelID != "" && !model.IsValidId(channelID) {
		p.API.LogError("Invalid query param", "Query param", constants.QueryParamChannelID)
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("Query param %s is not valid", constants.QueryParamChannelID)})
		return
	}

	userID := r.URL.Query().Get(constants.QueryParamUserID)
	if userID != "" && !model.IsValidId(userID) {
		p.API.LogError("Invalid query param", "Query param", constants.QueryParamUserID)
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("Query param %s is not valid", constants.QueryParamUserID)})
		return
	}

	subscriptionType := r.URL.Query().Get(constants.QueryParamSubscriptionType)
	if subscriptionType != "" && !constants.ValidSubscriptionTypes[subscriptionType] {
		p.API.LogError("Invalid query param", "Query param", constants.QueryParamSubscriptionType)
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("Query param %s is not valid", constants.QueryParamSubscriptionType)})
		return
	}

	client := p.GetClientFromRequest(r)
	page, perPage := GetPageAndPerPage(r)
	subscriptions, statusCode, err := client.GetAllSubscriptions(channelID, userID, subscriptionType, fmt.Sprint(perPage), fmt.Sprint(page*perPage))
	if err != nil {
		p.API.LogError("Error in getting all subscriptions", "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: statusCode, Message: fmt.Sprintf("Error in getting all subscriptions. Error: %s", err.Error())})
		return
	}

	var bulkSubscriptions []*serializer.SubscriptionResponse
	var recordSubscriptions []*serializer.SubscriptionResponse
	wg := sync.WaitGroup{}
	for _, subscription := range subscriptions {
		if subscription.Type == constants.SubscriptionTypeBulk {
			bulkSubscriptions = append(bulkSubscriptions, subscription)
			continue
		}
		wg.Add(1)
		go p.GetRecordFromServiceNowForSubscription(subscription, client, &wg)
		recordSubscriptions = append(recordSubscriptions, subscription)
	}

	wg.Wait()
	recordSubscriptions = filterSubscriptionsOnRecordData(recordSubscriptions)
	bulkSubscriptions = append(bulkSubscriptions, recordSubscriptions...)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	result, err := json.Marshal(bulkSubscriptions)
	if err != nil {
		p.API.LogDebug("Error while marshaling the response", "Error", err.Error())
		_, _ = w.Write([]byte("[]"))
		return
	}

	if string(result) == "null" {
		_, _ = w.Write([]byte("[]"))
	} else if _, err = w.Write(result); err != nil {
		p.API.LogError("Error while writing response", "Error", err.Error())
		w.WriteHeader(http.StatusInternalServerError)
	}
}

func (p *Plugin) deleteSubscription(w http.ResponseWriter, r *http.Request) {
	pathParams := mux.Vars(r)
	subscriptionID := pathParams[constants.PathParamSubscriptionID]
	client := p.GetClientFromRequest(r)
	if statusCode, err := client.DeleteSubscription(subscriptionID); err != nil {
		p.API.LogError("Error in deleting the subscription", "subscriptionID", subscriptionID, "Error", err.Error())
		responseMessage := "No record found"
		if statusCode != http.StatusNotFound {
			responseMessage = fmt.Sprintf("Error in deleting the subscription. Error: %s", err.Error())
		}
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: statusCode, Message: responseMessage})
		return
	}

	returnStatusOK(w)
}

func (p *Plugin) editSubscription(w http.ResponseWriter, r *http.Request) {
	pathParams := mux.Vars(r)
	subscriptionID := pathParams[constants.PathParamSubscriptionID]
	subcription, err := serializer.SubscriptionFromJSON(r.Body)
	if err != nil {
		p.API.LogError("Error in unmarshalling the request body", "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("Error in unmarshalling the request body. Error: %s", err.Error())})
		return
	}

	if err = subcription.IsValidForUpdation(p.getConfiguration().MattermostSiteURL); err != nil {
		p.API.LogError("Error in validating the request body", "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("Error in validating the request body. Error: %s", err.Error())})
		return
	}

	client := p.GetClientFromRequest(r)
	if statusCode, err := client.EditSubscription(subscriptionID, subcription); err != nil {
		p.API.LogError("Error in editing the subscription", "subscriptionID", subscriptionID, "Error", err.Error())
		responseMessage := "No record found"
		if statusCode != http.StatusNotFound {
			responseMessage = fmt.Sprintf("Error in editing the subscription. Error: %s", err.Error())
		}
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: statusCode, Message: responseMessage})
		return
	}

	returnStatusOK(w)
}

func (p *Plugin) getUserChannelsForTeam(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get(constants.HeaderMattermostUserID)
	pathParams := mux.Vars(r)
	teamID := pathParams[constants.PathParamTeamID]
	if !model.IsValidId(teamID) {
		p.API.LogError(constants.ErrorInvalidTeamID)
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: constants.ErrorInvalidTeamID})
		return
	}

	channels, channelErr := p.API.GetChannelsForTeamForUser(teamID, userID, false)
	if channelErr != nil {
		p.API.LogError("Error in getting channels for team and user", "Error", channelErr.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: channelErr.StatusCode, Message: fmt.Sprintf("Error in getting channels for team and user. Error: %s", channelErr.Error())})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if channels == nil {
		_, _ = w.Write([]byte("[]"))
		return
	}

	var requiredChannels []*model.Channel
	for _, channel := range channels {
		if channel.Type == model.CHANNEL_PRIVATE || channel.Type == model.CHANNEL_OPEN {
			requiredChannels = append(requiredChannels, channel)
		}
	}

	if requiredChannels == nil {
		_, _ = w.Write([]byte("[]"))
		return
	}

	p.writeJSON(w, requiredChannels)
}

func (p *Plugin) searchRecordsInServiceNow(w http.ResponseWriter, r *http.Request) {
	pathParams := mux.Vars(r)
	recordType := pathParams[constants.PathParamRecordType]
	if !constants.ValidRecordTypesForSearching[recordType] {
		p.API.LogError("Invalid record type while searching", "Record type", recordType)
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: constants.ErrorInvalidRecordType})
		return
	}

	searchTerm := r.URL.Query().Get(constants.QueryParamSearchTerm)
	if len(searchTerm) < constants.CharacterThresholdForSearchingRecords {
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("The search term must be at least %d characters long.", constants.CharacterThresholdForSearchingRecords)})
		return
	}

	page, perPage := GetPageAndPerPage(r)
	client := p.GetClientFromRequest(r)
	records, statusCode, err := client.SearchRecordsInServiceNow(recordType, searchTerm, fmt.Sprint(perPage), fmt.Sprint(page*perPage))
	if err != nil {
		p.API.LogError("Error in searching for records in ServiceNow", "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: statusCode, Message: fmt.Sprintf("Error in searching for records in ServiceNow. Error: %s", err.Error())})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	result, err := json.Marshal(records)
	if err != nil {
		p.API.LogDebug("Error while marshaling the response", "Error", err.Error())
		_, _ = w.Write([]byte("[]"))
		return
	}

	if string(result) == "null" {
		_, _ = w.Write([]byte("[]"))
	} else if _, err = w.Write(result); err != nil {
		p.API.LogError("Error while writing response", "Error", err.Error())
		w.WriteHeader(http.StatusInternalServerError)
	}
}

func (p *Plugin) getRecordFromServiceNow(w http.ResponseWriter, r *http.Request) {
	pathParams := mux.Vars(r)
	recordType := pathParams[constants.PathParamRecordType]
	if !constants.ValidRecordTypesForSearching[recordType] {
		p.API.LogError("Invalid record type while trying to get record", "Record type", recordType)
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: constants.ErrorInvalidRecordType})
		return
	}

	recordID := pathParams[constants.PathParamRecordID]
	client := p.GetClientFromRequest(r)
	record, statusCode, err := client.GetRecordFromServiceNow(recordType, recordID)
	if err != nil {
		p.API.LogError("Error in getting record from ServiceNow", "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: statusCode, Message: fmt.Sprintf("Error in getting record from ServiceNow. Error: %s", err.Error())})
		return
	}

	p.writeJSON(w, record)
}

func (p *Plugin) handleNotification(w http.ResponseWriter, r *http.Request) {
	event, err := serializer.ServiceNowEventFromJSON(r.Body)
	if err != nil {
		p.API.LogError("Error in unmarshalling the request body", "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("Error in unmarshalling the request body. Error: %s", err.Error())})
		return
	}

	post := event.CreateNotificationPost(p.botID, p.getConfiguration().ServiceNowBaseURL)
	if _, postErr := p.API.CreatePost(post); postErr != nil {
		p.API.LogError("Unable to create post", "Error", postErr.Error())
	}
	returnStatusOK(w)
}

func (p *Plugin) shareRecordInChannel(w http.ResponseWriter, r *http.Request) {
	pathParams := mux.Vars(r)
	channelID := pathParams[constants.QueryParamChannelID]
	if !model.IsValidId(channelID) {
		p.API.LogError(constants.ErrorInvalidChannelID)
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: constants.ErrorInvalidChannelID})
		return
	}

	record, err := serializer.ServiceNowRecordFromJSON(r.Body)
	if err != nil {
		p.API.LogError("Error in unmarshalling the request body", "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("Error in unmarshalling the request body. Error: %s", err.Error())})
		return
	}

	if !constants.ValidRecordTypesForSearching[record.RecordType] {
		p.API.LogError("Invalid record type while trying to share record", "Record type", record.RecordType)
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: constants.ErrorInvalidRecordType})
		return
	}

	if err := record.HandleNestedFields(); err != nil {
		p.API.LogError("Invalid request body", "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("Invalid request body. Error: %s", err.Error())})
		return
	}

	userID := r.Header.Get(constants.HeaderMattermostUserID)
	user, userErr := p.API.GetUser(userID)
	if userErr != nil {
		p.API.LogError("Unable to get the user", "UserID", userID, "Error", userErr.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusInternalServerError, Message: constants.ErrorGeneric})
		return
	}

	post := record.CreateSharingPost(channelID, p.botID, p.getConfiguration().ServiceNowBaseURL, user.Username)
	if _, postErr := p.API.CreatePost(post); postErr != nil {
		p.API.LogError("Unable to create post", "Error", postErr.Error())
	}

	returnStatusOK(w)
}

func (p *Plugin) getCommentsForRecord(w http.ResponseWriter, r *http.Request) {
	pathParams := mux.Vars(r)
	recordType := pathParams[constants.PathParamRecordType]
	if !constants.RecordTypesSupportingComments[recordType] {
		p.API.LogError(constants.ErrorInvalidRecordType, "Record type", recordType)
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: constants.ErrorInvalidRecordType})
		return
	}

	recordID := pathParams[constants.PathParamRecordID]
	client := p.GetClientFromRequest(r)
	comments, statusCode, err := client.GetAllComments(recordType, recordID)
	if err != nil {
		// TODO: Move all the inline messages to constants package
		p.API.LogError("Error in getting all comments", "Record ID", recordID, "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: statusCode, Message: fmt.Sprintf("Error in getting all comments. Error: %s", err.Error())})
		return
	}

	page, perPage := GetPageAndPerPage(r)
	commentsArray := ProcessComments(comments, page, perPage)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	result, err := json.Marshal(commentsArray)
	if err != nil {
		p.API.LogDebug("Error while marshaling the response", "Error", err.Error())
		_, _ = w.Write([]byte("[]"))
		return
	}

	if string(result) == "null" {
		_, _ = w.Write([]byte("[]"))
	} else if _, err = w.Write(result); err != nil {
		p.API.LogError("Error while writing response", "Error", err.Error())
		w.WriteHeader(http.StatusInternalServerError)
	}
}

func (p *Plugin) addCommentsOnRecord(w http.ResponseWriter, r *http.Request) {
	pathParams := mux.Vars(r)
	recordType := pathParams[constants.PathParamRecordType]
	if !constants.RecordTypesSupportingComments[recordType] {
		p.API.LogError(constants.ErrorInvalidRecordType, "Record type", recordType)
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: constants.ErrorInvalidRecordType})
		return
	}

	payload, err := serializer.ServiceNowCommentPayloadFromJSON(r.Body)
	if err != nil {
		p.API.LogError("Error in unmarshalling the request body", "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("Error in unmarshalling the request body. Error: %s", err.Error())})
		return
	}

	recordID := pathParams[constants.PathParamRecordID]
	client := p.GetClientFromRequest(r)
	statusCode, err := client.AddComment(recordType, recordID, payload)
	if err != nil {
		p.API.LogError("Error in creating the comment", "Record ID", recordID, "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: statusCode, Message: fmt.Sprintf("Error in creating the comment. Error: %s", err.Error())})
		return
	}

	returnStatusOK(w)
}

func (p *Plugin) getStatesForRecordType(w http.ResponseWriter, r *http.Request) {
	pathParams := mux.Vars(r)
	recordType := pathParams[constants.PathParamRecordType]
	if !constants.RecordTypesSupportingStateUpdation[recordType] {
		p.API.LogError(constants.ErrorInvalidRecordType, "Record type", recordType)
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: constants.ErrorInvalidRecordType})
		return
	}

	if recordType == constants.RecordTypeFollowOnTask {
		recordType = constants.RecordTypeTask
	}

	client := p.GetClientFromRequest(r)
	states, statusCode, err := client.GetStatesFromServiceNow(recordType)
	if err != nil {
		p.API.LogError("Error in getting the states", "Record Type", recordType, "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: statusCode, Message: fmt.Sprintf("Error in getting the states. Error: %s", err.Error())})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	result, err := json.Marshal(states)
	if err != nil {
		p.API.LogDebug("Error while marshaling the response", "Error", err.Error())
		_, _ = w.Write([]byte("[]"))
		return
	}

	if string(result) == "null" {
		_, _ = w.Write([]byte("[]"))
	} else if _, err = w.Write(result); err != nil {
		p.API.LogError("Error while writing response", "Error", err.Error())
		w.WriteHeader(http.StatusInternalServerError)
	}
}

func (p *Plugin) updateStateOfRecord(w http.ResponseWriter, r *http.Request) {
	pathParams := mux.Vars(r)
	recordType := pathParams[constants.PathParamRecordType]
	if !constants.RecordTypesSupportingStateUpdation[recordType] {
		p.API.LogError(constants.ErrorInvalidRecordType, "Record type", recordType)
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: constants.ErrorInvalidRecordType})
		return
	}

	payload, err := serializer.ServiceNowStatePayloadFromJSON(r.Body)
	if err != nil {
		p.API.LogError("Error in unmarshalling the request body", "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("Error in unmarshalling the request body. Error: %s", err.Error())})
		return
	}

	if err = payload.Validate(); err != nil {
		p.API.LogError("Error in validating the request body", "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("Error in validating the request body. Error: %s", err.Error())})
		return
	}

	recordID := pathParams[constants.PathParamRecordID]
	client := p.GetClientFromRequest(r)
	statusCode, err := client.UpdateStateOfRecordInServiceNow(recordType, recordID, payload)
	if err != nil {
		p.API.LogError("Error in updating the state", "Record ID", recordID, "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: statusCode, Message: fmt.Sprintf("Error in updating the state. Error: %s", err.Error())})
		return
	}

	returnStatusOK(w)
}

func returnStatusOK(w http.ResponseWriter) {
	m := make(map[string]string)
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
