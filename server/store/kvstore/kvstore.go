// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License for license information.

package kvstore

import (
	"encoding/json"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/pkg/errors"
)

type KVStore interface {
	Load(key string) ([]byte, error)
	Store(key string, data []byte) error
	StoreTTL(key string, data []byte, ttlSeconds int64) error
	StoreWithOptions(key string, value []byte, opts model.PluginKVSetOptions) (bool, error)
	Delete(key string) error
}

var ErrNotFound = errors.New("not found")

func Ensure(s KVStore, key string, newValue []byte) ([]byte, error) {
	value, err := s.Load(key)
	switch err {
	case nil:
		return value, nil
	case ErrNotFound:
		break
	default:
		return nil, err
	}

	if err = s.Store(key, newValue); err != nil {
		return nil, err
	}

	// Load again in case we lost the race to another server
	value, err = s.Load(key)
	if err != nil {
		return newValue, nil
	}
	return value, nil
}

func LoadJSON(s KVStore, key string, v interface{}) error {
	data, err := s.Load(key)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, v)
}

func StoreJSON(s KVStore, key string, v interface{}) error {
	data, err := json.Marshal(v)
	if err != nil {
		return err
	}
	return s.Store(key, data)
}
