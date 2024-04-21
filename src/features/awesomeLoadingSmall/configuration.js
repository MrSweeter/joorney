export default {
    id: 'awesomeLoadingSmall',
    display_name: 'Awesome Loading Small',
    icon: ['<i class="fa-solid fa-spinner"></i>'],
    trigger: {
        load: true,
        navigate: true,
    },
    customization: {
        popup: true,
        option: true,
    },
    __comment__: 'awesomeLoadingImages is shared with awesomeLoadingLarge',
    defaultSettings: {
        awesomeLoadingSmallEnabled: false,
        awesomeLoadingSmallWhitelistMode: false,
        awesomeLoadingSmallImage: '',
        awesomeLoadingImages: [
            'https://github.githubassets.com/images/mona-loading-dark.gif',
            'https://media.tenor.com/nBt6RZkFJh8AAAAi/never-gonna.gif',
            'https://static.wikia.nocookie.net/fbbc7304-c0ac-44dc-9ccd-a839ee627a9a/scale-to-width/370',
        ],
    },
    supported_version: [],
};
