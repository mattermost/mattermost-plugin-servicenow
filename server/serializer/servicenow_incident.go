package serializer

type IncidentCaller struct {
	MattermostUserID string          `json:"mattermostUserID"`
	Username         string          `json:"username"`
	ServiceNowUser   *ServiceNowUser `json:"serviceNowUser"`
}
