export default {
    id: 'tooltipMetadata',
    display_name: 'Tooltip Metadata',
    icon: ['<i class="fa-solid fa-file-lines"></i>'],
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
        tooltipMetadataEnabled: false,
        tooltipMetadataWhitelistMode: false,
    },
    supported_version: ['TODO[VERSION_CHECK]'],
};
