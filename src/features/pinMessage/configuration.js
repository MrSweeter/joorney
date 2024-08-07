export default {
    id: 'pinMessage',
    display_name: 'Pin Message',
    icon: ['<i class="fa-solid fa-thumbtack"></i>'],
    trigger: {
        background: false,
        load: true,
        navigate: true,
        context: false,
        onrequest: ['https://*/*/toggle_message_starred', 'https://*/*/message/update_content'],
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
    },
    supported_version: ['17+'],
};
