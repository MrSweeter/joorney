export default {
    id: 'autoOpenRunbot',
    display_name: 'Auto Open Runbot',
    icon: ['<i class="qol-font-icon-size fa-regular me-2"></i>'],
    trigger: {
        content: {
            load: true,
            navigate: true,
        },
        background: false,
    },
    customization: {
        popup: true,
        option: false,
    },
    defaultSettings: {
        autoOpenRunbotEnabled: false,
        autoOpenRunbotLimitedOrigins: ['https://runbot.odoo.com'],
    },
    limited: true,
};
