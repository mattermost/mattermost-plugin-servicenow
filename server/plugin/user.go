package plugin

import (
	"context"
	"fmt"
	"strings"

	"github.com/Brightscout/mattermost-plugin-servicenow/server/constants"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/serializer"
	"github.com/mattermost/mattermost-server/v5/model"
	"github.com/pkg/errors"
	"golang.org/x/oauth2"
)

func (p *Plugin) InitOAuth2(mattermostUserID string) (string, error) {
	if _, err := p.GetUser(mattermostUserID); err == nil {
		return "", fmt.Errorf(constants.ErrorUserAlreadyConnected)
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
		return errors.New(constants.ErrorMissingUserCodeState)
	}

	oconf := p.NewOAuth2Config()

	if err := p.store.VerifyOAuth2State(state); err != nil {
		return errors.WithMessage(err, "missing stored state")
	}

	mattermostUserID := strings.Split(state, "_")[1]
	if mattermostUserID != authedUserID {
		return errors.New(constants.ErrorUserIDMismatchInOAuth)
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

	client := p.NewClient(ctx, token)
	serviceNowUser, _, err := client.GetMe(user.Email)
	if err != nil {
		return err
	}

	u := &serializer.User{
		MattermostUserID: mattermostUserID,
		Username:         user.Username,
		OAuth2Token:      encryptedToken,
		ServiceNowUser:   serviceNowUser,
	}

	if err = p.store.StoreUser(u); err != nil {
		return err
	}

	// We are not handling the error here because if there is any error in creating the DM, it should not stop this function and just log the error
	// and the logging is already being done inside the DM function
	_, _ = p.DM(mattermostUserID, p.getHelpMessage(constants.ConnectSuccessMessage, strings.Contains(user.Roles, model.SYSTEM_ADMIN_ROLE_ID)), user.Username)
	return nil
}

func (p *Plugin) GetUser(mattermostUserID string) (*serializer.User, error) {
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
