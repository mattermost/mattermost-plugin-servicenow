// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License for license information.

package kvstore

import (
	"crypto/sha512"
	"fmt"

	"github.com/mattermost/mattermost-server/v5/model"
)

type hashedKeyStore struct {
	store  KVStore
	prefix string
}

var _ KVStore = (*hashedKeyStore)(nil)

func NewHashedKeyStore(s KVStore, prefix string) KVStore {
	return &hashedKeyStore{
		store:  s,
		prefix: prefix,
	}
}

func (s hashedKeyStore) Load(key string) ([]byte, error) {
	return s.store.Load(HashKey(s.prefix, key))
}

func (s hashedKeyStore) Store(key string, data []byte) error {
	return s.store.Store(HashKey(s.prefix, key), data)
}

func (s hashedKeyStore) StoreTTL(key string, data []byte, ttlSeconds int64) error {
	return s.store.StoreTTL(HashKey(s.prefix, key), data, ttlSeconds)
}

func (s hashedKeyStore) StoreWithOptions(key string, value []byte, opts model.PluginKVSetOptions) (bool, error) {
	return s.store.StoreWithOptions(HashKey(s.prefix, key), value, opts)
}

func (s hashedKeyStore) Delete(key string) error {
	return s.store.Delete(HashKey(s.prefix, key))
}

func HashKey(prefix, hashableKey string) string {
	if hashableKey == "" {
		return prefix
	}

	h := sha512.New()
	_, _ = h.Write([]byte(hashableKey))
	hashedKey := fmt.Sprintf("%s%x", prefix, h.Sum(nil))
	return hashedKey[:50]
}
