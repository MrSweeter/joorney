export default {
    id: 'newServerActionCode',
    display_name: 'New Server Action Code',
    icon: ['<i class="fa-solid fa-code"></i>'],
    trigger: {
        content: {
            load: true,
            navigate: true,
        },
        option: true,
        popup: true,
        background: false,
    },
    defaultSettings: {
        newServerActionCodeEnabled: false,
        newServerActionCodeWhitelistMode: false,
    },
};
