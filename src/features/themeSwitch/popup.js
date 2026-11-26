import { PopupCustomizableFeature } from '../../generic/popup.js';
import { escapeHTML } from '../../html_generator.js';
import { StorageSync } from '../../utils/browser.js';
import { t } from '../../utils/i18n.js';
import configuration from './configuration.js';

const MODES = [
    { value: 'system', labelKey: 'themeSwitch_mode_system' },
    { value: 'autoDark', labelKey: 'themeSwitch_mode_dark' },
    { value: 'autoLight', labelKey: 'themeSwitch_mode_light' },
    { value: 'dynamicLocation', labelKey: 'themeSwitch_mode_location' },
    { value: 'dynamicTime', labelKey: 'themeSwitch_mode_time' },
];

export default class ThemeSwitchPopupFeature extends PopupCustomizableFeature {
    constructor() {
        super(configuration);
    }

    blockHTML() {
        const options = MODES.map((m) => `<option value="${m.value}">${escapeHTML(t(m.labelKey))}</option>`).join('');
        return `
            <div class="joorney-popup-field">
                <label class="joorney-popup-setting-label" for="joorney_theme_switch_mode_switcher">${escapeHTML(t('optionsThemeSwitch_modeLabel'))}</label>
                <select id="joorney_theme_switch_mode_switcher" class="joorney-input">${options}</select>
            </div>
        `;
    }

    async render(_active) {
        const select = this.container.querySelector('#joorney_theme_switch_mode_switcher');
        // Same default as the options page and the background (configuration.js)
        const { themeSwitchMode } = await StorageSync.get({
            themeSwitchMode: this.defaultSettings.themeSwitchMode,
        });
        select.value = themeSwitchMode;
        select.onchange = () => this.saveSettings({ themeSwitchMode: select.value });
    }
}
