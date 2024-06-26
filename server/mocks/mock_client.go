// Code generated by mockery v2.11.0. DO NOT EDIT.

// Regenerate this file using `make client-mocks`.

package mocks

import (
	mock "github.com/stretchr/testify/mock"

	serializer "github.com/mattermost/mattermost-plugin-servicenow/server/serializer"

	testing "testing"
)

// Client is an autogenerated mock type for the Client type
type Client struct {
	mock.Mock
}

// ActivateSubscriptions provides a mock function with given fields:
func (_m *Client) ActivateSubscriptions() (int, error) {
	ret := _m.Called()

	var r0 int
	if rf, ok := ret.Get(0).(func() int); ok {
		r0 = rf()
	} else {
		r0 = ret.Get(0).(int)
	}

	var r1 error
	if rf, ok := ret.Get(1).(func() error); ok {
		r1 = rf()
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// AddComment provides a mock function with given fields: recordType, recordID, payload
func (_m *Client) AddComment(recordType string, recordID string, payload *serializer.ServiceNowCommentPayload) (int, error) {
	ret := _m.Called(recordType, recordID, payload)

	var r0 int
	if rf, ok := ret.Get(0).(func(string, string, *serializer.ServiceNowCommentPayload) int); ok {
		r0 = rf(recordType, recordID, payload)
	} else {
		r0 = ret.Get(0).(int)
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(string, string, *serializer.ServiceNowCommentPayload) error); ok {
		r1 = rf(recordType, recordID, payload)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// CheckForDuplicateSubscription provides a mock function with given fields: _a0
func (_m *Client) CheckForDuplicateSubscription(_a0 *serializer.SubscriptionPayload) (bool, int, error) {
	ret := _m.Called(_a0)

	var r0 bool
	if rf, ok := ret.Get(0).(func(*serializer.SubscriptionPayload) bool); ok {
		r0 = rf(_a0)
	} else {
		r0 = ret.Get(0).(bool)
	}

	var r1 int
	if rf, ok := ret.Get(1).(func(*serializer.SubscriptionPayload) int); ok {
		r1 = rf(_a0)
	} else {
		r1 = ret.Get(1).(int)
	}

	var r2 error
	if rf, ok := ret.Get(2).(func(*serializer.SubscriptionPayload) error); ok {
		r2 = rf(_a0)
	} else {
		r2 = ret.Error(2)
	}

	return r0, r1, r2
}

// CreateIncident provides a mock function with given fields: _a0
func (_m *Client) CreateIncident(_a0 *serializer.IncidentPayload) (*serializer.IncidentResponse, int, error) {
	ret := _m.Called(_a0)

	var r0 *serializer.IncidentResponse
	if rf, ok := ret.Get(0).(func(*serializer.IncidentPayload) *serializer.IncidentResponse); ok {
		r0 = rf(_a0)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*serializer.IncidentResponse)
		}
	}

	var r1 int
	if rf, ok := ret.Get(1).(func(*serializer.IncidentPayload) int); ok {
		r1 = rf(_a0)
	} else {
		r1 = ret.Get(1).(int)
	}

	var r2 error
	if rf, ok := ret.Get(2).(func(*serializer.IncidentPayload) error); ok {
		r2 = rf(_a0)
	} else {
		r2 = ret.Error(2)
	}

	return r0, r1, r2
}

// CreateSubscription provides a mock function with given fields: _a0
func (_m *Client) CreateSubscription(_a0 *serializer.SubscriptionPayload) (*serializer.SubscriptionResponse, int, error) {
	ret := _m.Called(_a0)

	var r0 *serializer.SubscriptionResponse
	if rf, ok := ret.Get(0).(func(*serializer.SubscriptionPayload) *serializer.SubscriptionResponse); ok {
		r0 = rf(_a0)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*serializer.SubscriptionResponse)
		}
	}

	var r1 int
	if rf, ok := ret.Get(1).(func(*serializer.SubscriptionPayload) int); ok {
		r1 = rf(_a0)
	} else {
		r1 = ret.Get(1).(int)
	}

	var r2 error
	if rf, ok := ret.Get(2).(func(*serializer.SubscriptionPayload) error); ok {
		r2 = rf(_a0)
	} else {
		r2 = ret.Error(2)
	}

	return r0, r1, r2
}

