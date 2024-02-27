export default {
    id: 'starringTaskEffect',
    display_name: 'Starring Task Effect',
    icon: ['<i class="fa-solid fa-star"></i>'],
    trigger: {
        content: {
            load: true,
            navigate: true,
        },
        option: true,
        popup: true,
        background: false,
    },
    defaultSettings: {
        starringTaskEffectEnabled: false,
        starringTaskEffectWhitelistMode: false,
    },
};
