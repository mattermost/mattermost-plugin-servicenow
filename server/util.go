package main

import (
	"fmt"
	"strings"

	"github.com/Brightscout/mattermost-plugin-servicenow/server/serializer"
)

func ParseSubscriptionsToCommandResponse(subscriptions []*serializer.SubscriptionResponse) string {
	var sb strings.Builder
	sb.WriteString("These are your subscriptions for this channel: \n")
	for _, subscription := range subscriptions {
		sb.WriteString(fmt.Sprintf("* `Subscription ID`: %s, `Record type`: %s, `Subscription type`: %s, `Level`: %s\n", subscription.SysID, subscription.RecordType, subscription.SubscriptionType, subscription.Level))
	}
	return sb.String()
}
