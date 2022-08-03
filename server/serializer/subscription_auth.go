package serializer

type SubscriptionAuthPayload struct {
	ServerURL string `json:"server_url"`
	APISecret string `json:"api_secret"`
}

type SubscriptionAuthDetails struct {
	Result []*SubscriptionAuthPayload `json:"result"`
}
