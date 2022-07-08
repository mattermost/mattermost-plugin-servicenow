package main

import (
	"context"
	"fmt"
	"net/http"
	"net/url"

	"github.com/Brightscout/mattermost-plugin-servicenow/server/constants"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/serializer"
	"github.com/pkg/errors"
	"golang.org/x/oauth2"
)

type Client interface {
	ActivateSubscriptions(serverURL, secret string) error
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

func (c *client) ActivateSubscriptions(serverURL, secret string) error {
	subscriptionAuthDetails := &serializer.SubscriptionAuthDetails{}
	queryParams := url.Values{}
	queryParams.Add(constants.SysQueryParam, fmt.Sprintf("server_url=%s", serverURL))
	if _, err := c.CallJSON(http.MethodGet, constants.PathActivateSubscriptions, nil, subscriptionAuthDetails, queryParams); err != nil {
		return errors.Wrap(err, "failed to get subscription auth details")
	}

	if len(subscriptionAuthDetails.Result) > 0 {
		c.plugin.subscriptionsActivated = true
		return nil
	}

	payload := serializer.SubscriptionAuthPayload{
		ServerURL: serverURL,
		APISecret: secret,
	}

	if _, err := c.CallJSON(http.MethodPost, constants.PathActivateSubscriptions, payload, nil, nil); err != nil {
		return errors.Wrap(err, "failed to activate subscriptions for this server")
	}

	c.plugin.subscriptionsActivated = true
	return nil
}
