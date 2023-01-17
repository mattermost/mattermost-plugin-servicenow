package serializer

type ServiceNowTableFields struct {
	Name     string `json:"name"`
	Type     string `json:"type"`
	Label    string `json:"label"`
	IsChoice bool   `json:"isChoice"`
	Writable bool   `json:"writable"`
}

type ServiceNowTableFieldsResult struct {
	Result []*ServiceNowTableFields `json:"result"`
}
