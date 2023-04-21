# Include custom targets and environment variables here
default: all

GO_TEST_FLAGS = -race -gcflags=-l

.PHONY: store-mocks
store-mocks: ## Creates mock files.
	$(GO) install github.com/vektra/mockery/v2/...@v2.11.0
	$(GOBIN)/mockery --dir server/plugin --name "Store" --output server/mocks --filename mock_store.go --note 'Regenerate this file using `make store-mocks`.'

.PHONY: client-mocks
client-mocks: ## Creates mock files.
	$(GO) install github.com/vektra/mockery/v2/...@v2.11.0
	$(GOBIN)/mockery --dir server/plugin --name "Client" --output server/mocks --filename mock_client.go --note 'Regenerate this file using `make client-mocks`.'
