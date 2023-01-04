package serializer

type ServiceNowAssignmentGroup struct {
	SysID string `json:"sys_id"`
	Name  string `json:"name"`
}

type ServiceNowAssignmentGroupResult struct {
	Result []*ServiceNowAssignmentGroup `json:"result"`
}
