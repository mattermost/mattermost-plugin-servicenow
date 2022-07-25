package main

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/Brightscout/mattermost-plugin-servicenow/server/serializer"
)

func ParseSubscriptionsToCommandResponse(subscriptions []*serializer.SubscriptionResponse) string {
	var sb strings.Builder
	sb.WriteString("#### Record subscriptions for this channel\n")
	recordSubscriptionsTableHeader := "| Subscription ID | Subscription Type | Record Type | Record ID | Events|\n| :----|:--------| :--------| :-----| :--------|"
	sb.WriteString(recordSubscriptionsTableHeader)
	for _, subscription := range subscriptions {
		sb.WriteString(subscription.GetFormattedSubscription())
	}
	return sb.String()
}

func GetPaginationParamsFromRequest(r *http.Request, param string) (int, error) {
	param = r.URL.Query().Get(param)
	convertedParam, err := strconv.Atoi(param)
	if err != nil {
		return 0, err
	}

	return convertedParam, nil
}
