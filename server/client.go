package main

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/Brightscout/mattermost-plugin-servicenow/server/constants"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/serializer"
	"github.com/pkg/errors"
	"golang.org/x/oauth2"
)

type Client interface {
	ActivateSubscriptions() (int, error)
	CreateSubscription(*serializer.SubscriptionPayload) (int, error)
	GetSubscription(subscriptionID string) (*serializer.SubscriptionResponse, int, error)
	GetAllSubscriptions(channelID, userID, limit, offset string) ([]*serializer.SubscriptionResponse, int, error)
	DeleteSubscription(subscriptionID string) (int, error)
	EditSubscription(subscriptionID string, subscription *serializer.SubscriptionPayload) (int, error)
	CheckForDuplicateSubscription(*serializer.SubscriptionPayload) (bool, int, error)
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
	if c.plugin.subscriptionsActivated {
		return http.StatusOK, nil
	}
	serverURL := c.plugin.getConfiguration().MattermostSiteURL
	subscriptionAuthDetails := &serializer.SubscriptionAuthDetails{}
	queryParams := url.Values{}
	queryParams.Add(constants.SysQueryParam, fmt.Sprintf("server_url=%s", serverURL))
	// TODO: Add an API call for checking if the update set has been uploaded and if its version matches with the plugin's update set XML file
	if _, statusCode, err := c.CallJSON(http.MethodGet, constants.PathActivateSubscriptions, nil, subscriptionAuthDetails, queryParams); err != nil {
		if strings.Contains(err.Error(), "Invalid table") {
			return statusCode, constants.ErrUpdateSetNotUploaded
		}
		return statusCode, errors.Wrap(err, "failed to get subscription auth details")
	}

	if len(subscriptionAuthDetails.Result) > 0 {
		c.plugin.subscriptionsActivated = true
		return http.StatusOK, nil
	}

	payload := serializer.SubscriptionAuthPayload{
		ServerURL: serverURL,
		APISecret: c.plugin.getConfiguration().WebhookSecret,
	}

	if _, statusCode, err := c.CallJSON(http.MethodPost, constants.PathActivateSubscriptions, payload, nil, nil); err != nil {
		return statusCode, errors.Wrap(err, "failed to activate subscriptions for this server")
	}

	c.plugin.subscriptionsActivated = true
	return http.StatusOK, nil
}

func (c *client) CreateSubscription(subscription *serializer.SubscriptionPayload) (int, error) {
	if statusCode, err := c.ActivateSubscriptions(); err != nil {
		return statusCode, err
	}

	_, statusCode, err := c.CallJSON(http.MethodPost, constants.PathSubscriptionCRUD, subscription, nil, nil)
	if err != nil {
		return statusCode, errors.Wrap(err, "failed to create subscription in ServiceNow")
	}

	return statusCode, nil
}

func (c *client) GetAllSubscriptions(channelID, userID, limit, offset string) ([]*serializer.SubscriptionResponse, int, error) {
	if statusCode, err := c.ActivateSubscriptions(); err != nil {
		return nil, statusCode, err
	}

	query := "is_active=true"
	// userID will be intentionally sent empty string if we have to return subscriptions irrespective of user
	if userID != "" {
		query = fmt.Sprintf("%s^user_id=%s", query, userID)
	}
	// channelID will be intentionally sent empty string if we have to return subscriptions for whole server
	if channelID != "" {
		query = fmt.Sprintf("%s^channel_id=%s", query, channelID)
	}

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
	if statusCode, err := c.ActivateSubscriptions(); err != nil {
		return nil, statusCode, err
	}

	subscription := &serializer.SubscriptionResult{}
	_, statusCode, err := c.CallJSON(http.MethodGet, fmt.Sprintf("%s/%s", constants.PathSubscriptionCRUD, subscriptionID), nil, subscription, nil)
	if err != nil {
		return nil, statusCode, errors.Wrap(err, "failed to get subscription from ServiceNow")
	}

	return subscription.Result, statusCode, nil
}

func (c *client) DeleteSubscription(subscriptionID string) (int, error) {
	if statusCode, err := c.ActivateSubscriptions(); err != nil {
		return statusCode, err
	}

	_, statusCode, err := c.CallJSON(http.MethodDelete, fmt.Sprintf("%s/%s", constants.PathSubscriptionCRUD, subscriptionID), nil, nil, nil)
	if err != nil {
		return statusCode, errors.Wrap(err, "failed to delete subscription from ServiceNow")
	}
	return statusCode, nil
}

func (c *client) EditSubscription(subscriptionID string, subscription *serializer.SubscriptionPayload) (int, error) {
	if statusCode, err := c.ActivateSubscriptions(); err != nil {
		return statusCode, err
	}

	_, statusCode, err := c.CallJSON(http.MethodPatch, fmt.Sprintf("%s/%s", constants.PathSubscriptionCRUD, subscriptionID), subscription, nil, nil)
	if err != nil {
		return statusCode, errors.Wrap(err, "failed to update subscription from ServiceNow")
	}
	return statusCode, nil
}

// CheckForDuplicateSubscription returns true and an error if a duplicate subscription exists in ServiceNow
// The boolean return type value should be checked only if the error being returned is nil
func (c *client) CheckForDuplicateSubscription(subscription *serializer.SubscriptionPayload) (bool, int, error) {
	if statusCode, err := c.ActivateSubscriptions(); err != nil {
		return false, statusCode, err
	}

	query := fmt.Sprintf("channel_id=%s^is_active=true^record_id=%s^server_url=%s", *subscription.ChannelID, *subscription.RecordID, *subscription.ServerURL)
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
