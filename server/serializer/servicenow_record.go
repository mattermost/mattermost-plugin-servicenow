package serializer

type ServiceNowPartialRecord struct {
	SysID            string `json:"sys_id"`
	Number           string `json:"number"`
	ShortDescription string `json:"short_description"`
}

type ServiceNowRecord struct {
	SysID            string      `json:"sys_id"`
	Number           string      `json:"number"`
	ShortDescription string      `json:"short_description"`
	State            string      `json:"state"`
	Priority         string      `json:"priority"`
	AssignedTo       interface{} `json:"assigned_to"`
	AssignmentGroup  interface{} `json:"assignment_group"`
}

type ServiceNowPartialRecordsResult struct {
	Result []*ServiceNowPartialRecord `json:"result"`
}

type ServiceNowRecordResult struct {
	Result *ServiceNowRecord `json:"result"`
}
