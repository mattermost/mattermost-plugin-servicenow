package serializer

import (
	"encoding/json"
	"fmt"
	"io"

	"github.com/Brightscout/mattermost-plugin-servicenow/server/constants"
	"github.com/mattermost/mattermost-server/v5/model"
)

type ServiceNowPartialRecord struct {
	SysID            string `json:"sys_id"`
	Number           string `json:"number"`
	ShortDescription string `json:"short_description"`
}

type ServiceNowRecord struct {
	SysID            string      `json:"sys_id"`
	Number           string      `json:"number"`
	ShortDescription string      `json:"short_description"`
	RecordType       string      `json:"record_type,omitempty"`
	State            string      `json:"state,omitempty"`
	Priority         string      `json:"priority,omitempty"`
	Workflow         string      `json:"workflow_state,omitempty"`
	AssignedTo       interface{} `json:"assigned_to,omitempty"`
	AssignmentGroup  interface{} `json:"assignment_group,omitempty"`
	KnowledgeBase    interface{} `json:"kb_knowledge_base,omitempty"`
	Category         interface{} `json:"kb_category,omitempty"`
	Author           interface{} `json:"author,omitempty"`
}

type NestedField struct {
	DisplayValue string `json:"display_value"`
	Link         string `json:"link"`
}

type ServiceNowPartialRecordsResult struct {
	Result []*ServiceNowPartialRecord `json:"result"`
}

type ServiceNowRecordResult struct {
	Result *ServiceNowRecord `json:"result"`
}

func (nf *NestedField) LoadFromMap(m map[string]interface{}) error {
	data, err := json.Marshal(m)
	if err == nil {
		err = json.Unmarshal(data, nf)
	}

	return err
}

func ServiceNowRecordFromJSON(data io.Reader) (*ServiceNowRecord, error) {
	var sr *ServiceNowRecord
	if err := json.NewDecoder(data).Decode(&sr); err != nil {
		return nil, err
	}

	return sr, nil
}

func (sr *ServiceNowRecord) CreateSharingPost(channelID, botID, serviceNowURL, pluginURL, sharedByUsername string) *model.Post {
	post := &model.Post{
		ChannelId: channelID,
		UserId:    botID,
	}

	titleLink := fmt.Sprintf("%s/nav_to.do?uri=%s.do?sys_id=%s", serviceNowURL, sr.RecordType, sr.SysID)
	fields := []*model.SlackAttachmentField{
		{
			Title: "Short Description",
			Value: sr.ShortDescription,
		},
	}

	if sr.RecordType == constants.RecordTypeKnowledge {
		fields = append(fields, []*model.SlackAttachmentField{
			{
				Title: "Knowledge Base",
				Value: sr.KnowledgeBase,
			},
			{
				Title: "Workflow",
				Value: sr.Workflow,
			},
			{
				Title: "Category",
				Value: sr.Category,
			},
			{
				Title: "Author",
				Value: sr.Author,
			},
		}...)
	} else {
		fields = append(fields, []*model.SlackAttachmentField{
			{
				Title: "State",
				Value: sr.State,
			},
			{
				Title: "Priority",
				Value: sr.Priority,
			},
			{
				Title: "Assigned to",
				Value: sr.AssignedTo,
			},
			{
				Title: "Assignment group",
				Value: sr.AssignmentGroup,
			},
		}...)
	}

	var actions []*model.PostAction
	if constants.RecordTypesSupportingComments[sr.RecordType] {
		actions = append(actions, &model.PostAction{
			Type: "button",
			Name: "Add and view comments",
			Integration: &model.PostActionIntegration{
				URL: fmt.Sprintf("%s%s", pluginURL, constants.PathOpenCommentModal),
				Context: map[string]interface{}{
					constants.ContextNameRecordType: sr.RecordType,
					constants.ContextNameRecordID:   sr.SysID,
				},
			},
		})
	}

	if constants.RecordTypesSupportingStateUpdation[sr.RecordType] {
		actions = append(actions, &model.PostAction{
			Type: "button",
			Name: "Update State",
		})
	}

	slackAttachment := &model.SlackAttachment{
		Title:     sr.Number,
		TitleLink: titleLink,
		Pretext:   fmt.Sprintf("Shared by @%s", sharedByUsername),
		Fields:    fields,
		Actions:   actions,
	}

	model.ParseSlackAttachment(post, []*model.SlackAttachment{slackAttachment})
	return post
}

func (sr *ServiceNowRecord) HandleNestedFields() error {
	var err error
	if sr.RecordType == constants.RecordTypeKnowledge {
		sr.KnowledgeBase, err = GetNestedFieldValue(sr.KnowledgeBase)
		if err != nil {
			return fmt.Errorf("%w : kb_knowledge_base", err)
		}
		sr.Category, err = GetNestedFieldValue(sr.Category)
		if err != nil {
			return fmt.Errorf("%w : kb_category", err)
		}
		sr.Author, err = GetNestedFieldValue(sr.Author)
		if err != nil {
			return fmt.Errorf("%w : author", err)
		}
	} else {
		sr.AssignedTo, err = GetNestedFieldValue(sr.AssignedTo)
		if err != nil {
			return fmt.Errorf("%w : assigned_to", err)
		}
		sr.AssignmentGroup, err = GetNestedFieldValue(sr.AssignmentGroup)
		if err != nil {
			return fmt.Errorf("%w : assignment_group", err)
		}
	}

	return err
}

func GetNestedFieldValue(field interface{}) (string, error) {
	if _, ok := field.(string); ok || field == nil {
		return "N/A", nil
	}

	jsonObject, ok := field.(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("error in parsing field")
	}

	nf := NestedField{}
	if err := nf.LoadFromMap(jsonObject); err != nil {
		return "", err
	}

	return fmt.Sprintf("[%s](%s)", nf.DisplayValue, nf.Link), nil
}
