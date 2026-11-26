export default {
    id: 'saveKnowledge',
    display_name: 'Save Knowledge',
    icon: 'bookmark',
    category: 'productivity',
    tags: ['knowledge'],
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
        saveKnowledgeEnabled: false,
        saveKnowledgeWhitelistMode: false,
    },
    supported_version: ['16:17'],
};
