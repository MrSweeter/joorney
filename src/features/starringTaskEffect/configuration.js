export default {
    id: 'starringTaskEffect',
    display_name: 'Starring Task Effect',
    icon: ['<i class="fa-solid fa-star"></i>'],
    trigger: {
        load: true,
        navigate: true,
    },
    customization: {
        popup: false,
        option: false,
    },
    defaultSettings: {
        starringTaskEffectEnabled: false,
        starringTaskEffectWhitelistMode: false,
    },
    supported_version: ['16+'],
};
