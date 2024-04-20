import { importFeatureContentFile } from '../configuration.js';
import { Runtime } from '../src/utils/browser.js';
import { MESSAGE_ACTION } from '../src/utils/messaging.js';

/**
 * Entry point for content scripts.
 *
 * This file is inserted after every other content script.
 * Hence, every function / variable created by other content scripts are available here.
 */

//#region Navigation Event

window.addEventListener('load', async () => {
    const url = window.location.href;
    if (!url || !url.startsWith('http')) return;

    updateLandingPage();

    await updateTabState(url);
    await loadFeatures(url, (f) => f.trigger.content.load);

    const script = document.createElement('script');
    script.src = Runtime.getURL('inject.js');
    script.onload = function () {
        this.remove();
    };

    document.documentElement.appendChild(script);
});

// Experimental: This is an experimental technology - firefox not compatible
// navigation.addEventListener('navigate', (e) => {
//     checkTaskPage(e.destination.url);
// });
// Chrome & Firefox compatible
Runtime.onMessage.addListener(async (msg) => {
    const url = msg.url;
    if (!url || !url.startsWith('http')) return;
    loadFeatures(url, (f) => f.trigger.content.navigate);
});

async function loadFeatures(url, filter) {
    Runtime.sendMessage(
        {
            action: MESSAGE_ACTION.GET_FEATURES_LIST,
        },
        (r) => console.log(r)
    );

    const response = await Runtime.sendMessage({
        action: MESSAGE_ACTION.GET_FEATURES_LIST,
    });
    console.log(response);
    const features = response.features;

    console.log(features);

    features.filter(filter).forEach((feature) => {
        importFeatureContentFile(feature.id).then((featureModule) => {
            console.log(featureModule);
            featureModule.load(url);
        });
    });
}

//#endregion

export async function updateTabState(url) {
    const { offs } = await chrome.storage.local.get({ offs: [] });
    if (offs.includes(new URL(url).origin)) {
        await chrome.runtime.sendMessage({
            action: MESSAGE_ACTION.UPDATE_EXT_STATUS,
            forceSwitchToOFF: true,
        });
        return true;
    }
    return false;
}

function updateLandingPage() {
    Array.from(document.getElementsByClassName('odoo-qol-landing-extension-state')).forEach(
        (el) => (el.style.color = '#fca311')
    );
}
