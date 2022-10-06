package serializer

type ServiceNowComment struct {
	CommentsAndWorkNotes string `json:"comments_and_work_notes"`
}

type ServiceNowCommentsResult struct {
	Result *ServiceNowComment `json:"result"`
}
