export default {
    id: 'showMyBadge',
    display_name: 'Show My Badge',
    icon: ['<i class="fa-solid fa-certificate"></i>'],
    trigger: {
        background: false,
        load: true,
        navigate: true,
    },
    customization: {
        option: false,
        popup: false,
    },
    defaultSettings: {
        showMyBadgeEnabled: false,
        showMyBadgeWhitelistMode: false,
    },
    supported_version: ['17+'],
};
