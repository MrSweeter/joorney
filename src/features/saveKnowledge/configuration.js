export default {
    id: 'saveKnowledge',
    display_name: 'Save Knowledge',
    icon: [
        '<i class="fa-regular fa-bookmark"></i>',
        '<i class="fa-solid fa-floppy-disk double-fa"></i>',
    ],
    trigger: {
        load: true,
        navigate: true,
    },
    customization: {
        popup: false,
        option: false,
    },
    defaultSettings: {
        saveKnowledgeEnabled: false,
        saveKnowledgeWhitelistMode: false,
    },
    supported_version: [
        '14.0',
        '15.0',
        'saas-15.2',
        '16.0',
        'saas-16.1',
        'saas-16.2',
        'saas-16.3',
        'saas-16.4',
    ],
};
