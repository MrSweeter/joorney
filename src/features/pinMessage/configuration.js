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
        popup: false,
    },
    defaultSettings: {
        pinMessageEnabled: false,
        pinMessageWhitelistMode: false,
        pinMessageContextMenu: {},
    },
    supported_version: ['17+'],
};
