package plugin

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"sync"

	"github.com/mattermost/mattermost-server/v6/model"
	"golang.org/x/oauth2"

	"github.com/mattermost/mattermost-plugin-servicenow/server/constants"
	"github.com/mattermost/mattermost-plugin-servicenow/server/serializer"
)

func (p *Plugin) handleAPIError(w http.ResponseWriter, apiErr *serializer.APIErrorResponse) {
	w.Header().Set("Content-Type", "application/json")
	errorBytes, err := json.Marshal(apiErr)
	if err != nil {
		p.API.LogError("Failed to marshal API error", "Error", err.Error())
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.WriteHeader(apiErr.StatusCode)

	if _, err = w.Write(errorBytes); err != nil {
		p.API.LogError("Failed to write JSON response", "Error", err.Error())
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}

func (p *Plugin) writeJSON(w http.ResponseWriter, statusCode int, v interface{}) {
	if statusCode == 0 {
		statusCode = http.StatusOK
	}

	w.Header().Set("Content-Type", "application/json")
	b, err := json.Marshal(v)
	if err != nil {
		p.API.LogError("Failed to marshal JSON response", "Error", err.Error())
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	if _, err = w.Write(b); err != nil {
		p.API.LogError("Failed to write JSON response", "Error", err.Error())
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.WriteHeader(statusCode)
}

func (p *Plugin) writeJSONArray(w http.ResponseWriter, statusCode int, v interface{}) {
	if statusCode == 0 {
		statusCode = http.StatusOK
	}

	w.Header().Set("Content-Type", "application/json")
	b, err := json.Marshal(v)
	if err != nil {
		p.API.LogError("Failed to marshal JSON response", "Error", err.Error())
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte("[]"))
		return
	}

	if string(b) == "null" {
		w.WriteHeader(statusCode)
		_, _ = w.Write([]byte("[]"))
		return
	}

	if _, err = w.Write(b); err != nil {
		p.API.LogError("Error while writing response", "Error", err.Error())
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.WriteHeader(statusCode)
}

func ParseSubscriptionsToCommandResponse(subscriptions []*serializer.SubscriptionResponse) string {
	var sb strings.Builder
	var recordSubscriptions strings.Builder
	var bulkSubscriptions strings.Builder
	for _, subscription := range subscriptions {
		if subscription.Type == constants.SubscriptionTypeRecord {
			recordSubscriptions.WriteString(subscription.GetFormattedSubscription())
		} else {
			bulkSubscriptions.WriteString(subscription.GetFormattedSubscription())
		}
	}

	if bulkSubscriptions.Len() > 0 {
		sb.WriteString("#### Bulk subscriptions\n")
		sb.WriteString("| Subscription ID | Record Type | Events | Created By | Channel |\n| :----|:--------| :--------|:--------|:--------|")
		sb.WriteString(bulkSubscriptions.String())
	}

	if recordSubscriptions.Len() > 0 {
		sb.WriteString("\n#### Record subscriptions\n")
		sb.WriteString("| Subscription ID | Record Type | Record Number | Record Short Description | Events | Created By | Channel |\n| :----|:--------| :--------| :-----| :--------|:--------|:--------|")
		sb.WriteString(recordSubscriptions.String())
	}

	return sb.String()
}

func GetPageAndPerPage(r *http.Request) (page, perPage int) {
	query := r.URL.Query()
	if val, err := strconv.Atoi(query.Get(constants.QueryParamPage)); err != nil || val < 0 {
		page = constants.DefaultPage
	} else {
		page = val
	}

	val, err := strconv.Atoi(query.Get(constants.QueryParamPerPage))
	switch {
	case err != nil || val < 0:
		perPage = constants.DefaultPerPage
	case val > constants.MaxPerPage:
		perPage = constants.MaxPerPage
	default:
		perPage = val
	}

	return page, perPage
}

func (p *Plugin) GetClientFromRequest(r *http.Request) Client {
	ctx := r.Context()
	token := ctx.Value(constants.ContextTokenKey).(*oauth2.Token)
	return p.NewClient(ctx, token)
}

func (p *Plugin) GetRecordFromServiceNowForSubscription(subscription *serializer.SubscriptionResponse, client Client, wg *sync.WaitGroup) {
	if wg != nil {
		defer wg.Done()
	}
	record, _, err := client.GetRecordFromServiceNow(subscription.RecordType, subscription.RecordID)
	if err != nil {
		p.API.LogError("Error in getting record from ServiceNow", "Record type", subscription.RecordType, "Record ID", subscription.RecordID, "Error", err.Error())
		subscription.Number = "N/A"
		subscription.ShortDescription = "N/A"
		return
	}
	subscription.Number = record.Number
	subscription.ShortDescription = record.ShortDescription
}

func (p *Plugin) getHelpMessage(header string, isSysAdmin bool) string {
	var sb strings.Builder
	sb.WriteString(header)
	helpCommandMessage := strings.ReplaceAll(commandHelp, "|", "`")
	if isSysAdmin {
		helpCommandMessage = strings.ReplaceAll(commandHelpForAdmin, "|", "`")
	}

	sb.WriteString(helpCommandMessage)
	return sb.String()
}

func (p *Plugin) IsAuthorizedSysAdmin(userID string) (bool, error) {
	user, appErr := p.API.GetUser(userID)
	if appErr != nil {
		return false, appErr
	}

	if !strings.Contains(user.Roles, model.SystemAdminRoleId) {
		return false, nil
	}

	return true, nil
}

func ConvertSubscriptionToMap(subscription *serializer.SubscriptionResponse) (map[string]interface{}, error) {
	var m map[string]interface{}
	bytes, err := json.Marshal(&subscription)
	if err != nil {
		return nil, err
	}

	if err = json.Unmarshal(bytes, &m); err != nil {
		return nil, err
	}

	return m, nil
}

// FilterSubscriptionsOnRecordData filters the given subscriptions based on if they contain record data or not.
// It keeps only those subscriptions which contain record data (number and short description) and discards the rest of them
func FilterSubscriptionsOnRecordData(subscripitons []*serializer.SubscriptionResponse) []*serializer.SubscriptionResponse {
	n := 0
	for _, subscription := range subscripitons {
		if subscription.Type == constants.SubscriptionTypeBulk || (subscription.Number != "" && subscription.ShortDescription != "") {
			subscripitons[n] = subscription
			n++
		}
	}

	return subscripitons[:n]
}

func (p *Plugin) handleClientError(w http.ResponseWriter, r *http.Request, err error, isSysAdmin bool, statusCode int, userID, response string) string {
	message := ""
	if strings.Contains(err.Error(), "oauth2: cannot fetch token: 401 Unauthorized") {
		if userID == "" && r != nil {
			userID = r.Header.Get(constants.HeaderMattermostUserID)
		}

		if disconnectErr := p.DisconnectUser(userID); disconnectErr != nil {
			p.API.LogError(disconnectErr.Error())
			if w != nil {
				p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: http.StatusInternalServerError, Message: genericErrorMessage})
			}
			return genericErrorMessage
		}

		if w != nil {
			p.handleAPIError(w, &serializer.APIErrorResponse{ID: constants.APIErrorIDRefreshTokenExpired, StatusCode: http.StatusBadRequest, Message: constants.APIErrorRefreshTokenExpired})
			return message
		}

		return fmt.Sprintf(tokenExpiredReconnectMessage, p.GetPluginURL(), constants.PathOAuth2Connect)
	}

	if strings.EqualFold(err.Error(), constants.APIErrorIDSubscriptionsNotConfigured) {
		if w != nil {
			p.handleAPIError(w, &serializer.APIErrorResponse{ID: constants.APIErrorIDSubscriptionsNotConfigured, StatusCode: http.StatusBadRequest, Message: constants.APIErrorSubscriptionsNotConfigured})
			return message
		}

		message = subscriptionsNotConfiguredErrorForUser
		if isSysAdmin {
			message = subscriptionsNotConfiguredErrorForAdmin
		}

		return message
	}

	if strings.EqualFold(err.Error(), constants.APIErrorIDSubscriptionsNotAuthorized) {
		if w != nil {
			p.handleAPIError(w, &serializer.APIErrorResponse{ID: constants.APIErrorIDSubscriptionsNotAuthorized, StatusCode: http.StatusUnauthorized, Message: constants.APIErrorSubscriptionsNotAuthorized})
			return message
		}

		message = subscriptionsNotAuthorizedErrorForUser
		if isSysAdmin {
			message = subscriptionsNotAuthorizedErrorForAdmin
		}

		return message
	}

	if strings.EqualFold(err.Error(), constants.APIErrorIDLatestUpdateSetNotUploaded) {
		if w != nil {
			p.handleAPIError(w, &serializer.APIErrorResponse{ID: constants.APIErrorIDLatestUpdateSetNotUploaded, StatusCode: http.StatusBadRequest, Message: constants.APIErrorLatestUpdateSetNotUploaded})
		}

		return constants.APIErrorIDLatestUpdateSetNotUploaded
	}

	if statusCode == http.StatusNotFound && strings.Contains(err.Error(), constants.ErrorACLRestrictsRecordRetrieval) {
		if w != nil {
			p.handleAPIError(w, &serializer.APIErrorResponse{ID: constants.APIErrorIDInsufficientPermissions, StatusCode: http.StatusUnauthorized, Message: constants.APIErrorInsufficientPermissions})
		}

		return message
	}

	if w != nil {
		if statusCode == 0 {
			statusCode = http.StatusInternalServerError
		}
		if response == "" {
			response = err.Error()
		}
		p.handleAPIError(w, &serializer.APIErrorResponse{StatusCode: statusCode, Message: response})
	}

	return genericErrorMessage
}

func IsValidUserKey(key string) (string, bool) {
	res := strings.Split(key, "_")
	if len(res) == 2 && res[0]+"_" == constants.UserKeyPrefix {
		return res[1], true
	}
	return "", false
}

func decodeKey(key string) (string, error) {
	if key == "" {
		return "", nil
	}

	decodedKey, err := base64.StdEncoding.DecodeString(key)
	if err != nil {
		return "", err
	}

	return string(decodedKey), nil
}

func (p *Plugin) HasChannelPermissions(userID, channelID string) (int, error) {
	if !p.API.HasPermissionToChannel(userID, channelID, model.PermissionCreatePost) {
		p.API.LogDebug(constants.ErrorChannelPermissionsForUser, "UserID", userID, "ChannelID", channelID)
		return http.StatusForbidden, fmt.Errorf(constants.ErrorInsufficientPermissions)
	}

	return http.StatusOK, nil
}

func (p *Plugin) HasPublicOrPrivateChannelPermissions(userID, channelID string) (int, error) {
	channel, channelErr := p.API.GetChannel(channelID)
	if channelErr != nil {
		p.API.LogDebug(constants.ErrorChannelPermissionsForUser, "Error", channelErr.Error())
		return channelErr.StatusCode, fmt.Errorf(constants.ErrorChannelPermissionsForUser)
	}

	// Check if a channel is direct message or group channel
	if channel.Type == model.ChannelTypeDirect || channel.Type == model.ChannelTypeGroup {
		p.API.LogDebug(constants.ErrorInvalidChannelType, "ChannelType", channel.Type)
		return http.StatusBadRequest, fmt.Errorf(constants.ErrorInvalidChannelType)
	}

	if !p.API.HasPermissionToChannel(userID, channelID, model.PermissionCreatePost) {
		p.API.LogDebug(constants.ErrorChannelPermissionsForUser, "UserID", userID, "ChannelID", channelID)
		return http.StatusForbidden, fmt.Errorf(constants.ErrorInsufficientPermissions)
	}

	return http.StatusOK, nil
}
