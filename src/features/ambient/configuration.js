export default {
    id: 'ambient',
    display_name: 'Ambient',
    icon: ['<i class="fa-regular fa-circle-question"></i>'],
    trigger: {
        background: false,
        load: true,
        navigate: false,
    },
    customization: {
        option: false,
        popup: false,
    },
    defaultSettings: {
        ambientEnabled: false,
        ambientWhitelistMode: false,
    },
    supported_version: [],
};
