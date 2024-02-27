export default {
    id: 'awesomeLoadingSmall',
    display_name: 'Awesome Loading Small',
    icon: ['<i class="fa-solid fa-spinner"></i>'],
    trigger: {
        content: {
            load: true,
            navigate: true,
        },
        option: true,
        popup: true,
        background: false,
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
};
