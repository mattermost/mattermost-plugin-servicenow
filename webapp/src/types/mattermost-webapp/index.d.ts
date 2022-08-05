import React from 'react';

export interface PluginRegistry {
    registerPostTypeComponent(typeName: string, component: React.ElementType)
    registerRootComponent(component: ReactDOM)
    registerRightHandSidebarComponent(component: () => JSX.Element, title: string | JSX.Element)
    registerChannelHeaderButtonAction(icon: JSX.Element, action: () => void, dropdownText: string | null, tooltipText: string | null)
    registerAdminConsoleCustomSetting(key: string, component: React.ElementType)

    // Add more if needed from https://developers.mattermost.com/extend/plugins/webapp/reference
}
