package plugin

import (
	"fmt"
	"reflect"
	"testing"

	"bou.ke/monkey"
	"github.com/mattermost/mattermost-plugin-servicenow/server/constants"
	"github.com/mattermost/mattermost-plugin-servicenow/server/serializer"
	"github.com/mattermost/mattermost-plugin-servicenow/server/store/kvstore"
	"github.com/mattermost/mattermost-plugin-servicenow/server/testutils"
	"github.com/stretchr/testify/assert"
)

func Test_LoadUser(t *testing.T) {
	for _, test := range []struct {
		description   string
		setupTest     func()
		expectedError error
	}{
		{
			description: "User is loaded from the KV store using mattermostUserID",
			setupTest: func() {
				monkey.Patch(kvstore.LoadJSON, func(_ kvstore.KVStore, _ string, _ interface{}) error {
					return nil
				})
			},
		},
		{
			description: "User is not loaded from the KV store",
			setupTest: func() {
				monkey.Patch(kvstore.LoadJSON, func(_ kvstore.KVStore, _ string, _ interface{}) error {
					return fmt.Errorf("error in loading the user")
				})
			},
			expectedError: fmt.Errorf("error in loading the user"),
		},
	} {
		t.Run(test.description, func(t *testing.T) {
			defer monkey.UnpatchAll()
			ps := pluginStore{}

			test.setupTest()
			user, err := ps.LoadUser("mock-userID")
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
			description: "User is stored in the KV store",
			setupTest: func() {
				monkey.Patch(kvstore.StoreJSON, func(_ kvstore.KVStore, _ string, _ interface{}) error {
					return nil
				})
			},
		},
		{
			description: "User is not stored",
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
			ps := pluginStore{}
			test.setupTest()

			err := ps.StoreUser(&serializer.User{})
			assert.EqualValues(t, test.expectedError, err)
		})
	}
}

func TestDeleteUser(t *testing.T) {
	defer monkey.UnpatchAll()
	ps := new(pluginStore)
	p := Plugin{}
	ps.userKV = kvstore.NewHashedKeyStore(kvstore.NewPluginStore(p.API), constants.UserKeyPrefix)
	for _, test := range []struct {
		description   string
		setupTest     func()
		expectedError error
	}{
		{
			description: "User is not loaded from the KV store using mattermostUserID",
			setupTest: func() {
				monkey.PatchInstanceMethod(reflect.TypeOf(ps), "LoadUser", func(*pluginStore, string) (*serializer.User, error) {
					return nil, fmt.Errorf("error in loading the user")
				})
			},
			expectedError: fmt.Errorf("error in loading the user"),
		},
		{
			description: "User is deleted from the KV store",
			setupTest: func() {
				monkey.PatchInstanceMethod(reflect.TypeOf(ps), "LoadUser", func(*pluginStore, string) (*serializer.User, error) {
					return testutils.GetSerializerUser(), nil
				})
				monkey.PatchInstanceMethod(reflect.TypeOf(ps.userKV), "Delete", func(*kvstore.HashedKeyStore, string) error {
					return nil
				})
			},
		},
		{
			description: "User is not deleted",
			setupTest: func() {
				monkey.PatchInstanceMethod(reflect.TypeOf(ps), "LoadUser", func(*pluginStore, string) (*serializer.User, error) {
					return testutils.GetSerializerUser(), nil
				})
				monkey.PatchInstanceMethod(reflect.TypeOf(ps.userKV), "Delete", func(*kvstore.HashedKeyStore, string) error {
					return fmt.Errorf("error in deleting the user")
				})
			},
			expectedError: fmt.Errorf("error in deleting the user"),
		},
	} {
		t.Run(test.description, func(t *testing.T) {
			assert := assert.New(t)
			test.setupTest()

			err := ps.DeleteUser(testutils.GetID())
			if test.expectedError != nil {
				assert.EqualValues(err, test.expectedError)
				return
			}

			assert.Nil(err)
		})
	}
}

func TestVerifyOAuth2State(t *testing.T) {
	ps := new(pluginStore)
	p := Plugin{}
	ps.oauth2KV = kvstore.NewHashedKeyStore(kvstore.NewOneTimePluginStore(p.API, OAuth2KeyExpiration), constants.OAuth2KeyPrefix)
	for _, test := range []struct {
		description   string
		errorMessage  error
		data          []byte
		expectedError string
	}{
		{
			description: "User is verified",
			data:        []byte("mockState"),
		},
		{
			description:   "Invalid oauth state",
			data:          []byte("mockData"),
			expectedError: "invalid oauth state, please try again",
		},
		{
			description:   "User is not loaded",
			expectedError: "authentication attempt expired, please try again",
			errorMessage:  ErrNotFound,
		},
	} {
		t.Run(test.description, func(t *testing.T) {
			assert := assert.New(t)
			defer monkey.UnpatchAll()
			monkey.PatchInstanceMethod(reflect.TypeOf(ps.oauth2KV), "Load", func(*kvstore.HashedKeyStore, string) ([]byte, error) {
				return test.data, test.errorMessage
			})

			err := ps.VerifyOAuth2State("mockState")
			if test.expectedError != "" {
				assert.EqualValues(err.Error(), test.expectedError)
				return
			}

			assert.Nil(err)
		})
	}
}
