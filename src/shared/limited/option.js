import OptionFeature from '../../generic/option.js';
import { generateLimitedFeatureOptionButtonItem } from '../../html_generator.js';
import { StorageSync } from '../../utils/browser.js';

export default class LimitedShareOptionFeature extends OptionFeature {
    appendHTMLFeatureElement() {
        const limitedContainer = document.getElementById('joorney-limited-feature');
        limitedContainer.appendChild(generateLimitedFeatureOptionButtonItem(this.configuration));
    }

    moveElementToHTMLContainer(defaultConfiguration) {
        const enabled = defaultConfiguration[`${this.configuration.id}Enabled`];

        const featureInput = document.getElementById(`joorney_${this.configuration.id}_limited_feature`);
        featureInput.checked = enabled;

        featureInput.onchange = async (e) => {
            const checked = e.target.checked;
            await StorageSync.set({ [`${this.configuration.id}Enabled`]: checked });
        };
    }
}
