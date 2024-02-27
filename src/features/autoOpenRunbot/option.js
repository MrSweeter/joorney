import LimitedShareOptionFeature from '../../shared/limitedRunbot/option.js';
import configuration from './configuration.js';

export default class AutoOpenRunbotOptionFeature extends LimitedShareOptionFeature {
    constructor() {
        super(configuration);
    }
}
