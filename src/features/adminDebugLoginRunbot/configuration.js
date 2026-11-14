export default {
    id: 'adminDebugLoginRunbot',
    display_name: '[Runbot] Admin Debug Login',
    icon: 'rocket_launch',
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
    },
    limited: true,
    limitedOrigins: ['https://runbot.odoo.com', 'regex://^https://[\\w-]+\\.runbot\\d{3}\\.odoo\\.com$'],
};
