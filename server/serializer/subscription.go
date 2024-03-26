package serializer

import (
	"encoding/json"
	"fmt"
	"io"
	"regexp"
	"strings"

	"github.com/mattermost/mattermost-server/v6/model"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"

	"github.com/mattermost/mattermost-plugin-servicenow/server/constants"
)

type SubscriptionPayload struct {
	ChannelID          *string `json:"channel_id"`
	UserID             *string `json:"user_id"`
	Type               *string `json:"type"`
	RecordType         *string `json:"record_type"`
	RecordID           *string `json:"record_id"`
	IsActive           *bool   `json:"is_active"`
	SubscriptionEvents *string `json:"subscription_events"`
	RecordNumber       *string `json:"record_number"`
	ServerURL          *string `json:"server_url"`
}

type SubscriptionResponse struct {
	SysID              string `json:"sys_id"`
	UserID             string `json:"user_id"`
	UserName           string `json:"-"`
	ChannelID          string `json:"channel_id"`
	ChannelName        string `json:"-"`
	RecordType         string `json:"record_type"`
	RecordID           string `json:"record_id"`
	SubscriptionEvents string `json:"subscription_events"`
	Type               string `json:"type"`
	ServerURL          string `json:"server_url"`
	IsActive           string `json:"is_active"`
	Number             string `json:"number"`
	ShortDescription   string `json:"short_description"`
}

func (s *SubscriptionResponse) GetFormattedSubscription() string {
	subscriptionEvents := GetFormattedSubscriptionEvents(s.SubscriptionEvents)

	if s.Type == constants.SubscriptionTypeRecord {
		return fmt.Sprintf("\n|%s|%s|%s|%s|%s|%s|%s|", s.SysID, constants.FormattedRecordTypes[s.RecordType], s.Number, s.ShortDescription, subscriptionEvents, s.UserName, s.ChannelName)
	}
	return fmt.Sprintf("\n|%s|%s|%s|%s|%s|", s.SysID, constants.FormattedRecordTypes[s.RecordType], subscriptionEvents, s.UserName, s.ChannelName)
}

type SubscriptionResult struct {
	Result *SubscriptionResponse `json:"result"`
}

type SubscriptionsResult struct {
	Result []*SubscriptionResponse `json:"result"`
}

func (s *SubscriptionPayload) IsValidForUpdation(siteURL string) error {
	if s.UserID != nil && !model.IsValidId(*s.UserID) {
		return fmt.Errorf("userID is not valid")
	}

	if s.ChannelID != nil && !model.IsValidId(*s.ChannelID) {
		return fmt.Errorf("channelID is not valid")
	}

	if s.Type == nil {
		return fmt.Errorf("type is required")
	}

	if !constants.ValidSubscriptionTypes[*s.Type] {
		return fmt.Errorf("type is not valid")
	}

	if *s.Type == constants.SubscriptionTypeBulk {
		recordID := ""
		s.RecordID = &recordID
	}

	if s.RecordType != nil && !constants.ValidSubscriptionRecordTypes[*s.RecordType] {
		return fmt.Errorf("recordType is not valid")
	}

	if s.SubscriptionEvents != nil {
		events := strings.Split(*s.SubscriptionEvents, ",")
		for _, event := range events {
			event = strings.TrimSpace(event)
			if !constants.ValidSubscriptionEvents[event] {
				return fmt.Errorf("subscription event %s is not valid", event)
			}
		}
	}

	if s.ServerURL != nil && *s.ServerURL != siteURL {
		return fmt.Errorf("serverURL is different from the site URL")
	}
	return nil
}

func (s *SubscriptionPayload) IsValidForCreation(siteURL string) error {
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

	if s.Type == nil {
		return fmt.Errorf("type is required")
	} else if !constants.ValidSubscriptionTypes[*s.Type] {
		return fmt.Errorf("type is not valid")
	}

	if *s.Type == constants.SubscriptionTypeRecord {
		if s.RecordID == nil {
			return fmt.Errorf("recordID is required")
		}

		if valid, err := regexp.MatchString(constants.ServiceNowSysIDRegex, *s.RecordID); err != nil || !valid {
			return fmt.Errorf("recordID is not valid")
		}
	} else {
		recordID := ""
		s.RecordID = &recordID
	}

	if s.RecordType == nil {
		return fmt.Errorf("recordType is required")
	} else if !constants.ValidSubscriptionRecordTypes[*s.RecordType] {
		return fmt.Errorf("recordType is not valid")
	}

	if s.SubscriptionEvents == nil {
		return fmt.Errorf("subscriptionEvents are required")
	}

	events := strings.Split(*s.SubscriptionEvents, ",")
	for _, event := range events {
		event = strings.TrimSpace(event)
		if !constants.ValidSubscriptionEvents[event] {
			return fmt.Errorf("subscription event %s is not valid", event)
		}
	}

	if s.IsActive == nil {
		return fmt.Errorf("isActive is required")
	} else if !*s.IsActive {
		return fmt.Errorf("isActive must be true for creating subscription")
	}

	if s.ServerURL == nil {
		return fmt.Errorf("serverURL is required")
	} else if *s.ServerURL != siteURL {
		return fmt.Errorf("serverURL is different from the site URL")
	}

	return nil
}

