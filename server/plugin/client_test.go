package plugin

import (
	"net/http"
	"net/url"
	"reflect"
	"testing"

	"bou.ke/monkey"
	"github.com/pkg/errors"
	"github.com/stretchr/testify/assert"

	"github.com/mattermost/mattermost-plugin-servicenow/server/constants"
	"github.com/mattermost/mattermost-plugin-servicenow/server/serializer"
	"github.com/mattermost/mattermost-plugin-servicenow/server/testutils"
)

func TestActivateSubscriptions(t *testing.T) {
	defer monkey.UnpatchAll()
	c := new(client)
	c.plugin = &Plugin{}
	for _, testCase := range []struct {
		description  string
		statusCode   int
		errorMessage error
		expectedErr  string
	}{
		{
			description: "ActivateSubscriptions: valid",
			statusCode:  http.StatusOK,
		},
		{
			description:  "ActivateSubscriptions: user not authorized with error",
			statusCode:   http.StatusForbidden,
			errorMessage: errors.New("user Not Authorized"),
			expectedErr:  constants.APIErrorIDSubscriptionsNotAuthorized,
		},
		{
			description:  "ActivateSubscriptions: invalid table",
			statusCode:   http.StatusInternalServerError,
			errorMessage: errors.New("mockError: Invalid table"),
			expectedErr:  constants.APIErrorIDSubscriptionsNotConfigured,
		},
		{
			description:  "ActivateSubscriptions: failed to get subscription auth details",
			statusCode:   http.StatusInternalServerError,
			errorMessage: errors.New("mockError"),
			expectedErr:  "failed to get subscription auth details: mockError",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
				return nil, testCase.statusCode, testCase.errorMessage
			})
			statusCode, err := c.ActivateSubscriptions()
			if testCase.expectedErr != "" {
				assert.EqualError(t, err, testCase.expectedErr)
			} else {
				assert.NoError(t, err)
			}

			assert.Equal(t, testCase.statusCode, statusCode)
		})
	}
}

func TestCreateSubscriptionClient(t *testing.T) {
	defer monkey.UnpatchAll()
	c := new(client)
	for _, testCase := range []struct {
		description  string
		statusCode   int
		errorMessage error
		expectedErr  string
	}{
		{
			description: "CreateSubscription: valid",
			statusCode:  http.StatusOK,
		},
		{
			description:  "CreateSubscription: with error",
			statusCode:   http.StatusInternalServerError,
			errorMessage: errors.New("mockError"),
			expectedErr:  "failed to create subscription in ServiceNow: mockError",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
				return nil, testCase.statusCode, testCase.errorMessage
			})
			statusCode, err := c.CreateSubscription(&serializer.SubscriptionPayload{})
			if testCase.expectedErr != "" {
				assert.EqualError(t, err, testCase.expectedErr)
			} else {
				assert.NoError(t, err)
			}

			assert.Equal(t, testCase.statusCode, statusCode)
		})
	}
}

func TestGetAllSubscriptionsClient(t *testing.T) {
	defer monkey.UnpatchAll()
	c := new(client)
	c.plugin = &Plugin{}
	for _, testCase := range []struct {
		description  string
		statusCode   int
		errorMessage error
		expectedErr  string
	}{
		{
			description: "GetAllSubscriptions: valid",
			statusCode:  http.StatusOK,
		},
		{
			description:  "GetAllSubscriptions: with error",
			statusCode:   http.StatusInternalServerError,
			errorMessage: errors.New("mockError"),
			expectedErr:  "failed to get subscriptions from ServiceNow: mockError",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
				return nil, testCase.statusCode, testCase.errorMessage
			})
			_, statusCode, err := c.GetAllSubscriptions("mockChannelID", "mockUserID", "mockSubscriptionType", "mockLimit", "mockOffset")
			if testCase.expectedErr != "" {
				assert.EqualError(t, err, testCase.expectedErr)
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
		description  string
		statusCode   int
		errorMessage error
		expectedErr  string
	}{
		{
			description: "GetSubscription: valid",
			statusCode:  http.StatusOK,
		},
		{
			description:  "GetSubscription: with error",
			statusCode:   http.StatusInternalServerError,
			errorMessage: errors.New("mockError"),
			expectedErr:  "failed to get subscription from ServiceNow: mockError",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
				return nil, testCase.statusCode, testCase.errorMessage
			})
			_, statusCode, err := c.GetSubscription("mockSubscriptionID")
			if testCase.expectedErr != "" {
				assert.EqualError(t, err, testCase.expectedErr)
			} else {
				assert.NoError(t, err)
			}

			assert.Equal(t, testCase.statusCode, statusCode)
		})
	}
}

