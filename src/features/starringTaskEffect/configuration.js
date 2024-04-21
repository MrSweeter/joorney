export default {
    id: 'starringTaskEffect',
    display_name: 'Starring Task Effect',
    icon: ['<i class="fa-solid fa-star"></i>'],
    trigger: {
        content: {
            load: true,
            navigate: true,
        },
        background: false,
    },
    customization: {
        popup: true,
        option: false,
    },
    defaultSettings: {
        starringTaskEffectEnabled: false,
        starringTaskEffectWhitelistMode: false,
    },
    supported_version: ['TODO[VERSION_CHECK]'],
};
