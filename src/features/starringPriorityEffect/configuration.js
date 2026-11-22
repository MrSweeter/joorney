export default {
    id: 'starringPriorityEffect',
    display_name: 'Starring Effect',
    icon: 'star',
    category: 'ui',
    tags: ['fun', 'project'],
    video: '',
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
