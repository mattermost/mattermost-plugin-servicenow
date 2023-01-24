package serializer

type ServiceNowFilter struct {
	SysID string `json:"sys_id"`
	Name  string `json:"name"`
}

type ServiceNowFilterResult struct {
	Result []*ServiceNowFilter `json:"result"`
}
