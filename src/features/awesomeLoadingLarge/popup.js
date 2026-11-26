import AwesomeLoadingSharePopupFeature from '../../shared/awesomeLoadingShare/popup.js';
import configuration from './configuration.js';

export default class AwesomeLoadingLargePopupFeature extends AwesomeLoadingSharePopupFeature {
    constructor() {
        super(configuration, 'awesomeLoadingLargeImage');
    }
}
