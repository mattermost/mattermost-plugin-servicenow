// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package serializer

import (
	"encoding/json"
	"fmt"
	"io"
	"strings"
)

type ServiceNowState struct {
	Label string `json:"label"`
	Value string `json:"value"`
}

type ServiceNowStatesResult struct {
	Result []*ServiceNowState `json:"result"`
}

type ServiceNowUpdateStatePayload struct {
	State string `json:"state"`
}

func ServiceNowStatePayloadFromJSON(data io.Reader) (*ServiceNowUpdateStatePayload, error) {
	var usp *ServiceNowUpdateStatePayload
	if err := json.NewDecoder(data).Decode(&usp); err != nil {
		return nil, err
	}

	return usp, nil
}

func (s *ServiceNowUpdateStatePayload) Validate() error {
	s.State = strings.TrimSpace(s.State)
	if s.State == "" {
		return fmt.Errorf("state value cannot be empty")
	}

	return nil
}
