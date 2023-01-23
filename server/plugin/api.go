package plugin

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"path/filepath"
	"runtime/debug"
	"strings"
	"sync"

	"github.com/gorilla/mux"
	"github.com/mattermost/mattermost-server/v5/model"
	"github.com/pkg/errors"

	"github.com/mattermost/mattermost-plugin-servicenow/server/constants"
	"github.com/mattermost/mattermost-plugin-servicenow/server/serializer"
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
	s.HandleFunc(constants.PathOpenCommentModal, p.checkAuth(p.handleOpenCommentModal)).Methods(http.MethodPost)
	s.HandleFunc(constants.PathGetStatesForRecordType, p.checkAuth(p.checkOAuth(p.getStatesForRecordType))).Methods(http.MethodGet)
	s.HandleFunc(constants.PathUpdateStateOfRecord, p.checkAuth(p.checkOAuth(p.updateStateOfRecord))).Methods(http.MethodPatch)
	s.HandleFunc(constants.PathOpenStateModal, p.checkAuth(p.handleOpenStateModal)).Methods(http.MethodPost)
	s.HandleFunc(constants.PathProcessNotification, p.checkAuthBySecret(p.handleNotification)).Methods(http.MethodPost)
	s.HandleFunc(constants.PathGetConfig, p.checkAuth(p.getConfig)).Methods(http.MethodGet)
	s.HandleFunc(constants.PathGetUsers, p.checkAuth(p.checkOAuth(p.handleGetUsers))).Methods(http.MethodGet)
	s.HandleFunc(constants.PathCreateIncident, p.checkAuth(p.checkOAuth(p.createIncident))).Methods(http.MethodPost)
	s.HandleFunc(constants.PathSearchCatalogItems, p.checkAuth(p.checkOAuth(p.searchCatalogItemsInServiceNow))).Methods(http.MethodGet)

	// 404 handler
	r.Handle("{anything:.*}", http.NotFoundHandler())
	return r
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
				p.API.LogError(constants.ErrorGetUser, "Error", err.Error())
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
			_ = p.handleClientError(w, r, err, false, 0, "", "")
			p.API.LogError("Unable to check or activate subscriptions in ServiceNow.", "Error", err.Error())
			return
		}

		handler(w, r)
	}
}

func (p *Plugin) getConfig(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get(constants.HeaderMattermostUserID)
	user, userErr := p.API.GetUser(userID)
	if userErr != nil {
		p.API.LogError(constants.ErrorGetUser, "UserID", userID, "Error", userErr.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusInternalServerError, Message: constants.ErrorGeneric})
		return
	}

	if strings.Contains(user.Roles, model.SYSTEM_ADMIN_ROLE_ID) {
		p.writeJSON(w, 0, p.getConfiguration())
		return
	}

	p.writeJSON(w, 0, map[string]string{
		"ServiceNowBaseURL": p.getConfiguration().ServiceNowBaseURL,
	})
}

func (p *Plugin) getConnected(w http.ResponseWriter, r *http.Request) {
	resp := &serializer.ConnectedResponse{
		Connected: false,
	}

	userID := r.Header.Get(constants.HeaderMattermostUserID)
	if _, err := p.GetUser(userID); err == nil {
		resp.Connected = true
	}

	p.writeJSON(w, 0, resp)
}

