package plugin

import (
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
