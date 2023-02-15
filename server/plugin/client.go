package plugin

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/pkg/errors"
	"golang.org/x/oauth2"

	"github.com/mattermost/mattermost-plugin-servicenow/server/constants"
	"github.com/mattermost/mattermost-plugin-servicenow/server/serializer"
)

type Client interface {
	ActivateSubscriptions() (int, error)
	CreateSubscription(*serializer.SubscriptionPayload) (int, error)
	GetSubscription(subscriptionID string) (*serializer.SubscriptionResponse, int, error)
	GetAllSubscriptions(channelID, userID, subscriptionType, limit, offset string) ([]*serializer.SubscriptionResponse, int, error)
	DeleteSubscription(subscriptionID string) (int, error)
	EditSubscription(subscriptionID string, subscription *serializer.SubscriptionPayload) (int, error)
	CheckForDuplicateSubscription(*serializer.SubscriptionPayload) (bool, int, error)
	SearchRecordsInServiceNow(tableName, searchTerm, limit, offset string) ([]*serializer.ServiceNowPartialRecord, int, error)
	GetRecordFromServiceNow(tableName, sysID string) (*serializer.ServiceNowRecord, int, error)
	GetAllComments(recordType, recordID string) (*serializer.ServiceNowComment, int, error)
	AddComment(recordType, recordID string, payload *serializer.ServiceNowCommentPayload) (int, error)
	GetStatesFromServiceNow(recordType string) ([]*serializer.ServiceNowState, int, error)
	UpdateStateOfRecordInServiceNow(recordType, recordID string, payload *serializer.ServiceNowUpdateStatePayload) (int, error)
	GetMe(userEmail string) (*serializer.ServiceNowUser, int, error)
	CreateIncident(*serializer.IncidentPayload) (*serializer.IncidentResponse, int, error)
	SearchCatalogItemsInServiceNow(searchTerm, limit, offset string) ([]*serializer.ServiceNowCatalogItem, int, error)
}

type client struct {
	ctx        context.Context
	httpClient *http.Client
	plugin     *Plugin
}

func (p *Plugin) NewClient(ctx context.Context, token *oauth2.Token) Client {
	httpClient := p.NewOAuth2Config().Client(ctx, token)
	return &client{
		ctx:        ctx,
		httpClient: httpClient,
		plugin:     p,
	}
}

func (c *client) ActivateSubscriptions() (int, error) {
	pluginConfig := c.plugin.getConfiguration()
	subscriptionAuthDetails := &serializer.SubscriptionAuthDetails{}
	query := fmt.Sprintf("server_url=%s^api_secret=%s", pluginConfig.MattermostSiteURL, pluginConfig.WebhookSecret)
	queryParams := url.Values{
		constants.SysQueryParam: {query},
	}

	// TODO: Add an API call for checking if the update set has been uploaded and if its version matches with the plugin's update set XML file
	if _, statusCode, err := c.CallJSON(http.MethodGet, constants.PathActivateSubscriptions, nil, subscriptionAuthDetails, queryParams); err != nil {
		if strings.Contains(err.Error(), "Invalid table") {
			return statusCode, fmt.Errorf(constants.APIErrorIDSubscriptionsNotConfigured)
		}
		if statusCode == http.StatusForbidden || strings.Contains(err.Error(), "User Not Authorized") {
			return statusCode, fmt.Errorf(constants.APIErrorIDSubscriptionsNotAuthorized)
		}

		return statusCode, errors.Wrap(err, "failed to get subscription auth details")
	}

	if len(subscriptionAuthDetails.Result) > 0 {
		return http.StatusOK, nil
	}

	payload := serializer.SubscriptionAuthPayload{
		ServerURL: pluginConfig.MattermostSiteURL,
		APISecret: pluginConfig.WebhookSecret,
	}

	if _, statusCode, err := c.CallJSON(http.MethodPost, constants.PathActivateSubscriptions, payload, nil, nil); err != nil {
		return statusCode, errors.Wrap(err, "failed to activate subscriptions for this server")
	}

	return http.StatusOK, nil
}

func (c *client) CreateSubscription(subscription *serializer.SubscriptionPayload) (int, error) {
	_, statusCode, err := c.CallJSON(http.MethodPost, constants.PathSubscriptionCRUD, subscription, nil, nil)
	if err != nil {
		return statusCode, errors.Wrap(err, "failed to create subscription in ServiceNow")
	}

	return statusCode, nil
}

