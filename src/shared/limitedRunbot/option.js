import OptionFeature from '../../generic/option.js';
import { Runtime, StorageSync } from '../../utils/browser.js';

export default class LimitedShareOptionFeature extends OptionFeature {
    async load() {
        const configuration = await StorageSync.get(this.configuration.defaultSettings);
        this.restoreLimitedFeature(
            this.configuration.id,
            configuration[`${this.configuration.id}Enabled`]
        );
        return configuration;
    }

    restoreLimitedFeature(feature, enabled) {
        const featureInput = document.getElementById(`qol_${feature}_limited_feature`);
        featureInput.checked = enabled;

        featureInput.onchange = async (e) => {
            const toUpdate = {};
            const checked = e.target.checked;
            toUpdate[`${feature}Enabled`] = checked;
            await StorageSync.set(toUpdate);
            this.restoreLimitedFeature(feature, checked);
        };
    }

    handleUpdateMessage() {
        Runtime.onMessage.addListener((msg) => {
            const enableFeature =
                msg[`enable${feature.charAt(0).toUpperCase()}${feature.slice(1)}`];
            if (enableFeature === true || enableFeature === false) {
                this.restoreLimitedFeature(feature, enableFeature);
            }
        });
    }
}
