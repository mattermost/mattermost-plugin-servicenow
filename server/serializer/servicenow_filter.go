package serializer

type ServiceNowFilter struct {
	SysID string `json:"sys_id"`
	Name  string `json:"name"`
}

type ServiceNowFilterData struct {
	FilterType  string `json:"filterType"`
	FilterValue string `json:"filterValue"`
	FilterName  string `json:"filterName"`
}

type ServiceNowFilterResult struct {
	Result []*ServiceNowFilter `json:"result"`
}
