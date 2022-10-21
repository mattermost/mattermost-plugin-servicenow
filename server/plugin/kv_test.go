package plugin

import (
	"fmt"
	"reflect"
	"testing"

	"bou.ke/monkey"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/serializer"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/store/kvstore"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/testutils"
	"github.com/pkg/errors"
	"github.com/stretchr/testify/assert"
)

func Test_LoadUser(t *testing.T) {
	for _, test := range []struct {
		description   string
		setupTest     func()
		expectedError error
	}{
		{
			description: "User is loaded successfully from the KV store using mattermostID",
			setupTest: func() {
				monkey.Patch(kvstore.LoadJSON, func(_ kvstore.KVStore, _ string, _ interface{}) error {
					return nil
				})
			},
		},
		{
			description: "User is not loaded successfully from the KV store",
			setupTest: func() {
				monkey.Patch(kvstore.LoadJSON, func(_ kvstore.KVStore, _ string, _ interface{}) error {
					return fmt.Errorf("error in loading user")
				})
			},
			expectedError: fmt.Errorf("error in loading user"),
		},
	} {
		t.Run(test.description, func(t *testing.T) {
			defer monkey.UnpatchAll()
			s := pluginStore{}

			test.setupTest()
			user, err := s.LoadUser("mock-userID")
			assert.EqualValues(t, test.expectedError, err)
			if test.expectedError == nil {
				assert.Equal(t, &serializer.User{}, user)
			}
		})
	}
}

func TestStoreUser(t *testing.T) {
	for _, test := range []struct {
		description   string
		setupTest     func()
		expectedError error
	}{
		{
			description: "User is stored successfully in the KV store",
			setupTest: func() {
				monkey.Patch(kvstore.StoreJSON, func(_ kvstore.KVStore, _ string, _ interface{}) error {
					return nil
				})
			},
		},
		{
			description: "User is not stored successfully",
			setupTest: func() {
				monkey.Patch(kvstore.StoreJSON, func(_ kvstore.KVStore, _ string, _ interface{}) error {
					return fmt.Errorf("error in storing user")
				})
			},
			expectedError: fmt.Errorf("error in storing user"),
		},
	} {
		t.Run(test.description, func(t *testing.T) {
			defer monkey.UnpatchAll()
			s := pluginStore{}
			test.setupTest()

			err := s.StoreUser(&serializer.User{})
			assert.EqualValues(t, test.expectedError, err)
		})
	}
}

func TestDeleteUser(t *testing.T) {
	defer monkey.UnpatchAll()
	s := new(pluginStore)
	p := Plugin{}
	s.userKV = kvstore.NewHashedKeyStore(kvstore.NewPluginStore(p.API), UserKeyPrefix)
	for _, test := range []struct {
		description   string
		setupTest     func()
		expectedError string
	}{
		{
			description: "User is not loaded successfully from the KV store using mattermostID",
			setupTest: func() {
				monkey.PatchInstanceMethod(reflect.TypeOf(s), "LoadUser", func(*pluginStore, string) (*serializer.User, error) {
					return nil, errors.New("mockError")
				})
			},
			expectedError: "mockError",
		},
		{
			description: "User is deleted successfully from the KV store",
			setupTest: func() {
				monkey.PatchInstanceMethod(reflect.TypeOf(s), "LoadUser", func(*pluginStore, string) (*serializer.User, error) {
					return testutils.GetSerializerUser(), nil
				})
				monkey.PatchInstanceMethod(reflect.TypeOf(s.userKV), "Delete", func(*kvstore.HashedKeyStore, string) error {
					return nil
				})
			},
		},
		{
			description: "User is not deleted successfully",
			setupTest: func() {
				monkey.PatchInstanceMethod(reflect.TypeOf(s), "LoadUser", func(*pluginStore, string) (*serializer.User, error) {
					return testutils.GetSerializerUser(), nil
				})
				monkey.PatchInstanceMethod(reflect.TypeOf(s.userKV), "Delete", func(*kvstore.HashedKeyStore, string) error {
					return errors.New("mockError")
				})
			},
			expectedError: "mockError",
		},
	} {
		t.Run(test.description, func(t *testing.T) {
			assert := assert.New(t)
			test.setupTest()

			err := s.DeleteUser(testutils.GetID())
			if test.expectedError != "" {
				assert.EqualValues(err.Error(), test.expectedError)
				return
			}

			assert.Nil(err)
		})
	}
}

func TestVerifyOAuth2State(t *testing.T) {
	s := new(pluginStore)
	p := Plugin{}
	s.oauth2KV = kvstore.NewHashedKeyStore(kvstore.NewOneTimePluginStore(p.API, OAuth2KeyExpiration), OAuth2KeyPrefix)
	for _, test := range []struct {
		description   string
		errorMessage  error
		data          []byte
		expectedError string
	}{
		{
			description: "User is verified successfully",
			data:        []byte("mockState"),
		},
		{
			description:   "Invalid oauth state",
			data:          []byte("mockData"),
			expectedError: "invalid oauth state, please try again",
		},
		{
			description:   "User is not loaded successfully",
			expectedError: "authentication attempt expired, please try again",
			errorMessage:  ErrNotFound,
		},
	} {
		t.Run(test.description, func(t *testing.T) {
			assert := assert.New(t)
			defer monkey.UnpatchAll()
			monkey.PatchInstanceMethod(reflect.TypeOf(s.oauth2KV), "Load", func(*kvstore.HashedKeyStore, string) ([]byte, error) {
				return test.data, test.errorMessage
			})

			err := s.VerifyOAuth2State("mockState")
			if test.expectedError != "" {
				assert.EqualValues(err.Error(), test.expectedError)
				return
			}

			assert.Nil(err)
		})
	}
}