// checkAuthBySecret verifies if provided request is performed by an authorized source.
func (p *Plugin) checkAuthBySecret(handleFunc http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if status, err := verifyHTTPSecret(p.getConfiguration().WebhookSecret, r.FormValue("secret")); err != nil {
			p.API.LogError(constants.ErrorInvalidSecret, "Error", err.Error())
			p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: status, Message: fmt.Sprintf("%s. Error: %s", constants.ErrorInvalidSecret, err.Error())})
			return
		}

		handleFunc(w, r)
	}
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
			window.open('','_parent','');
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
		p.API.LogError(constants.ErrorUnmarshallingRequestBody, "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("%s. Error: %s", constants.ErrorUnmarshallingRequestBody, err.Error())})
		return
	}

	if err = subscription.IsValidForCreation(p.getConfiguration().MattermostSiteURL); err != nil {
		p.API.LogError(constants.ErrorValidatingRequestBody, "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("%s. Error: %s", constants.ErrorValidatingRequestBody, err.Error())})
		return
	}

	userID := r.Header.Get(constants.HeaderMattermostUserID)
	if userID != *subscription.UserID {
		p.API.LogError(constants.ErrorUserMismatch)
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: constants.ErrorUserMismatch})
		return
	}

	permissionStatusCode, permissionErr := p.HasChannelPermissions(userID, *subscription.ChannelID)
	if permissionErr != nil {
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: permissionStatusCode, Message: permissionErr.Error()})
		return
	}

	client := p.GetClientFromRequest(r)
	exists, statusCode, err := client.CheckForDuplicateSubscription(subscription)
	if err != nil {
		_ = p.handleClientError(w, r, err, false, statusCode, "", "")
		p.API.LogError("Error in checking for duplicate subscription", "Error", err.Error())
		return
	}

	if exists {
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: "Subscription already exists"})
		return
	}

	if statusCode, err = client.CreateSubscription(subscription); err != nil {
		_ = p.handleClientError(w, r, err, false, statusCode, "", "")
		p.API.LogError("Error in creating subscription", "Error", err.Error())
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
		p.API.LogError(constants.ErrorInvalidQueryParam, "Query param", constants.QueryParamChannelID)
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("Query param %s is not valid", constants.QueryParamChannelID)})
		return
	}

	userID := r.URL.Query().Get(constants.QueryParamUserID)
	if userID != "" && !model.IsValidId(userID) {
		p.API.LogError(constants.ErrorInvalidQueryParam, "Query param", constants.QueryParamUserID)
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("Query param %s is not valid", constants.QueryParamUserID)})
		return
	}

	subscriptionType := r.URL.Query().Get(constants.QueryParamSubscriptionType)
	if subscriptionType != "" && !constants.ValidSubscriptionTypes[subscriptionType] {
		p.API.LogError(constants.ErrorInvalidQueryParam, "Query param", constants.QueryParamSubscriptionType)
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("Query param %s is not valid", constants.QueryParamSubscriptionType)})
		return
	}

	client := p.GetClientFromRequest(r)
	page, perPage := GetPageAndPerPage(r)
	subscriptions, statusCode, err := client.GetAllSubscriptions(channelID, userID, subscriptionType, fmt.Sprint(perPage), fmt.Sprint(page*perPage))
	if err != nil {
		_ = p.handleClientError(w, r, err, false, statusCode, "", fmt.Sprintf("%s. Error: %s", constants.ErrorGetSubscriptions, err.Error()))
		p.API.LogError(constants.ErrorGetSubscriptions, "Error", err.Error())
		return
	}

	var bulkSubscriptions []*serializer.SubscriptionResponse
	var recordSubscriptions []*serializer.SubscriptionResponse
	wg := sync.WaitGroup{}
	mattermostUserID := r.Header.Get(constants.HeaderMattermostUserID)
	for _, subscription := range subscriptions {
		_, permissionErr := p.HasChannelPermissions(mattermostUserID, subscription.ChannelID)
		if permissionErr != nil {
			continue
		}

		if subscription.Type == constants.SubscriptionTypeBulk {
			bulkSubscriptions = append(bulkSubscriptions, subscription)
			continue
		}
		wg.Add(1)
		go p.GetRecordFromServiceNowForSubscription(subscription, client, &wg)
		recordSubscriptions = append(recordSubscriptions, subscription)
	}

	wg.Wait()
	recordSubscriptions = FilterSubscriptionsOnRecordData(recordSubscriptions)
	bulkSubscriptions = append(bulkSubscriptions, recordSubscriptions...)

	p.writeJSONArray(w, statusCode, bulkSubscriptions)
}

