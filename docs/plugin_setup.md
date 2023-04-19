# Configuration

- Go to the ServiceNow plugin configuration page on Mattermost as **System Console > Plugins > ServiceNow Plugin**.
- On the ServiceNow plugin configuration page, you need to configure the following:
    - **ServiceNow Server Base URL**: Enter the base URL of your ServiceNow instance.
    - **ServiceNow Webhook Secret**: Regenerates the secret for ServiceNow Plugin. Regenerating this key will stop subscriptions notifications. Refer to the documentation [here](./servicenow_setup.md) to update the instance and start receiving notifications.
    - **ServiceNow OAuth Client ID**: The clientID of your registered OAuth app in ServiceNow.
    - **ServiceNow OAuth Client Secret**: The client secret of your registered OAuth app in ServiceNow.
    - **Encryption Secret**: Regenerate a new encryption secret. This encryption secret will be used to encrypt and decrypt the OAuth token.
    - **Download ServiceNow Update Set**: This button is for downloading the update set XML file that needs to be uploaded to ServiceNow.

    ![image](https://user-images.githubusercontent.com/77336594/201635962-441c0add-1300-4168-973c-ac36d5df8c8a.png)
