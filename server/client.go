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
	ActivateSubscriptions() error
	CreateSubscription(*serializer.SubscriptionPayload) error
	GetSubscriptions(userID, channelID, limit, offset string) ([]*serializer.SubscriptionResponse, error)
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

func (c *client) ActivateSubscriptions() error {
	if c.plugin.subscriptionsActivated {
		return nil
	}
	serverURL := c.plugin.getConfiguration().MattermostSiteURL
	subscriptionAuthDetails := &serializer.SubscriptionAuthDetails{}
	queryParams := url.Values{}
	queryParams.Add(constants.SysQueryParam, fmt.Sprintf("server_url=%s", serverURL))
	// TODO: Add an API call for checking if the update set has been uploaded and if its version matches with the plugin's update set XML file
	if _, err := c.CallJSON(http.MethodGet, constants.PathActivateSubscriptions, nil, subscriptionAuthDetails, queryParams); err != nil {
		if strings.Contains(err.Error(), "Invalid table") {
			return errors.New(constants.UpdateSetNotUploadedMessage)
		}
		return errors.Wrap(err, "failed to get subscription auth details")
	}

	if len(subscriptionAuthDetails.Result) > 0 {
		c.plugin.subscriptionsActivated = true
		return nil
	}

	payload := serializer.SubscriptionAuthPayload{
		ServerURL: serverURL,
		APISecret: c.plugin.getConfiguration().WebhookSecret,
	}

	if _, err := c.CallJSON(http.MethodPost, constants.PathActivateSubscriptions, payload, nil, nil); err != nil {
		return errors.Wrap(err, "failed to activate subscriptions for this server")
	}

	c.plugin.subscriptionsActivated = true
	return nil
}

func (c *client) CreateSubscription(subscription *serializer.SubscriptionPayload) error {
	if err := c.ActivateSubscriptions(); err != nil {
		return err
	}

	if _, err := c.CallJSON(http.MethodPost, constants.PathSubscriptionCRUD, subscription, nil, nil); err != nil {
		return errors.Wrap(err, "failed to create subscription in ServiceNow")
	}

	return nil
}

func (c *client) GetSubscriptions(userID, channelID, limit, offset string) ([]*serializer.SubscriptionResponse, error) {
	if err := c.ActivateSubscriptions(); err != nil {
		return nil, err
	}

	query := fmt.Sprintf("mm_user_id=%s^is_active=true", userID)
	// channelID will be intentionally sent empty string if we have to return subscriptions for whole server
	if channelID != "" {
		query = fmt.Sprintf("%s^channel_id=%s", query, channelID)
	}

	params := url.Values{
		constants.SysQueryParam:       {query},
		constants.SysQueryParamLimit:  {limit},
		constants.SysQueryParamOffset: {offset},
	}

	subscriptions := &serializer.SubscriptionsResult{}
	if _, err := c.CallJSON(http.MethodGet, constants.PathSubscriptionCRUD, nil, subscriptions, params); err != nil {
		return nil, errors.Wrap(err, "failed to get subscriptions from ServiceNow")
	}

	return subscriptions.Result, nil
}
