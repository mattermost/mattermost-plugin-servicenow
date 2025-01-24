// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

interface PluginRegistry {
    registerReducer(reducer)
    registerPostTypeComponent(typeName: string, component: React.ElementType)
    registerRootComponent(component: ReactDOM)
    registerRightHandSidebarComponent(component: () => JSX.Element, title: string | JSX.Element)
    registerChannelHeaderButtonAction(icon: JSX.Element, action: () => void, dropdownText: string | null, tooltipText: string | null)
    registerAdminConsoleCustomSetting(key: string, component: React.ElementType)
    registerSlashCommandWillBePostedHook(hook: (message: string, args: MmHookArgTypes) => Promise<({message?: string, args?: MmHookArgTypes})>)
    registerWebSocketEventHandler(event: string, handler: (msg: any) => void)
    registerAppBarComponent(iconUrl: string, action: () => void, tooltipText: string)
    registerPostDropdownMenuComponent(component: React.ReactNode)

    // Add more if needed from https://developers.mattermost.com/extend/plugins/webapp/reference
}
