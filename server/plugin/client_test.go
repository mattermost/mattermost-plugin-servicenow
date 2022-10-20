package plugin

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
		setupClient   func(c *client)
		statusCode    int
		expectedError string
	}{
		{
			description: "ActivateSubscriptions: valid",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusOK, nil
				})
			},
			statusCode: http.StatusOK,
		},
		{
			description: "ActivateSubscriptions: user not authorized with error",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusForbidden, errors.New("mockError: User Not Authorized")
				})
			},
			statusCode:    http.StatusForbidden,
			expectedError: constants.APIErrorIDSubscriptionsNotAuthorized,
		},
		{
			description: "ActivateSubscriptions: invalid table",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusInternalServerError, errors.New("mockError: Invalid table")
				})
			},
			statusCode:    http.StatusInternalServerError,
			expectedError: constants.APIErrorIDSubscriptionsNotConfigured,
		},
		{
			description: "ActivateSubscriptions: failed to get subscription auth details",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusInternalServerError, errors.New("mockError")
				})
			},
			statusCode:    http.StatusInternalServerError,
			expectedError: "failed to get subscription auth details: mockError",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			testCase.setupClient(c)
			statusCode, err := c.ActivateSubscriptions()
			if testCase.expectedError != "" {
				assert.EqualError(t, err, testCase.expectedError)
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
		description string
		statusCode  int
		setupClient func(c *client)
		expectedErr string
	}{
		{
			description: "CreateSubscription: valid",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusOK, nil
				})
			},
			statusCode: http.StatusOK,
		},
		{
			description: "CreateSubscription: with error",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusInternalServerError, errors.New("mockError")
				})
			},
			statusCode:  http.StatusInternalServerError,
			expectedErr: "failed to create subscription in ServiceNow: mockError",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			testCase.setupClient(c)
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
		description string
		statusCode  int
		setupClient func(c *client)
		expectedErr string
	}{
		{
			description: "GetAllSubscriptions: valid",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusOK, nil
				})
			},
			statusCode: http.StatusOK,
		},
		{
			description: "GetAllSubscriptions: with error",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusInternalServerError, errors.New("mockError")
				})
			},
			statusCode:  http.StatusInternalServerError,
			expectedErr: "failed to get subscriptions from ServiceNow: mockError",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			testCase.setupClient(c)
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
		description string
		statusCode  int
		setupClient func(c *client)
		expectedErr string
	}{
		{
			description: "GetSubscription: valid",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusOK, nil
				})
			},
			statusCode: http.StatusOK,
		},
		{
			description: "GetSubscription: with error",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusInternalServerError, errors.New("mockError")
				})
			},
			statusCode:  http.StatusInternalServerError,
			expectedErr: "failed to get subscription from ServiceNow: mockError",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			testCase.setupClient(c)
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
		description string
		statusCode  int
		setupClient func(c *client)
		expectedErr string
	}{
		{
			description: "DeleteSubscription: valid",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusOK, nil
				})
			},
			statusCode: http.StatusOK,
		},
		{
			description: "DeleteSubscription: with error",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusInternalServerError, errors.New("mockError")
				})
			},
			statusCode:  http.StatusInternalServerError,
			expectedErr: "failed to delete subscription from ServiceNow: mockError",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			testCase.setupClient(c)
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
		description string
		statusCode  int
		setupClient func(c *client)
		expectedErr string
	}{
		{
			description: "EditSubscription: valid",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusOK, nil
				})
			},
			statusCode: http.StatusOK,
		},
		{
			description: "EditSubscription: with error",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusInternalServerError, errors.New("mockError")
				})
			},
			statusCode:  http.StatusInternalServerError,
			expectedErr: "failed to update subscription from ServiceNow: mockError",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			testCase.setupClient(c)
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
		description string
		statusCode  int
		setupClient func(c *client)
		expectedErr string
	}{
		{
			description: "CheckForDuplicateSubscription: valid",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusOK, nil
				})
			},
			statusCode: http.StatusOK,
		},
		{
			description: "CheckForDuplicateSubscription: with error",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusInternalServerError, errors.New("mockError")
				})
			},
			statusCode:  http.StatusInternalServerError,
			expectedErr: "failed to get subscriptions from ServiceNow: mockError",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			testCase.setupClient(c)
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
		description string
		statusCode  int
		setupClient func(c *client)
		expectedErr string
	}{
		{
			description: "SearchRecordsInServiceNow: valid",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusOK, nil
				})
			},
			statusCode: http.StatusOK,
		},
		{
			description: "SearchRecordsInServiceNow: with error",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusInternalServerError, errors.New("mockError")
				})
			},
			statusCode:  http.StatusInternalServerError,
			expectedErr: "mockError",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			testCase.setupClient(c)
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
		description string
		statusCode  int
		setupClient func(c *client)
		expectedErr string
	}{
		{
			description: "GetRecordFromServiceNow: valid",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusOK, nil
				})
			},
			statusCode: http.StatusOK,
		},
		{
			description: "GetRecordFromServiceNow: with error",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusInternalServerError, errors.New("mockError")
				})
			},
			statusCode:  http.StatusInternalServerError,
			expectedErr: "mockError",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			testCase.setupClient(c)
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
		description string
		statusCode  int
		setupClient func(c *client)
		expectedErr string
	}{
		{
			description: "GetAllComments: valid",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusOK, nil
				})
			},
			statusCode: http.StatusOK,
		},
		{
			description: "GetAllComments: with error",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusInternalServerError, errors.New("mockError")
				})
			},
			statusCode:  http.StatusInternalServerError,
			expectedErr: "mockError",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			testCase.setupClient(c)
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
		description string
		statusCode  int
		setupClient func(c *client)
		expectedErr string
	}{
		{
			description: "AddComment: valid",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusOK, nil
				})
			},
			statusCode: http.StatusOK,
		},
		{
			description: "AddComment: with error",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusInternalServerError, errors.New("mockError")
				})
			},
			statusCode:  http.StatusInternalServerError,
			expectedErr: "mockError",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			testCase.setupClient(c)
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
		description string
		statusCode  int
		setupClient func(c *client)
		expectedErr string
	}{
		{
			description: "GetStatesFromServiceNow: valid",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusOK, nil
				})
			},
			statusCode: http.StatusOK,
		},
		{
			description: "GetStatesFromServiceNow: with error",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusInternalServerError, errors.New("mockError")
				})
			},
			statusCode:  http.StatusInternalServerError,
			expectedErr: "mockError",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			testCase.setupClient(c)
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
		description string
		statusCode  int
		setupClient func(c *client)
		expectedErr string
	}{
		{
			description: "UpdateStateOfRecordInServiceNow: valid",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusOK, nil
				})
			},
			statusCode: http.StatusOK,
		},
		{
			description: "UpdateStateOfRecordInServiceNow: with error",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c), "CallJSON", func(_ *client, _, _ string, _, _ interface{}, _ url.Values) (_ []byte, _ int, _ error) {
					return nil, http.StatusInternalServerError, errors.New("mockError")
				})
			},
			statusCode:  http.StatusInternalServerError,
			expectedErr: "mockError",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			testCase.setupClient(c)
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
