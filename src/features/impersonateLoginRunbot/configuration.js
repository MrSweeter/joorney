export default {
    id: 'impersonateLoginRunbot',
    display_name: 'Impersonate Login Runbot',
    icon: ['<!--<i class="fa-solid fa-people-arrows"></i>-->', '<i class="fa-solid fa-masks-theater"></i>'],
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
