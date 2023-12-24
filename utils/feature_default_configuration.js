export const defaultOriginsFilterSetting = {
    // [LIMITATION] Object is loaded by default even if values exists - 'https://www.odoo.com': {},
    originsFilterOrigins: {},
};

export const defaultThemeSwitchSetting = {
    themeSwitchEnabled: false,
    themeSwitchWhitelistMode: true,
    themeSwitchMode: 'autoDark' /* "autoDark", "autoLight", "dynamicLocation", "dynamicTime" */,
    themeSwitchLocationLatitude: '51.477928',
    themeSwitchLocationLongitude: '-0.001545',
    themeSwitchDarkStartTime: '20:30',
    themeSwitchDarkStopTime: '07:30',
};

export const defaultAwesomeLoadingSetting = {
    awesomeLoadingLargeEnabled: false,
    awesomeLoadingLargeWhitelistMode: true,
    awesomeLoadingSmallEnabled: false,
    awesomeLoadingSmallWhitelistMode: true,
    awesomeLoadingLargeImage: 'https://media.tenor.com/nBt6RZkFJh8AAAAi/never-gonna.gif',
    awesomeLoadingSmallImage: '',
    awesomeLoadingImages: [
        'https://github.githubassets.com/images/mona-loading-dark.gif',
        'https://media.tenor.com/nBt6RZkFJh8AAAAi/never-gonna.gif',
        'https://static.wikia.nocookie.net/fbbc7304-c0ac-44dc-9ccd-a839ee627a9a/scale-to-width/370',
    ],
};

export const defaultAwesomeStyleSetting = {
    awesomeStyleEnabled: false,
    awesomeStyleWhitelistMode: true,
    awesomeStyleCSS: '',
};

export const defaultSaveKnowledgeSetting = {
    saveKnowledgeEnabled: false,
    saveKnowledgeWhitelistMode: true,
};

export const defaultTaskSetupSetting = {
    assignMeTaskEnabled: false,
    assignMeTaskWhitelistMode: true,
    starringTaskEffectEnabled: false,
    starringTaskEffectWhitelistMode: true,
};

export const defaultUnfocusAppSetting = {
    unfocusAppEnabled: false,
    unfocusAppWhitelistMode: true,
    unfocusAppReorderEnabled: false,
    unfocusAppShareEnabled: false,
    unfocusAppOrigins: {},
};

export const defaultSmartLoginRunbotSetting = {
    adminDebugLoginRunbotEnabled: false,
    adminDebugLoginRunbotLimitedOrigins: [
        'https://runbot.odoo.com',
        'regex://.*\\.runbot\\d{3}\\.odoo\\.com',
    ],
    impersonateLoginRunbotEnabled: false,
    impersonateLoginRunbotLimitedOrigins: ['regex://.*\\.runbot\\d{3}\\.odoo\\.com'],
    autoOpenRunbotEnabled: false,
    autoOpenRunbotLimitedOrigins: ['https://runbot.odoo.com'],
};

export const configurationInternalVersion = {
    configurationVersion: 1,
};

export const QOL_DEFAULT_CONFIGURATION = {
    ...configurationInternalVersion,

    ...defaultThemeSwitchSetting,
    ...defaultAwesomeLoadingSetting,
    ...defaultSaveKnowledgeSetting,
    ...defaultTaskSetupSetting,
    ...defaultOriginsFilterSetting,
    ...defaultAwesomeStyleSetting,
    ...defaultUnfocusAppSetting,
    ...defaultSmartLoginRunbotSetting,
};
