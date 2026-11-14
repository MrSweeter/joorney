import { WebNavigation, sendTabMessage } from '../../src/utils/browser.js';
import { MESSAGE_ACTION } from '../../src/utils/messaging.js';

export function listenNavigation() {
    // [ODOO] < 17.2 On page # path change
    WebNavigation.onReferenceFragmentUpdated.addListener((e) => {
        // Ignore iframe navigation (website editor, html field, report preview...)
        if (e.frameId === 0 && e.url.startsWith('http')) {
            sendTabMessage(e.tabId, MESSAGE_ACTION.TO_CONTENT.TAB_NAVIGATION, {
                url: e.url,
                navigator: true,
                fragment: true,
            });
        }
    });

    // [ODOO] 17.2+
    WebNavigation.onHistoryStateUpdated.addListener((e) => {
        if (e.frameId === 0 && e.url.startsWith('http')) {
            sendTabMessage(e.tabId, MESSAGE_ACTION.TO_CONTENT.TAB_NAVIGATION, {
                url: e.url,
                navigator: true,
                history: true,
            });
        }
    });
}
