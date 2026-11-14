export default {
    id: 'ambient',
    display_name: 'Ambient',
    icon: 'landscape',
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
        ambientStatus: {},
    },
    supported_version: ['17+'],
};