func (p *Plugin) deleteSubscription(w http.ResponseWriter, r *http.Request) {
	pathParams := mux.Vars(r)
	subscriptionID := pathParams[constants.PathParamSubscriptionID]
	client := p.GetClientFromRequest(r)
	if statusCode, err := client.DeleteSubscription(subscriptionID); err != nil {
		p.API.LogError(constants.ErrorDeleteSubscription, "subscriptionID", subscriptionID, "Error", err.Error())
		responseMessage := "No record found"
		if statusCode != http.StatusNotFound {
			responseMessage = fmt.Sprintf("%s. Error: %s", constants.ErrorDeleteSubscription, err.Error())
		}
		p.handleClientError(w, r, err, false, statusCode, "", responseMessage)
		return
	}

	returnStatusOK(w)
}

func (p *Plugin) editSubscription(w http.ResponseWriter, r *http.Request) {
	pathParams := mux.Vars(r)
	subscriptionID := pathParams[constants.PathParamSubscriptionID]
	subscription, err := serializer.SubscriptionFromJSON(r.Body)
	if err != nil {
		p.API.LogError(constants.ErrorUnmarshallingRequestBody, "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("%s. Error: %s", constants.ErrorUnmarshallingRequestBody, err.Error())})
		return
	}

	if err = subscription.IsValidForUpdation(p.getConfiguration().MattermostSiteURL); err != nil {
		p.API.LogError(constants.ErrorValidatingRequestBody, "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("%s. Error: %s", constants.ErrorValidatingRequestBody, err.Error())})
		return
	}

	userID := r.Header.Get(constants.HeaderMattermostUserID)
	permissionStatusCode, permissionErr := p.HasChannelPermissions(userID, *subscription.ChannelID)
	if permissionErr != nil {
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: permissionStatusCode, Message: permissionErr.Error()})
		return
	}

	client := p.GetClientFromRequest(r)
	if statusCode, err := client.EditSubscription(subscriptionID, subscription); err != nil {
		p.API.LogError(constants.ErrorEditingSubscription, "subscriptionID", subscriptionID, "Error", err.Error())
		responseMessage := "No record found"
		if statusCode != http.StatusNotFound {
			responseMessage = fmt.Sprintf("%s. Error: %s", constants.ErrorEditingSubscription, err.Error())
		}
		_ = p.handleClientError(w, r, err, false, statusCode, "", responseMessage)
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
		p.API.LogError(constants.ErrorGetChannel, "Error", channelErr.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: channelErr.StatusCode, Message: fmt.Sprintf("%s. Error: %s", constants.ErrorGetChannel, channelErr.Error())})
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

	p.writeJSON(w, 0, requiredChannels)
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
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf(constants.ErrorSearchTermThreshold, constants.CharacterThresholdForSearchingRecords)})
		return
	}

	page, perPage := GetPageAndPerPage(r)
	client := p.GetClientFromRequest(r)
	records, statusCode, err := client.SearchRecordsInServiceNow(recordType, searchTerm, fmt.Sprint(perPage), fmt.Sprint(page*perPage))
	if err != nil {
		p.API.LogError(constants.ErrorSearchingRecord, "Error", err.Error())
		_ = p.handleClientError(w, r, err, false, statusCode, "", fmt.Sprintf("%s. Error: %s", constants.ErrorSearchingRecord, err.Error()))
		return
	}

	for _, record := range records {
		record.ShortDescription = strings.ReplaceAll(record.ShortDescription, "\n", "")
	}
	p.writeJSONArray(w, statusCode, records)
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
		p.API.LogError(constants.ErrorGetRecord, "Error", err.Error())
		_ = p.handleClientError(w, r, err, false, statusCode, "", fmt.Sprintf("%s. Error: %s", constants.ErrorGetRecord, err.Error()))
		return
	}

	record.RecordType = recordType
	if err := record.HandleNestedFields(p.getConfiguration().ServiceNowBaseURL); err != nil {
		p.API.LogError(constants.ErrorHandlingNestedFields, "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusInternalServerError, Message: fmt.Sprintf("%s. Error: %s", constants.ErrorHandlingNestedFields, err.Error())})
		return
	}

	p.writeJSON(w, 0, record)
}

