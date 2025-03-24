export default {
    id: 'crudMessage',
    display_name: 'Clean Message (edited, removed)',
    icon: '<i class="fa-regular fa-bomb"></i>',
    trigger: {
        background: false,
        load: true,
        navigate: true,
        context: false,
        onrequest: ['https://*/mail/message/update_content', 'https://*/mail/thread/messages'],
    },
    customization: {
        option: false,
        popup: false,
    },
    defaultSettings: {
        crudMessageEnabled: false,
        crudMessageWhitelistMode: false,
    },
    supported_version: ['18+'],
};
