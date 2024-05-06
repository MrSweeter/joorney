import ContentFeature from '../../generic/content.js';
import { isOdooWebsite } from '../../utils/authorize.js';
import { Runtime, StorageSync } from '../../utils/browser.js';
import configuration from './configuration.js';

const awesomeStyleID = 'odoo-qol-awesome-style';

export default class AwesomeStyleContentFeature extends ContentFeature {
    constructor() {
        super(configuration);
    }

    async loadFeature(url) {
        if (!isOdooWebsite(url)) return;
        const exist = document.getElementsByName(awesomeStyleID);
        if (exist.length > 0) return;
        this.appendAwesomeStyle();
    }

    async appendAwesomeStyle() {
        const { awesomeStyleCSS } = await StorageSync.get({
            awesomeStyleCSS: this.configuration.defaultSettings.awesomeStyleCSS,
        });

        if (awesomeStyleCSS) {
            this.appendAwesomeStyleToDOM(awesomeStyleCSS);
        }
    }

    async appendAwesomeStyleToDOM(css) {
        const styleTemplate = document.createElement('template');
        styleTemplate.innerHTML = `
            <style name="${awesomeStyleID}" type="text/css">
                ${css}
            </style>
        `.trim();

        document.documentElement.appendChild(styleTemplate.content.firstChild);
    }

    handleUpdateMessage() {
        Runtime.onMessage.addListener((msg) => {
            const css = msg.enableAwesomeStyle;

            if (typeof css === 'boolean') {
                const exist = Array.from(document.getElementsByName(awesomeStyleID));
                if (exist) for (const e of exist) e.remove();
                if (css && isOdooWebsite(msg.url)) this.appendAwesomeStyle(msg.url);
            }
        });
    }
}
