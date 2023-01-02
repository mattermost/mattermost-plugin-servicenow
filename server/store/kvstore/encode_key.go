package kvstore

import (
	"encoding/base64"
	"fmt"
)

func encodeKey(prefix, key string) string {
	if key == "" {
		return prefix
	}

	encodedKey := fmt.Sprintf("%s%s", prefix, base64.StdEncoding.EncodeToString([]byte(key)))
	return encodedKey
}
