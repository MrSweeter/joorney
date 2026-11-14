export default {
    id: 'awesomeStyle',
    display_name: 'Awesome Style',
    icon: 'css',
    trigger: {
        load: true,
        navigate: true,
    },
    customization: {
        popup: false,
        option: true,
    },
    defaultSettings: {
        awesomeStyleEnabled: false,
        awesomeStyleWhitelistMode: false,
        awesomeStyleCSS: '',
    },
    supported_version: ['16+'],
};
