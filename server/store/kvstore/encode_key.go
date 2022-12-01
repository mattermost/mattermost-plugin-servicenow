package kvstore

import (
	"encoding/base64"
	"fmt"
)

func encodeKey(prefix, key string) string {
	if key == "" {
		return prefix
	}

	encodedKey := base64.StdEncoding.EncodeToString([]byte(key))
	encodedKey = fmt.Sprintf("%s%s", prefix, encodedKey)
	return encodedKey
}
