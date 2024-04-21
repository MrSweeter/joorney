export default {
    id: 'newServerActionCode',
    display_name: 'New Server Action Code',
    icon: ['<i class="fa-solid fa-code"></i>'],
    trigger: {
        load: true,
        navigate: true,
    },
    customization: {
        popup: true,
        option: false,
    },
    defaultSettings: {
        newServerActionCodeEnabled: false,
        newServerActionCodeWhitelistMode: false,
    },
    supported_version: [],
};
