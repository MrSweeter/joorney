export default {
    id: 'saveKnowledge',
    display_name: 'Save Knowledge',
    icon: '<i class="fa-solid fa-bookmark"></i>',
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
    supported_version: ['16:17'],
};
