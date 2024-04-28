export default {
    id: 'autoOpenRunbot',
    display_name: 'Auto Open Runbot',
    icon: [
        '<!--<i class="fa-solid fa-door-open"></i>-->',
        '<!--<i class="fa-solid fa-dungeon"></i>-->',
        '<i class="fa-solid fa-fighter-jet"></i>',
    ],
    trigger: {
        load: true,
        navigate: true,
    },
    customization: {
        popup: false,
        option: false,
    },
    defaultSettings: {
        autoOpenRunbotEnabled: false,
        autoOpenRunbotLimitedOrigins: ['https://runbot.odoo.com'],
    },
    limited: true,
};
