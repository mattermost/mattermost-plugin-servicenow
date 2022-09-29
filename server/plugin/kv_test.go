package plugin

import (
	"fmt"
	"testing"

	"bou.ke/monkey"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/serializer"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/store/kvstore"
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
