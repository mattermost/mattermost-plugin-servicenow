// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package serializer

type ServiceNowCatalogItem struct {
	SysID            string   `json:"sys_id"`
	Name             string   `json:"name"`
	ShortDescription string   `json:"short_description"`
	Category         Category `json:"category"`
	Price            string   `json:"price"`
}

type Category struct {
	SysID string `json:"sys_id"`
	Title string `json:"title"`
}

type ServiceNowCatalogItemsResult struct {
	Result []*ServiceNowCatalogItem `json:"result"`
}
