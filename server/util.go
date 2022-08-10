package main

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/Brightscout/mattermost-plugin-servicenow/server/serializer"
)

func ParseSubscriptionsToCommandResponse(subscriptions []*serializer.SubscriptionResponse) string {
	var sb strings.Builder
	sb.WriteString("These are your subscriptions for this channel: \n")
	for _, subscription := range subscriptions {
		sb.WriteString(fmt.Sprintf("* `Subscription ID`: %s, `Record type`: %s, `Subscription type`: %s, `SubscriptionEvents`: %s\n", subscription.SysID, subscription.RecordType, subscription.Type, subscription.SubscriptionEvents))
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
