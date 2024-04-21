import LimitedShareOptionFeature from '../../shared/limited/option.js';
import configuration from './configuration.js';

export default class AdminDebugLoginRunbotOptionFeature extends LimitedShareOptionFeature {
    constructor() {
        super(configuration);
    }
}
