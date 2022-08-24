# Configuration

- Go to the ServiceNow plugin configuration page on Mattermost as **System Console > Plugins > ServiceNow Plugin**.
- On the ServiceNow plugin configuration page, you need to configure the following:
    - **ServiceNow Server Base URL**: Enter the base URL of your ServiceNow instance.
    - **ServiceNow Webhook Secret**: Regenerate a new webhook secret. This webhook secret is used to authenticate HTTP requests from ServiceNow to Mattermost.
    - **ServiceNow OAuth Client ID**: The clientID of your registered OAuth app in ServiceNow.
    - **ServiceNow OAuth Client Secret**: The client secret of your registered OAuth app in ServiceNow.
    - **Encryption Secret**: Regenerate a new encryption secret. This encryption secret will be used to encrypt and decrypt the OAuth token.
    - **Download ServiceNow Update Set**: This button is for downloading the update set XML file that needs to be uploaded to ServiceNow.
