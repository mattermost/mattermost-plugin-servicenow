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

This plugin integrates ServiceNow with Mattermost by allowing users to subscribe to record changes in ServiceNow and manage them through Mattermost. For a stable production release, please download the latest version from the Plugin Marketplace and follow the instructions to [install](#installation) and [configure](#setup) the plugin. If you are a developer who wants to work on this plugin, see the [Developer docs](./docs/developer_docs.md).

## Features

This plugin contains the following features:
- Connecting/disconnecting to ServiceNow account using OAuth.
- Creating/editing subscriptions to get notifications for ServiceNow record changes using wizards.
- Ability to open the create/edit subscription modal through UI or by using slash commands.
- Subscriptions to only specific records are supported.
- Supported record types - incident, problem, change_request.
- Supported events
  * State changed
  * Priority changed
  * Assigned to changed
  * Assignment group changed
  * New comment added
- Notifications will be sent in the form of a post created by the ServiceNow bot in the channel specified while creating the subscription.
- Ability to see the existing subscriptions in the Right Hand Sidebar or by using a slash command.
- Ability to delete the subscriptions from the Right Hand Sidebar or by using a slash command.

## Installation

1. Go to the [releases page of this GitHub repository](https://github.com/Brightscout/mattermost-plugin-servicenow/releases) and download the latest release for your Mattermost server.
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
