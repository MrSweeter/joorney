import LimitedRunbotContentFeature, { openVersionKey, searchVersionPath } from '../../shared/limited/runbot_content.js';
import { Console } from '../../utils/browser.js';
import { ValueIsNaN } from '../../utils/util.js';
import { sanitizeVersion } from '../../utils/version.js';
import configuration from './configuration.js';

export default class AutoOpenRunbotContentFeature extends LimitedRunbotContentFeature {
    constructor() {
        super(configuration);
    }

    async loadFeature(url) {
        if (!this.isRunbotPageWithAutoOpenHash(url)) return;

        this.loadPath(url);
    }

    async loadPath(url, batchOffset = 0) {
        const { path, version } = await this.getRunbotPath(url, batchOffset);
        try {
            if (!path && !version) {
                window.location = 'https://runbot.odoo.com/';
            }
            if (!path && version) {
                const searchPath = `${searchVersionPath}${version}`;
                const searchAndOpenPath = `${searchPath}&${openVersionKey}=${version}`;
                // Avoid loop if version not exist and already searched
                const finalPath = url.searchParams.has('search') ? searchPath : searchAndOpenPath;
                window.location = `https://runbot.odoo.com/${finalPath}`;
                return;
            }
            await this.openRunbot(`https://runbot.odoo.com/${path}`, false);
        } catch (error) {
            if (batchOffset) {
                Console.warn(error);
                return;
            }
            this.loadPath(url, 1);
        }
    }

    async getRunbotPath(tabURL, batchOffset = 0) {
        const urlVersion = this.getOpenData(tabURL);
        if (!urlVersion) return {};

        let openVersion = Number.parseFloat(urlVersion).toFixed(1);
        if (ValueIsNaN(openVersion)) {
            openVersion = urlVersion;
        }
        openVersion = sanitizeVersion(openVersion);

        const rows = document.getElementsByClassName('bundle_row');

        // FOR EACH VERSION ROW
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const version = sanitizeVersion(row.querySelector('div.one_line a b').textContent);
            if (version !== openVersion) continue;

            const batches = row.querySelectorAll('div.batch_slots');

            // FOR EACH BATCH OF DATABASE OF VERSION
            for (let j = batchOffset; j < batches.length; j++) {
                const batch = batches[j];
                const groups = Array.from(batch.querySelectorAll('div.slot_button_group'));

                // FOR EACH SUBGROUP BUILD OF BATCH
                for (let k = 0; k < groups.length; k++) {
                    const group = groups[k];
                    const type = group.querySelector('a.slot_name span').textContent.toLowerCase();

                    if (!type.startsWith('enterprise')) continue;

                    const signInButtons = group.getElementsByClassName('fa fa-sign-in btn btn-info');
                    const spinGearIcons = group.getElementsByClassName('fa-cog fa-spin');
                    const refreshingIcons = group.querySelector('span i.fa-refresh');

                    // SIGN IN exist and runbot not in a refresh state
                    if (signInButtons.length > 0 && spinGearIcons.length === 0 && !refreshingIcons) {
                        return { path: signInButtons.item(0).getAttribute('href'), version: openVersion };
                    }
                }
            }
        }

        return { version: openVersion };
    }
}
