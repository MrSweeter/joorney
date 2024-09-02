export default {
    id: 'contextOdooMenus',
    display_name: 'Context OdooMenus',
    icon: '<i class="fa-solid fa-location-arrow"></i>',
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
        contextOdooMenusContextMenu: {},
    },
    supported_version: ['15+'],
};
