package serializer

type ServiceNowCatalogItems struct {
	SysID            string   `json:"sys_id"`
	Name             string   `json:"name"`
	ShortDescription string   `json:"short_description"`
	Category         Category `json:"category"`
	Price            string   `json:"price"`
}

type Category struct {
	SysID string `json:"sys_id"`
	Title string `json:"title"`
}

type ServiceNowCatalogItemsResult struct {
	Result []*ServiceNowCatalogItems `json:"result"`
}
