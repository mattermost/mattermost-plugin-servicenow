package plugin

import (
	"sync"
	"time"

	"github.com/mattermost/mattermost-server/v5/plugin"
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
	if err := kvstore.StoreJSON(s.userKV, user.MattermostUserID, user); err != nil {
		return err
	}

	return nil
}

func (s *pluginStore) DeleteUser(mattermostUserID string) error {
	u, err := s.LoadUser(mattermostUserID)
	if err != nil {
		return err
	}

	if err = s.userKV.Delete(u.MattermostUserID); err != nil {
		return err
	}

	return nil
}

func (s *pluginStore) GetAllUsers() ([]*serializer.IncidentCaller, error) {
	page := 0
	users := []*serializer.IncidentCaller{}
	wg := new(sync.WaitGroup)
	mu := new(sync.Mutex)
	for {
		kvList, err := s.plugin.API.KVList(page, constants.DefaultPerPage)
		if err != nil {
			return nil, err
		}

		for _, key := range kvList {
			wg.Add(1)

			go func(key string) {
				defer wg.Done()

				if userID, isValidUserKey := IsValidUserKey(key); isValidUserKey {
					decodedKey, decodeErr := decodeKey(userID)
					if decodeErr != nil {
						s.plugin.API.LogError("Unable to decode key", "UserID", userID, "Error", decodeErr.Error())
						return
					}

					user, loadErr := s.LoadUser(decodedKey)
					if loadErr != nil {
						s.plugin.API.LogError("Unable to load user", "UserID", userID, "Error", loadErr.Error())
						return
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
			}(key)
		}

		// Wait for all goroutines to complete before continuing.
		wg.Wait()

		if len(kvList) < constants.DefaultPerPage {
			break
		}

		page++
	}

	return users, nil
}

func (s *pluginStore) DeleteUserTokenOnEncryptionSecretChange() {
	users, err := s.GetAllUsers()
	if err != nil {
		s.plugin.API.LogError(constants.ErrorGetUsers, "Error", err.Error())
		return
	}

	for _, user := range users {
		if err := s.DeleteUser(user.MattermostUserID); err != nil {
			s.plugin.API.LogError("Unable to delete a user", "UserID", user.MattermostUserID, "Error", err.Error())
			continue
		}
	}
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
