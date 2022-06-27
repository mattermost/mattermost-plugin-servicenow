// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License for license information.

package kvstore

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func Test_hashKey(t *testing.T) {
	type args struct {
		prefix      string
		hashableKey string
	}
	tests := []struct {
		name string
		args args
		want string
	}{
		{"empty", args{"", ""}, ""},
		{"value", args{"", "https://mmtest.mattermost.com"}, "715d5aaee8abf70aa32c8da1a0d3bf95910fd01863143376accee24403e406016d718de0409a7fc018e59eda0b0580fa0df250787d114bbfdf1ffbe4b26e7ea7"},
		{"prefix", args{"abc_", ""}, "abc_"},
		{"prefix value", args{"abc_", "123"}, "abc_3c9909afec25354d551dae21590bb26e38d53f2173b8d3dc3eee4c047e7ab1c1eb8b85103e3be7ba613b31bb5c9c36214dc9f14a42fd7a2fdb84856bca5c44c2"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := HashKey(tt.args.prefix, tt.args.hashableKey)
			require.Equal(t, tt.want, got)
		})
	}
}
