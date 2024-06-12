export default {
    id: 'adminDebugLoginRunbot',
    display_name: '[Runbot] Admin Debug Login',
    icon: ['<i class="fa-solid fa-rocket"></i>'],
    trigger: {
        load: true,
        navigate: true,
    },
    customization: {
        popup: false,
        option: false,
    },
    defaultSettings: {
        adminDebugLoginRunbotEnabled: false,
        adminDebugLoginRunbotLimitedOrigins: ['https://runbot.odoo.com', 'regex://.*\\.runbot\\d{3}\\.odoo\\.com'],
    },
    limited: true,
};
