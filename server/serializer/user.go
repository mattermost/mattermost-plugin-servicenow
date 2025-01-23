// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package serializer

type UserList struct {
	UserDetails []*ServiceNowUser `json:"result"`
}

type ServiceNowUser struct {
	UserID   string `json:"sys_id"`
	Username string `json:"user_name"`
}

type User struct {
	MattermostUserID string
	OAuth2Token      string
	Username         string
	ServiceNowUser   *ServiceNowUser
}
