import { sanitizeURL } from '../utils/url_manager.js';
import { isAuthorizedFeature } from '../utils/authorize.js';

export default class BackgroundFeature {
    constructor(configuration) {
        this.configuration = configuration;
        this.defaultSettings = configuration.defaultSettings;
    }

    async load(tab) {
        // TODO Maybe useless as background trigger has been moved to content script side
        if (!tab.url) return;
        const url = sanitizeURL(tab.url);
        const origin = url.origin;
        if (!origin || !origin.startsWith('http')) return;

        if (!(await isAuthorizedFeature(this.configuration.id, url))) return;

        this.loadFeature(tab, url);
    }

    async loadFeature(tab, url) {}
}
