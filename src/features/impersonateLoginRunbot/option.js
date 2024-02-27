import LimitedShareOptionFeature from '../../shared/limitedRunbot/option.js';
import configuration from './configuration.js';

export default class ImpersonateLoginRunbotOptionFeature extends LimitedShareOptionFeature {
    constructor() {
        super(configuration);
    }
}
