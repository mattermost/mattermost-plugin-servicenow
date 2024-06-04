package plugin

import (
	"sync"
	"time"

	"github.com/mattermost/mattermost-plugin-api/cluster"
	"github.com/mattermost/mattermost-server/v6/plugin"
	"github.com/pkg/errors"

	"github.com/mattermost/mattermost-plugin-servicenow/server/constants"
	"github.com/mattermost/mattermost-plugin-servicenow/server/serializer"
	"github.com/mattermost/mattermost-plugin-servicenow/server/store/kvstore"
)

const (
	OAuth2KeyExpiration   = 15 * time.Minute
	oAuth2StateTimeToLive = 300 // seconds
)

var ErrNotFound = kvstore.ErrNotFound

type Store interface {
	UserStore
	OAuth2StateStore
}

type UserStore interface {
	LoadUser(mattermostUserID string) (*serializer.User, error)
	StoreUser(user *serializer.User) error
	DeleteUser(mattermostUserID string) error
	GetAllUsers() ([]*serializer.IncidentCaller, error)
	DeleteUserTokenOnEncryptionSecretChange()
	DeleteAllUsersState() bool
}

// OAuth2StateStore manages OAuth2 state
type OAuth2StateStore interface {
	VerifyOAuth2State(state string) error
	StoreOAuth2State(state string) error
}

type pluginStore struct {
	plugin   *Plugin
	basicKV  kvstore.KVStore
	oauth2KV kvstore.KVStore
	userKV   kvstore.KVStore
}

func (p *Plugin) NewStore(api plugin.API) Store {
	basicKV := kvstore.NewPluginStore(api)
	return &pluginStore{
		plugin:   p,
		basicKV:  basicKV,
		userKV:   kvstore.NewHashedKeyStore(basicKV, constants.UserKeyPrefix),
		oauth2KV: kvstore.NewHashedKeyStore(kvstore.NewOneTimePluginStore(api, OAuth2KeyExpiration), constants.OAuth2KeyPrefix),
	}
}

func (s *pluginStore) LoadUser(mattermostUserID string) (*serializer.User, error) {
	user := serializer.User{}
	if err := kvstore.LoadJSON(s.userKV, mattermostUserID, &user); err != nil {
		return nil, err
	}

	return &user, nil
}

func (s *pluginStore) StoreUser(user *serializer.User) error {
	err := kvstore.StoreJSON(s.userKV, user.MattermostUserID, user)
	return err
}

func (s *pluginStore) DeleteUser(mattermostUserID string) error {
	u, err := s.LoadUser(mattermostUserID)
	if err != nil {
		return err
	}

	err = s.userKV.Delete(u.MattermostUserID)
	return err
}

func (s *pluginStore) GetAllUsers() ([]*serializer.IncidentCaller, error) {
	page := 0
	users := []*serializer.IncidentCaller{}
	mu := new(sync.Mutex)
	for {
		kvList, err := s.plugin.API.KVList(page, constants.DefaultPerPage)
		if err != nil {
			return nil, err
		}

		for _, key := range kvList {
			if userID, isValidUserKey := IsValidUserKey(key); isValidUserKey {
				decodedKey, decodeErr := decodeKey(userID)
				if decodeErr != nil {
					s.plugin.API.LogError("Unable to decode key", "Key", key, "Error", decodeErr.Error())
					break
				}

				user, loadErr := s.LoadUser(decodedKey)
				if loadErr != nil {
					s.plugin.API.LogError("Unable to load user", "UserID", decodedKey, "Error", loadErr.Error())
					break
				}

				// Append the loaded user to the users slice under a lock.
				mu.Lock()
				users = append(users, &serializer.IncidentCaller{
					MattermostUserID: user.MattermostUserID,
					Username:         user.Username,
					ServiceNowUser:   user.ServiceNowUser,
				})
				mu.Unlock()
			}
		}

		if len(kvList) < constants.DefaultPerPage {
			break
		}

		page++
	}

	return users, nil
}

func (s *pluginStore) DeleteUserTokenOnEncryptionSecretChange() {
	deleteAllUsersMutex, err := cluster.NewMutex(s.plugin.API, constants.DeleteAllUsersMutexKey)
	if err != nil {
		s.plugin.API.LogError("Failed to create mutex for deleting users", "Error", err.Error())
	}

	deleteAllUsersMutex.Lock()
	deleteAllUsersState := s.DeleteAllUsersState()
	deleteAllUsersMutex.Unlock()

	if !deleteAllUsersState {
		return
	}

	defer func() {
		if err = s.basicKV.Delete(constants.DeleteAllUsersKey); err != nil {
			s.plugin.API.LogError("Unable to disconnect users job running flag from the store", "Error", err.Error())
		}
	}()
	users, err := s.GetAllUsers()
	if err != nil {
		s.plugin.API.LogError(constants.ErrorGetUsers, "Error", err.Error())
		return
	}

	for _, user := range users {
		if err := s.DeleteUser(user.MattermostUserID); err != nil {
			s.plugin.API.LogWarn("Unable to delete a user on encryption secret change", "UserID", user.MattermostUserID, "Error", err.Error())
			continue
		}
	}
}

func (s *pluginStore) DeleteAllUsersState() bool {
	key, err := s.basicKV.Load(constants.DeleteAllUsersKey)
	if err != nil && err.Error() != "not found" {
		s.plugin.API.LogError("Unable to get disconnect users job running flag from the store", "Error", err.Error())
		return false
	}

	if len(key) == 0 {
		if err := s.basicKV.Store(constants.DeleteAllUsersKey, []byte{1}); err != nil {
			s.plugin.API.LogError("Unable to store disconnect users job running flag from the store", "Error", err.Error())
			return false
		}

		return true
	}

	return false
}

func (s *pluginStore) VerifyOAuth2State(state string) error {
	data, err := s.oauth2KV.Load(state)
	if err != nil {
		if err == ErrNotFound {
			return errors.New("authentication attempt expired, please try again")
		}
		return err
	}

	if string(data) != state {
		return errors.New("invalid oauth state, please try again")
	}
	return nil
}

func (s *pluginStore) StoreOAuth2State(state string) error {
	return s.oauth2KV.StoreTTL(state, []byte(state), oAuth2StateTimeToLive)
}
