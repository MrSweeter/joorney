export default {
    id: 'tooltipMetadata',
    display_name: 'Tooltip Metadata',
    icon: 'description',
    trigger: {
        load: true,
        navigate: true,
    },
    customization: {
        popup: false,
        option: false,
    },
    defaultSettings: {
        tooltipMetadataEnabled: false,
        tooltipMetadataWhitelistMode: false,
    },
    supported_version: ['16+'],
};