func (p *Plugin) handleNotification(w http.ResponseWriter, r *http.Request) {
	event, err := serializer.ServiceNowEventFromJSON(r.Body)
	if err != nil {
		p.API.LogError(constants.ErrorUnmarshallingRequestBody, "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("%s. Error: %s", constants.ErrorUnmarshallingRequestBody, err.Error())})
		return
	}

	post := event.CreateNotificationPost(p.botID, p.getConfiguration().ServiceNowBaseURL, p.GetPluginURL())
	if _, postErr := p.API.CreatePost(post); postErr != nil {
		p.API.LogError(constants.ErrorCreatePost, "Error", postErr.Error())
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

	userID := r.Header.Get(constants.HeaderMattermostUserID)
	user, userErr := p.API.GetUser(userID)
	if userErr != nil {
		p.API.LogError(constants.ErrorGetUser, "UserID", userID, "Error", userErr.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusInternalServerError, Message: constants.ErrorGeneric})
		return
	}

	permissionStatusCode, permissionErr := p.HasChannelPermissions(userID, channelID)
	if permissionErr != nil {
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: permissionStatusCode, Message: permissionErr.Error()})
		return
	}

	shareRecordData, err := serializer.ServiceNowRecordFromJSON(r.Body)
	if err != nil {
		p.API.LogError(constants.ErrorUnmarshallingRequestBody, "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("%s. Error: %s", constants.ErrorUnmarshallingRequestBody, err.Error())})
		return
	}

	if !constants.ValidRecordTypesForSearching[shareRecordData.RecordType] {
		p.API.LogError("Invalid record type while trying to share record", "Record type", shareRecordData.RecordType)
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: constants.ErrorInvalidRecordType})
		return
	}

	client := p.GetClientFromRequest(r)
	record, statusCode, err := client.GetRecordFromServiceNow(shareRecordData.RecordType, shareRecordData.SysID)
	if err != nil {
		p.API.LogError(constants.ErrorGetRecord, "Error", err.Error())
		_ = p.handleClientError(w, r, err, false, statusCode, "", fmt.Sprintf("%s. Error: %s", constants.ErrorGetRecord, err.Error()))
		return
	}

	record.RecordType = shareRecordData.RecordType
	if err := record.HandleNestedFields(p.getConfiguration().ServiceNowBaseURL); err != nil {
		p.API.LogError(constants.ErrorHandlingNestedFields, "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusInternalServerError, Message: fmt.Sprintf("%s. Error: %s", constants.ErrorHandlingNestedFields, err.Error())})
		return
	}

	post := record.CreateSharingPost(channelID, p.botID, p.getConfiguration().ServiceNowBaseURL, p.GetPluginURL(), user.Username)
	if _, postErr := p.API.CreatePost(post); postErr != nil {
		p.API.LogError(constants.ErrorCreatePost, "Error", postErr.Error())
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
	response, statusCode, err := client.GetAllComments(recordType, recordID)
	if err != nil {
		p.API.LogError(constants.ErrorGetComments, "Record ID", recordID, "Error", err.Error())
		_ = p.handleClientError(w, r, err, false, statusCode, "", fmt.Sprintf("%s. Error: %s", constants.ErrorGetComments, err.Error()))
		return
	}

	p.writeJSON(w, statusCode, response.CommentsAndWorkNotes)
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
		p.API.LogError(constants.ErrorUnmarshallingRequestBody, "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("%s. Error: %s", constants.ErrorUnmarshallingRequestBody, err.Error())})
		return
	}

	recordID := pathParams[constants.PathParamRecordID]
	client := p.GetClientFromRequest(r)
	statusCode, err := client.AddComment(recordType, recordID, payload)
	if err != nil {
		p.API.LogError(constants.ErrorCreateComment, "Record ID", recordID, "Error", err.Error())
		_ = p.handleClientError(w, r, err, false, statusCode, "", fmt.Sprintf("%s. Error: %s", constants.ErrorCreateComment, err.Error()))
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
		p.API.LogError(constants.ErrorGetStates, "Record Type", recordType, "Error", err.Error())
		_ = p.handleClientError(w, r, err, false, statusCode, "", fmt.Sprintf("%s. Error: %s", constants.ErrorGetStates, err.Error()))
		return
	}

	p.writeJSONArray(w, statusCode, states)
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
		p.API.LogError(constants.ErrorUnmarshallingRequestBody, "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("%s. Error: %s", constants.ErrorUnmarshallingRequestBody, err.Error())})
		return
	}

	if err = payload.Validate(); err != nil {
		p.API.LogError(constants.ErrorValidatingRequestBody, "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("%s. Error: %s", constants.ErrorValidatingRequestBody, err.Error())})
		return
	}

	recordID := pathParams[constants.PathParamRecordID]
	client := p.GetClientFromRequest(r)
	statusCode, err := client.UpdateStateOfRecordInServiceNow(recordType, recordID, payload)
	if err != nil {
		p.API.LogError("Error in updating the state", "Record ID", recordID, "Error", err.Error())
		_ = p.handleClientError(w, r, err, false, statusCode, "", fmt.Sprintf("Error in updating the state. Error: %s", err.Error()))
		return
	}

	returnStatusOK(w)
}

func (p *Plugin) handleOpenCommentModal(w http.ResponseWriter, r *http.Request) {
	response := &model.PostActionIntegrationResponse{}
	decoder := json.NewDecoder(r.Body)
	postActionIntegrationRequest := &model.PostActionIntegrationRequest{}
	if err := decoder.Decode(&postActionIntegrationRequest); err != nil {
		p.API.LogError("Error decoding PostActionIntegrationRequest params: ", err.Error())
		p.returnPostActionIntegrationResponse(w, response)
		return
	}

	p.API.PublishWebSocketEvent(
		constants.WSEventOpenCommentModal,
		postActionIntegrationRequest.Context,
		&model.WebsocketBroadcast{UserId: postActionIntegrationRequest.UserId},
	)

	p.returnPostActionIntegrationResponse(w, response)
}

func (p *Plugin) handleOpenStateModal(w http.ResponseWriter, r *http.Request) {
	response := &model.PostActionIntegrationResponse{}
	decoder := json.NewDecoder(r.Body)
	postActionIntegrationRequest := &model.PostActionIntegrationRequest{}
	if err := decoder.Decode(&postActionIntegrationRequest); err != nil {
		p.API.LogError("Error decoding PostActionIntegrationRequest params: ", err.Error())
		p.returnPostActionIntegrationResponse(w, response)
		return
	}

	p.API.PublishWebSocketEvent(
		constants.WSEventOpenUpdateStateModal,
		postActionIntegrationRequest.Context,
		&model.WebsocketBroadcast{UserId: postActionIntegrationRequest.UserId},
	)

	p.returnPostActionIntegrationResponse(w, response)
}

func (p *Plugin) handleGetUsers(w http.ResponseWriter, r *http.Request) {
	users, err := p.store.GetAllUsers()
	if err != nil {
		p.API.LogError(constants.ErrorGetUsers, "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusInternalServerError, Message: fmt.Sprintf("%s. Error: %s", constants.ErrorGetUsers, err.Error())})
		return
	}

	p.writeJSONArray(w, http.StatusOK, users)
}

func (p *Plugin) createIncident(w http.ResponseWriter, r *http.Request) {
	mattermostUserID := r.Header.Get(constants.HeaderMattermostUserID)
	incident, err := serializer.IncidentFromJSON(r.Body)
	if err != nil {
		p.API.LogError(constants.ErrorUnmarshallingRequestBody, "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("%s. Error: %s", constants.ErrorUnmarshallingRequestBody, err.Error())})
		return
	}

	if err = incident.IsValid(); err != nil {
		p.API.LogError(constants.ErrorValidatingRequestBody, "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf("%s. Error: %s", constants.ErrorValidatingRequestBody, err.Error())})
		return
	}

	client := p.GetClientFromRequest(r)
	response, statusCode, err := client.CreateIncident(incident)
	if err != nil {
		p.API.LogError(constants.APIErrorCreateIncident, "Error", err.Error())
		_ = p.handleClientError(w, r, err, false, statusCode, "", fmt.Sprintf("%s. Error: %s", constants.APIErrorCreateIncident, err.Error()))
		return
	}

	// TODO: post the created incident in the current channel instead of DM
	channel, channelErr := p.API.GetDirectChannel(mattermostUserID, p.botID)
	if channelErr != nil {
		p.API.LogError(constants.ErrorGetBotChannel, "userID", mattermostUserID, "Error", channelErr.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusInternalServerError, Message: constants.ErrorGetBotChannel})
		return
	}

	record := serializer.ServiceNowRecord{
		SysID:            response.SysID,
		Number:           response.Number,
		ShortDescription: response.ShortDescription,
		RecordType:       constants.RecordTypeIncident,
		State:            response.State,
		Priority:         response.Priority,
		AssignedTo:       response.AssignedTo,
		AssignmentGroup:  response.AssignmentGroup,
	}

	if err := record.HandleNestedFields(p.getConfiguration().ServiceNowBaseURL); err != nil {
		p.API.LogError(constants.ErrorHandlingNestedFields, "Error", err.Error())
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusInternalServerError, Message: fmt.Sprintf("%s. Error: %s", constants.ErrorHandlingNestedFields, err.Error())})
		return
	}

	post := record.CreateSharingPost(channel.Id, p.botID, p.getConfiguration().ServiceNowBaseURL, p.GetPluginURL(), "")
	if _, postErr := p.API.CreatePost(post); postErr != nil {
		p.API.LogError(constants.ErrorCreatePost, "Error", postErr.Error())
	}

	p.writeJSON(w, statusCode, record)
}

func (p *Plugin) searchCatalogItemsInServiceNow(w http.ResponseWriter, r *http.Request) {
	searchTerm := r.URL.Query().Get(constants.QueryParamSearchTerm)
	if len(searchTerm) < constants.CharacterThresholdForSearchingCatalogItems {
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusBadRequest, Message: fmt.Sprintf(constants.ErrorSearchTermThreshold, constants.CharacterThresholdForSearchingCatalogItems)})
		return
	}

	page, perPage := GetPageAndPerPage(r)
	client := p.GetClientFromRequest(r)
	items, statusCode, err := client.SearchCatalogItemsInServiceNow(searchTerm, fmt.Sprint(perPage), fmt.Sprint(page*perPage))
	if err != nil {
		p.API.LogError(constants.APIErrorSearchingCatalogItems, "Error", err.Error())
		_ = p.handleClientError(w, r, err, false, statusCode, "", fmt.Sprintf("%s. Error: %s", constants.APIErrorSearchingCatalogItems, err.Error()))
		return
	}

	p.writeJSONArray(w, statusCode, items)
}

func returnStatusOK(w http.ResponseWriter) {
	m := make(map[string]string)
	w.Header().Set("Content-Type", "application/json")
	m[model.STATUS] = model.STATUS_OK
	_, _ = w.Write([]byte(model.MapToJson(m)))
}

func (p *Plugin) returnPostActionIntegrationResponse(w http.ResponseWriter, res *model.PostActionIntegrationResponse) {
	w.Header().Set("Content-Type", "application/json")
	if _, err := w.Write(res.ToJson()); err != nil {
		p.API.LogWarn("failed to write PostActionIntegrationResponse", "Error", err.Error())
	}
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
					"URL", r.URL.String(),
					"Error", x,
					"Stack", string(debug.Stack()))
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
