// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package serializer

type SubscriptionAuthPayload struct {
	ServerURL string `json:"server_url"`
	APISecret string `json:"api_secret"`
}

type SubscriptionAuthDetails struct {
	Result []*SubscriptionAuthPayload `json:"result"`
}
