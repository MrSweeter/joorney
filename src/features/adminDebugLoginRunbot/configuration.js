export default {
    id: 'adminDebugLoginRunbot',
    display_name: 'Admin Debug Login Runbot',
    icon: ['<i class="fa-solid fa-rocket"></i>'],
    trigger: {
        content: {
            load: true,
            navigate: true,
        },
        option: true,
        popup: true,
        background: false,
    },
    defaultSettings: {
        adminDebugLoginRunbotEnabled: false,
        adminDebugLoginRunbotLimitedOrigins: [
            'https://runbot.odoo.com',
            'regex://.*\\.runbot\\d{3}\\.odoo\\.com',
        ],
    },
    limited: true,
};
