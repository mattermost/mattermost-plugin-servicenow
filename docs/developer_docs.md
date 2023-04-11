# Mattermost ServiceNow Plugin

## Table of Contents
- [License](#license)
- [Overview](#overview)
- [Features](#features)
- [Basic Knowledge](#basic-knowledge)
- [Installation](#installation)
- [Setup](#setup)
- [Connecting to ServiceNow](#connecting-to-servicenow)
- [Development](#development)

## License

See the [LICENSE](./LICENSE) file for license rights and limitations.

## Overview

This plugin integrates ServiceNow with Mattermost by allowing users to subscribe to record changes in ServiceNow and manage them through Mattermost. For a stable production release, please download the latest version from the Plugin Marketplace and follow the instructions to [install](#installation) and [configure](#setup) the plugin.

## Features

This plugin contains the following features:
- Connecting/disconnecting to ServiceNow account using OAuth.
- Creating/editing subscriptions to get notifications for ServiceNow record changes using wizards.

    ![image](https://user-images.githubusercontent.com/77336594/201639757-02f6fa4c-1fb2-4af5-99cd-91ee035b778c.png)

- Ability to open the create/edit subscription modal through UI or slash commands.

    ![image](https://user-images.githubusercontent.com/77336594/201640162-7e5e971b-de16-498c-8ac0-91c5f1268a4e.png)

- Ability to create a record or bulk subscription.

    ![image](https://user-images.githubusercontent.com/77336594/201640297-048c80d2-a95c-4514-8545-b52902b7f995.png)

- A record subscription is for subscribing to changes in a specific record and a Bulk subscription allows subscribing to all records of a particular type.
- Supported record types for subscriptions - incident, problem, change_request.

    ![image](https://user-images.githubusercontent.com/77336594/201640472-4ed11987-8418-47e2-99af-fad06a380a99.png)

- Supported events:
  * State changed
  * Priority changed
  * Assigned to changed
  * Assignment group changed
  * New comment added
  * New record created (only for bulk subscriptions)

    ![image](https://user-images.githubusercontent.com/77336594/201640654-ea442c90-53ea-4008-9833-94af67b40a7b.png)

- Notifications will be sent in the form of a post created by the ServiceNow bot in the channel specified while creating the subscription.

    ![image](https://user-images.githubusercontent.com/77336594/201694614-50960fd4-20cb-4011-8b47-4721dec0a867.png)

- Ability to see the existing subscriptions in the Right-Hand Sidebar or slash command.
    * In Right-hand sidebar

        ![image](https://user-images.githubusercontent.com/100013900/208841484-aa7c2792-20d4-41f2-b6fa-81d88d4cc20a.png)

    * Using slash command

        ![image](https://user-images.githubusercontent.com/77336594/201642526-2d35acdf-cbfc-4223-8732-601dc5c75f84.png)

- Ability to delete the subscriptions from the Right-Hand Sidebar or slash command.
- Ability to filter subscriptions using the slash command to get a post containing filtered subscriptions.
- Ability to filter subscriptions in the Right-Hand Sidebar using the filter icon.

    ![image](https://user-images.githubusercontent.com/77336594/201643022-572c2e66-ac48-4d39-9c11-ba9b9e6212ae.png)

- Search and share a ServiceNow record in a specific channel.

    ![image](https://user-images.githubusercontent.com/77336594/201643252-5534cdbd-c124-4ea8-b367-99f5a0fae69b.png)

- Ability to open search and share record modal through UI or slash command.
- View comments on a ServiceNow record and add new comments.

    ![image](https://user-images.githubusercontent.com/77336594/201649748-5b0e7185-0dd4-4558-b472-fb423ed1144f.png)

- Supported record types for adding new comments - incident, problem, change_request, task, change_task and cert_follow_on_task.
- Update the state of a ServiceNow record.

    ![image](https://user-images.githubusercontent.com/77336594/201645430-873a71f9-2bdd-49bf-9064-c7ba6c43e62a.png)

- Ability to open the "Add and View comments" modal or "Update State" modal through buttons present in a notification post or a shared record post.
- Supported record types for sharing a record - incident, problem, change_request, kb_knowledge, task, change_task and cert_follow_on_task.
- Supported record types for updating a record state - incident, task, change_task and cert_follow_on_task.
- Ability to open the incident modal through UI or slash command and create an incident in ServiceNow.
- Ability to auto-subscribe to the newly created incident using a toggle switch present inside the incident modal.

    ![image](https://user-images.githubusercontent.com/100013900/209933247-ff39a3f8-7f77-47b2-a97b-0329d56ad031.png)

- Ability to open the incident modal from post menu actions and auto-fill the "Short description" and "Description" fields with the post data.

    ![image](https://user-images.githubusercontent.com/100013900/205903818-2b5b40ca-10a1-486c-bed1-c0c766bc0eff.png)

- Ability to open the request modal through UI or slash command and begin a catalog request in ServiceNow.

    ![image](https://user-images.githubusercontent.com/100013900/208844538-a74ded9c-435f-40c5-bab4-8e03e4bef984.png)

- Feature to open the "Incident" modal, "Request" modal, and "Share record" modal using a menu present in the RHS.

    ![image](https://user-images.githubusercontent.com/100013900/206096719-54994d12-e0c8-4673-976a-cd5cb54ee9a2.png)

## Basic Knowledge

- [What is ServiceNow?](https://www.servicenow.com/)
- [What are Update Sets?](https://docs.servicenow.com/bundle/sandiego-application-development/page/build/system-update-sets/concept/system-update-sets.html)
    - You can read more about update sets like "How to create them", "How to commit them", "How to back out an update set", "How to export them as XML", "How to import them" etc. The link above contains all the information about update sets.
    - [Merging Update Sets](https://docs.servicenow.com/bundle/sandiego-application-development/page/build/system-update-sets/task/t_MergeUpdateSets.html)    
- [ServiceNow REST API](https://docs.servicenow.com/bundle/sandiego-application-development/page/integrate/inbound-rest/concept/c_RESTAPI.html)
    - [REST API Explorer](https://docs.servicenow.com/bundle/sandiego-application-development/page/integrate/inbound-rest/concept/use-REST-API-Explorer.html)
- [ServiceNow server-side scripting](https://developer.servicenow.com/dev.do#!/learn/learning-plans/sandiego/new_to_servicenow/app_store_learnv2_scripting_sandiego_introduction_to_server_side_scripting)
    - [Glide Record](https://developer.servicenow.com/dev.do#!/learn/learning-plans/sandiego/new_to_servicenow/app_store_learnv2_scripting_sandiego_gliderecord)

## Installation

1. Go to the [releases page of this GitHub repository](https://github.com/mattermost/mattermost-plugin-servicenow/releases) and download the latest release for your Mattermost server.
2. Upload this file on the Mattermost **System Console > Plugins > Management** page to install the plugin. To learn more about how to upload a plugin, [see the documentation](https://docs.mattermost.com/administration/plugins.html#plugin-uploads).
3. Enable the plugin from **System Console > Plugins > ServiceNow Plugin**.

## Setup

- [ServiceNow Setup](./servicenow_setup.md)
- [Plugin Setup](./plugin_setup.md)

## Connecting to ServiceNow

There are two methods by which you can connect your Mattermost account to your ServiceNow account.

- **Using slash command**
    - Run the slash command `/servicenow connect` in any channel.
    - You will get an ephemeral message from the ServiceNow bot containing a link to connect your account.
    - Click on that link. If it asks for login, enter your ServiceNow credentials and click `Allow` to authorize and connect your account.

- **Using the button in the right-hand sidebar**
    - Open the right-hand sidebar by clicking on the ServiceNow icon present in the channel header section of all channels.
    - You will see a button saying "Connect your account".

        ![image](https://user-images.githubusercontent.com/77336594/186386427-6533a3fe-da58-4d14-a60c-f6c3bb8ea7f5.png)

    - Click on that button. If it asks for login, enter your ServiceNow credentials and click `Allow` to authorize and connect your account.

After connecting successfully, you will get a direct message from the ServiceNow bot containing a Welcome message and some useful information along with some instructions for the system admins.
**Note**: You will only get a direct message from the bot if your Mattermost server is configured to allow direct messages between any users on the server. If your server is configured to allow direct messages only between two users of the same team, then you will not get any direct message.
    
## Development

### Setup

Make sure you have the following components installed:  

- Go - v1.16 - [Getting Started](https://golang.org/doc/install)
    > **Note:** If you have installed Go to a custom location, make sure the `$GOROOT` variable is set properly. Refer [Installing to a custom location](https://golang.org/doc/install#install).

- Make

### Building the plugin

Run the following command in the plugin repo to prepare a compiled, distributable plugin zip:

```bash
make dist
```

After a successful build, a `.tar.gz` file in the `/dist` folder will be created which can be uploaded to Mattermost. To avoid having to manually install your plugin, deploy your plugin using one of the following options.

### Deploying with Local Mode

If your Mattermost server is running locally, you can enable [local mode](https://docs.mattermost.com/administration/mmctl-cli-tool.html#local-mode) to streamline deploying your plugin. Edit your server configuration as follows:

```
{
    "ServiceSettings": {
        ...
        "EnableLocalMode": true,
        "LocalModeSocketLocation": "/var/tmp/mattermost_local.socket"
    }
}
```

and then deploy your plugin:

```bash
make deploy
```

You may also customize the Unix socket path:

```bash
export MM_LOCALSOCKETPATH=/var/tmp/alternate_local.socket
make deploy
```

If developing a plugin with a web app, watch for changes and deploy those automatically:

```bash
export MM_SERVICESETTINGS_SITEURL=http://localhost:8065
export MM_ADMIN_TOKEN=j44acwd8obn78cdcx7koid4jkr
make watch
```

### Deploying with credentials

Alternatively, you can authenticate with the server's API with credentials:

```bash
export MM_SERVICESETTINGS_SITEURL=http://localhost:8065
export MM_ADMIN_USERNAME=admin
export MM_ADMIN_PASSWORD=password
make deploy
```

or with a [personal access token](https://docs.mattermost.com/developer/personal-access-tokens.html):

```bash
export MM_SERVICESETTINGS_SITEURL=http://localhost:8065
export MM_ADMIN_TOKEN=j44acwd8obn78cdcx7koid4jkr
make deploy
```

### Creating/modifying the update set

The update set was created by creating a new application called **ServiceNow for Mattermost Notifications** using the "Studio" system application in ServiceNow. To open the app in Studio, navigate to **All > System Applications > Studio** and select the application "ServiceNow for Mattermost Notifications". Below is an image of how the application looks in the Studio.

![image](https://user-images.githubusercontent.com/77336594/186447710-afdd66fc-95fc-4d06-b8de-af6a61a0df9d.png)

As you can see, the application consists of 2 tables, 4 business rules, 4 event registrations, 4 script actions and 2 script includes sections. All of these contain some code. You can explore and modify the code according to your needs.
Before doing any changes here, you should change the current application scope. Go to the ServiceNow home screen and hover on the globe icon present in the nav bar on the right side along with the search bar. Below is a screenshot of the icon:

![image](https://user-images.githubusercontent.com/77336594/186450580-2f59ce0a-966f-4c73-ab37-93148d9c9c9c.png)

As you can see in the screenshot, the application scope is "ServiceNow for Mattermost Notifications" but it is "Global" by default. So, change the application scope and you can also change the update set here if you want. You have to remember that whatever update set is selected here will contain the latest changes that you do in the application in Studio. If you don't change the update set, it will use the "Default" update set. After you have done all the required changes in the application in Studio, you can export the latest update set XML file from one of the two locations: **All > System Update Sets > Retrieved Update Sets** or **All > System Update Sets > Local Update Sets**. When you find the update set that you selected in the nav bar header before doing the changes, go to that update set and it will show all the changes you have done in the "Customer Updates" tab in the table at the bottom.

![image](https://user-images.githubusercontent.com/77336594/186453112-412f2f2c-1f8d-446f-acc9-202c2197c6c0.png)

Then, you can merge this update set and the update set that you uploaded so that you can have all the changes in one update set. After both the update sets are merged, you can export the latest update as an XML file.

---

Made with &#9829; by [Brightscout](https://www.brightscout.com)