func TestDeleteSubscriptionClient(t *testing.T) {
	defer monkey.UnpatchAll()
	c := new(client)
	for _, testCase := range []struct {
		description  string
		statusCode   int
		errorMessage error
		expectedErr  string
	}{
		{
			description: "DeleteSubscription: valid",
			statusCode:  http.StatusOK,
		},
		{
			description:  "DeleteSubscription: with error",
			statusCode:   http.StatusInternalServerError,
			errorMessage: errors.New("mockError"),
			expectedErr:  "failed to delete subscription from ServiceNow: mockError",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
				return nil, testCase.statusCode, testCase.errorMessage
			})
			statusCode, err := c.DeleteSubscription("mockSubscriptionID")
			if testCase.expectedErr != "" {
				assert.EqualError(t, err, testCase.expectedErr)
			} else {
				assert.NoError(t, err)
			}

			assert.Equal(t, testCase.statusCode, statusCode)
		})
	}
}

func TestEditSubscriptionClient(t *testing.T) {
	defer monkey.UnpatchAll()
	c := new(client)
	for _, testCase := range []struct {
		description  string
		statusCode   int
		errorMessage error
		expectedErr  string
	}{
		{
			description: "EditSubscription: valid",
			statusCode:  http.StatusOK,
		},
		{
			description:  "EditSubscription: with error",
			statusCode:   http.StatusInternalServerError,
			errorMessage: errors.New("mockError"),
			expectedErr:  "failed to update subscription from ServiceNow: mockError",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
				return nil, testCase.statusCode, testCase.errorMessage
			})
			statusCode, err := c.EditSubscription("mockSubscriptionID", &serializer.SubscriptionPayload{})
			if testCase.expectedErr != "" {
				assert.EqualError(t, err, testCase.expectedErr)
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
		description  string
		statusCode   int
		errorMessage error
		expectedErr  string
	}{
		{
			description: "CheckForDuplicateSubscription: valid",
			statusCode:  http.StatusOK,
		},
		{
			description:  "CheckForDuplicateSubscription: with error",
			statusCode:   http.StatusInternalServerError,
			errorMessage: errors.New("mockError"),
			expectedErr:  "failed to get subscriptions from ServiceNow: mockError",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
				return nil, testCase.statusCode, testCase.errorMessage
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
			if testCase.expectedErr != "" {
				assert.EqualError(t, err, testCase.expectedErr)
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
		description  string
		statusCode   int
		errorMessage error
		expectedErr  string
	}{
		{
			description: "SearchRecordsInServiceNow: valid",
			statusCode:  http.StatusOK,
		},
		{
			description:  "SearchRecordsInServiceNow: with error",
			statusCode:   http.StatusInternalServerError,
			errorMessage: errors.New("error in searching the records"),
			expectedErr:  "error in searching the records",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
				return nil, testCase.statusCode, testCase.errorMessage
			})
			_, statusCode, err := c.SearchRecordsInServiceNow("mockTable", "mockSearchItem", "mockLimit", "mockOffset")
			if testCase.expectedErr != "" {
				assert.EqualError(t, err, testCase.expectedErr)
			} else {
				assert.NoError(t, err)
			}

			assert.Equal(t, testCase.statusCode, statusCode)
		})
	}
}

func TestGetRecordFromServiceNowClient(t *testing.T) {
	defer monkey.UnpatchAll()
	c := new(client)
	for _, testCase := range []struct {
		description  string
		statusCode   int
		errorMessage error
		expectedErr  string
	}{
		{
			description: "GetRecordFromServiceNow: valid",
			statusCode:  http.StatusOK,
		},
		{
			description:  "GetRecordFromServiceNow: with error",
			statusCode:   http.StatusInternalServerError,
			errorMessage: errors.New("error in getting the records"),
			expectedErr:  "error in getting the records",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
				return nil, testCase.statusCode, testCase.errorMessage
			})
			_, statusCode, err := c.GetRecordFromServiceNow("mockTable", "mockSysID")
			if testCase.expectedErr != "" {
				assert.EqualError(t, err, testCase.expectedErr)
			} else {
				assert.NoError(t, err)
			}

			assert.EqualValues(t, testCase.statusCode, statusCode)
		})
	}
}

