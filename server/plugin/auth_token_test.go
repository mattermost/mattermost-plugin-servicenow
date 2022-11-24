package plugin

import (
	"crypto/aes"
	"crypto/cipher"
	"encoding/json"
	"errors"
	"io"
	"testing"

	"bou.ke/monkey"
	"github.com/stretchr/testify/assert"
	"golang.org/x/oauth2"
)

type mockBLock struct{}

func (b *mockBLock) BlockSize() int { return 0 }

func (b *mockBLock) Encrypt(_, _ []byte) {}

func (b *mockBLock) Decrypt(_, _ []byte) {}

type mockAesgcm struct{}

func (a *mockAesgcm) NonceSize() int { return 1 }

func (a *mockAesgcm) Overhead() int { return 0 }

func (a *mockAesgcm) Seal(dst, nonce, plaintext, additionalData []byte) []byte { return []byte("mock") }

func (a *mockAesgcm) Open(dst, nonce, ciphertext, additionalData []byte) ([]byte, error) {
	return []byte("mock"), nil
}

func Test_NewEncodedAuthToken(t *testing.T) {
	defer monkey.UnpatchAll()
	for _, testCase := range []struct {
		description   string
		setupPlugin   func()
		expectedError string
	}{
		{
			description: "NewEncodedAuthToken: oAuth token is encoded successfully",
			setupPlugin: func() {
				monkey.Patch(aes.NewCipher, func(a []byte) (cipher.Block, error) {
					return &mockBLock{}, nil
				})
				monkey.Patch(cipher.NewGCM, func(_ cipher.Block) (cipher.AEAD, error) {
					return &mockAesgcm{}, nil
				})
				monkey.Patch(io.ReadFull, func(_ io.Reader, _ []byte) (int, error) {
					return 0, nil
				})
			},
		},
		{
			description: "NewEncodedAuthToken: failed to create the oAuth token because aes.NewCipher gives error",
			setupPlugin: func() {
				monkey.Patch(aes.NewCipher, func(a []byte) (cipher.Block, error) {
					return &mockBLock{}, errors.New("mockError")
				})
			},
			expectedError: "failed to create auth token: mockError",
		},
		{
			description: "NewEncodedAuthToken: failed to create the oAuth token because cipher.NewGCM gives error",
			setupPlugin: func() {
				monkey.Patch(aes.NewCipher, func(a []byte) (cipher.Block, error) {
					return &mockBLock{}, nil
				})
				monkey.Patch(cipher.NewGCM, func(_ cipher.Block) (cipher.AEAD, error) {
					return &mockAesgcm{}, errors.New("mockError")
				})
			},
			expectedError: "failed to create auth token: mockError",
		},
		{
			description: "NewEncodedAuthToken: failed to create the oAuth token because io.ReadFull gives error",
			setupPlugin: func() {
				monkey.Patch(aes.NewCipher, func(a []byte) (cipher.Block, error) {
					return &mockBLock{}, nil
				})
				monkey.Patch(cipher.NewGCM, func(_ cipher.Block) (cipher.AEAD, error) {
					return &mockAesgcm{}, nil
				})
				monkey.Patch(io.ReadFull, func(_ io.Reader, _ []byte) (int, error) {
					return 0, errors.New("mockError")
				})
			},
			expectedError: "failed to create auth token: mockError",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			p := Plugin{}
			testCase.setupPlugin()
			p.setConfiguration(
				&configuration{
					EncryptionSecret: "mockEncryptionSecret",
				})
			tok := &oauth2.Token{}
			res, err := p.NewEncodedAuthToken(tok)
			if testCase.expectedError != "" {
				assert.EqualError(t, err, testCase.expectedError)
				assert.EqualValues(t, "", res)
			} else {
				assert.Nil(t, err)
				assert.NotEqualValues(t, "", res)
			}
		})
	}
}

func Test_ParseAuthToken(t *testing.T) {
	defer monkey.UnpatchAll()
	for _, testCase := range []struct {
		description   string
		expectedError string
		setupPlugin   func()
		encodedToken  string
	}{
		{
			description:  "ParseAuthToken: oAuth2 token is parsed successfully",
			encodedToken: "mockEncodedToken",
			setupPlugin: func() {
				monkey.Patch(aes.NewCipher, func(a []byte) (cipher.Block, error) {
					return &mockBLock{}, nil
				})
				monkey.Patch(cipher.NewGCM, func(_ cipher.Block) (cipher.AEAD, error) {
					return &mockAesgcm{}, nil
				})
				monkey.Patch(json.Unmarshal, func(_ []byte, _ interface{}) error {
					return nil
				})
			},
		},
		{
			description:   "ParseAuthToken: failed to decode the oAuth token because aes.NewCipher gives error",
			expectedError: "aes.NewCipher gives error",
			setupPlugin: func() {
				monkey.Patch(aes.NewCipher, func(a []byte) (cipher.Block, error) {
					return &mockBLock{}, errors.New("aes.NewCipher gives error")
				})
			},
			encodedToken: "mockEncodedToken",
		},
		{
			description:   "ParseAuthToken: failed to decode the oAuth token because cipher.NewGCM gives error",
			expectedError: "cipher.NewGCM gives error",
			setupPlugin: func() {
				monkey.Patch(aes.NewCipher, func(a []byte) (cipher.Block, error) {
					return &mockBLock{}, nil
				})
				monkey.Patch(cipher.NewGCM, func(_ cipher.Block) (cipher.AEAD, error) {
					return &mockAesgcm{}, errors.New("cipher.NewGCM gives error")
				})
			},
			encodedToken: "mockEncodedToken",
		},
		{
			description:   "ParseAuthToken: failed to decode the oAuth token because token is too short",
			expectedError: "token too short",
			setupPlugin: func() {
				monkey.Patch(aes.NewCipher, func(a []byte) (cipher.Block, error) {
					return &mockBLock{}, nil
				})
				monkey.Patch(cipher.NewGCM, func(_ cipher.Block) (cipher.AEAD, error) {
					return &mockAesgcm{}, nil
				})
			},
		},
		{
			description:   "ParseAuthToken: failed to decode the oAuth token because json.Unmarshal gives error",
			expectedError: "error because json.Unmarshal gives error",
			setupPlugin: func() {
				monkey.Patch(aes.NewCipher, func(a []byte) (cipher.Block, error) {
					return &mockBLock{}, nil
				})
				monkey.Patch(cipher.NewGCM, func(_ cipher.Block) (cipher.AEAD, error) {
					return &mockAesgcm{}, nil
				})
				monkey.Patch(json.Unmarshal, func(_ []byte, _ interface{}) error {
					return errors.New("error because json.Unmarshal gives error")
				})
			},
			encodedToken: "mockEncodedToken",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			p := Plugin{}
			testCase.setupPlugin()
			p.setConfiguration(
				&configuration{
					EncryptionSecret: "mockEncryptionSecret",
				})
			res, err := p.ParseAuthToken(testCase.encodedToken)
			if testCase.expectedError != "" {
				assert.EqualError(t, err, testCase.expectedError)
				assert.Nil(t, res)
			} else {
				assert.Nil(t, err)
			}
		})
	}
}
