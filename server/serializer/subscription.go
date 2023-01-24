package serializer

import (
	"encoding/json"
	"fmt"
	"io"
	"regexp"
	"strings"

	"github.com/mattermost/mattermost-server/v5/model"
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
	SubscriptionNumber *string `json:"subscription_number"`
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
	var subscriptionEvents strings.Builder
	events := strings.Split(s.SubscriptionEvents, ",")
	for index, event := range events {
		event = constants.FormattedEventNames[strings.TrimSpace(event)]
		if index != len(events)-1 {
			event += ", "
		}
		subscriptionEvents.WriteString(event)
	}

	if s.Type == constants.SubscriptionTypeRecord {
		return fmt.Sprintf("\n|%s|%s|%s|%s|%s|%s|%s|", s.SysID, constants.FormattedRecordTypes[s.RecordType], s.Number, s.ShortDescription, subscriptionEvents.String(), s.UserName, s.ChannelName)
	}
	return fmt.Sprintf("\n|%s|%s|%s|%s|%s|", s.SysID, constants.FormattedRecordTypes[s.RecordType], subscriptionEvents.String(), s.UserName, s.ChannelName)
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

func (sr *SubscriptionResponse) CreateSubscriptionPost(botID, serviceNowURL string) *model.Post {
	post := &model.Post{
		ChannelId: sr.ChannelID,
		UserId:    botID,
	}

	subscriptionEvents := ""
	events := strings.Split(sr.SubscriptionEvents, ",")
	for index, event := range events {
		subscriptionEvents += constants.FormattedEventNames[strings.TrimSpace(event)]
		if index != len(events)-1 {
			subscriptionEvents += ", "
		}
	}

	titleLink := fmt.Sprintf("%s/nav_to.do?uri=%s_list.do%%3Fsysparm_query=active=true", serviceNowURL, sr.RecordType)
	recordType := cases.Title(language.Und).String(sr.RecordType)
	postTitle := fmt.Sprintf("%s subscription created for [%s](%s)", constants.BulkSubscription, recordType, titleLink)
	if sr.Type == constants.RecordSubscription {
		titleLink = fmt.Sprintf("%s/nav_to.do?uri=%s.do%%3Fsys_id=%s%%26sysparm_stack=%s_list.do%%3Fsysparm_query=active=true", serviceNowURL, sr.RecordType, sr.RecordID, sr.RecordType)
		postTitle = fmt.Sprintf("%s subscription created for %s [%s](%s)", cases.Title(language.Und).String(sr.Type), recordType, sr.Number, titleLink)
	}

	slackAttachment := &model.SlackAttachment{
		Title: postTitle,
		Fields: []*model.SlackAttachmentField{
			{
				Title: "Subscription ID",
				Value: sr.SysID,
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

func (sr *SubscriptionResponse) EditSubscriptionPost(botID, serviceNowURL string) *model.Post {
	post := &model.Post{
		ChannelId: sr.ChannelID,
		UserId:    botID,
	}

	subscriptionEvents := ""
	events := strings.Split(sr.SubscriptionEvents, ",")
	for index, event := range events {
		subscriptionEvents += constants.FormattedEventNames[strings.TrimSpace(event)]
		if index != len(events)-1 {
			subscriptionEvents += ", "
		}
	}

	recordType := cases.Title(language.Und).String(sr.RecordType)
	textLink := fmt.Sprintf("%s/nav_to.do?uri=%s_list.do%%3Fsysparm_query=active=true", serviceNowURL, sr.RecordType)
	postText := fmt.Sprintf("%s subscription for [%s](%s)", constants.BulkSubscription, recordType, textLink)
	if sr.Type == constants.RecordSubscription {
		textLink = fmt.Sprintf("%s/nav_to.do?uri=%s.do%%3Fsys_id=%s%%26sysparm_stack=%s_list.do%%3Fsysparm_query=active=true", serviceNowURL, sr.RecordType, sr.RecordID, sr.RecordType)
		postText = fmt.Sprintf("%s subscription for %s [%s](%s)", cases.Title(language.Und).String(sr.Type), recordType, sr.Number, textLink)
	}

	slackAttachment := &model.SlackAttachment{
		Fields: []*model.SlackAttachmentField{
			{
				Title: "Subscription Updated",
				Value: postText,
			},
			{
				Title: "Subscription ID",
				Value: sr.SysID,
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
