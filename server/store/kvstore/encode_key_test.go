package kvstore

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func Test_encodeKey(t *testing.T) {
	type args struct {
		prefix    string
		encodeKey string
	}
	tests := []struct {
		name string
		args args
		want string
	}{
		{"empty", args{"", ""}, ""},
		{"value", args{"", "https://mmtest.com"}, "aHR0cHM6Ly9tbXRlc3QuY29t"},
		{"prefix", args{"abc_", ""}, "abc_"},
		{"prefix value", args{"abc_", "123"}, "abc_MTIz"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := encodeKey(tt.args.prefix, tt.args.encodeKey)
			require.Equal(t, tt.want, got)
		})
	}
}
