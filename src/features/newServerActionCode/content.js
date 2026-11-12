import ContentFeature from '../../generic/content.js';
import { isStillSamePage } from '../../utils/authorize.js';
import { isModelCreateView_fromURL } from '../../utils/url_manager.js';
import { sleep } from '../../utils/util.js';
import configuration from './configuration.js';

export default class NewServerActionCodeContentFeature extends ContentFeature {
    constructor() {
        super(configuration);
        this._serverActionObserver = null;
    }

    unload() {
        super.unload();
        this.disconnectServerActionObserver();
    }

    disconnectServerActionObserver() {
        this._serverActionObserver?.disconnect();
        this._serverActionObserver = null;
    }

    async loadFeature(url) {
        const isNew = await this.tryCatch(() => this.isServerActionCreateView_fromURL(url), false);
        if (!isNew) return;
        if (!(await isStillSamePage(250, url))) return;
        await this.selectServerActionModel();
        this.selectExecuteCode();
    }

    async selectServerActionModel() {
        // [ODOO] 17.0+ model_id_0, name_0, model_id_0_0_0
        const inputModel = document.getElementById('model_id_0');
        if (!inputModel) return;
        inputModel.click();
        inputModel.value = 'ir.actions.server';

        const parent = inputModel.parentElement;
        this.disconnectServerActionObserver();
        const observer = new MutationObserver((mutations) => {
            const choiceMutations = mutations.filter((m) => m.target.id.match(/^model_id_0_0_\d+$/));
            // model_id_0_0_0 for record and model_id_0_0_1 for search more (optional)
            const mutationSet = new Set(choiceMutations.map((m) => m.target.id)); // [ODOO] 18.3+ create 4 mutations
            if (mutationSet.size > 3) return;

            const serverActionItem = parent.querySelector('#model_id_0_0_0');

            if (serverActionItem) {
                this.disconnectServerActionObserver();
                serverActionItem.click();
            }

            const nameElement = document.getElementById('name_0');
            if (nameElement) nameElement.focus();
        });
        this._serverActionObserver = observer;
        observer.observe(parent, { childList: true, subtree: true });
        // Item may never appear (no match, other Odoo version), avoid stealing the focus forever
        setTimeout(() => {
            if (this._serverActionObserver === observer) this.disconnectServerActionObserver();
        }, 5000);
        inputModel.dispatchEvent(new InputEvent('input', { bubbles: true }));

        await sleep(500); // [ODOO] 18.3+ action type is not shown by default, wait event end
    }

    selectExecuteCode() {
        const badge = document.querySelector(`span.o_selection_badge[value='"code"']`);
        if (badge) badge.click();
    }

    async isServerActionCreateView_fromURL(url) {
        return await isModelCreateView_fromURL(url, 'ir.actions.server');
    }
}
