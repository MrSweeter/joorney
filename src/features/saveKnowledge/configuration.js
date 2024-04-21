export default {
    id: 'saveKnowledge',
    display_name: 'Save Knowledge',
    icon: [
        '<i class="fa-regular fa-bookmark"></i>',
        '<i class="fa-solid fa-floppy-disk double-fa"></i>',
    ],
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
        saveKnowledgeEnabled: false,
        saveKnowledgeWhitelistMode: false,
    },
    supported_version: ['TODO[VERSION_CHECK]'],
};
