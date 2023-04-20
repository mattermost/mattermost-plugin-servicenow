# Setting up your ServiceNow instance

We need to do some changes in the ServiceNow instance so that we can create subscriptions to record changes and send the notifications to Mattermost. This is done by using an update set. You can read more about update sets [here](https://docs.servicenow.com/bundle/sandiego-application-development/page/build/system-update-sets/concept/system-update-sets.html). You can download the update set needed for these changes from the plugin's configuration page. You can read more about that in the Plugin setup [doc](./plugin_setup.md).

## 1. Get your ServiceNow developer instance (only for developers)
  - Log in to your [ServiceNow](https://developer.servicenow.com) developer account.
  - Then click on Request Instance in the top right corner. Basically, ServiceNow itself provides developer instances to anyone who wishes to develop on ServiceNow.
  - Once the instance is created, open the menu from the top right corner, navigate to `Manage Instance Password`, and log in to your dev instance in a new tab.

## 2. Creating an OAuth app in ServiceNow

- Go to your ServiceNow instance and navigate to **All > System OAuth > Application Registry.**
- Click on the New button on the top right corner and then go to "Create an OAuth API endpoint for external clients".
- Enter the name for your app and set the redirect URL to:
    ```
    https://<your-mattermost-url>/plugins/mattermost-plugin-servicenow/api/v1/oauth2/complete
    ````
- The client secret will be generated automatically.
- You will need the values `ClientID` and `ClientSecret` while configuring the plugin.

## 3. Upload the update set in ServiceNow

- Download the update set XML file from the plugin's configuration.
- Go to ServiceNow instance and navigate to **All > System Update Sets > Retrieved Update Sets**.
- Click on the "Import Update Set from XML" link present at the bottom of the page.
- Choose the downloaded XML file from the plugin's configuration and upload that file.
- You will be back on the "Retrieved Update Sets" page and you'll be able to see an update set named "ServiceNow for Mattermost Notifications"
- Click on that update set and then click on "Preview Update Set".
- After the preview is complete, you'll be able to see the option "Commit Update Set", so click on that button.
- You'll see a warning dialog saying "Confirm Data Loss". Click on "Proceed with Commit".

    ![Image Pasted at 2022-7-7 23-14](https://user-images.githubusercontent.com/77336594/186408425-8bb71211-deaf-4c61-b906-64dc4f51acde.png)

- After that, your update set is uploaded and committed.

## 4. Setting up user permissions in ServiceNow

After the update is uploaded, it creates a new role called `x_830655_mm_std.user`. For any user to manage/add the Mattermost subscriptions, he must have this role in ServiceNow. So, within ServiceNow user roles, you have to add the `x_830655_mm_std.user` role to all the users who should have the ability to add or manage subscriptions through Mattermost. You can follow the below steps to do that.

- Go to ServiceNow instance and navigate to **All > User Administration > Users**.
- On the Users page, open any user's profile. 
- Click on the "Roles" tab in the table present below and click on "Edit".
- Then, search for the `x_830655_mm_std.user` role and add that role to the user's Roles list and click on "Save".

    ![image](https://user-images.githubusercontent.com/77336594/186422364-0d5507ad-8392-4cd8-b1e6-93e9c7e44d90.png)

- After the previous step, that user will have permission to add or manage subscriptions.

## 5. Update the API secret on the change of ServiceNow Webhook Secret

- Go to the ServiceNow instance and navigate to **All > x_830655_mm_std_servicenow_for_mattermost_notifications_auth.list**.
- On the page, open the row consisting of your Mattermost Server URL.
- Copy the Webhook Secret from the ServiceNow plugin configuration page on Mattermost from **System Console > Plugins > ServiceNow Plugin**.
- Update the API Secret in the ServiceNow instance with the copied Webhook Secret from Mattermost and click on Update. 
