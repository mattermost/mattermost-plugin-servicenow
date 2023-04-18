# Include custom targets and environment variables here
default: all

# If there's no MM_RUDDER_PLUGINS_PROD, add DEV data
RUDDER_WRITE_KEY = 1d5bMvdrfWClLxgK1FvV3s4U1tg
ifdef MM_RUDDER_PLUGINS_PROD
	RUDDER_WRITE_KEY = $(MM_RUDDER_PLUGINS_PROD)
endif

GO_BUILD_FLAGS += -ldflags '-X "github.com/mattermost/mattermost-plugin-api/experimental/telemetry.rudderWriteKey=$(RUDDER_WRITE_KEY)"'

GO_TEST_FLAGS = -race -gcflags=-l

.PHONY: store-mocks
store-mocks: ## Creates mock files.
	$(GO) install github.com/vektra/mockery/v2/...@v2.11.0
	$(GOBIN)/mockery --dir server/plugin --name "Store" --output server/mocks --filename mock_store.go --note 'Regenerate this file using `make store-mocks`.'

.PHONY: client-mocks
client-mocks: ## Creates mock files.
	$(GO) install github.com/vektra/mockery/v2/...@v2.11.0
	$(GOBIN)/mockery --dir server/plugin --name "Client" --output server/mocks --filename mock_client.go --note 'Regenerate this file using `make client-mocks`.'
