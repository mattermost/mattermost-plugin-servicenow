package serializer

import (
	"encoding/json"
	"fmt"
	"io"

	"github.com/mattermost/mattermost-server/v6/model"

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
	State            string `json:"state"`
	Priority         string `json:"priority"`
	AssignedTo       string `json:"assigned_to"`
	AssignmentGroup  string `json:"assignment_group"`
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
	post := &model.Post{
		ChannelId: se.ChannelID,
		UserId:    botID,
	}

	if se.AssignedTo == "" {
		se.AssignedTo = "N/A"
	}
	if se.AssignmentGroup == "" {
		se.AssignmentGroup = "N/A"
	}

	var actions []*model.PostAction
	if constants.RecordTypesSupportingComments[se.RecordType] {
		actions = append(actions, &model.PostAction{
			Type: model.PostActionTypeButton,
			Name: "Add and view comments",
			Integration: &model.PostActionIntegration{
				URL: fmt.Sprintf("%s%s", pluginURL, constants.PathOpenCommentModal),
				Context: map[string]interface{}{
					constants.ContextNameRecordType: se.RecordType,
					constants.ContextNameRecordID:   se.RecordID,
				},
			},
		})
	}

	if constants.RecordTypesSupportingStateUpdation[se.RecordType] {
		actions = append(actions, &model.PostAction{
			Type: model.PostActionTypeButton,
			Name: "Update State",
			Integration: &model.PostActionIntegration{
				URL: fmt.Sprintf("%s%s", pluginURL, constants.PathOpenStateModal),
				Context: map[string]interface{}{
					constants.ContextNameRecordType: se.RecordType,
					constants.ContextNameRecordID:   se.RecordID,
				},
			},
		})
	}

	titleLink := fmt.Sprintf(constants.PathRecord, serviceNowURL, se.RecordType, se.RecordID, se.RecordType)
	slackAttachment := &model.SlackAttachment{
		Title: fmt.Sprintf("[%s](%s): %s", se.Number, titleLink, se.ShortDescription),
		Text:  fmt.Sprintf("**Event: %s**", constants.FormattedEventNames[se.EventOccurred]),
		Fields: []*model.SlackAttachmentField{
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
				Title: "Assigned to",
				Value: se.AssignedTo,
				Short: true,
			},
			{
				Title: "Assignment group",
				Value: se.AssignmentGroup,
				Short: true,
			},
		},
		Actions: actions,
	}

	model.ParseSlackAttachment(post, []*model.SlackAttachment{slackAttachment})
	return post
}
