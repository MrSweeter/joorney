export default {
    id: 'assignMeTask',
    display_name: 'Assign Me Task',
    icon: ['<i class="fa-solid fa-user-plus"></i>'],
    trigger: {
        load: true,
        navigate: true,
    },
    customization: {
        popup: true,
        option: false,
    },
    defaultSettings: {
        assignMeTaskEnabled: false,
        assignMeTaskWhitelistMode: false,
    },
    supported_version: [],
};
