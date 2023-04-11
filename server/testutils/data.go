package testutils

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/mattermost/mattermost-server/v5/api4"
	"github.com/mattermost/mattermost-server/v5/model"

	"github.com/mattermost/mattermost-plugin-servicenow/server/constants"
	"github.com/mattermost/mattermost-plugin-servicenow/server/serializer"
)

func GetSecret() string {
	return "test-secret"
}

func GetID() string {
	return "sfmq19kpztg5iy47ebe51hb31w"
}

func GetChannelID() string {
	return "bnqnzipmnir4zkkj95ggba5pde"
}

func GetRecordTypeSubscription() string {
	return constants.SubscriptionTypeRecord
}

func GetBulkTypeSubscription() string {
	return constants.SubscriptionTypeBulk
}

func GetSubscriptionBody(subscriptionType string) string {
	return fmt.Sprintf(`{
		"user_id": "%s",
		"type": "%s",
		"channel_id": "%s",
		"filters": "mockFilter"
		}`, GetID(), subscriptionType, GetChannelID())
}

func GetChannel(channelType string) *model.Channel {
	return &model.Channel{
		Id:   api4.GenerateTestId(),
		Type: channelType,
	}
}

func GetPost() *model.Post {
	return &model.Post{
		Id: api4.GenerateTestId(),
	}
}

func GetUser(role string) *model.User {
	return &model.User{
		Id:       api4.GenerateTestId(),
		Username: "test-user",
		Roles:    role,
	}
}

func GetChannels(count int, channelType string) []*model.Channel {
	if count == 0 {
		return nil
	}

	if channelType == "" {
		channelType = model.CHANNEL_OPEN
	}

	channels := make([]*model.Channel, count)
	for i := 0; i < count; i++ {
		channels[i] = GetChannel(channelType)
	}

	return channels
}

func GetBadRequestAppError() *model.AppError {
	return &model.AppError{
		StatusCode: http.StatusBadRequest,
	}
}

func GetInternalServerAppError(errorMsg string) *model.AppError {
	return &model.AppError{
		StatusCode:    http.StatusInternalServerError,
		DetailedError: errorMsg,
	}
}

func GetNotFoundAppError() *model.AppError {
	return &model.AppError{
		StatusCode: http.StatusNotFound,
	}
}

func GetServiceNowSysID() string {
	return "d5d4f60807861110da0ef4be7c1ed0d6"
}

func GetServiceNowNumber() string {
	return "PRB0000005"
}

func GetServiceNowShortDescription() string {
	return "Test description"
}

func GetServiceNowComments() *serializer.ServiceNowComment {
	return &serializer.ServiceNowComment{
		CommentsAndWorkNotes: "Test comment",
	}
}

func GetServiceNowPartialRecord() *serializer.ServiceNowPartialRecord {
	return &serializer.ServiceNowPartialRecord{
		SysID:            GetServiceNowSysID(),
		Number:           GetServiceNowNumber(),
		ShortDescription: GetServiceNowShortDescription(),
	}
}

func GetServiceNowState() *serializer.ServiceNowState {
	return &serializer.ServiceNowState{
		Label: constants.RecordTypeIncident,
		Value: constants.RecordTypeIncident,
	}
}

func GetServiceNowPartialRecords(count int) []*serializer.ServiceNowPartialRecord {
	if count == 0 {
		return nil
	}

	records := make([]*serializer.ServiceNowPartialRecord, count)
	for i := 0; i < count; i++ {
		records[i] = GetServiceNowPartialRecord()
	}

	return records
}

func GetServiceNowStates(count int) []*serializer.ServiceNowState {
	if count == 0 {
		return nil
	}

	states := make([]*serializer.ServiceNowState, count)
	for i := 0; i < count; i++ {
		states[i] = GetServiceNowState()
	}

	return states
}

func GetSerializerUser() *serializer.User {
	return &serializer.User{
		MattermostUserID: GetID(),
		OAuth2Token:      "test-oauthtoken",
		ServiceNowUser: &serializer.ServiceNowUser{
			UserID: GetServiceNowSysID(),
		},
	}
}

func GetLimitAndOffset() (limit, offset string) {
	return fmt.Sprint(constants.DefaultPerPage), fmt.Sprint(constants.DefaultPerPage * constants.DefaultPage)
}

func GetServiceNowUser() *serializer.ServiceNowUser {
	return &serializer.ServiceNowUser{
		UserID: GetServiceNowSysID(),
	}
}

