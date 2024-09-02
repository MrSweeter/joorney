export default {
    id: 'awesomeLoadingLarge',
    display_name: 'Awesome Loading Large',
    icon: '<i class="fa-solid fa-circle-notch"></i>',
    trigger: {
        load: true,
        navigate: true,
    },
    customization: {
        popup: true,
        option: true,
    },
    __comment__: 'awesomeLoadingImages is shared with awesomeLoadingSmall',
    defaultSettings: {
        awesomeLoadingLargeEnabled: false,
        awesomeLoadingLargeWhitelistMode: false,
        awesomeLoadingLargeImage: 'https://media.tenor.com/nBt6RZkFJh8AAAAi/never-gonna.gif',
        awesomeLoadingImages: [
            'https://github.githubassets.com/images/mona-loading-dark.gif',
            'https://media.tenor.com/nBt6RZkFJh8AAAAi/never-gonna.gif',
            'https://static.wikia.nocookie.net/fbbc7304-c0ac-44dc-9ccd-a839ee627a9a/scale-to-width/370',
        ],
    },
    supported_version: ['16:17'],
};
