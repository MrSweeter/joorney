import ContentFeature from '../../generic/content.js';
import { Runtime } from '../../utils/browser.js';
import configuration from './configuration.js';

export default class ThemeSwitchContentFeature extends ContentFeature {
    constructor() {
        super(configuration);
    }

    async loadFeature(_url) {
        Runtime.sendMessage({ feature: this.configuration.id });
    }

    handleUpdateMessage() {
        /* No message */
    }
}
