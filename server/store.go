package main

import (
	"encoding/json"
	"time"

	"github.com/Brightscout/mattermost-plugin-servicenow/server/store/kvstore"
	"github.com/mattermost/mattermost-server/v5/model"
	"github.com/mattermost/mattermost-server/v5/store/sqlstore"
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
	TokenStore
}

type UserStore interface {
	LoadUser(mattermostUserID string) (*User, error)
	StoreUser(user *User) error
	DeleteUser(mattermostUserID string) error
}

// OAuth2StateStore manages OAuth2 state
type OAuth2StateStore interface {
	VerifyOAuth2State(state string) error
	StoreOAuth2State(state string) error
}

type TokenStore interface {
	Connect(model.SqlSettings)
	Disconnect()
	GetToken(pluginID, userID string) (*User, error)
	DeleteToken(pluginID, userID string) error
}

type pluginStore struct {
	plugin   *Plugin
	basicKV  kvstore.KVStore
	oauth2KV kvstore.KVStore
	userKV   kvstore.KVStore
	db       *sqlstore.SqlStore
}

func (p *Plugin) NewStore() Store {
	basicKV := kvstore.NewPluginStore(p.API)
	return &pluginStore{
		plugin:   p,
		basicKV:  basicKV,
		userKV:   kvstore.NewHashedKeyStore(basicKV, UserKeyPrefix),
		oauth2KV: kvstore.NewHashedKeyStore(kvstore.NewOneTimePluginStore(p.API, OAuth2KeyExpiration), OAuth2KeyPrefix),
		db:       nil,
	}
}

func (s *pluginStore) LoadUser(mattermostUserID string) (*User, error) {
	user := User{}
	err := kvstore.LoadJSON(s.userKV, mattermostUserID, &user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *pluginStore) StoreUser(user *User) error {
	err := kvstore.StoreJSON(s.userKV, user.MattermostUserID, user)
	if err != nil {
		return err
	}

	return nil
}

func (s *pluginStore) DeleteUser(mattermostUserID string) error {
	u, err := s.LoadUser(mattermostUserID)
	if err != nil {
		return err
	}
	err = s.userKV.Delete(u.MattermostUserID)
	if err != nil {
		return err
	}

	return nil
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

func (s *pluginStore) Connect(sqlSettings model.SqlSettings) {
	s.db = sqlstore.New(sqlSettings, nil)
}

func (s *pluginStore) Disconnect() {
	if s.db != nil {
		s.db.Close()
	}
}

func (s *pluginStore) GetToken(pluginID, userID string) (*User, error) {
	userKey := kvstore.HashKey(UserKeyPrefix, userID)
	value, err := s.db.Plugin().Get(pluginID, userKey)
	if err != nil {
		return nil, err
	}

	var user *User
	if err = json.Unmarshal(value.Value, &user); err != nil {
		return nil, errors.Wrap(err, "unable to unmarshal the value into user")
	}

	return user, nil
}

func (s *pluginStore) DeleteToken(pluginID, userID string) error {
	userKey := kvstore.HashKey(UserKeyPrefix, userID)
	if err := s.db.Plugin().Delete(pluginID, userKey); err != nil {
		return err
	}

	return nil
}