func GetServiceNowRecord() *serializer.ServiceNowRecord {
	return &serializer.ServiceNowRecord{
		SysID:            GetServiceNowSysID(),
		Number:           GetServiceNowNumber(),
		ShortDescription: GetServiceNowShortDescription(),
		State:            "New",
		Priority:         "High",
		AssignedTo:       "",
		AssignmentGroup:  "",
	}
}

func GetSubscription(subscriptionType string, addFilters bool) *serializer.SubscriptionResponse {
	response := &serializer.SubscriptionResponse{
		SysID:              GetServiceNowSysID(),
		UserID:             GetID(),
		ChannelID:          GetID(),
		RecordType:         constants.RecordTypeProblem,
		SubscriptionEvents: constants.SubscriptionEventPriority + "," + constants.SubscriptionEventState,
		IsActive:           "true",
		Type:               subscriptionType,
		Number:             GetServiceNowNumber(),
		ShortDescription:   GetServiceNowShortDescription(),
	}

	if addFilters {
		response.Filters = fmt.Sprintf(`{"%s":"filter1","%s":"filter2"}`, constants.FilterAssignmentGroup, constants.FilterService)
	}

	return response
}

func GetSubscriptions(count int) []*serializer.SubscriptionResponse {
	subscriptions := make([]*serializer.SubscriptionResponse, count)
	for i := 0; i < count; i++ {
		if i%2 == 0 {
			subscriptions[i] = GetSubscription(constants.SubscriptionTypeBulk, false)
		} else {
			subscriptions[i] = GetSubscription(constants.SubscriptionTypeRecord, false)
		}
	}

	return subscriptions
}

func GetSearchTerm(valid bool, threshold int) string {
	l := threshold
	if !valid {
		l--
	}

	var sb strings.Builder
	for i := 0; i < l; i++ {
		sb.WriteString("s")
	}

	return sb.String()
}

func GetUserKey(valid bool) string {
	if valid {
		return "user_bW9ja0tleQ=="
	}

	return "user_invalidKey"
}

func GetServiceNowIncidentResponse() *serializer.IncidentResponse {
	return &serializer.IncidentResponse{
		SysID:            GetServiceNowSysID(),
		ShortDescription: GetServiceNowShortDescription(),
	}
}

func GetServiceNowCatalogItem() *serializer.ServiceNowCatalogItem {
	return &serializer.ServiceNowCatalogItem{
		SysID: GetServiceNowSysID(),
	}
}

func GetServiceNowCatalogItems(count int) []*serializer.ServiceNowCatalogItem {
	if count == 0 {
		return nil
	}

	items := make([]*serializer.ServiceNowCatalogItem, count)
	for i := 0; i < count; i++ {
		items[i] = GetServiceNowCatalogItem()
	}

	return items
}

func GetServiceNowFilterValue() *serializer.ServiceNowFilter {
	return &serializer.ServiceNowFilter{
		SysID: GetServiceNowSysID(),
		Name:  "mockName",
	}
}

func GetServiceNowFilterValues(count int) []*serializer.ServiceNowFilter {
	if count == 0 {
		return nil
	}

	items := make([]*serializer.ServiceNowFilter, count)
	for i := 0; i < count; i++ {
		items[i] = GetServiceNowFilterValue()
	}

	return items
}

func GetServiceNowIncidentCaller() *serializer.IncidentCaller {
	return &serializer.IncidentCaller{
		ServiceNowUser: GetServiceNowUser(),
	}
}

func GetServiceNowIncidentCallers(count int) []*serializer.IncidentCaller {
	if count == 0 {
		return nil
	}

	users := make([]*serializer.IncidentCaller, count)
	for i := 0; i < count; i++ {
		users[i] = GetServiceNowIncidentCaller()
	}

	return users
}

func GetServiceNowIncidentFields(count int) []*serializer.ServiceNowIncidentFields {
	if count == 0 {
		return nil
	}

	fields := make([]*serializer.ServiceNowIncidentFields, count)
	for i := 0; i < count; i++ {
		fields[i] = &serializer.ServiceNowIncidentFields{
			Label:   "mockLabel",
			Value:   "mockValue",
			Element: "mockElement",
		}
	}

	return fields
}

func GetServiceNowTableFields(count int) []*serializer.ServiceNowTableFields {
	if count == 0 {
		return nil
	}

	fields := make([]*serializer.ServiceNowTableFields, count)
	for i := 0; i < count; i++ {
		fields[i] = &serializer.ServiceNowTableFields{
			Label: "mockLabel",
			Name:  "mockName",
		}
	}

	return fields
}
