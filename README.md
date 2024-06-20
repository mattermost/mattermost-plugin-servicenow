# Mattermost ServiceNow Plugin

This plugin integrates ServiceNow with Mattermost by allowing users to subscribe to record changes in ServiceNow and manage them through Mattermost. For a stable production release, please download the latest version from the Plugin Marketplace and follow the instructions install and set up the plugin. If you are a developer who wants to work on this plugin, please see the [Developer docs](./docs/developer_docs.md).

See the [Mattermost Product Documentation](https://docs.mattermost.com/integrate/servicenow-interoperability.html) for details on installing, configuring, enabling, and using this Mattermost integration.

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

        ![image](https://user-images.githubusercontent.com/77336594/201642077-6098b4c6-111f-4364-a75d-b6b43cbdfe12.png)

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

## How to Release

To trigger a release, follow these steps:

1. **For Patch Release:** Run the following command:
    ```
    make patch
    ```
   This will release a patch change.

2. **For Minor Release:** Run the following command:
    ```
    make minor
    ```
   This will release a minor change.

3. **For Major Release:** Run the following command:
    ```
    make major
    ```
   This will release a major change.

4. **For Patch Release Candidate (RC):** Run the following command:
    ```
    make patch-rc
    ```
   This will release a patch release candidate.

5. **For Minor Release Candidate (RC):** Run the following command:
    ```
    make minor-rc
    ```
   This will release a minor release candidate.

6. **For Major Release Candidate (RC):** Run the following command:
    ```
    make major-rc
    ```
   This will release a major release candidate.

## License

See the [LICENSE](./LICENSE) file for license rights and limitations.

---

Made with &#9829; by [Brightscout](https://www.brightscout.com)
