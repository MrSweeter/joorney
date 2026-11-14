export default {
    id: 'assignMeTask',
    display_name: 'Assign Me Task',
    icon: 'person_add',
    trigger: {
        load: true,
        navigate: true,
    },
    customization: {
        popup: false,
        option: false,
    },
    defaultSettings: {
        assignMeTaskEnabled: false,
        assignMeTaskWhitelistMode: false,
    },
    supported_version: ['16.3+'],
};