func (c *client) GetAllSubscriptions(channelID, userID, subscriptionType, limit, offset string) ([]*serializer.SubscriptionResponse, int, error) {
	query := fmt.Sprintf("is_active=true^server_url=%s", c.plugin.getConfiguration().MattermostSiteURL)

	// userID will be intentionally sent empty string if we have to return subscriptions irrespective of user
	if userID != "" {
		query = fmt.Sprintf("%s^user_id=%s", query, userID)
	}
	// channelID will be intentionally sent empty string if we have to return subscriptions for whole server
	if channelID != "" {
		query = fmt.Sprintf("%s^channel_id=%s", query, channelID)
	}

	// subscriptionType will be intentionally sent an empty string if we have to return subscriptions of all types
	if subscriptionType != "" {
		query = fmt.Sprintf("%s^type=%s", query, subscriptionType)
	}

	query = fmt.Sprintf("%s^ORDERBYDESC%s", query, constants.FieldSysUpdatedOn)
	queryParams := url.Values{
		constants.SysQueryParam:       {query},
		constants.SysQueryParamLimit:  {limit},
		constants.SysQueryParamOffset: {offset},
	}

	subscriptions := &serializer.SubscriptionsResult{}
	_, statusCode, err := c.CallJSON(http.MethodGet, constants.PathSubscriptionCRUD, nil, subscriptions, queryParams)
	if err != nil {
		return nil, statusCode, errors.Wrap(err, "failed to get subscriptions from ServiceNow")
	}

	return subscriptions.Result, statusCode, nil
}

func (c *client) GetSubscription(subscriptionID string) (*serializer.SubscriptionResponse, int, error) {
	subscription := &serializer.SubscriptionResult{}
	_, statusCode, err := c.CallJSON(http.MethodGet, fmt.Sprintf("%s/%s", constants.PathSubscriptionCRUD, subscriptionID), nil, subscription, nil)
	if err != nil {
		return nil, statusCode, errors.Wrap(err, "failed to get subscription from ServiceNow")
	}

	return subscription.Result, statusCode, nil
}

func (c *client) DeleteSubscription(subscriptionID string) (int, error) {
	_, statusCode, err := c.CallJSON(http.MethodDelete, fmt.Sprintf("%s/%s", constants.PathSubscriptionCRUD, subscriptionID), nil, nil, nil)
	if err != nil {
		return statusCode, errors.Wrap(err, "failed to delete subscription from ServiceNow")
	}
	return statusCode, nil
}

func (c *client) EditSubscription(subscriptionID string, subscription *serializer.SubscriptionPayload) (int, error) {
	_, statusCode, err := c.CallJSON(http.MethodPatch, fmt.Sprintf("%s/%s", constants.PathSubscriptionCRUD, subscriptionID), subscription, nil, nil)
	if err != nil {
		return statusCode, errors.Wrap(err, "failed to update subscription from ServiceNow")
	}
	return statusCode, nil
}

// CheckForDuplicateSubscription returns true and an error if a duplicate subscription exists in ServiceNow
// The boolean return type value should be checked only if the error being returned is nil
func (c *client) CheckForDuplicateSubscription(subscription *serializer.SubscriptionPayload) (bool, int, error) {
	query := fmt.Sprintf("channel_id=%s^is_active=true^type=%s^record_type=%s^record_id=%s^server_url=%s", *subscription.ChannelID, *subscription.Type, *subscription.RecordType, *subscription.RecordID, *subscription.ServerURL)
	queryParams := url.Values{
		constants.SysQueryParam:      {query},
		constants.SysQueryParamLimit: {fmt.Sprint(constants.DefaultPerPage)},
	}

	subscriptions := &serializer.SubscriptionsResult{}
	_, statusCode, err := c.CallJSON(http.MethodGet, constants.PathSubscriptionCRUD, nil, subscriptions, queryParams)
	if err != nil {
		return false, statusCode, errors.Wrap(err, "failed to get subscriptions from ServiceNow")
	}

	return len(subscriptions.Result) > 0, statusCode, nil
}

func (c *client) SearchRecordsInServiceNow(tableName, searchTerm, limit, offset string) ([]*serializer.ServiceNowPartialRecord, int, error) {
	query := fmt.Sprintf("%s LIKE%s ^OR %s STARTSWITH%s", constants.FieldShortDescription, searchTerm, constants.FieldNumber, searchTerm)
	queryParams := url.Values{
		constants.SysQueryParam:       {query},
		constants.SysQueryParamLimit:  {limit},
		constants.SysQueryParamOffset: {offset},
		constants.SysQueryParamFields: {fmt.Sprintf("%s,%s,%s", constants.FieldSysID, constants.FieldNumber, constants.FieldShortDescription)},
	}

	records := &serializer.ServiceNowPartialRecordsResult{}
	url := strings.Replace(constants.PathGetRecordsFromServiceNow, "{tableName}", tableName, 1)
	_, statusCode, err := c.CallJSON(http.MethodGet, url, nil, records, queryParams)
	if err != nil {
		return nil, statusCode, err
	}

	return records.Result, statusCode, nil
}

