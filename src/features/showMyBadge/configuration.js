export default {
    id: 'showMyBadge',
    display_name: 'Show My Badge',
    icon: 'workspace_premium',
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
