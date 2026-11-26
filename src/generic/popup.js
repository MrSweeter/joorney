import { escapeHTML } from '../html_generator.js';
import { Runtime, StorageSync, sendTabMessage, Tabs } from '../utils/browser.js';
import { featureIDToPascalCase } from '../utils/features.js';
import { t } from '../utils/i18n.js';
import { iconHTML } from '../utils/icons.js';
import { MESSAGE_ACTION } from '../utils/messaging.js';

// The options pages (Home, Features, feature page) refresh on this message
export function notifyOptionPages(message = {}) {
    const extensionURL = Runtime.getURL('');
    // No query for the extension scheme
    Tabs.query({}).then((tabs) => {
        for (const tab of tabs.filter((tb) => tb.url?.startsWith(extensionURL))) {
            sendTabMessage(tab.id, MESSAGE_ACTION.TO_CONTENT.POPUP_HAS_CHANGE, message);
        }
    });
}

// Rows of setting switches, wired by PopupCustomizableFeature.setupSettingSwitches. Same keys, icons and labels as
// the Behaviour group of the options feature page (options/pages/feature/settings.js)
export function settingSwitchesHTML(rows) {
    return rows
        .map(({ setting, icon, labelKey, helpKey }) => {
            const id = `joorney_popup_setting_${escapeHTML(setting)}`;
            const help = escapeHTML(t(helpKey));
            return `
                <div class="joorney-popup-setting" title="${help}">
                    <span class="joorney-popup-setting-icon">${iconHTML(icon)}</span>
                    <label class="joorney-popup-setting-label" for="${id}">${escapeHTML(t(labelKey))}</label>
                    <button type="button" role="switch" class="joorney-switch" id="${id}" data-setting="${escapeHTML(setting)}" aria-checked="false" aria-description="${help}"></button>
                </div>
            `;
        })
        .join('');
}

/**
 * Feature in the toolbar popup. The popup page draws the card and its switch (popup/index.js), so a plain feature
 * has nothing to load.
 */
export default class PopupFeature {
    constructor(configuration) {
        this.configuration = configuration;
        this.defaultSettings = configuration.defaultSettings;
    }

    async load(_context) {}
}

/**
 * Feature with settings in the toolbar popup (configuration.customization.popup), drawn under its card.
 * - blockHTML(): the settings markup, '<button role="switch" data-setting="<key>">' switches are wired here
 *   (same contract as OptionCustomizationFeature on the options feature page)
 * - render(active): fills what blockHTML cannot (selects, previews)
 * - getNotificationMessage(data): the POPUP_HAS_CHANGE message the content script follows without reload
 *
 * The settings stay usable while the feature is off on the host: they can be prepared beforehand.
 */
export class PopupCustomizableFeature extends PopupFeature {
    constructor(configuration) {
        super(configuration);
        if (!configuration.customization.popup) throw new Error(`Invalid state for feature: ${this.configuration.id}`);
    }

    // context: { container, active, tab, onChange }
    async load({ container, active, tab, onChange }) {
        this.container = container;
        this.tab = tab;
        this.onChange = onChange;
        this.active = active;
        container.innerHTML = this.blockHTML();
        await this.setupSettingSwitches();
        await this.render(active);
    }

    blockHTML() {
        return '';
    }

    async render(_active) {}

    async setActive(active) {
        this.active = active;
        await this.render(active);
        this.notifyTab(this.getNotificationMessage({ checked: active }));
    }

    getNotificationMessage(data) {
        return { [`enable${featureIDToPascalCase(this.configuration.id)}`]: data.checked };
    }

    async setupSettingSwitches() {
        const switches = Array.from(this.container.querySelectorAll('[role="switch"][data-setting]'));
        if (!switches.length) return;
        const values = await StorageSync.get(
            Object.fromEntries(switches.map((el) => [el.dataset.setting, this.defaultSettings[el.dataset.setting]]))
        );
        for (const el of switches) {
            const key = el.dataset.setting;
            el.setAttribute('aria-checked', String(Boolean(values[key])));
            el.onclick = async () => {
                const value = el.getAttribute('aria-checked') !== 'true';
                el.setAttribute('aria-checked', String(value));
                await this.saveSettings({ [key]: value });
            };
        }
    }

    // Every setting written from the popup: the options pages follow, the popup offers to reload the tab
    async saveSettings(values) {
        await StorageSync.set(values);
        notifyOptionPages(values);
        this.onChange?.();
    }

    // Only the current tab: the other tabs may be on hosts where the feature does not run
    notifyTab(message) {
        if (!this.tab?.id || Object.values(message).every((v) => v === undefined)) return;
        sendTabMessage(this.tab.id, MESSAGE_ACTION.TO_CONTENT.POPUP_HAS_CHANGE, { ...message, url: this.tab.url });
    }
}
