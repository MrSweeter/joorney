function loadThemeSwitch(configuration) {
    const themeSwitchFeature = document.getElementById('themeSwitchFeature');
    themeSwitchFeature.onchange = updateThemeSwitch;

    themeSwitchFeature.checked = configuration.themeSwitchEnabled;

    updateRenderThemeSwitch(configuration.themeSwitchEnabled);
}

async function updateThemeSwitch(e) {
    const checked = e.target.checked;
    await chrome.storage.sync.set({ themeSwitchEnabled: checked });
    updateOptionPage({ enableThemeSwitch: checked });
    updateRenderThemeSwitch(checked);
}

async function updateRenderThemeSwitch(checked) {
    const themeModeSwitcher = document.getElementById('qol_theme_switch_mode_switcher');

    const { themeSwitchMode } = await chrome.storage.sync.get({
        themeSwitchMode: 'autoDark',
    });

    themeModeSwitcher.value = themeSwitchMode;
    themeModeSwitcher.onchange = onThemeSwitchModeChange;

    themeModeSwitcher.disabled = !checked;
    themeModeSwitcher.style.opacity = checked ? 1 : 0.5;
}

function onThemeSwitchModeChange(event) {
    const themeSwitchFeature = document.getElementById('themeSwitchFeature');
    const enabled = themeSwitchFeature.checked;
    if (enabled)
        chrome.storage.sync.set({
            themeSwitchMode: event.currentTarget.value,
        });
    else event.preventDefault();
}
