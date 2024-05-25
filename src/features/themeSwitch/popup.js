import { PopupCustomizableFeature } from '../../generic/popup.js';
import { StorageSync } from '../../utils/browser.ts';
import configuration from './configuration.js';

export default class ThemeSwitchPopupFeature extends PopupCustomizableFeature {
    constructor() {
        super(configuration);
    }

    async render(enabled) {
        const themeModeSwitcher = document.getElementById('joorney_theme_switch_mode_switcher');

        const { themeSwitchMode } = await StorageSync.get({
            themeSwitchMode: 'autoDark',
        });

        themeModeSwitcher.value = themeSwitchMode;
        themeModeSwitcher.onchange = this.onThemeSwitchModeChange;

        themeModeSwitcher.disabled = !enabled;
        themeModeSwitcher.style.opacity = enabled ? 1 : 0.5;
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
