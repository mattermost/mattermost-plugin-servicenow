// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License for license information.

package kvstore

import (
	"crypto/sha512"
	"fmt"

	"github.com/mattermost/mattermost-server/v5/model"
)

type HashedKeyStore struct {
	store  KVStore
	prefix string
}

var _ KVStore = (*HashedKeyStore)(nil)

func NewHashedKeyStore(s KVStore, prefix string) KVStore {
	return &HashedKeyStore{
		store:  s,
		prefix: prefix,
	}
}

func (s HashedKeyStore) Load(key string) ([]byte, error) {
	return s.store.Load(hashKey(s.prefix, key))
}

func (s HashedKeyStore) Store(key string, data []byte) error {
	return s.store.Store(hashKey(s.prefix, key), data)
}

func (s HashedKeyStore) StoreTTL(key string, data []byte, ttlSeconds int64) error {
	return s.store.StoreTTL(hashKey(s.prefix, key), data, ttlSeconds)
}

func (s HashedKeyStore) StoreWithOptions(key string, value []byte, opts model.PluginKVSetOptions) (bool, error) {
	return s.store.StoreWithOptions(hashKey(s.prefix, key), value, opts)
}

func (s HashedKeyStore) Delete(key string) error {
	return s.store.Delete(hashKey(s.prefix, key))
}

func hashKey(prefix, hashableKey string) string {
	if hashableKey == "" {
		return prefix
	}

	h := sha512.New()
	_, _ = h.Write([]byte(hashableKey))
	hashedKey := fmt.Sprintf("%s%x", prefix, h.Sum(nil))
	// We are returning a key of 50 length because Mattermost server below v6 don't support keys longer than 50
	return hashedKey[:50]
}
