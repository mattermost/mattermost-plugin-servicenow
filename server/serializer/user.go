package serializer

type UserList struct {
	UserDetails []*ServiceNowUser `json:"result"`
}

type ServiceNowUser struct {
	UserID   string `json:"sys_id"`
	Email    string `json:"email"`
	Username string `json:"user_name"`
}

type User struct {
	MattermostUserID string
	OAuth2Token      string
	Username         string
	ServiceNowUser   *ServiceNowUser
}
