export default {
    id: 'newServerActionCode',
    display_name: 'New Server Action Code',
    icon: ['<i class="fa-solid fa-code"></i>'],
    trigger: {
        content: {
            load: true,
            navigate: true,
        },
        background: false,
    },
    customization: {
        popup: true,
        option: false,
    },
    defaultSettings: {
        newServerActionCodeEnabled: false,
        newServerActionCodeWhitelistMode: false,
    },
    supported_version: ['TODO[VERSION_CHECK]'],
};
