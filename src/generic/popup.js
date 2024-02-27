import { StorageSync, Tabs, Runtime } from '../utils/browser.js';
import { featureIDToPascalCase } from '../utils/features.js';

export default class PopupFeature {
    constructor(configuration) {
        this.configuration = configuration;
        this.defaultSettings = configuration.defaultSettings;
    }

    load(configurationArg) {
        const feature = document.getElementById(`${this.configuration.id}Feature`);
        feature.onchange = this.updateFeature;

        feature.checked = configurationArg[`${this.configuration.id}Enabled`];
    }

    updateFeature(e) {
        const checked = e.target.checked;
        StorageSync.set({ [`${this.configuration.id}Enabled`]: checked });
        notifyOptionPage({ [`enable${featureIDToPascalCase(this.configuration.id)}`]: checked });
    }

    // TODO SWITCH TO MESSAGE CONTENT, not only "checked"
    notifyTabs(checked) {
        // The wildcard * for scheme only matches http or https
        // Same url pattern than content_scripts in manifest
        Tabs.query({ url: '*://*/*' }).then((tabs) => {
            tabs.forEach((t) =>
                Tabs.sendMessage(t.id, {
                    [`enable${featureIDToPascalCase(this.configuration.id)}`]: checked,
                    url: t.url,
                })
            );
        });
    }

    async notifyOptionPage(message) {
        reloadTabFeatures();
        // No query for the chrome-extension scheme
        Tabs.query({}).then((tabs) => {
            tabs.filter((t) => t.url.startsWith(`chrome-extension://${Runtime.id}`)).forEach(
                (tab) => Tabs.sendMessage(tab.id, message)
            );
        });
    }
}
