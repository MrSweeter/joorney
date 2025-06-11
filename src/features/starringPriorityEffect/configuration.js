export default {
    id: 'starringPriorityEffect',
    display_name: 'Starring Effect',
    icon: '<i class="fa-solid fa-star"></i>',
    trigger: {
        load: true,
        navigate: true,
    },
    customization: {
        popup: false,
        option: false,
    },
    defaultSettings: {
        starringPriorityEffectEnabled: false,
        starringPriorityEffectWhitelistMode: false,
    },
    supported_version: ['16+'],
};
