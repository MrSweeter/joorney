export default {
    id: 'eggs',
    display_name: 'Eggs',
    icon: '<i class="fa-regular fa-circle-question"></i>',
    trigger: {
        background: false,
        load: true,
        navigate: true,
        context: false,
        onrequest: [],
    },
    customization: {
        option: false,
        popup: false,
    },
    defaultSettings: {
        eggsEnabled: false,
        eggsWhitelistMode: false,
    },
    supported_version: ['18+'],
};
