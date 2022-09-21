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
			description: "User is loaded successfully from KV store using mattermostID",
			setupTest: func() {
				monkey.Patch(kvstore.LoadJSON, func(_ kvstore.KVStore, _ string, _ interface{}) error {
					return nil
				})
			},
		},
		{
			description: "User is not loaded successfully from KV store",
			setupTest: func() {
				monkey.Patch(kvstore.LoadJSON, func(_ kvstore.KVStore, _ string, _ interface{}) error {
					return fmt.Errorf("user load error")
				})
			},
			expectedError: fmt.Errorf("user load error"),
		},
	} {
		t.Run(test.description, func(t *testing.T) {
			defer monkey.UnpatchAll()
			s := pluginStore{}

			test.setupTest()
			_, err := s.LoadUser("mock-userID")
			assert.EqualValues(t, test.expectedError, err)
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
			description: "User is stored successfully in KV store",
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
					return fmt.Errorf("user store error")
				})
			},
			expectedError: fmt.Errorf("user store error"),
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
