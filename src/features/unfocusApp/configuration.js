export default {
    id: 'unfocusApp',
    display_name: 'Unfocus App',
    icon: 'widgets',
    category: 'ui',
    tags: ['homeMenu', 'navigation'],
    video: '',
    trigger: {
        load: true,
        navigate: true,
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
    supported_version: ['16+'],
};
