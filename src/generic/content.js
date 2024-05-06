import { isAuthorizedFeature, isSupportedFeature } from '../utils/authorize.js';
import { NotYetImplemented } from '../utils/error.js';
import { sanitizeURL } from '../utils/util.js';

export default class ContentFeature {
    constructor(configuration) {
        this.configuration = configuration;
        this.defaultSettings = configuration.defaultSettings;
    }

    async load(urlArg, versionInfo) {
        if (!isSupportedFeature(versionInfo, this.configuration.supported_version)) return;

        const url = sanitizeURL(urlArg);

        if (!(await isAuthorizedFeature(this.configuration.id, url))) return;

        this.loadFeature(url);
        this.handleUpdateMessage();
    }

    async loadFeature(_url) {
        throw NotYetImplemented;
    }

    async handleUpdateMessage() {
        if (this.configuration.customization.popup) throw NotYetImplemented;
    }
}
