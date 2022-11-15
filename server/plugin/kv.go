package plugin

import (
	"time"

	"github.com/Brightscout/mattermost-plugin-servicenow/server/constants"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/serializer"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/store/kvstore"
	"github.com/mattermost/mattermost-server/v5/plugin"
	"github.com/pkg/errors"
)

const (
	UserKeyPrefix   = "user_"
	OAuth2KeyPrefix = "oauth2_"
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
		userKV:   kvstore.NewHashedKeyStore(basicKV, UserKeyPrefix),
		oauth2KV: kvstore.NewHashedKeyStore(kvstore.NewOneTimePluginStore(api, OAuth2KeyExpiration), OAuth2KeyPrefix),
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
	for {
		kvList, err := s.plugin.API.KVList(page, constants.DefaultPerPage)
		if err != nil {
			return nil, err
		}

		if len(kvList) == 0 {
			return users, nil
		}

		for _, key := range kvList {
			if userID, isValidUserKey := IsValidUserKey(key); isValidUserKey {
				decodedKey, decordErr := decodeKey(userID)
				if decordErr != nil {
					return nil, decordErr
				}

				user, loadErr := s.LoadUser(decodedKey)
				if loadErr != nil {
					return nil, loadErr
				}

				users = append(users, &serializer.IncidentCaller{
					MattermostUserID: user.MattermostUserID,
					Username:         user.Username,
					ServiceNowUser:   user.ServiceNowUser,
				})
			}
		}

		page++
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
