package serializer

import (
	"fmt"
	"regexp"

	"github.com/Brightscout/mattermost-plugin-servicenow/server/constants"
	"github.com/mattermost/mattermost-server/v5/model"
)

type SubscriptionPayload struct {
	UserID           *string `json:"mm_user_id"`
	ChannelID        *string `json:"channel_id"`
	RecordType       *string `json:"record_type"`
	RecordID         *string `json:"record_id"`
	SubscriptionType *string `json:"subscription_type"`
	Level            *string `json:"level"`
	ServerURL        *string `json:"server_url"`
	IsActive         *bool   `json:"is_active"`
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

type SubscriptionResult struct {
	Result *SubscriptionResponse `json:"result"`
}

type SubscriptionsResult struct {
	Result []*SubscriptionResponse `json:"result"`
}

func (s *SubscriptionPayload) IsValidForUpdation() error {
	if s.UserID != nil && !model.IsValidId(*s.UserID) {
		return fmt.Errorf("userID is not valid")
	}

	if s.ChannelID != nil && !model.IsValidId(*s.ChannelID) {
		return fmt.Errorf("channelID is not valid")
	}

	if s.Level != nil && *s.Level != constants.SubscriptionLevelRecord {
		return fmt.Errorf("level is not valid")
	}

	if s.RecordType != nil && !constants.SubscriptionRecordTypes[*s.RecordType] {
		return fmt.Errorf("recordType is not valid")
	}

	if s.SubscriptionType != nil && !constants.SubscriptionTypes[*s.SubscriptionType] {
		return fmt.Errorf("subscriptionType is not valid")
	}
	return nil
}

func (s *SubscriptionPayload) IsValidForCreation() error {
	if s.UserID == nil {
		return fmt.Errorf("userID is required")
	} else if !model.IsValidId(*s.UserID) {
		return fmt.Errorf("userID is not valid")
	}

	if s.ChannelID == nil {
		return fmt.Errorf("channelID is required")
	} else if !model.IsValidId(*s.ChannelID) {
		return fmt.Errorf("channelID is not valid")
	}

	if s.Level == nil {
		return fmt.Errorf("level is required")
	} else if *s.Level != constants.SubscriptionLevelRecord {
		return fmt.Errorf("level is not valid")
	}

	if s.RecordType == nil {
		return fmt.Errorf("recordType is required")
	} else if !constants.SubscriptionRecordTypes[*s.RecordType] {
		return fmt.Errorf("recordType is not valid")
	}

	if s.SubscriptionType == nil {
		return fmt.Errorf("subscriptionType is required")
	} else if !constants.SubscriptionTypes[*s.SubscriptionType] {
		return fmt.Errorf("subscriptionType is not valid")
	}

	if s.IsActive == nil {
		return fmt.Errorf("isActive is required")
	}

	if s.RecordID == nil {
		return fmt.Errorf("recordID is required")
	} else if valid, err := regexp.MatchString(constants.ServiceNowSysIDRegex, *s.RecordID); err != nil || !valid {
		return fmt.Errorf("recordID is not valid")
	}

	return nil
}
