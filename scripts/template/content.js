import ContentFeature from '../../src/generic/content.js';
import configuration from './configuration.js';

export default class FEATURE_CLASS_NAME extends ContentFeature {
    constructor() {
        super(configuration);
    }

    async loadFeature(url) {
        throw new Error('Not yet implemented');
    }
}
