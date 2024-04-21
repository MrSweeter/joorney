import OptionFeature from '../../generic/option.js';
import { StorageSync } from '../../utils/browser.js';
import configuration from './configuration.js';

export default class AwesomeStyleOptionFeature extends OptionFeature {
    constructor() {
        super(configuration);
    }
}
