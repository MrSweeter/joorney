export default {
    id: 'impersonateLoginRunbot',
    display_name: '[Runbot] Impersonate Login',
    icon: 'theater_comedy',
    trigger: {
        load: true,
        navigate: true,
    },
    customization: {
        popup: false,
        option: false,
    },
    defaultSettings: {
        impersonateLoginRunbotEnabled: false,
    },
    limited: true,
    limitedOrigins: ['regex://^https://[\\w-]+\\.runbot\\d{3}\\.odoo\\.com$'],
};
