package plugin

import (
	"fmt"
	"net/http"
	"strings"
	"sync"

	"github.com/gorilla/mux"
	pluginapi "github.com/mattermost/mattermost-plugin-api"
	"github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/plugin"
	"golang.org/x/oauth2"

	"github.com/mattermost/mattermost-plugin-servicenow/server/constants"
	"github.com/mattermost/mattermost-plugin-servicenow/server/telemetry"

	root "github.com/mattermost/mattermost-plugin-servicenow"
)

var Manifest model.Manifest = root.Manifest

// Plugin implements the interface expected by the Mattermost server to communicate between the server and plugin processes.
type Plugin struct {
	plugin.MattermostPlugin

	// configurationLock synchronizes access to the configuration.
	configurationLock sync.RWMutex

	// configuration is the active plugin configuration. Consult getConfiguration and
	// setConfiguration for usage.
	configuration *configuration

	client          *pluginapi.Client
	botID           string
	router          *mux.Router
	store           Store
	CommandHandlers map[string]CommandHandleFunc

	// Telemetry package copied inside repository, should be changed
	// to pluginapi's one (0.1.3+) when min_server_version is safe to point at 7.x
	telemetryClient telemetry.Client
	tracker         telemetry.Tracker
}

// NewPlugin returns an instance of a Plugin.
func NewPlugin() *Plugin {
	p := &Plugin{}

	p.CommandHandlers = map[string]CommandHandleFunc{
		constants.CommandDisconnect:     p.handleDisconnect,
		constants.CommandSubscriptions:  p.handleSubscriptions,
		constants.CommandUnsubscribe:    p.handleDeleteSubscription,
		constants.CommandSearchAndShare: p.handleSearchAndShare,
		constants.CommandIncident:       p.handleIncident,
	}

	return p
}

// ServeHTTP demonstrates a plugin that handles HTTP requests
func (p *Plugin) ServeHTTP(_ *plugin.Context, w http.ResponseWriter, r *http.Request) {
	p.router.ServeHTTP(w, r)
}

func (p *Plugin) GetSiteURL() string {
	return p.getConfiguration().MattermostSiteURL
}

func (p *Plugin) GetPluginURLPath() string {
	return "/plugins/" + Manifest.Id + "/api/v1"
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
