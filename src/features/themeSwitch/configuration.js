export default {
    id: 'themeSwitch',
    display_name: 'Theme Switch',
    icon: [
        '<i class="fa-solid fa-sun"></i>',
        '<i class="fa-solid fa-circle double-fa-mask double-fa-bicolor"></i>',
        '<i class="fa-solid fa-moon double-fa"></i>',
    ],
    trigger: {
        background: true,
        load: false,
        navigate: false,
    },
    customization: {
        popup: true,
        option: true,
    },
    __comment__: "themeSwitchMode: 'system', 'autoDark', 'autoLight', 'dynamicLocation', 'dynamicTime'",
    defaultSettings: {
        themeSwitchEnabled: false,
        themeSwitchWhitelistMode: false,
        themeSwitchMode: 'system',
        themeSwitchLocationLatitude: '51.477928',
        themeSwitchLocationLongitude: '-0.001545',
        themeSwitchDarkStartTime: '20:30',
        themeSwitchDarkStopTime: '07:30',
    },
    supported_version: ['16+'],
};
