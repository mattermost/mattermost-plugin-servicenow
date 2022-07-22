package main

import (
	"context"
	"fmt"
	"strings"

	"github.com/Brightscout/mattermost-plugin-servicenow/server/constants"
	"github.com/mattermost/mattermost-server/v5/model"
	"github.com/pkg/errors"
	"golang.org/x/oauth2"
)

type User struct {
	MattermostUserID string
	OAuth2Token      string
}

func (p *Plugin) InitOAuth2(mattermostUserID string) (string, error) {
	if _, err := p.GetUser(mattermostUserID); err == nil {
		return "", fmt.Errorf("user is already connected to ServiceNow")
	}

	conf := p.NewOAuth2Config()
	state := fmt.Sprintf("%v_%v", model.NewId()[0:15], mattermostUserID)
	if err := p.store.StoreOAuth2State(state); err != nil {
		return "", err
	}

	return conf.AuthCodeURL(state, oauth2.AccessTypeOffline), nil
}

func (p *Plugin) CompleteOAuth2(authedUserID, code, state string) error {
	if authedUserID == "" || code == "" || state == "" {
		return errors.New("missing user, code or state")
	}

	oconf := p.NewOAuth2Config()

	if err := p.store.VerifyOAuth2State(state); err != nil {
		return errors.WithMessage(err, "missing stored state")
	}

	mattermostUserID := strings.Split(state, "_")[1]
	if mattermostUserID != authedUserID {
		return errors.New("not authorized, user ID mismatch")
	}

	user, userErr := p.API.GetUser(mattermostUserID)
	if userErr != nil {
		return errors.Wrap(userErr, fmt.Sprintf("unable to get user for userID: %s", mattermostUserID))
	}

	ctx := context.Background()
	token, err := oconf.Exchange(ctx, code)
	if err != nil {
		return err
	}

	encryptedToken, err := p.NewEncodedAuthToken(token)
	if err != nil {
		return err
	}

	u := &User{
		MattermostUserID: mattermostUserID,
		OAuth2Token:      encryptedToken,
	}

	if err = p.store.StoreUser(u); err != nil {
		return err
	}

	client := p.NewClient(context.Background(), token)
	if err = client.ActivateSubscriptions(); err != nil {
		return err
	}

	if _, err = p.DM(mattermostUserID, fmt.Sprintf("%s%s", constants.ConnectSuccessMessage, strings.ReplaceAll(commandHelp, "|", "`")), user.Username); err != nil {
		return err
	}

	return nil
}

func (p *Plugin) GetUser(mattermostUserID string) (*User, error) {
	storedUser, err := p.store.LoadUser(mattermostUserID)
	if err != nil {
		return nil, err
	}

	return storedUser, nil
}

func (p *Plugin) DisconnectUser(mattermostUserID string) error {
	if err := p.store.DeleteUser(mattermostUserID); err != nil {
		return err
	}

	return nil
}
