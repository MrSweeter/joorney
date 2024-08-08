import { ToastManager } from '../toast/index.js';
import { isAuthorizedFeature, isSupportedFeature } from '../utils/authorize.js';
import { Console, Runtime } from '../utils/browser.js';
import { NotYetImplemented } from '../utils/error.js';
import { MESSAGE_ACTION } from '../utils/messaging.js';
import { sanitizeURL } from '../utils/util.js';

export default class ContentFeature {
    constructor(configuration) {
        this.configuration = configuration;
        this.defaultSettings = configuration.defaultSettings;
    }

    async load(urlArg, versionInfo) {
        if (!(await isSupportedFeature(versionInfo, this.configuration.supported_version))) return;

        const url = sanitizeURL(urlArg);

        if (!(await isAuthorizedFeature(this.configuration.id, url))) return;

        this.loadFeature(url);
        this.handlePopupMessage();

        this.observeRequest();
    }

    observeRequest() {
        const onrequest = this.configuration.trigger.onrequest;
        if (!onrequest || onrequest.length < 1) return;

        Runtime.onMessage.addListener((msg) => {
            if (msg.action === MESSAGE_ACTION.TO_CONTENT.WEB_REQUEST_COMPLETE) this.onRequestCompleted(msg);
        });
    }

    async onRequestCompleted(_msg) {}

    async loadFeature(_url) {
        throw NotYetImplemented;
    }

    async handlePopupMessage() {
        if (!this.configuration.customization.popup) return;
        Runtime.onMessage.addListener((msg) => {
            if (msg.action !== MESSAGE_ACTION.TO_CONTENT.POPUP_HAS_CHANGE) return;
            this.onPopupMessage(msg);
        });
    }

    onPopupMessage(_msg) {
        if (this.configuration.customization.popup) throw NotYetImplemented;
    }

    async tryCatch(fct, fallback = undefined) {
        try {
            return await Promise.resolve(fct());
        } catch (e) {
            if (e.type === 'OdooAPIException') {
                const error = e.error;
                switch (error.data.name) {
                    case 'odoo.exceptions.AccessError':
                        ToastManager.warn(
                            this.configuration.id,
                            `${e.fromCache ? '[cache] ' : ''}${error.data.name}`,
                            error.data.message
                        );
                        break;
                    case 'builtins.ValueError':
                        ToastManager.warn(
                            this.configuration.id,
                            `${e.fromCache ? '[cache] ' : ''}${error.data.name}`,
                            error.data.message
                        );
                        break;
                    default:
                        ToastManager.error(
                            this.configuration.id,
                            `${e.fromCache ? '[cache] ' : ''}${error.data.name}`,
                            error.data.message
                        );
                }
            } else {
                Console.error(e);
            }
        }
        return fallback;
    }
}
