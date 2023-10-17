package serializer

import (
	"encoding/json"
	"errors"
	"io"
	"strings"

	"github.com/mattermost/mattermost-plugin-servicenow/server/constants"
)

type IncidentCaller struct {
	MattermostUserID string          `json:"mattermostUserID"`
	Username         string          `json:"username"`
	ServiceNowUser   *ServiceNowUser `json:"serviceNowUser"`
}

type IncidentResult struct {
	Result *IncidentResponse `json:"result"`
}

type IncidentPayload struct {
	ShortDescription string `json:"short_description"`
	Description      string `json:"description"`
	Caller           string `json:"caller_id"`
	ChannelID        string `json:"channel_id"`
}

type IncidentResponse struct {
	SysID            string      `json:"sys_id"`
	ShortDescription string      `json:"short_description"`
	Description      string      `json:"description"`
	Number           string      `json:"number"`
	State            string      `json:"state,omitempty"`
	Priority         string      `json:"priority,omitempty"`
	AssignedTo       interface{} `json:"assigned_to,omitempty"`
	AssignmentGroup  interface{} `json:"assignment_group,omitempty"`
}

func IncidentFromJSON(data io.Reader) (*IncidentPayload, error) {
	var ip *IncidentPayload
	if err := json.NewDecoder(data).Decode(&ip); err != nil {
		return nil, err
	}

	return ip, nil
}

func (ip *IncidentPayload) IsValid() error {
	ip.ShortDescription = strings.TrimSpace(ip.ShortDescription)
	if ip.ShortDescription == "" {
		return errors.New(constants.ErrorEmptyShortDescription)
	}

	return nil
}
