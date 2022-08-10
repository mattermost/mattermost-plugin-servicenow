package main

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/Brightscout/mattermost-plugin-servicenow/server/constants"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/serializer"
	"golang.org/x/oauth2"
)

func ParseSubscriptionsToCommandResponse(subscriptions []*serializer.SubscriptionResponse) string {
	var sb strings.Builder
	sb.WriteString("#### Record subscriptions for this channel\n")
	recordSubscriptionsTableHeader := "| Subscription ID | Record Type | Record ID | Events|\n| :----|:--------| :--------| :-----| :--------|"
	sb.WriteString(recordSubscriptionsTableHeader)
	for _, subscription := range subscriptions {
		sb.WriteString(subscription.GetFormattedSubscription())
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
