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
    const themeSwitcher = document.getElementById('qol_theme_switch_switcher');

    const { themeSwitchDarkModeEnabled } = await chrome.storage.sync.get({
        themeSwitchDarkModeEnabled: false,
    });

    const themeModeInput = document.getElementById('qol_theme_switch_input');
    themeModeInput.checked = themeSwitchDarkModeEnabled;
    themeModeInput.setAttribute('indeterminate', !checked);
    themeModeInput.onchange = onThemeSwitchModeChange;

    themeSwitcher.disabled = !checked;
    themeModeInput.disabled = !checked;
    themeSwitcher.style.opacity = checked ? 1 : 0.5;
}

function onThemeSwitchModeChange(event) {
    const themeSwitchFeature = document.getElementById('themeSwitchFeature');
    const enabled = themeSwitchFeature.checked;
    if (enabled)
        chrome.storage.sync.set({
            themeSwitchDarkModeEnabled: event.currentTarget.checked,
        });
    else event.preventDefault();
}
