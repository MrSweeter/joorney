import { reloadTabFeatures } from '../../popup/src/tab_features.js';
import { Runtime, StorageSync, Tabs } from '../utils/browser';
import { featureIDToPascalCase } from '../utils/features';

export default class PopupFeature {
    constructor(configuration) {
        this.configuration = configuration;
        this.defaultSettings = configuration.defaultSettings;
        this.updateFeature = this.updateFeature.bind(this);
    }

    load() {
        this.restore();
    }

    async restore() {
        const defaultConfiguration = await this.getDefaultConfiguration();
        const feature = document.getElementById(`${this.configuration.id}Feature`);
        feature.onchange = this.updateFeature;

        feature.checked = defaultConfiguration[`${this.configuration.id}Enabled`];
    }

    async getDefaultConfiguration() {
        const configuration = await StorageSync.get({
            [`${this.configuration.id}Enabled`]: false,
        });
        return configuration;
    }

    updateFeature(e) {
        const checked = e.target.checked;
        StorageSync.set({ [`${this.configuration.id}Enabled`]: checked });
        this.notifyOptionPage({
            [`enable${featureIDToPascalCase(this.configuration.id)}`]: checked,
        });
    }

    getNotificationMessage(data) {
        return {
            [`enable${featureIDToPascalCase(this.configuration.id)}`]: data.checked,
        };
    }

    notifyTabs(data) {
        // The wildcard * for scheme only matches http or https
        // Same url pattern than content_scripts in manifest
        Tabs.query({ url: '*://*/*' }).then(async (tabs) => {
            const message = this.getNotificationMessage(data);
            if (Object.keys(message).length) {
                for (const t of tabs) {
                    Tabs.sendMessage(t.id, { ...message, url: t.url });
                }
            }
        });
    }

    async notifyOptionPage(message) {
        reloadTabFeatures();
        // No query for the chrome-extension scheme
        Tabs.query({}).then((tabs) => {
            for (const tab of tabs.filter((t) => t.url.startsWith(`chrome-extension://${Runtime.id}`))) {
                Tabs.sendMessage(tab.id, message);
            }
        });
    }
}

export class PopupCustomizableFeature extends PopupFeature {
    constructor(configuration) {
        super(configuration);
        if (!configuration.customization.popup) throw new Error(`Invalid state for feature: ${this.configuration.id}`);
    }

    load(currentSettings) {
        super.load();
        const container = document.querySelector(`div[data-feature-customization="${this.configuration.id}"]`);
        if (!container) throw new Error(`Invalid state for feature: ${this.configuration.id}`);
        container.classList.remove('d-none');
        document.getElementById(`joorney-popup-feature-${this.configuration.id}-label`).innerHTML =
            this.configuration.display_name;

        this.render(currentSettings[`${this.configuration.id}Enabled`]);
    }

    updateFeature(e) {
        super.updateFeature(e);
        const checked = e.target.checked;
        this.render(checked);
        this.notifyTabs({ checked: checked });
    }

    render(_enabled) {}
}
