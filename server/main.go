package main

import (
	"github.com/mattermost/mattermost-plugin-servicenow/server/plugin"
	mmplugin "github.com/mattermost/mattermost-server/v5/plugin"
)

func main() {
	mmplugin.ClientMain(plugin.NewPlugin())
}
