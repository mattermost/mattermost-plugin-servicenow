package main

import (
	"fmt"
	"net/http"
	"strings"
	"sync"

	"github.com/Brightscout/mattermost-plugin-servicenow/server/constants"
	"github.com/gorilla/mux"
	"github.com/mattermost/mattermost-server/v5/plugin"
	"golang.org/x/oauth2"
)

// Plugin implements the interface expected by the Mattermost server to communicate between the server and plugin processes.
type Plugin struct {
	plugin.MattermostPlugin

	// configurationLock synchronizes access to the configuration.
	configurationLock sync.RWMutex

	// configuration is the active plugin configuration. Consult getConfiguration and
	// setConfiguration for usage.
	configuration          *configuration
	botID                  string
	router                 *mux.Router
	store                  Store
	CommandHandlers        map[string]CommandHandleFunc
	subscriptionsActivated bool
}

// NewPlugin returns an instance of a Plugin.
func NewPlugin() *Plugin {
	p := &Plugin{}

	p.CommandHandlers = map[string]CommandHandleFunc{
		"disconnect":    p.handleDisconnect,
		"subscriptions": p.handleSubscriptions,
		"unsubscribe":   p.handleDeleteSubscription,
		"help":          p.handleHelp,
		"":              p.handleHelp,
	}

	return p
}

// ServeHTTP demonstrates a plugin that handles HTTP requests
func (p *Plugin) ServeHTTP(c *plugin.Context, w http.ResponseWriter, r *http.Request) {
	p.router.ServeHTTP(w, r)
}

func (p *Plugin) GetSiteURL() string {
	return p.getConfiguration().MattermostSiteURL
}

func (p *Plugin) GetPluginURLPath() string {
	return "/plugins/" + manifest.ID + "/api/v1"
}

func (p *Plugin) GetPluginURL() string {
	return strings.TrimRight(p.GetSiteURL(), "/") + p.GetPluginURLPath()
}

func (p *Plugin) NewOAuth2Config() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     p.getConfiguration().ServiceNowOAuthClientID,
		ClientSecret: p.getConfiguration().ServiceNowOAuthClientSecret,
		RedirectURL:  fmt.Sprintf("%s%s", p.GetPluginURL(), constants.PathOAuth2Complete),
		Endpoint: oauth2.Endpoint{
			AuthURL:  fmt.Sprintf("%s/oauth_auth.do", p.getConfiguration().ServiceNowBaseURL),
			TokenURL: fmt.Sprintf("%s/oauth_token.do", p.getConfiguration().ServiceNowBaseURL),
		},
	}
}
