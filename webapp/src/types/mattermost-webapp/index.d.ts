import React from 'react';

export interface PluginRegistry {
    registerReducer(reducer)
    registerPostTypeComponent(typeName: string, component: React.ElementType)
    registerRootComponent(component: ReactDOM)
    registerRightHandSidebarComponent(component: () => JSX.Element, title: string | JSX.Element)
    registerChannelHeaderButtonAction(icon: JSX.Element, action: () => void, dropdownText: string | null, tooltipText: string | null)
    registerAdminConsoleCustomSetting(key: string, component: React.ElementType)
    registerSlashCommandWillBePostedHook(hook: (message: string, args: {channel_id: string, team_id: string, root_id: string}) => Promise<({message?: string, args?: {channel_id: string, team_id: string, root_id: string}})>)

    // Add more if needed from https://developers.mattermost.com/extend/plugins/webapp/reference
}
