import { isAuthorizedFeature } from '../utils/authorize.js';
import { sendRuntimeMessage } from '../utils/browser.js';
import { MESSAGE_ACTION } from '../utils/messaging.js';
import { sanitizeURL } from '../utils/util.js';
import ContentFeature from './content.js';

export default class BackgroundFeature {
    constructor(configuration) {
        this.configuration = configuration;
        this.defaultSettings = configuration.defaultSettings;
    }

    async load(tab) {
        // TODO[IMP] Maybe useless as background trigger has been moved to content script side, cf themeSwitch
        if (!tab.url) return;
        const url = sanitizeURL(tab.url);
        const origin = url.origin;
        if (!origin || !origin.startsWith('http')) return;

        if (!(await isAuthorizedFeature(this.configuration.id, url))) return;

        this.loadFeature(tab, url);
    }

    async loadFeature(_tab, _url) {}
}

export class BackgroundTriggerContentFeature extends ContentFeature {
    async loadFeature(_url) {
        sendRuntimeMessage(MESSAGE_ACTION.TO_BACKGROUND.TRIGGER_FEATURE, { feature: this.configuration.id });
    }

    handlePopupMessage() {
        /* No message */
    }
}
