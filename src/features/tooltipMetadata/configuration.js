export default {
    id: 'tooltipMetadata',
    display_name: 'Tooltip Metadata',
    icon: ['<i class="fa-solid fa-file-lines"></i>'],
    trigger: {
        load: true,
        navigate: true,
    },
    customization: {
        popup: true,
        option: false,
    },
    defaultSettings: {
        tooltipMetadataEnabled: false,
        tooltipMetadataWhitelistMode: false,
    },
    supported_version: [],
};
