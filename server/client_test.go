package main

import (
	"net/http"
	"net/url"
	"reflect"
	"testing"

	"bou.ke/monkey"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/constants"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/serializer"
	"github.com/pkg/errors"
	"github.com/stretchr/testify/assert"
)

func TestActivateSubscriptions(t *testing.T) {
	defer monkey.UnpatchAll()
	c := new(client)
	c.plugin = &Plugin{}
	for _, testCase := range []struct {
		description   string
		statusCode    int
		err           error
		expectedError error
	}{
		{
			description: "ActivateSubscriptions: valid",
			statusCode:  http.StatusOK,
		},
		{
			description:   "ActivateSubscriptions: user not authorized with error",
			statusCode:    http.StatusForbidden,
			err:           errors.New("mockError: User Not Authorized"),
			expectedError: errors.New(constants.APIErrorIDSubscriptionsNotAuthorized),
		},
		{
			description:   "ActivateSubscriptions: user not authorized with status forbidden",
			statusCode:    http.StatusForbidden,
			err:           errors.New("mockError"),
			expectedError: errors.New(constants.APIErrorIDSubscriptionsNotAuthorized),
		},
		{
			description:   "ActivateSubscriptions: invalid table",
			statusCode:    http.StatusInternalServerError,
			err:           errors.New("mockError: Invalid table"),
			expectedError: errors.New(constants.APIErrorIDSubscriptionsNotConfigured),
		},
		{
			description:   "ActivateSubscriptions: failed to get subscription auth details",
			statusCode:    http.StatusInternalServerError,
			err:           errors.New("mockError"),
			expectedError: errors.New("failed to get subscription auth details: mockError"),
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
				return nil, testCase.statusCode, testCase.err
			})

			statusCode, err := c.ActivateSubscriptions()

			if testCase.expectedError != nil {
				assert.EqualError(t, testCase.expectedError, err.Error())
			} else {
				assert.NoError(t, err)
			}

			assert.Equal(t, testCase.statusCode, statusCode)
		})
	}
}

func TestCreateSubscription(t *testing.T) {
	defer monkey.UnpatchAll()
	c := new(client)
	for _, testCase := range []struct {
		description string
		statusCode  int
		err         error
		expectedErr error
	}{
		{
			description: "CreateSubscription: valid",
			statusCode:  http.StatusOK,
		},
		{
			description: "CreateSubscription: with error",
			statusCode:  http.StatusInternalServerError,
			err:         errors.New("mockError"),
			expectedErr: errors.New("failed to create subscription in ServiceNow: mockError"),
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
				return nil, testCase.statusCode, testCase.err
			})

			statusCode, err := c.CreateSubscription(&serializer.SubscriptionPayload{})

			if testCase.expectedErr != nil {
				assert.EqualError(t, err, testCase.expectedErr.Error())
			} else {
				assert.NoError(t, err)
			}

			assert.Equal(t, testCase.statusCode, statusCode)
		})
	}
}

func TestGetAllSubscriptions(t *testing.T) {
	defer monkey.UnpatchAll()
	c := new(client)
	c.plugin = &Plugin{}
	for _, testCase := range []struct {
		description string
		statusCode  int
		err         error
		expectedErr error
	}{
		{
			description: "GetAllSubscriptions: valid",
			statusCode:  http.StatusOK,
		},
		{
			description: "GetAllSubscriptions: with error",
			statusCode:  http.StatusInternalServerError,
			err:         errors.New("mockError"),
			expectedErr: errors.New("failed to get subscriptions from ServiceNow: mockError"),
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
				return nil, testCase.statusCode, testCase.err
			})

			_, statusCode, err := c.GetAllSubscriptions("mockChannelID", "mockUserID", "mockSubscriptionType", "mockLimit", "mockOffset")

			if testCase.expectedErr != nil {
				assert.EqualError(t, err, testCase.expectedErr.Error())
			} else {
				assert.NoError(t, err)
			}

			assert.Equal(t, testCase.statusCode, statusCode)
		})
	}
}

func TestGetSubscription(t *testing.T) {
	defer monkey.UnpatchAll()
	c := new(client)
	for _, testCase := range []struct {
		description string
		statusCode  int
		err         error
		expectedErr error
	}{
		{
			description: "GetSubscription: valid",
			statusCode:  http.StatusOK,
		},
		{
			description: "GetSubscription: with error",
			statusCode:  http.StatusInternalServerError,
			err:         errors.New("mockError"),
			expectedErr: errors.New("failed to get subscription from ServiceNow: mockError"),
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
				return nil, testCase.statusCode, testCase.err
			})

			_, statusCode, err := c.GetSubscription("mockSubscriptionID")

			if testCase.expectedErr != nil {
				assert.EqualError(t, err, testCase.expectedErr.Error())
			} else {
				assert.NoError(t, err)
			}

			assert.Equal(t, testCase.statusCode, statusCode)
		})
	}
}