func SubscriptionFromJSON(data io.Reader) (*SubscriptionPayload, error) {
	var sp *SubscriptionPayload
	if err := json.NewDecoder(data).Decode(&sp); err != nil {
		return nil, err
	}

	return sp, nil
}

func GetFormattedSubscriptionEvents(subscriptionEvents string) string {
	var formattedSubscriptionEvents strings.Builder
	events := strings.Split(subscriptionEvents, ",")
	for index, event := range events {
		event = constants.FormattedEventNames[strings.TrimSpace(event)]
		if index != len(events)-1 {
			event += ", "
		}
		formattedSubscriptionEvents.WriteString(event)
	}

	return formattedSubscriptionEvents.String()
}

func (s *SubscriptionResponse) CreateSubscriptionCreatedPost(botID, serviceNowURL string) *model.Post {
	post := &model.Post{
		ChannelId: s.ChannelID,
		UserId:    botID,
	}

	subscriptionEvents := GetFormattedSubscriptionEvents(s.SubscriptionEvents)
	var titleLink, postTitle string
	recordType := cases.Title(language.Und).String(s.RecordType)
	if s.Type == constants.SubscriptionTypeRecord {
		titleLink = fmt.Sprintf(constants.PathRecord, serviceNowURL, s.RecordType, s.RecordID, s.RecordType)
		postTitle = fmt.Sprintf("%s subscription created for %s [%s](%s)", cases.Title(language.Und).String(s.Type), recordType, s.Number, titleLink)
	} else {
		titleLink = fmt.Sprintf(constants.PathRecordList, serviceNowURL, s.RecordType)
		postTitle = fmt.Sprintf("%s subscription created for [%s](%s)", constants.BulkSubscription, recordType, titleLink)
	}

	slackAttachment := &model.SlackAttachment{
		Title: postTitle,
		Fields: []*model.SlackAttachmentField{
			{
				Title: "Subscription ID",
				Value: s.SysID,
			},
			{
				Title: "Event(s)",
				Value: subscriptionEvents,
			},
		},
	}

	model.ParseSlackAttachment(post, []*model.SlackAttachment{slackAttachment})
	return post
}

func (s *SubscriptionResponse) CreateSubscriptionEditedPost(botID, serviceNowURL string) *model.Post {
	post := &model.Post{
		ChannelId: s.ChannelID,
		UserId:    botID,
	}

	subscriptionEvents := GetFormattedSubscriptionEvents(s.SubscriptionEvents)
	recordType := cases.Title(language.Und).String(s.RecordType)
	var textLink, postText string
	if s.Type == constants.SubscriptionTypeRecord {
		textLink = fmt.Sprintf(constants.PathRecord, serviceNowURL, s.RecordType, s.RecordID, s.RecordType)
		postText = fmt.Sprintf("%s subscription for %s [%s](%s)", cases.Title(language.Und).String(s.Type), recordType, s.Number, textLink)
	} else {
		textLink = fmt.Sprintf(constants.PathRecordList, serviceNowURL, s.RecordType)
		postText = fmt.Sprintf("%s subscription for [%s](%s)", constants.BulkSubscription, recordType, textLink)
	}

	slackAttachment := &model.SlackAttachment{
		Fields: []*model.SlackAttachmentField{
			{
				Title: "Subscription Updated",
				Value: postText,
			},
			{
				Title: "Subscription ID",
				Value: s.SysID,
			},
			{
				Title: "Event(s)",
				Value: subscriptionEvents,
			},
		},
	}

	model.ParseSlackAttachment(post, []*model.SlackAttachment{slackAttachment})
	return post
}
