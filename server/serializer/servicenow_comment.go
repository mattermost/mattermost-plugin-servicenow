package serializer

type ServiceNowComment struct {
	SysID      string `json:"sys_id"`
	CreatedOn  string `json:"sys_created_on"`
	RecordType string `json:"name"`
	ElementID  string `json:"element_id"`
	Value      string `json:"value"`
	CreatedBy  string `json:"sys_created_by"`
	Element    string `json:"element"`
}

type ServiceNowCommentsResult struct {
	Result []*ServiceNowComment `json:"result"`
}
