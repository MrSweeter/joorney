export const defaultThemeSwitchSetting = {
    themeSwitchEnabled: false,
    themeSwitchDarkModeEnabled: false,
};

export const defaultAwesomeLoadingSetting = {
    awesomeLoadingLargeEnabled: false,
    awesomeLoadingSmallEnabled: false,
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
    awesomeStyleCSS: '',
};

export const defaultSaveKnowledgeSetting = {
    saveKnowledgeEnabled: false,
};

export const defaultTaskSetupSetting = {
    assignMeTaskEnabled: false,
    starringTaskEffectEnabled: false,
};

export const defaultOriginsFilterSetting = {
    // [LIMITATION] Object is loaded by default even if values exists - 'https://www.odoo.com': {},
    originsFilterOrigins: {},
    originsFilterIsBlacklist: false,
};

export const defaultUnfocusAppSetting = {
    unfocusAppEnabled: false,
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

export const defaultKeyboardShortcutLocalSetting = {
    kbsEnabled: true,
    kbsAltKey: true,
    kbsCtrlKey: true,
    kbsShiftKey: false,
    kbsCodeKey: 'Period',
    kbsDisplayKey: 'Period (:)'
};

export const QOL_DEFAULT_CONFIGURATION = {
    ...defaultThemeSwitchSetting,
    ...defaultAwesomeLoadingSetting,
    ...defaultSaveKnowledgeSetting,
    ...defaultTaskSetupSetting,
    ...defaultOriginsFilterSetting,
    ...defaultAwesomeStyleSetting,
    ...defaultUnfocusAppSetting,
    ...defaultSmartLoginRunbotSetting,
    ...defaultKeyboardShortcutLocalSetting
};
