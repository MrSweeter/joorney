import OptionFeature from '../../generic/option.js';
import configuration from './configuration.js';

export default class AmbientOptionFeature extends OptionFeature {
    constructor() {
        super(configuration);
    }
}
