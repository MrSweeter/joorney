export default {
    id: 'ambient',
    display_name: 'Ambient',
    icon: [
        '<i class="fa-solid fa-mountain-sun"></i>',
        // '<i class="fa-solid fa-panorama"></i>'
    ],
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
    supported_version: [],
};
