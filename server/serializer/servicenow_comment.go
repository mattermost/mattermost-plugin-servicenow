// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package serializer

import (
	"encoding/json"
	"errors"
	"io"
	"strings"

	"github.com/mattermost/mattermost-plugin-servicenow/server/constants"
)

type ServiceNowComment struct {
	CommentsAndWorkNotes string `json:"comments_and_work_notes"`
}

type ServiceNowCommentPayload struct {
	Comments string `json:"comments"`
}

type ServiceNowCommentsResult struct {
	Result *ServiceNowComment `json:"result"`
}

func ServiceNowCommentPayloadFromJSON(data io.Reader) (*ServiceNowCommentPayload, error) {
	var scp *ServiceNowCommentPayload
	if err := json.NewDecoder(data).Decode(&scp); err != nil {
		return nil, err
	}

	return scp, nil
}

func (s *ServiceNowCommentPayload) Validate() error {
	s.Comments = strings.TrimSpace(s.Comments)
	if s.Comments == "" {
		return errors.New(constants.ErrorEmptyComment)
	}

	return nil
}
