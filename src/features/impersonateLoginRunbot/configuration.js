export default {
    id: 'impersonateLoginRunbot',
    display_name: '[Runbot] Impersonate Login',
    icon: '<i class="fa-solid fa-masks-theater"></i>',
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
        impersonateLoginRunbotLimitedOrigins: ['regex://.*\\.runbot\\d{3}\\.odoo\\.com'],
    },
    limited: true,
};
