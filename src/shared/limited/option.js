import OptionFeature from '../../generic/option.js';
import { generateLimitedFeatureOptionButtonItem } from '../../html_generator.js';
import { StorageSync } from '../../utils/browser.js';

export default class LimitedShareOptionFeature extends OptionFeature {
    appendHTMLFeatureElement() {
        let limitedContainer = document.getElementById('qol-limited-feature');
        limitedContainer.appendChild(generateLimitedFeatureOptionButtonItem(this.configuration));
    }

    moveElementToHTMLContainer(defaultConfiguration) {
        const enabled = defaultConfiguration[`${this.configuration.id}Enabled`];

        const featureInput = document.getElementById(
            `qol_${this.configuration.id}_limited_feature`
        );
        featureInput.checked = enabled;

        featureInput.onchange = async (e) => {
            const checked = e.target.checked;
            await StorageSync.set({ [`${this.configuration.id}Enabled`]: checked });
            //this.loadLimitedFeature(feature, checked);
        };
    }
}
