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
	State            string      `json:"state,omitempty"`
	Priority         string      `json:"priority,omitempty"`
	AssignedTo       interface{} `json:"assigned_to,omitempty"`
	AssignmentGroup  interface{} `json:"assignment_group,omitempty"`
	KnowledgeBase    interface{} `json:"kb_knowledge_base,omitempty"`
	Workflow         string      `json:"workflow_state,omitempty"`
	Category         interface{} `json:"kb_category,omitempty"`
	Author           interface{} `json:"author,omitempty"`
}

type ServiceNowPartialRecordsResult struct {
	Result []*ServiceNowPartialRecord `json:"result"`
}

type ServiceNowRecordResult struct {
	Result *ServiceNowRecord `json:"result"`
}
