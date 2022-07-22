package serializer

import (
	"fmt"

	"github.com/Brightscout/mattermost-plugin-servicenow/server/constants"
	"github.com/mattermost/mattermost-server/v5/model"
)

type SubscriptionPayload struct {
	UserID           string `json:"mm_user_id"`
	ChannelID        string `json:"channel_id"`
	RecordType       string `json:"record_type"`
	RecordID         string `json:"record_id"`
	SubscriptionType string `json:"subscription_type"`
	Level            string `json:"level"`
	ServerURL        string `json:"server_url"`
	IsActive         bool   `json:"is_active"`
}

type SubscriptionResponse struct {
	SysID            string `json:"sys_id"`
	UserID           string `json:"mm_user_id"`
	ChannelID        string `json:"channel_id"`
	RecordType       string `json:"record_type"`
	RecordID         string `json:"record_id"`
	SubscriptionType string `json:"subscription_type"`
	Level            string `json:"level"`
	ServerURL        string `json:"server_url"`
	IsActive         string `json:"is_active"`
}

type SubscriptionsResult struct {
	Result []*SubscriptionResponse `json:"result"`
}

func (s *SubscriptionPayload) IsValid() error {
	if !model.IsValidId(s.UserID) {
		return fmt.Errorf("userID is not valid")
	}

	if !model.IsValidId(s.ChannelID) {
		return fmt.Errorf("channelID is not valid")
	}

	if s.Level != constants.SubscriptionLevelRecord {
		return fmt.Errorf("level is not valid")
	}

	if !constants.SubscriptionRecordTypes[s.RecordType] {
		return fmt.Errorf("recordType is not valid")
	}

	if !constants.SubscriptionTypes[s.SubscriptionType] {
		return fmt.Errorf("subscriptionType is not valid")
	}
	return nil
}