// DeleteSubscription provides a mock function with given fields: subscriptionID
func (_m *Client) DeleteSubscription(subscriptionID string) (int, error) {
	ret := _m.Called(subscriptionID)

	var r0 int
	if rf, ok := ret.Get(0).(func(string) int); ok {
		r0 = rf(subscriptionID)
	} else {
		r0 = ret.Get(0).(int)
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(string) error); ok {
		r1 = rf(subscriptionID)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// EditSubscription provides a mock function with given fields: subscriptionID, subscription
func (_m *Client) EditSubscription(subscriptionID string, subscription *serializer.SubscriptionPayload) (*serializer.SubscriptionResponse, int, error) {
	ret := _m.Called(subscriptionID, subscription)

	var r0 *serializer.SubscriptionResponse
	if rf, ok := ret.Get(0).(func(string, *serializer.SubscriptionPayload) *serializer.SubscriptionResponse); ok {
		r0 = rf(subscriptionID, subscription)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*serializer.SubscriptionResponse)
		}
	}

	var r1 int
	if rf, ok := ret.Get(1).(func(string, *serializer.SubscriptionPayload) int); ok {
		r1 = rf(subscriptionID, subscription)
	} else {
		r1 = ret.Get(1).(int)
	}

	var r2 error
	if rf, ok := ret.Get(2).(func(string, *serializer.SubscriptionPayload) error); ok {
		r2 = rf(subscriptionID, subscription)
	} else {
		r2 = ret.Error(2)
	}

	return r0, r1, r2
}

// GetAllComments provides a mock function with given fields: recordType, recordID
func (_m *Client) GetAllComments(recordType string, recordID string) (*serializer.ServiceNowComment, int, error) {
	ret := _m.Called(recordType, recordID)

	var r0 *serializer.ServiceNowComment
	if rf, ok := ret.Get(0).(func(string, string) *serializer.ServiceNowComment); ok {
		r0 = rf(recordType, recordID)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*serializer.ServiceNowComment)
		}
	}

	var r1 int
	if rf, ok := ret.Get(1).(func(string, string) int); ok {
		r1 = rf(recordType, recordID)
	} else {
		r1 = ret.Get(1).(int)
	}

	var r2 error
	if rf, ok := ret.Get(2).(func(string, string) error); ok {
		r2 = rf(recordType, recordID)
	} else {
		r2 = ret.Error(2)
	}

	return r0, r1, r2
}

// GetAllSubscriptions provides a mock function with given fields: channelID, userID, subscriptionType, limit, offset
func (_m *Client) GetAllSubscriptions(channelID string, userID string, subscriptionType string, limit string, offset string) ([]*serializer.SubscriptionResponse, int, error) {
	ret := _m.Called(channelID, userID, subscriptionType, limit, offset)

	var r0 []*serializer.SubscriptionResponse
	if rf, ok := ret.Get(0).(func(string, string, string, string, string) []*serializer.SubscriptionResponse); ok {
		r0 = rf(channelID, userID, subscriptionType, limit, offset)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).([]*serializer.SubscriptionResponse)
		}
	}

	var r1 int
	if rf, ok := ret.Get(1).(func(string, string, string, string, string) int); ok {
		r1 = rf(channelID, userID, subscriptionType, limit, offset)
	} else {
		r1 = ret.Get(1).(int)
	}

	var r2 error
	if rf, ok := ret.Get(2).(func(string, string, string, string, string) error); ok {
		r2 = rf(channelID, userID, subscriptionType, limit, offset)
	} else {
		r2 = ret.Error(2)
	}

	return r0, r1, r2
}

// GetMe provides a mock function with given fields: userEmail
func (_m *Client) GetMe(userEmail string) (*serializer.ServiceNowUser, int, error) {
	ret := _m.Called(userEmail)

	var r0 *serializer.ServiceNowUser
	if rf, ok := ret.Get(0).(func(string) *serializer.ServiceNowUser); ok {
		r0 = rf(userEmail)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*serializer.ServiceNowUser)
		}
	}

	var r1 int
	if rf, ok := ret.Get(1).(func(string) int); ok {
		r1 = rf(userEmail)
	} else {
		r1 = ret.Get(1).(int)
	}

	var r2 error
	if rf, ok := ret.Get(2).(func(string) error); ok {
		r2 = rf(userEmail)
	} else {
		r2 = ret.Error(2)
	}

	return r0, r1, r2
}

// GetRecordFromServiceNow provides a mock function with given fields: tableName, sysID
func (_m *Client) GetRecordFromServiceNow(tableName string, sysID string) (*serializer.ServiceNowRecord, int, error) {
	ret := _m.Called(tableName, sysID)

	var r0 *serializer.ServiceNowRecord
	if rf, ok := ret.Get(0).(func(string, string) *serializer.ServiceNowRecord); ok {
		r0 = rf(tableName, sysID)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*serializer.ServiceNowRecord)
		}
	}

	var r1 int
	if rf, ok := ret.Get(1).(func(string, string) int); ok {
		r1 = rf(tableName, sysID)
	} else {
		r1 = ret.Get(1).(int)
	}

	var r2 error
	if rf, ok := ret.Get(2).(func(string, string) error); ok {
		r2 = rf(tableName, sysID)
	} else {
		r2 = ret.Error(2)
	}

	return r0, r1, r2
}

