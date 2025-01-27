// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package serializer

// Error struct to store error ids and error message.
type APIErrorResponse struct {
	ID         string `json:"id"`
	Message    string `json:"message"`
	StatusCode int    `json:"-"`
}

func (a *APIErrorResponse) Error() string {
	return a.Message
}
