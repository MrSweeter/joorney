export default {
    id: 'tooltipMetadata',
    display_name: 'Tooltip Metadata',
    icon: ['<i class="fa-solid fa-file-lines"></i>'],
    trigger: {
        content: {
            load: true,
            navigate: true,
        },
        option: true,
        popup: true,
        background: false,
    },
    defaultSettings: {
        tooltipMetadataEnabled: false,
        tooltipMetadataWhitelistMode: false,
    },
};
