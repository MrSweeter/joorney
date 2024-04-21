export default {
    id: 'impersonateLoginRunbot',
    display_name: 'Impersonate Login Runbot',
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
        impersonateLoginRunbotEnabled: false,
        impersonateLoginRunbotLimitedOrigins: ['regex://.*\\.runbot\\d{3}\\.odoo\\.com'],
    },
    limited: true,
};
