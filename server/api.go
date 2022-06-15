package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"path/filepath"
	"runtime/debug"

	"github.com/gorilla/mux"
	"github.com/mattermost/mattermost-server/v5/model"
)

// InitAPI initializes the REST API
func (p *Plugin) InitAPI() *mux.Router {
	r := mux.NewRouter()
	r.Use(p.withRecovery)

	p.handleStaticFiles(r)
	s := r.PathPrefix("/api/v1").Subrouter()

	// API for POC. TODO: Remove this endpoint later
	s.HandleFunc("/notification", p.handleNotification).Methods(http.MethodPost)

	// 404 handler
	r.Handle("{anything:.*}", http.NotFoundHandler())
	return r
}

func (p *Plugin) handleNotification(w http.ResponseWriter, r *http.Request) {
	v := make(map[string]string)
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&v); err != nil {
		p.API.LogError("Error in decoding body", "Error", err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	p.API.LogInfo(fmt.Sprintf("%+v", v))
	returnStatusOK(w, v)
}

func returnStatusOK(w http.ResponseWriter, m map[string]string) {
	w.Header().Set("Content-Type", "application/json")
	m[model.STATUS] = model.STATUS_OK
	_, _ = w.Write([]byte(model.MapToJson(m)))
}

// handleStaticFiles handles the static files under the assets directory.
func (p *Plugin) handleStaticFiles(r *mux.Router) {
	bundlePath, err := p.API.GetBundlePath()
	if err != nil {
		p.API.LogWarn("Failed to get bundle path.", "Error", err.Error())
		return
	}

	// This will serve static files from the 'assets' directory under '/static/<filename>'
	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir(filepath.Join(bundlePath, "assets")))))
}

// withRecovery allows recovery from panics
func (p *Plugin) withRecovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if x := recover(); x != nil {
				p.API.LogError("Recovered from a panic",
					"url", r.URL.String(),
					"error", x,
					"stack", string(debug.Stack()))
			}
		}()

		next.ServeHTTP(w, r)
	})
}
