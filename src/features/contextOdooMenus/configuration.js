// Paths are ir.ui.menu names (English), resolved at click time (api/odoo.js getMenu) and opened with the URL form
// matching the current Odoo (url_manager.js createActionMenuURL), so the same path works on every version.
// Ids are stable (not UUIDs) so a later release can recognise these entries.
const defaultMenuPaths = [
    ['default_settings', 'Settings/General Settings'],
    ['default_technical_actions', 'Technical/Actions/Actions'],
    ['default_technical_window_actions', 'Technical/Actions/Window Actions'],
    ['default_technical_server_actions', 'Technical/Actions/Server Actions'],
    ['default_technical_scheduled_actions', 'Technical/Automation/Scheduled Actions'],
    ['default_technical_views', 'Technical/User Interface/Views'],
    ['default_technical_models', 'Technical/Database Structure/Models'],
    ['default_users', 'Users & Companies/Users'],
];

const defaultContextMenu = Object.fromEntries(
    defaultMenuPaths.map(([id, path], order) => [id, { id, path, order, active: true, favorite: false }])
);

export default {
    id: 'contextOdooMenus',
    display_name: 'Context OdooMenus',
    icon: 'near_me',
    category: 'productivity',
    tags: ['navigation'],
    video: '',
    trigger: {
        background: false,
        load: false,
        navigate: false,
        context: true,
    },
    customization: {
        option: true,
        popup: false,
    },
    defaultSettings: {
        contextOdooMenusEnabled: false,
        contextOdooMenusWhitelistMode: false,
        contextOdooMenusContextMenu: defaultContextMenu,
    },
    supported_version: ['16+'],
};
