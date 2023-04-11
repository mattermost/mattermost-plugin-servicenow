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
		{"value", args{"", "https://mmtest.com"}, "71c586b3364d6bf1401ffc04f36d1b03e2987c5a567a12ebc5"},
		{"prefix", args{"abc_", ""}, "abc_"},
		{"prefix value", args{"abc_", "123"}, "abc_3c9909afec25354d551dae21590bb26e38d53f2173b8d3"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := hashKey(tt.args.prefix, tt.args.hashableKey)
			require.Equal(t, tt.want, got)
		})
	}
}
