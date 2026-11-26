import { PopupCustomizableFeature, settingSwitchesHTML } from '../../generic/popup.js';
import configuration from './configuration.js';

export default class FEATURE_CLASS_NAMEPopupFeature extends PopupCustomizableFeature {
    constructor() {
        super(configuration);
    }

    // Drawn under the feature card in the toolbar popup; '<button role="switch" data-setting>' switches are wired
    blockHTML() {
        TODO('Complete empty generated method for the popup settings markup (settingSwitchesHTML for switches)');
        return settingSwitchesHTML([]);
    }

    async render(_active) {}
}
