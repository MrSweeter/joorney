export default {
    id: 'pinMessage',
    display_name: 'Pin Message',
    icon: '<i class="fa-solid fa-thumbtack"></i>',
    trigger: {
        background: false,
        load: true,
        navigate: true,
        context: false,
        onrequest: [
            'https://*/*/mail.message/toggle_message_starred',
            'https://*/mail/message/update_content',
            'https://*/mail/thread/messages',
        ],
    },
    customization: {
        option: false,
        popup: true,
    },
    defaultSettings: {
        pinMessageEnabled: false,
        pinMessageWhitelistMode: false,
        pinMessageContextMenu: {},
        pinMessageSelfAuthorEnabled: true,
        pinMessageDefaultShown: false,
    },
    supported_version: ['17+'],
};
