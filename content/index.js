import { importFeatureContentFile } from '../configuration.js';
import { isSupportedOdoo } from '../src/utils/authorize.js';
import { Runtime } from '../src/utils/browser.js';
import { MESSAGE_ACTION } from '../src/utils/messaging.js';
import { getOdooVersion } from '../src/utils/version.js';

/**
 * Entry point for content scripts.
 *
 * This file is inserted after every other content script.
 * Hence, every function / variable created by other content scripts are available here.
 */

//#region Navigation Event

window.addEventListener('load', async () => {
    const script = document.createElement('script');
    script.src = Runtime.getURL('inject.js');
    script.onload = function () {
        onVersionLoaded();
        this.remove();
    };
    document.documentElement.appendChild(script);
});

async function onVersionLoaded() {
    console.log('on Version loaded');
    const url = window.location.href;
    if (!canContinue(url)) return;

    updateLandingPage();

    await updateTabState(url);
    await loadFeatures(url, (f) => f.trigger.load);

    addNavigationListener();
}

function addNavigationListener() {
    // Experimental: This is an experimental technology - firefox not compatible
    // navigation.addEventListener('navigate', (e) => {
    //     checkTaskPage(e.destination.url);
    // });
    // Chrome & Firefox compatible
    Runtime.onMessage.addListener(async (msg) => {
        if (!msg.navigator) return;
        const url = msg.url;
        loadFeatures(url, (f) => f.trigger.navigate);
    });
}

function canContinue(url) {
    if (!url || !url.startsWith('http')) return false;
    return true;
    // Limited feature like runbot, can work without version check
    const { isOdoo, version } = getOdooVersion();
    return isOdoo && isSupportedOdoo(version);
}

async function loadFeatures(url, filter) {
    const response = await Runtime.sendMessage({
        action: MESSAGE_ACTION.GET_FEATURES_LIST,
    });
    const features = response.features;

    for (const feature of features.filter(filter)) {
        importFeatureContentFile(feature.id).then((featureModule) => {
            featureModule.load(url);
        });
    }
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
    for (const el of document.getElementsByClassName('odoo-qol-landing-extension-state')) {
        el.style.color = '#fca311';
    }
}
