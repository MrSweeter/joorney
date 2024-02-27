import PopupFeature from '../../generic/popup.js';
import { StorageSync } from '../../utils/browser.js';
import configuration from './configuration.js';

export default class ThemeSwitchPopupFeature extends PopupFeature {
    constructor() {
        super(configuration);
    }

    load(configurationArg) {
        super.load(configurationArg);
        this.updateRenderThemeSwitch(configurationArg.themeSwitchEnabled); // TODO CREATE RENDER ABSTRACT
    }

    updateFeature(e) {
        super.updateFeature(e);
        const checked = e.target.checked;
        this.updateRenderThemeSwitch(checked); // TODO CREATE RENDER ABSTRACT
    }

    async updateRenderThemeSwitch(checked) {
        const themeModeSwitcher = document.getElementById('qol_theme_switch_mode_switcher');

        const { themeSwitchMode } = await StorageSync.get({
            themeSwitchMode: 'autoDark',
        });

        themeModeSwitcher.value = themeSwitchMode;
        themeModeSwitcher.onchange = this.onThemeSwitchModeChange;

        themeModeSwitcher.disabled = !checked;
        themeModeSwitcher.style.opacity = checked ? 1 : 0.5;
    }

    onThemeSwitchModeChange(event) {
        const themeSwitchFeature = document.getElementById('themeSwitchFeature');
        const enabled = themeSwitchFeature.checked;
        if (enabled)
            StorageSync.set({
                themeSwitchMode: event.currentTarget.value,
            });
        else event.preventDefault();
    }
}
