export default {
    id: "followUnfollow",
    display_name: "Follow Unfollow",
    icon: '<i class="fa-solid fa-user-check"></i>',
    trigger: {
        background: false,
        load: true,
        navigate: true,
        context: false,
        onrequest: [],
        ondom: true
    },
    customization: {
        option: false,
        popup: false
    },
    defaultSettings: {
        followUnfollowEnabled: false,
        followUnfollowWhitelistMode: false
    },
    supported_version: [
        "18.3+"
    ]
};
