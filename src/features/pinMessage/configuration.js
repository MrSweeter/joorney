export default {
    id: 'pinMessage',
    display_name: 'Pin Message',
    icon: ['<i class="fa-regular fa-circle-question"></i>'],
    trigger: {
        background: false,
        load: true,
        navigate: true,
        context: false,
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
