package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"

	"github.com/pkg/errors"
)

type ErrorResponse struct {
	Error Error `json:"error"`
}

type Error struct {
	Detail  string `json:"detail"`
	Message string `json:"message"`
}

func (c *client) CallJSON(method, path string, in, out interface{}, params url.Values) (responseData []byte, err error) {
	contentType := "application/json"
	buf := &bytes.Buffer{}
	if err = json.NewEncoder(buf).Encode(in); err != nil {
		return nil, err
	}
	return c.call(method, path, contentType, buf, out, params)
}

func (c *client) call(method, path, contentType string, inBody io.Reader, out interface{}, params url.Values) (responseData []byte, err error) {
	errContext := fmt.Sprintf("serviceNow virtual agent: Call failed: method:%s, path:%s", method, path)
	pathURL, err := url.Parse(path)
	if err != nil {
		return nil, errors.WithMessage(err, errContext)
	}

	if pathURL.Scheme == "" || pathURL.Host == "" {
		var baseURL *url.URL
		baseURL, err = url.Parse(c.plugin.getConfiguration().ServiceNowURL)
		if err != nil {
			return nil, errors.WithMessage(err, errContext)
		}

		if path[0] != '/' {
			path = "/" + path
		}
		path = baseURL.String() + path
	}

	req, err := http.NewRequest(method, path, inBody)
	if err != nil {
		return nil, err
	}
	if params != nil {
		req.URL.RawQuery = params.Encode()
	}
	if contentType != "" {
		req.Header.Add("Content-Type", contentType)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}

	if resp.Body == nil {
		return nil, nil
	}
	defer resp.Body.Close()

	responseData, err = ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	switch resp.StatusCode {
	case http.StatusOK, http.StatusCreated:
		if out != nil {
			if err = json.Unmarshal(responseData, out); err != nil {
				return responseData, err
			}
		}
		return responseData, nil

	case http.StatusNoContent:
		return nil, nil
	}

	errResp := ErrorResponse{}
	if err = json.Unmarshal(responseData, &errResp); err != nil {
		return responseData, errors.WithMessagef(err, "status: %s", resp.Status)
	}
	return responseData, fmt.Errorf("errorMessage %s. errorDetail: %s", errResp.Error.Message, errResp.Error.Detail)
}
