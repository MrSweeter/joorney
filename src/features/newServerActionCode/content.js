import ContentFeature from '../../generic/content.js';
import { isModelCreateView_fromURL } from '../../utils/url_manager.js';
import configuration from './configuration.js';

export default class NewServerActionCodeContentFeature extends ContentFeature {
    constructor() {
        super(configuration);
    }

    async loadFeature(url) {
        const isNew = await this.isServerActionCreateView_fromURL(url);
        if (!isNew) return;

        this.selectExecuteCode();
    }

    selectExecuteCode() {
        const badge = document.querySelector(`span.o_selection_badge[value='"code"']`);
        if (badge) {
            // Odoo 16.4+
            badge.click();
            return;
        }
        // Odoo < 16.4
        const codeOption = document.querySelector(`option[value='"code"']`);
        if (!codeOption) return;
        const selector = codeOption.parentElement;
        selector.value = codeOption.value;
        selector.dispatchEvent(new Event('change'));
    }

    async isServerActionCreateView_fromURL(url) {
        return await isModelCreateView_fromURL(url, 'ir.actions.server');
    }
}
