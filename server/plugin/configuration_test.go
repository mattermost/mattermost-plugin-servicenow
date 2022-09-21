package plugin

import (
	"testing"

	"github.com/Brightscout/mattermost-plugin-servicenow/server/constants"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestIsValid(t *testing.T) {
	for _, testCase := range []struct {
		description string
		config      *configuration
		errMsg      string
	}{
		{
			description: "valid configuration",
			config: &configuration{
				ServiceNowBaseURL:           "mockServiceNowBaseURL",
				ServiceNowOAuthClientID:     "mockServiceNowOAuthClientID",
				ServiceNowOAuthClientSecret: "mockServiceNowOAuthClientSecret",
				EncryptionSecret:            "mockEncryptionSecret",
				WebhookSecret:               "mockWebhookSecret",
			},
		},
		{
			description: "invalid configuration: ServiceNowBaseURL empty",
			config: &configuration{
				ServiceNowBaseURL:           "",
				ServiceNowOAuthClientID:     "mockServiceNowOAuthClientID",
				ServiceNowOAuthClientSecret: "mockServiceNowOAuthClientSecret",
				EncryptionSecret:            "mockEncryptionSecret",
				WebhookSecret:               "mockWebhookSecret",
			},
			errMsg: constants.EmptyServiceNowURLErrorMessage,
		},
		{
			description: "invalid configuration: ServiceNowOAuthClientID empty",
			config: &configuration{
				ServiceNowBaseURL:           "mockServiceNowBaseURL",
				ServiceNowOAuthClientID:     "",
				ServiceNowOAuthClientSecret: "mockServiceNowOAuthClientSecret",
				EncryptionSecret:            "mockEncryptionSecret",
				WebhookSecret:               "mockWebhookSecret",
			},
			errMsg: constants.EmptyServiceNowOAuthClientIDErrorMessage,
		},
		{
			description: "invalid configuration: ServiceNowOAuthClientSecret empty",
			config: &configuration{
				ServiceNowBaseURL:           "mockServiceNowBaseURL",
				ServiceNowOAuthClientID:     "mockServiceNowOAuthClientID",
				ServiceNowOAuthClientSecret: "",
				EncryptionSecret:            "mockEncryptionSecret",
				WebhookSecret:               "mockWebhookSecret",
			},
			errMsg: constants.EmptyServiceNowOAuthClientSecretErrorMessage,
		},
		{
			description: "invalid configuration: EncryptionSecret empty",
			config: &configuration{
				ServiceNowBaseURL:           "mockServiceNowBaseURL",
				ServiceNowOAuthClientID:     "mockServiceNowOAuthClientID",
				ServiceNowOAuthClientSecret: "mockServiceNowOAuthClientSecret",
				EncryptionSecret:            "",
				WebhookSecret:               "mockWebhookSecret",
			},
			errMsg: constants.EmptyEncryptionSecretErrorMessage,
		},
		{
			description: "invalid configuration: WebhookSecret empty",
			config: &configuration{
				ServiceNowBaseURL:           "mockServiceNowBaseURL",
				ServiceNowOAuthClientID:     "mockServiceNowOAuthClientID",
				ServiceNowOAuthClientSecret: "mockServiceNowOAuthClientSecret",
				EncryptionSecret:            "mockEncryptionSecret",
				WebhookSecret:               "",
			},
			errMsg: constants.EmptyWebhookSecretErrorMessage,
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			err := testCase.config.IsValid()
			if testCase.errMsg != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), testCase.errMsg)
			} else {
				require.NoError(t, err)
			}
		})
	}
}