// GetStatesFromServiceNow provides a mock function with given fields: recordType
func (_m *Client) GetStatesFromServiceNow(recordType string) ([]*serializer.ServiceNowState, int, error) {
	ret := _m.Called(recordType)

	var r0 []*serializer.ServiceNowState
	if rf, ok := ret.Get(0).(func(string) []*serializer.ServiceNowState); ok {
		r0 = rf(recordType)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).([]*serializer.ServiceNowState)
		}
	}

	var r1 int
	if rf, ok := ret.Get(1).(func(string) int); ok {
		r1 = rf(recordType)
	} else {
		r1 = ret.Get(1).(int)
	}

	var r2 error
	if rf, ok := ret.Get(2).(func(string) error); ok {
		r2 = rf(recordType)
	} else {
		r2 = ret.Error(2)
	}

	return r0, r1, r2
}

// GetSubscription provides a mock function with given fields: subscriptionID
func (_m *Client) GetSubscription(subscriptionID string) (*serializer.SubscriptionResponse, int, error) {
	ret := _m.Called(subscriptionID)

	var r0 *serializer.SubscriptionResponse
	if rf, ok := ret.Get(0).(func(string) *serializer.SubscriptionResponse); ok {
		r0 = rf(subscriptionID)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*serializer.SubscriptionResponse)
		}
	}

	var r1 int
	if rf, ok := ret.Get(1).(func(string) int); ok {
		r1 = rf(subscriptionID)
	} else {
		r1 = ret.Get(1).(int)
	}

	var r2 error
	if rf, ok := ret.Get(2).(func(string) error); ok {
		r2 = rf(subscriptionID)
	} else {
		r2 = ret.Error(2)
	}

	return r0, r1, r2
}

// SearchCatalogItemsInServiceNow provides a mock function with given fields: searchTerm, limit, offset
func (_m *Client) SearchCatalogItemsInServiceNow(searchTerm string, limit string, offset string) ([]*serializer.ServiceNowCatalogItem, int, error) {
	ret := _m.Called(searchTerm, limit, offset)

	var r0 []*serializer.ServiceNowCatalogItem
	if rf, ok := ret.Get(0).(func(string, string, string) []*serializer.ServiceNowCatalogItem); ok {
		r0 = rf(searchTerm, limit, offset)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).([]*serializer.ServiceNowCatalogItem)
		}
	}

	var r1 int
	if rf, ok := ret.Get(1).(func(string, string, string) int); ok {
		r1 = rf(searchTerm, limit, offset)
	} else {
		r1 = ret.Get(1).(int)
	}

	var r2 error
	if rf, ok := ret.Get(2).(func(string, string, string) error); ok {
		r2 = rf(searchTerm, limit, offset)
	} else {
		r2 = ret.Error(2)
	}

	return r0, r1, r2
}

// SearchRecordsInServiceNow provides a mock function with given fields: tableName, searchTerm, limit, offset
func (_m *Client) SearchRecordsInServiceNow(tableName string, searchTerm string, limit string, offset string) ([]*serializer.ServiceNowPartialRecord, int, error) {
	ret := _m.Called(tableName, searchTerm, limit, offset)

	var r0 []*serializer.ServiceNowPartialRecord
	if rf, ok := ret.Get(0).(func(string, string, string, string) []*serializer.ServiceNowPartialRecord); ok {
		r0 = rf(tableName, searchTerm, limit, offset)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).([]*serializer.ServiceNowPartialRecord)
		}
	}

	var r1 int
	if rf, ok := ret.Get(1).(func(string, string, string, string) int); ok {
		r1 = rf(tableName, searchTerm, limit, offset)
	} else {
		r1 = ret.Get(1).(int)
	}

	var r2 error
	if rf, ok := ret.Get(2).(func(string, string, string, string) error); ok {
		r2 = rf(tableName, searchTerm, limit, offset)
	} else {
		r2 = ret.Error(2)
	}

	return r0, r1, r2
}

// UpdateStateOfRecordInServiceNow provides a mock function with given fields: recordType, recordID, payload
func (_m *Client) UpdateStateOfRecordInServiceNow(recordType string, recordID string, payload *serializer.ServiceNowUpdateStatePayload) (int, error) {
	ret := _m.Called(recordType, recordID, payload)

	var r0 int
	if rf, ok := ret.Get(0).(func(string, string, *serializer.ServiceNowUpdateStatePayload) int); ok {
		r0 = rf(recordType, recordID, payload)
	} else {
		r0 = ret.Get(0).(int)
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(string, string, *serializer.ServiceNowUpdateStatePayload) error); ok {
		r1 = rf(recordType, recordID, payload)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// NewClient creates a new instance of Client. It also registers a cleanup function to assert the mocks expectations.
func NewClient(t testing.TB) *Client {
	mock := &Client{}

	t.Cleanup(func() { mock.AssertExpectations(t) })

	return mock
}
