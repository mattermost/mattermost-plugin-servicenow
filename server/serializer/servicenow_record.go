package serializer

import (
	"encoding/json"
	"fmt"
	"io"
	"strings"

	"github.com/mattermost/mattermost-server/v6/model"

	"github.com/mattermost/mattermost-plugin-servicenow/server/constants"
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
	Description      string      `json:"description"`
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
	fields := []*model.SlackAttachmentField{}

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
			Type: model.PostActionTypeButton,
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
			Type: model.PostActionTypeButton,
			Name: "Update State",
			Integration: &model.PostActionIntegration{
				URL: fmt.Sprintf("%s%s", pluginURL, constants.PathOpenStateModal),
				Context: map[string]interface{}{
					constants.ContextNameRecordType: sr.RecordType,
					constants.ContextNameRecordID:   sr.SysID,
				},
			},
		})
	}

	slackAttachment := &model.SlackAttachment{
		Title:   fmt.Sprintf("[%s](%s): %s", sr.Number, titleLink, sr.ShortDescription),
		Fields:  fields,
		Actions: actions,
	}

	if sharedByUsername != "" {
		slackAttachment.Pretext = fmt.Sprintf("Shared by @%s", sharedByUsername)
	}

	model.ParseSlackAttachment(post, []*model.SlackAttachment{slackAttachment})
	return post
}

func (sr *ServiceNowRecord) HandleNestedFields(serviceNowURL string) error {
	var err error
	if sr.RecordType == constants.RecordTypeKnowledge {
		sr.KnowledgeBase, err = GetNestedFieldValue(sr.KnowledgeBase, constants.FieldKnowledgeBase, serviceNowURL)
		if err != nil {
			return fmt.Errorf("%w : kb_knowledge_base", err)
		}
		sr.Category, err = GetNestedFieldValue(sr.Category, constants.FieldCategory, serviceNowURL)
		if err != nil {
			return fmt.Errorf("%w : kb_category", err)
		}
		sr.Author, err = GetNestedFieldValue(sr.Author, constants.FieldAssignedTo, serviceNowURL)
		if err != nil {
			return fmt.Errorf("%w : author", err)
		}
	} else {
		sr.AssignedTo, err = GetNestedFieldValue(sr.AssignedTo, constants.FieldAssignedTo, serviceNowURL)
		if err != nil {
			return fmt.Errorf("%w : assigned_to", err)
		}
		sr.AssignmentGroup, err = GetNestedFieldValue(sr.AssignmentGroup, constants.FieldAssignmentGroup, serviceNowURL)
		if err != nil {
			return fmt.Errorf("%w : assignment_group", err)
		}
	}

	return err
}

func GetNestedFieldValue(field interface{}, fieldType, serviceNowURL string) (string, error) {
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

	sysID := GetSysID(nf.Link)
	url := serviceNowURL
	switch fieldType {
	case constants.FieldAssignedTo:
		url += fmt.Sprintf(constants.PathSysUser, sysID)
	case constants.FieldAssignmentGroup:
		url += fmt.Sprintf(constants.PathSysUserGroup, sysID)
	case constants.FieldKnowledgeBase:
		url += fmt.Sprintf(constants.PathKnowledgeBase, sysID)
	case constants.FieldCategory:
		url += fmt.Sprintf(constants.PathCategory, sysID)
	}

	return fmt.Sprintf("[%s](%s)", nf.DisplayValue, url), nil
}

func GetSysID(link string) string {
	linkData := strings.Split(link, "/")
	return linkData[len(linkData)-1]
}
