import { startDrag, updateFeatureOriginInputs } from '../../options/src/features.js';
import { generateFeatureOptionListItem } from '../html_generator.js';
import { Runtime, StorageSync } from '../utils/browser.ts';
import { featureIDToPascalCase } from '../utils/features.ts';

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
        const disabledContainer = document.getElementById('joorney-disable-feature');
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

        const featureElement = document.getElementById(`joorney_${this.configuration.id}_feature`);
        let container = document.getElementById('joorney-disable-feature');
        if (enabled) {
            if (isWhitelist) {
                container = document.getElementById('joorney-whitelist-feature');
            } else {
                container = document.getElementById('joorney-blacklist-feature');
            }
        }

        container.appendChild(featureElement);
        updateFeatureOriginInputs(this.configuration.id, enabled, isWhitelist);

        featureElement.ondragstart = startDrag;
    }
}
