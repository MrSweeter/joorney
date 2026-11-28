import AwesomeLoadingSharePopupFeature from '../../shared/awesomeLoadingShare/popup.js';
import configuration from './configuration.js';

export default class AwesomeLoadingSmallPopupFeature extends AwesomeLoadingSharePopupFeature {
    constructor() {
        super(configuration, 'awesomeLoadingSmallImage');
    }
}
