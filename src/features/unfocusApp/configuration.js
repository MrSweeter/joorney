export default {
    id: 'unfocusApp',
    display_name: 'Unfocus App',
    icon: ['<i class="fa-solid fa-ghost"></i>'],
    trigger: {
        content: {
            load: true,
            navigate: true,
        },
        background: false,
    },
    customization: {
        popup: true,
        option: true,
    },
    defaultSettings: {
        unfocusAppEnabled: false,
        unfocusAppWhitelistMode: false,
        unfocusAppReorderEnabled: false,
        unfocusAppShareEnabled: false,
        unfocusAppLightImageURL: 'https://i.imgur.com/AkTvOga.png',
        unfocusAppDarkImageURL: 'https://i.imgur.com/YzShNtH.png',
        unfocusAppOrigins: {},
    },
    supported_version: ['TODO[VERSION_CHECK]'],
};