func TestGetAllCommentsClient(t *testing.T) {
	defer monkey.UnpatchAll()
	c := new(client)
	for _, testCase := range []struct {
		description  string
		statusCode   int
		errorMessage error
		expectedErr  string
	}{
		{
			description: "GetAllComments: valid",
			statusCode:  http.StatusOK,
		},
		{
			description:  "GetAllComments: with error",
			statusCode:   http.StatusInternalServerError,
			errorMessage: errors.New("error in getting the comments"),
			expectedErr:  "error in getting the comments",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
				return nil, testCase.statusCode, testCase.errorMessage
			})
			_, statusCode, err := c.GetAllComments("mockRecordType", "mockRecordID")
			if testCase.expectedErr != "" {
				assert.EqualError(t, err, testCase.expectedErr)
			} else {
				assert.NoError(t, err)
			}

			assert.EqualValues(t, testCase.statusCode, statusCode)
		})
	}
}

func TestAddCommentClient(t *testing.T) {
	defer monkey.UnpatchAll()
	c := new(client)
	for _, testCase := range []struct {
		description  string
		statusCode   int
		errorMessage error
		expectedErr  string
	}{
		{
			description: "AddComment: valid",
			statusCode:  http.StatusOK,
		},
		{
			description:  "AddComment: with error",
			statusCode:   http.StatusInternalServerError,
			errorMessage: errors.New("error in adding the comment"),
			expectedErr:  "error in adding the comment",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
				return nil, testCase.statusCode, testCase.errorMessage
			})
			statusCode, err := c.AddComment("mockRecordType", "mockRecordID", &serializer.ServiceNowCommentPayload{
				Comments: "mockComment",
			})

			if testCase.expectedErr != "" {
				assert.EqualError(t, err, testCase.expectedErr)
			} else {
				assert.NoError(t, err)
			}

			assert.EqualValues(t, testCase.statusCode, statusCode)
		})
	}
}

func TestGetStatesFromServiceNowClient(t *testing.T) {
	defer monkey.UnpatchAll()
	c := new(client)
	for _, testCase := range []struct {
		description  string
		statusCode   int
		errorMessage error
		expectedErr  string
	}{
		{
			description: "GetStatesFromServiceNow: valid",
			statusCode:  http.StatusOK,
		},
		{
			description:  "GetStatesFromServiceNow: with latest update set not uploaded",
			statusCode:   http.StatusBadRequest,
			errorMessage: errors.New("mockError: Requested URI does not represent any resource"),
			expectedErr:  constants.APIErrorIDLatestUpdateSetNotUploaded,
		},
		{
			description:  "GetStatesFromServiceNow: with error",
			statusCode:   http.StatusInternalServerError,
			errorMessage: errors.New("error in getting the state"),
			expectedErr:  "error in getting the state",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
				return nil, testCase.statusCode, testCase.errorMessage
			})
			_, statusCode, err := c.GetStatesFromServiceNow("mockRecordType")

			if testCase.expectedErr != "" {
				assert.EqualError(t, err, testCase.expectedErr)
			} else {
				assert.NoError(t, err)
			}

			assert.EqualValues(t, testCase.statusCode, statusCode)
		})
	}
}

func TestUpdateStateOfRecordInServiceNowClient(t *testing.T) {
	defer monkey.UnpatchAll()
	c := new(client)
	for _, testCase := range []struct {
		description  string
		statusCode   int
		errorMessage error
		expectedErr  string
	}{
		{
			description: "UpdateStateOfRecordInServiceNow: valid",
			statusCode:  http.StatusOK,
		},
		{
			description:  "UpdateStateOfRecordInServiceNow: with error",
			statusCode:   http.StatusInternalServerError,
			errorMessage: errors.New("error in updating the state"),
			expectedErr:  "error in updating the state",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
				return nil, testCase.statusCode, testCase.errorMessage
			})
			statusCode, err := c.UpdateStateOfRecordInServiceNow("mockRecordType", "mockRecordID", &serializer.ServiceNowUpdateStatePayload{
				State: "mockState",
			})

			if testCase.expectedErr != "" {
				assert.EqualError(t, err, testCase.expectedErr)
			} else {
				assert.NoError(t, err)
			}

			assert.EqualValues(t, testCase.statusCode, statusCode)
		})
	}
}

