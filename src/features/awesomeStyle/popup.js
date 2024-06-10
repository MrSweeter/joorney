import PopupFeature from '../../generic/popup.js';
import configuration from './configuration.js';

export default class AwesomeStylePopupFeature extends PopupFeature {
    constructor() {
        super(configuration);
    }

    updateFeature(e) {
        super.updateFeature(e);
        this.notifyTabs({ checked: e.target.checked });
    }
}
