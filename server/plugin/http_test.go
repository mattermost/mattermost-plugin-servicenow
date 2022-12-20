package plugin

import (
	"bytes"
	"errors"
	"io"
	"net/http"
	"net/url"
	"reflect"
	"testing"

	"bou.ke/monkey"
	"github.com/mattermost/mattermost-server/v5/plugin/plugintest/mock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCallJSON(t *testing.T) {
	defer monkey.UnpatchAll()

	for _, testCase := range []struct {
		description        string
		callMethodResponse []byte
		expectedStatusCode int
	}{
		{
			description:        "Request is sent successfully",
			callMethodResponse: []byte("mockResponse"),
			expectedStatusCode: http.StatusOK,
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			var c *client
			monkey.PatchInstanceMethod(reflect.TypeOf(c), "Call", func(_ *client, _, _, _ string, _ io.Reader, _ interface{}, _ url.Values) ([]byte, int, error) {
				return testCase.callMethodResponse, http.StatusOK, nil
			})

			res, statusCode, err := c.CallJSON(string(mock.AnythingOfType("string")), string(mock.AnythingOfType("string")), mock.AnythingOfType("io.Reader"), mock.AnythingOfType("interface{}"), nil)

			assert.Equal(t, testCase.expectedStatusCode, statusCode)
			require.EqualValues(t, res, testCase.callMethodResponse)
			require.Nil(t, err)
		})
	}
}

func TestCall(t *testing.T) {
	defer monkey.UnpatchAll()
	p := Plugin{}
	c := new(client)
	mockClient := &client{
		plugin: &p,
	}

	for _, testCase := range []struct {
		description          string
		setupClient          func(c *client)
		expectedStatusCode   int
		expectedErrorMessage string
	}{
		{
			description: "Call: Do method returns an error while making the request",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c.httpClient), "Do", func(*http.Client, *http.Request) (*http.Response, error) {
					return &http.Response{}, errors.New("error while making the request")
				})
			},
			expectedErrorMessage: ErrorConnectionRefused.Error(),
			expectedStatusCode:   http.StatusInternalServerError,
		},
		{
			description: "Call: response body is nil",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c.httpClient), "Do", func(*http.Client, *http.Request) (*http.Response, error) {
					return &http.Response{
						StatusCode: http.StatusNoContent,
					}, nil
				})
			},
			expectedStatusCode: http.StatusNoContent,
		},
		{
			description: "Call: response body with status StatusNoContent",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c.httpClient), "Do", func(*http.Client, *http.Request) (*http.Response, error) {
					return &http.Response{
						StatusCode: http.StatusNoContent,
						Body:       io.NopCloser(bytes.NewBufferString("mockBody")),
					}, nil
				})
			},
			expectedStatusCode: http.StatusNoContent,
		},
		{
			description: "Call: response body with status StatusOK",
			setupClient: func(c *client) {
				monkey.PatchInstanceMethod(reflect.TypeOf(c.httpClient), "Do", func(*http.Client, *http.Request) (*http.Response, error) {
					return &http.Response{
						StatusCode: http.StatusOK,
						Body:       io.NopCloser(bytes.NewBufferString("mockBody")),
					}, nil
				})
			},
			expectedStatusCode: http.StatusOK,
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			testCase.setupClient(c)
			_, statusCode, err := mockClient.Call("mockMethod", "mockPath", "mockContentType", nil, nil, url.Values{})
			if testCase.expectedErrorMessage != "" {
				assert.EqualError(t, err, testCase.expectedErrorMessage)
			} else {
				assert.NoError(t, err)
			}

			assert.Equal(t, testCase.expectedStatusCode, statusCode)
		})
	}
}