func (c *client) GetRecordFromServiceNow(tableName, sysID string) (*serializer.ServiceNowRecord, int, error) {
	queryParams := url.Values{
		constants.SysQueryParamDisplayValue: {"true"},
	}

	record := &serializer.ServiceNowRecordResult{}
	url := strings.Replace(constants.PathGetRecordsFromServiceNow, "{tableName}", tableName, 1)
	_, statusCode, err := c.CallJSON(http.MethodGet, fmt.Sprintf("%s/%s", url, sysID), nil, record, queryParams)
	if err != nil {
		return nil, statusCode, err
	}

	return record.Result, statusCode, nil
}

func (c *client) GetAllComments(recordType, recordID string) (*serializer.ServiceNowComment, int, error) {
	queryParams := url.Values{
		constants.SysQueryParamDisplayValue: {"true"},
		constants.SysQueryParamFields:       {constants.FieldCommentsAndWorkNotes},
	}

	comments := &serializer.ServiceNowCommentsResult{}
	url := strings.Replace(constants.PathGetRecordsFromServiceNow, "{tableName}", recordType, 1)
	_, statusCode, err := c.CallJSON(http.MethodGet, fmt.Sprintf("%s/%s", url, recordID), nil, comments, queryParams)
	if err != nil {
		return nil, statusCode, err
	}

	return comments.Result, statusCode, nil
}

func (c *client) AddComment(recordType, recordID string, payload *serializer.ServiceNowCommentPayload) (int, error) {
	url := strings.Replace(constants.PathGetRecordsFromServiceNow, "{tableName}", recordType, 1)
	_, statusCode, err := c.CallJSON(http.MethodPatch, fmt.Sprintf("%s/%s", url, recordID), payload, nil, nil)
	return statusCode, err
}

func (c *client) GetStatesFromServiceNow(recordType string) ([]*serializer.ServiceNowState, int, error) {
	states := &serializer.ServiceNowStatesResult{}
	url := strings.Replace(constants.PathGetStatesFromServiceNow, "{record_type}", recordType, 1)
	_, statusCode, err := c.CallJSON(http.MethodGet, url, nil, states, nil)
	if err != nil {
		if statusCode == http.StatusBadRequest && strings.Contains(err.Error(), "Requested URI does not represent any resource") {
			return nil, statusCode, errors.New(constants.APIErrorIDLatestUpdateSetNotUploaded)
		}

		return nil, statusCode, err
	}

	return states.Result, statusCode, nil
}

func (c *client) UpdateStateOfRecordInServiceNow(recordType, recordID string, payload *serializer.ServiceNowUpdateStatePayload) (int, error) {
	url := strings.Replace(constants.PathGetRecordsFromServiceNow, "{tableName}", recordType, 1)
	_, statusCode, err := c.CallJSON(http.MethodPatch, fmt.Sprintf("%s/%s", url, recordID), payload, nil, nil)
	return statusCode, err
}

func (c *client) GetMe(userEmail string) (*serializer.ServiceNowUser, int, error) {
	userList := &serializer.UserList{}
	path := fmt.Sprintf("%s%s", c.plugin.getConfiguration().ServiceNowBaseURL, constants.PathGetUserFromServiceNow)
	params := url.Values{}
	params.Add(constants.SysQueryParam, fmt.Sprintf("email=%s", userEmail))

	_, statusCode, err := c.CallJSON(http.MethodGet, path, nil, userList, params)
	if err != nil {
		return nil, statusCode, errors.Wrap(err, "failed to get the user details")
	}

	if len(userList.UserDetails) == 0 {
		return nil, statusCode, fmt.Errorf("please make sure your email address on your Mattermost account matches the email in your ServiceNow account")
	}

	if len(userList.UserDetails) > 1 {
		c.plugin.API.LogWarn("Multiple users with the same email address exist on ServiceNow instance", "Email", userEmail, "Instance", c.plugin.getConfiguration().ServiceNowBaseURL)
	}

	return userList.UserDetails[0], statusCode, nil
}

func (c *client) CreateIncident(incident *serializer.IncidentPayload) (*serializer.IncidentResponse, int, error) {
	response := &serializer.IncidentResult{}
	url := strings.Replace(constants.PathGetRecordsFromServiceNow, "{tableName}", constants.RecordTypeIncident, 1)
	_, statusCode, err := c.CallJSON(http.MethodPost, url, incident, response, nil)
	if err != nil {
		return nil, statusCode, errors.Wrap(err, "failed to create the incident in ServiceNow")
	}

	return response.Result, statusCode, nil
}

func (c *client) SearchCatalogItemsInServiceNow(searchTerm, limit, offset string) ([]*serializer.ServiceNowCatalogItem, int, error) {
	queryParams := url.Values{
		constants.SysQueryParamText:   {searchTerm},
		constants.SysQueryParamLimit:  {limit},
		constants.SysQueryParamOffset: {offset},
	}

	items := &serializer.ServiceNowCatalogItemsResult{}
	_, statusCode, err := c.CallJSON(http.MethodGet, constants.PathGetCatalogItemsFromServiceNow, nil, items, queryParams)
	if err != nil {
		return nil, statusCode, err
	}

	return items.Result, statusCode, nil
}
