package plugin

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"sync"

	"github.com/Brightscout/mattermost-plugin-servicenow/server/constants"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/serializer"
	"github.com/mattermost/mattermost-server/v5/model"
	"golang.org/x/oauth2"
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
	w.WriteHeader(statusCode)
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
}

func (p *Plugin) writeJSONArray(w http.ResponseWriter, statusCode int, v interface{}) {
	if statusCode == 0 {
		statusCode = http.StatusOK
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	b, err := json.Marshal(v)
	if err != nil {
		p.API.LogError("Failed to marshal JSON response", "Error", err.Error())
		_, _ = w.Write([]byte("[]"))
		return
	}

	if string(b) == "null" {
		_, _ = w.Write([]byte("[]"))
	} else if _, err = w.Write(b); err != nil {
		p.API.LogError("Error while writing response", "Error", err.Error())
		w.WriteHeader(http.StatusInternalServerError)
	}
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

func (p *Plugin) isAuthorizedSysAdmin(userID string) (bool, error) {
	user, appErr := p.API.GetUser(userID)
	if appErr != nil {
		return false, appErr
	}

	if !strings.Contains(user.Roles, model.SYSTEM_ADMIN_ROLE_ID) {
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

// filterSubscriptionsOnRecordData filters the given subscriptions based on if they contain record data or not.
// It keeps only those subscriptions which contain record data (number and short description) and discards the rest of them
func filterSubscriptionsOnRecordData(subscripitons []*serializer.SubscriptionResponse) []*serializer.SubscriptionResponse {
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
