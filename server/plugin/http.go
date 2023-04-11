package plugin

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"github.com/pkg/errors"

	"github.com/mattermost/mattermost-plugin-servicenow/server/constants"
)

type ErrorResponse struct {
	Error  Error  `json:"error"`
	Status string `json:"status"`
}

type Error struct {
	Detail  string `json:"detail"`
	Message string `json:"message"`
}

var ErrorContentTypeNotJSON = fmt.Errorf("response content type is not JSON")

func (c *client) CallJSON(method, path string, in, out interface{}, params url.Values) (responseData []byte, statusCode int, err error) {
	contentType := "application/json"
	buf := &bytes.Buffer{}
	if err = json.NewEncoder(buf).Encode(in); err != nil {
		return nil, http.StatusInternalServerError, err
	}
	return c.Call(method, path, contentType, buf, out, params)
}

func (c *client) Call(method, path, contentType string, inBody io.Reader, out interface{}, params url.Values) (responseData []byte, statusCode int, err error) {
	errContext := fmt.Sprintf("serviceNow: Call failed: method:%s, path:%s", method, path)
	pathURL, err := url.Parse(path)
	if err != nil {
		return nil, http.StatusInternalServerError, errors.WithMessage(err, errContext)
	}

	if pathURL.Scheme == "" || pathURL.Host == "" {
		var baseURL *url.URL
		baseURL, err = url.Parse(c.plugin.getConfiguration().ServiceNowBaseURL)
		if err != nil {
			return nil, http.StatusInternalServerError, errors.WithMessage(err, errContext)
		}

		if path[0] != '/' {
			path = "/" + path
		}
		path = baseURL.String() + path
	}

	req, err := http.NewRequest(method, path, inBody)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}
	if params != nil {
		req.URL.RawQuery = params.Encode()
	}
	if contentType != "" {
		req.Header.Add("Content-Type", contentType)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		c.plugin.API.LogError(constants.ErrorConnectionRefused, "Error", err.Error())
		if strings.Contains(err.Error(), "invalid character '<'") {
			return nil, http.StatusInternalServerError, ErrorContentTypeNotJSON
		}
		return nil, http.StatusInternalServerError, fmt.Errorf("%s Error: %s", constants.ErrorConnectionRefused, err)
	}

	if resp.Body == nil {
		return nil, resp.StatusCode, nil
	}
	defer resp.Body.Close()

	responseData, err = io.ReadAll(resp.Body)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}

	switch resp.StatusCode {
	case http.StatusOK, http.StatusCreated:
		if out != nil {
			if err = json.Unmarshal(responseData, out); err != nil {
				return responseData, http.StatusInternalServerError, err
			}
		}
		return responseData, resp.StatusCode, nil

	case http.StatusNoContent:
		return nil, resp.StatusCode, nil
	}

	errResp := ErrorResponse{}
	if err = json.Unmarshal(responseData, &errResp); err != nil {
		return responseData, resp.StatusCode, errors.WithMessagef(err, "status: %s", resp.Status)
	}
	return responseData, resp.StatusCode, fmt.Errorf("errorMessage %s. errorDetail: %s", errResp.Error.Message, errResp.Error.Detail)
}
