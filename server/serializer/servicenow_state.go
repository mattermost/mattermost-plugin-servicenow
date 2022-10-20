package serializer

type ServiceNowState struct {
	Label string `json:"label"`
	Value string `json:"value"`
}

type ServiceNowStatesResult struct {
	Result []*ServiceNowState `json:"result"`
}
