export const openRunbotWithVersionMenuItem = {
    id: 'joorney_autoOpenRunbot_open_with_version',
    title: 'Open runbot with version %version%',
    active: true,
    favorite: true,
    order: 100,
};

export default {
    id: 'autoOpenRunbot',
    display_name: '[Runbot] Auto Open',
    icon: '<i class="fa-solid fa-fighter-jet"></i>',
    trigger: {
        load: true,
        navigate: true,
        context: true,
    },
    customization: {
        popup: false,
        option: false,
    },
    defaultSettings: {
        autoOpenRunbotEnabled: false,
        autoOpenRunbotLimitedOrigins: ['https://runbot.odoo.com'],
        autoOpenRunbotContextMenu: {
            [openRunbotWithVersionMenuItem.id]: openRunbotWithVersionMenuItem,
        },
    },
    limited: true,
};
