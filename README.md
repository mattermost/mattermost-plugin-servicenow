# Mattermost ServiceNow Plugin
## Table of Contents
- [License](#license)
- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Setup](#setup)
- [Connecting to ServiceNow](#connecting-to-servicenow)

## License

See the [LICENSE](./LICENSE) file for license rights and limitations.

## Overview

This plugin integrates ServiceNow with Mattermost by allowing users to subscribe to record changes in ServiceNow and manage them through Mattermost. For a stable production release, please download the latest version from the Plugin Marketplace and follow the instructions to [install](#installation) and [configure](#setup) the plugin. If you are a developer who wants to work on this plugin, please switch to the [Developer docs](./docs/developer_docs.md).

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

## Installation

1. Go to the [releases page of this GitHub repository](https://github.com/mattermost/mattermost-plugin-servicenow/releases) and download the latest release for your Mattermost server.
2. Upload this file on the Mattermost **System Console > Plugins > Management** page to install the plugin. To learn more about how to upload a plugin, [see the documentation](https://docs.mattermost.com/administration/plugins.html#plugin-uploads).
3. Enable the plugin from **System Console > Plugins > ServiceNow Plugin**.

## Setup

- [ServiceNow Setup](./docs/servicenow_setup.md)
- [Plugin Setup](./docs/plugin_setup.md)

## Connecting to ServiceNow

There are two methods by which you can connect your Mattermost account to your ServiceNow account.

- **Using slash command**
    - Run the slash command `/servicenow connect` in any channel.
    - You will get an ephemeral message from the ServiceNow bot containing a link to connect your account.
    - Click on that link. If it asks for login, enter your ServiceNow credentials and click `Allow` to authorize and connect your account.

- **Using the button in the right-hand sidebar**
    - Open the right-hand sidebar by clicking on the ServiceNow icon present in the channel header section of all channels.
    - You will see a button saying "Connect your account"
        ![image](https://user-images.githubusercontent.com/77336594/186386427-6533a3fe-da58-4d14-a60c-f6c3bb8ea7f5.png)
    - Click on that button. If it asks for login, enter your ServiceNow credentials and click `Allow` to authorize and connect your account.

After connecting successfully, you will get a direct message from the ServiceNow bot containing a Welcome message and some useful information along with some instructions for the system admins.
**Note**: You will only get a direct message from the bot if your Mattermost server is configured to allow direct messages between any users on the server. If your server is configured to allow direct messages only between two users of the same team, then you will not get any direct message.

---

Made with &#9829; by [Brightscout](https://www.brightscout.com)
