export default {
    id: 'newServerActionCode',
    display_name: 'New Server Action Code',
    icon: 'code_blocks',
    trigger: {
        load: true,
        navigate: true,
    },
    customization: {
        popup: false,
        option: false,
    },
    defaultSettings: {
        newServerActionCodeEnabled: false,
        newServerActionCodeWhitelistMode: false,
    },
    supported_version: ['16+'],
};