func TestGetMeClient(t *testing.T) {
	defer monkey.UnpatchAll()
	c := new(client)
	c.plugin = &Plugin{}
	c.plugin.setConfiguration(&configuration{
		ServiceNowBaseURL: "mockServiceNowBaseURL",
	})
	for _, testCase := range []struct {
		description  string
		statusCode   int
		errorMessage error
		expectedErr  string
	}{
		{
			description: "GetMe: user don't exist on ServiceNow",
			statusCode:  http.StatusNotFound,
			expectedErr: "user doesn't exist on ServiceNow instance mockServiceNowBaseURL with email mockEmail",
		},
		{
			description:  "GetMe: with error",
			statusCode:   http.StatusInternalServerError,
			errorMessage: errors.New("error in getting the user details"),
			expectedErr:  "failed to get the user details: error in getting the user details",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
				return nil, testCase.statusCode, testCase.errorMessage
			})

			_, statusCode, err := c.GetMe("mockEmail")
			if testCase.expectedErr != "" {
				assert.EqualError(t, err, testCase.expectedErr)
			} else {
				assert.NoError(t, err)
			}

			assert.EqualValues(t, testCase.statusCode, statusCode)
		})
	}
}

func TestCreateIncidentClient(t *testing.T) {
	defer monkey.UnpatchAll()
	c := new(client)
	for _, testCase := range []struct {
		description  string
		statusCode   int
		errorMessage error
		expectedErr  string
	}{
		{
			description: "CreateIncident: valid",
			statusCode:  http.StatusOK,
		},
		{
			description:  "CreateIncident: with error",
			statusCode:   http.StatusInternalServerError,
			errorMessage: errors.New("error in creating the incident"),
			expectedErr:  "failed to create the incident in ServiceNow: error in creating the incident",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
				return nil, testCase.statusCode, testCase.errorMessage
			})

			_, statusCode, err := c.CreateIncident(&serializer.IncidentPayload{
				ShortDescription: testutils.GetServiceNowShortDescription(),
			})

			if testCase.expectedErr != "" {
				assert.EqualError(t, err, testCase.expectedErr)
			} else {
				assert.NoError(t, err)
			}

			assert.EqualValues(t, testCase.statusCode, statusCode)
		})
	}
}

func TestSearchCatalogItemsInServiceNowClient(t *testing.T) {
	defer monkey.UnpatchAll()
	c := new(client)
	c.plugin = &Plugin{}
	limit, offset := testutils.GetLimitAndOffset()
	for _, testCase := range []struct {
		description  string
		statusCode   int
		errorMessage error
		expectedErr  string
	}{
		{
			description: "SearchCatalogItemsInServiceNow: valid",
			statusCode:  http.StatusOK,
		},
		{
			description:  "SearchCatalogItemsInServiceNow: with error",
			statusCode:   http.StatusInternalServerError,
			errorMessage: errors.New("error in searching the catalog items"),
			expectedErr:  "error in searching the catalog items",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
				return nil, testCase.statusCode, testCase.errorMessage
			})

			_, statusCode, err := c.SearchCatalogItemsInServiceNow("search", limit, offset)
			if testCase.expectedErr != "" {
				assert.EqualError(t, err, testCase.expectedErr)
			} else {
				assert.NoError(t, err)
			}

			assert.EqualValues(t, testCase.statusCode, statusCode)
		})
	}
}

func TestGetIncidentFieldsFromServiceNowClient(t *testing.T) {
	defer monkey.UnpatchAll()
	c := new(client)
	c.plugin = &Plugin{}
	for _, testCase := range []struct {
		description  string
		statusCode   int
		errorMessage error
		expectedErr  string
	}{
		{
			description: "GetIncidentFieldsFromServiceNow: valid",
			statusCode:  http.StatusOK,
		},
		{
			description:  "GetIncidentFieldsFromServiceNow: with latest update set not uploaded",
			statusCode:   http.StatusBadRequest,
			errorMessage: errors.New("mockError: Requested URI does not represent any resource"),
			expectedErr:  constants.APIErrorIDLatestUpdateSetNotUploaded,
		},
		{
			description:  "GetIncidentFieldsFromServiceNow: with error",
			statusCode:   http.StatusInternalServerError,
			errorMessage: errors.New("error in getting the incident fields"),
			expectedErr:  "error in getting the incident fields",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
				return nil, testCase.statusCode, testCase.errorMessage
			})

			_, statusCode, err := c.GetIncidentFieldsFromServiceNow()
			if testCase.expectedErr != "" {
				assert.EqualError(t, err, testCase.expectedErr)
			} else {
				assert.NoError(t, err)
			}

			assert.EqualValues(t, testCase.statusCode, statusCode)
		})
	}
}