func TestDeleteSubscription(t *testing.T) {
	defer monkey.UnpatchAll()
	c := new(client)
	for _, testCase := range []struct {
		description string
		statusCode  int
		err         error
		expectedErr error
	}{
		{
			description: "DeleteSubscription: valid",
			statusCode:  http.StatusOK,
		},
		{
			description: "DeleteSubscription: with error",
			statusCode:  http.StatusInternalServerError,
			err:         errors.New("mockError"),
			expectedErr: errors.New("failed to delete subscription from ServiceNow: mockError"),
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
				return nil, testCase.statusCode, testCase.err
			})

			statusCode, err := c.DeleteSubscription("mockSubscriptionID")

			if testCase.expectedErr != nil {
				assert.EqualError(t, err, testCase.expectedErr.Error())
			} else {
				assert.NoError(t, err)
			}

			assert.Equal(t, testCase.statusCode, statusCode)
		})
	}
}

func TestEditSubscription(t *testing.T) {
	defer monkey.UnpatchAll()
	c := new(client)
	for _, testCase := range []struct {
		description string
		statusCode  int
		err         error
		expectedErr error
	}{
		{
			description: "EditSubscription: valid",
			statusCode:  http.StatusOK,
		},
		{
			description: "EditSubscription: with error",
			statusCode:  http.StatusInternalServerError,
			err:         errors.New("mockError"),
			expectedErr: errors.New("failed to update subscription from ServiceNow: mockError"),
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
				return nil, testCase.statusCode, testCase.err
			})

			statusCode, err := c.EditSubscription("mockSubscriptionID", &serializer.SubscriptionPayload{})

			if testCase.expectedErr != nil {
				assert.EqualError(t, err, testCase.expectedErr.Error())
			} else {
				assert.NoError(t, err)
			}

			assert.Equal(t, testCase.statusCode, statusCode)
		})
	}
}

func TestCheckForDuplicateSubscription(t *testing.T) {
	defer monkey.UnpatchAll()
	c := new(client)
	for _, testCase := range []struct {
		description string
		statusCode  int
		err         error
		expectedErr error
	}{
		{
			description: "CheckForDuplicateSubscription: valid",
			statusCode:  http.StatusOK,
		},
		{
			description: "CheckForDuplicateSubscription: with error",
			statusCode:  http.StatusInternalServerError,
			err:         errors.New("mockError"),
			expectedErr: errors.New("failed to get subscriptions from ServiceNow: mockError"),
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
				return nil, testCase.statusCode, testCase.err
			})

			mockChannelID := "mockChannelID"
			mockType := "mockType"
			mockRecordType := "mockRecordType"
			mockRecordID := "mockRecordID"
			mockServerURL := "mockServerURL"
			_, statusCode, err := c.CheckForDuplicateSubscription(&serializer.SubscriptionPayload{
				ChannelID:  &mockChannelID,
				Type:       &mockType,
				RecordType: &mockRecordType,
				RecordID:   &mockRecordID,
				ServerURL:  &mockServerURL,
			})

			if testCase.expectedErr != nil {
				assert.EqualError(t, err, testCase.expectedErr.Error())
			} else {
				assert.NoError(t, err)
			}

			assert.Equal(t, testCase.statusCode, statusCode)
		})
	}
}

func TestSearchRecordsInServiceNow(t *testing.T) {
	defer monkey.UnpatchAll()
	c := new(client)
	for _, testCase := range []struct {
		description string
		statusCode  int
		err         error
		expectedErr error
	}{
		{
			description: "SearchRecordsInServiceNow: valid",
			statusCode:  http.StatusOK,
		},
		{
			description: "SearchRecordsInServiceNow: with error",
			statusCode:  http.StatusInternalServerError,
			err:         errors.New("mockError"),
			expectedErr: errors.New("mockError"),
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
				return nil, testCase.statusCode, testCase.err
			})

			_, statusCode, err := c.SearchRecordsInServiceNow("mockTable", "mockSearchItem", "mockLimit", "mockOffset")

			if testCase.expectedErr != nil {
				assert.EqualError(t, err, testCase.expectedErr.Error())
			} else {
				assert.NoError(t, err)
			}

			assert.Equal(t, testCase.statusCode, statusCode)
		})
	}
}

func TestGetRecordFromServiceNow(t *testing.T) {
	defer monkey.UnpatchAll()
	c := new(client)
	for _, testCase := range []struct {
		description string
		statusCode  int
		err         error
		expectedErr error
	}{
		{
			description: "GetRecordFromServiceNow: valid",
			statusCode:  http.StatusOK,
		},
		{
			description: "GetRecordFromServiceNow: with error",
			statusCode:  http.StatusInternalServerError,
			err:         errors.New("mockError"),
			expectedErr: errors.New("mockError"),
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
				return nil, testCase.statusCode, testCase.err
			})

			_, statusCode, err := c.GetRecordFromServiceNow("mockTable", "mockSysID")

			if testCase.expectedErr != nil {
				assert.EqualError(t, err, testCase.expectedErr.Error())
			} else {
				assert.NoError(t, err)
			}

			assert.EqualValues(t, testCase.statusCode, statusCode)
		})
	}
}
