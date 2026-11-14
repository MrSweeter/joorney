export default {
    id: 'followUnfollow',
    display_name: 'Follow/Unfollow',
    icon: 'how_to_reg',
    trigger: {
        background: false,
        load: true,
        navigate: true,
        context: false,
        onrequest: [],
        ondom: true,
    },
    customization: {
        option: false,
        popup: false,
    },
    defaultSettings: {
        followUnfollowEnabled: false,
        followUnfollowWhitelistMode: false,
    },
    supported_version: ['18.3+'],
};
