import ContentFeature from '../../src/generic/content.js';
import { NotYetImplemented } from '../../src/utils/error.js';
import configuration from './configuration.js';

export default class FEATURE_CLASS_NAME extends ContentFeature {
    constructor() {
        super(configuration);
    }

    async loadFeature(_url) {
        throw NotYetImplemented;
    }
}
