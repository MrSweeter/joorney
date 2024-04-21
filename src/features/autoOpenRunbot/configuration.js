export default {
    id: 'autoOpenRunbot',
    display_name: 'Auto Open Runbot',
    icon: ['<i class="qol-font-icon-size fa-regular me-2"></i>'],
    trigger: {
        load: true,
        navigate: true,
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
