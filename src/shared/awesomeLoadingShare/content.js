import ContentFeature from '../../generic/content.js';
import { isOdooWebsite } from '../../utils/authorize.js';
import { Runtime } from '../../utils/browser.js';

export default class AwesomeLoadingShareContentFeature extends ContentFeature {
    constructor(configuration) {
        super(configuration);
        this.loadingID = null;
    }

    async loadFeature(url) {
        const exist = document.getElementsByName(this.loadingID);
        if (exist.length > 0) return;
        if (!isOdooWebsite(url)) return;

        const image = await this.getLoadingImage();
        if (image) {
            this.appendLoadingToDOM(image);
        }
    }

    getInnerStyle(_image) {
        return '';
    }

    async getLoadingImage() {
        return '';
    }

    async appendLoadingToDOM(image) {
        const styleTemplate = document.createElement('template');
        styleTemplate.innerHTML = this.getInnerStyle(image);
        document.documentElement.appendChild(styleTemplate.content.firstChild);
    }

    handleUpdateMessage() {
        Runtime.onMessage.addListener((msg) => {
            const img = this.getImageFromNavigationMessage(msg);
            if (img || img === false) {
                const exist = Array.from(document.getElementsByName(this.loadingID));
                for (const e of exist) e.remove();
                if (img && isOdooWebsite(msg.url)) this.appendLoadingToDOM(img);
            }
        });
    }

    getImageFromNavigationMessage(_msg) {
        return '';
    }
}
