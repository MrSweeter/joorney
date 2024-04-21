export default {
    id: 'awesomeStyle',
    display_name: 'Awesome Style',
    icon: ['<i class="fa-brands fa-css3-alt"></i>'],
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
        awesomeStyleEnabled: false,
        awesomeStyleWhitelistMode: false,
        awesomeStyleCSS: '',
    },
    supported_version: ['TODO[VERSION_CHECK]'],
};
