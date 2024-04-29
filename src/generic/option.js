import { startDrag, updateFeatureOriginInputs } from '../../options/src/features.js';
import { generateFeatureOptionListItem } from '../html_generator.js';
import { Runtime, StorageSync } from '../utils/browser.js';
import { featureIDToPascalCase } from '../utils/features.js';

export default class OptionFeature {
    constructor(configuration) {
        this.configuration = configuration;
        this.defaultSettings = configuration.defaultSettings;
    }

    async load() {
        this.appendHTMLFeatureElement();

        this.handleUpdateMessage();

        return this.restore();
    }

    appendHTMLFeatureElement() {
        let disabledContainer = document.getElementById('qol-disable-feature');
        disabledContainer.appendChild(generateFeatureOptionListItem(this.configuration));
    }

    handleUpdateMessage() {
        Runtime.onMessage.addListener((msg) => {
            const enableFeature = msg[`enable${featureIDToPascalCase(this.configuration.id)}`];
            if (enableFeature === true || enableFeature === false) {
                this.restore();
            }
        });
    }

    async restore() {
        const defaultConfiguration = await this.getDefaultConfiguration();
        this.moveElementToHTMLContainer(defaultConfiguration);
    }

    async getDefaultConfiguration() {
        const configuration = await StorageSync.get({
            [`${this.configuration.id}Enabled`]: false,
            [`${this.configuration.id}WhitelistMode`]: true,
        });
        return configuration;
    }

    moveElementToHTMLContainer(defaultConfiguration) {
        const enabled = defaultConfiguration[`${this.configuration.id}Enabled`];
        const isWhitelist = defaultConfiguration[`${this.configuration.id}WhitelistMode`];

        const featureElement = document.getElementById(`qol_${this.configuration.id}_feature`);
        let container = document.getElementById('qol-disable-feature');
        if (enabled) {
            if (isWhitelist) {
                container = document.getElementById('qol-whitelist-feature');
            } else {
                container = document.getElementById('qol-blacklist-feature');
            }
        }

        container.appendChild(featureElement);
        updateFeatureOriginInputs(this.configuration.id, enabled, isWhitelist);

        featureElement.ondragstart = startDrag;
    }
}
