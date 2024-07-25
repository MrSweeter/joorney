import { features } from '../../configuration';
import { Console, Tabs, WebRequest, sendTabMessage } from '../../src/utils/browser';
import { MESSAGE_ACTION } from '../../src/utils/messaging';

export function listenRequest() {
    const urls = features.flatMap((f) => f.trigger.onrequest || []);

    WebRequest.onCompleted.addListener(requestComplete, { urls: urls }, []);
}

async function requestComplete(details) {
    if (!details.tabId || details.tabId < 0) return;
    try {
        const tab = await Tabs.get(details.tabId);
        if (!tab.active) return;
        if (!tab.url.startsWith('http')) return;

        await sendTabMessage(tab.id, MESSAGE_ACTION.TO_CONTENT.WEB_REQUEST_COMPLETE, { status: details.statusCode });
    } catch (error) {
        // Error: No tab with id (from Tabs.get) is expected
        if (`${error}`.includes(details.tabId)) Console.log(`background.js - requestComplete: ${error}`);
        else Console.error(error);
    }
}
