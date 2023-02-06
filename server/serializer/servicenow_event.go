package serializer

import (
	"encoding/json"
	"fmt"
	"io"

	"github.com/mattermost/mattermost-server/v5/model"

	"github.com/mattermost/mattermost-plugin-servicenow/server/constants"
)

type ServiceNowEvent struct {
	SubscriptionID   string `json:"sys_id"`
	RecordID         string `json:"record_id"`
	ChannelID        string `json:"mm_channel_id"`
	UserID           string `json:"mm_user_id"`
	SubscriptionType string `json:"type"`
	RecordType       string `json:"record_type"`
	RecordTypeName   string `json:"record_type_name"`
	Events           string `json:"subscription_events"`
	Number           string `json:"number"`
	ShortDescription string `json:"short_description"`
	Description      string `json:"description"`
	State            string `json:"state"`
	Priority         string `json:"priority"`
	AssignedTo       string `json:"assigned_to"`
	AssignmentGroup  string `json:"assignment_group"`
	Service          string `json:"service"`
	EventOccurred    string `json:"event_occurred"`
}

func ServiceNowEventFromJSON(data io.Reader) (*ServiceNowEvent, error) {
	var se *ServiceNowEvent
	if err := json.NewDecoder(data).Decode(&se); err != nil {
		return nil, err
	}

	return se, nil
}

func (se *ServiceNowEvent) CreateNotificationPost(botID, serviceNowURL, pluginURL string) *model.Post {
	if se.AssignedTo == "" {
		se.AssignedTo = constants.DefaultEmptyValue
	}
	if se.AssignmentGroup == "" {
		se.AssignmentGroup = constants.DefaultEmptyValue
	}
	if se.Service == "" {
		se.Service = constants.DefaultEmptyValue
	}

	titleLink := fmt.Sprintf("%s/nav_to.do?uri=%s.do%%3Fsys_id=%s%%26sysparm_stack=%s_list.do%%3Fsysparm_query=active=true", serviceNowURL, se.RecordType, se.RecordID, se.RecordType)

	if se.Description == "" {
		se.Description = constants.DefaultEmptyValue
	}

	if len(se.Description) > constants.MaxDescriptionChars {
		se.Description = fmt.Sprintf("%s... [see more](%s)", se.Description[:constants.MaxDescriptionChars], titleLink)
	}

	slackAttachment := &model.SlackAttachment{
		Title: fmt.Sprintf("[%s](%s): %s", se.Number, titleLink, se.ShortDescription),
		Fields: []*model.SlackAttachmentField{
			{
				Title: "Description",
				Value: se.Description,
			},
			{
				Title: "Event",
				Value: constants.FormattedEventNames[se.EventOccurred],
				Short: true,
			},
			{
				Title: "Record",
				Value: se.RecordTypeName,
				Short: true,
			},
			{
				Title: "State",
				Value: se.State,
				Short: true,
			},
			{
				Title: "Priority",
				Value: se.Priority,
				Short: true,
			},
			{
				Title: "Assigned To",
				Value: se.AssignedTo,
				Short: true,
			},
			{
				Title: "Assignment Group",
				Value: se.AssignmentGroup,
				Short: true,
			},
			{
				Title: "Service",
				Value: se.Service,
				Short: true,
			},
		},
	}

	post := &model.Post{
		ChannelId: se.ChannelID,
		UserId:    botID,
		Type:      constants.CustomNotifictationPost,
		Props: map[string]interface{}{
			"record_id":   se.RecordID,
			"record_type": se.RecordType,
		},
	}

	model.ParseSlackAttachment(post, []*model.SlackAttachment{slackAttachment})
	return post
}
