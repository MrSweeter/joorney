export default {
    id: 'assignMeTask',
    display_name: 'Assign Me Task',
    icon: ['<i class="fa-solid fa-user-plus"></i>'],
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
        assignMeTaskEnabled: false,
        assignMeTaskWhitelistMode: false,
    },
    supported_version: ['TODO[VERSION_CHECK]'],
};
