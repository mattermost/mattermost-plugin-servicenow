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
		{"value", args{"", "https://mmtest.mattermost.com"}, "aHR0cHM6Ly9tbXRlc3QubWF0dGVybW9zdC5jb20="},
		{"prefix", args{"abc_", ""}, "abc_"},
		{"prefix value", args{"abc_", "123"}, "abc_MTIz"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := encodeKey(tt.args.prefix, tt.args.hashableKey)
			require.Equal(t, tt.want, got)
		})
	}
}
