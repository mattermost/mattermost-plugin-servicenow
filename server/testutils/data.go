package testutils

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/mattermost/mattermost-server/v6/api4"
	"github.com/mattermost/mattermost-server/v6/model"

	"github.com/mattermost/mattermost-plugin-servicenow/server/constants"
	"github.com/mattermost/mattermost-plugin-servicenow/server/serializer"
)

func GetTestUserAndChannelRequestBody() string {
	return fmt.Sprintf(`{"user_id": "%s","channel_id": "%s"}`, GetID(), GetChannelID())
}

func GetSecret() string {
	return "test-secret"
}

func GetID() string {
	return "sfmq19kpztg5iy47ebe51hb31w"
}

func GetChannelID() string {
	return "bnqnzipmnir4zkkj95ggba5pde"
}

func GetChannel(channelType model.ChannelType) *model.Channel {
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

func GetChannels(count int, channelType model.ChannelType) []*model.Channel {
	if count == 0 {
		return nil
	}

	if channelType == "" {
		channelType = model.ChannelTypeOpen
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

func GetInternalServerAppError() *model.AppError {
	return &model.AppError{
		StatusCode: http.StatusInternalServerError,
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

func GetSubscription(subscriptionType string) *serializer.SubscriptionResponse {
	return &serializer.SubscriptionResponse{
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
}

func GetSubscriptions(count int) []*serializer.SubscriptionResponse {
	subscriptions := make([]*serializer.SubscriptionResponse, count)
	for i := 0; i < count; i++ {
		if i%2 == 0 {
			subscriptions[i] = GetSubscription(constants.SubscriptionTypeBulk)
		} else {
			subscriptions[i] = GetSubscription(constants.SubscriptionTypeRecord)
		}
	}

	return subscriptions
}

func GetSearchTerm(valid bool) string {
	l := constants.CharacterThresholdForSearchingRecords
	if !valid {
		l--
	}

	var sb strings.Builder
	for i := 0; i < l; i++ {
		sb.WriteString("s")
	}

	return sb.String()
}

func GetCreateIncidentPayload() string {
	return fmt.Sprintf(`{
		"short_description": "mockShortDescription",
		"description": "mockDescription",
		"caller_id": "%s",
		"channel_id": "%s"
	}`, GetID(), GetChannelID())
}
