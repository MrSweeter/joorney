import OptionCustomizationFeature from '../../generic/option_customization.js';
import configuration from './configuration.js';

// The Behaviour switches (options/pages/feature/settings.js) are wired by OptionCustomizationFeature
export default class PinMessageOptionCustomizationFeature extends OptionCustomizationFeature {
    constructor() {
        super(configuration);
    }
}
