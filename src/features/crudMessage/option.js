import OptionFeature from '../../generic/option.js';
import configuration from './configuration.js';

export default class CrudMessageOptionFeature extends OptionFeature {
    constructor() {
        super(configuration);
    }
}
