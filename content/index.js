import { importFeatureBackgroundTriggerFile, importFeatureContentFile } from '../configuration.js';
import { loadToast } from '../src/toast/index.js';
import { includeVersion } from '../src/utils/authorize.js';
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

let loadedURL = false;
addNavigationListener();

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
    const url = window.location.href;
    if (!canContinue(url)) return;

    updateLandingPage();

    await updateTabState(url);
    const versionInfo = await getOdooVersion();
    await loadFeatures(url, versionInfo, 'background');

    if (includeVersion(['17.2-'], versionInfo.version)) {
        await loadFeatures(url, versionInfo, 'load');
    }

    loadToast(versionInfo);

    loadedURL = url;
}

function addNavigationListener() {
    // Experimental: This is an experimental technology - firefox not compatible
    // navigation.addEventListener('navigate', (e) => {
    //     checkTaskPage(e.destination.url);
    // });
    // Chrome & Firefox compatible
    Runtime.onMessage.addListener(async (msg) => {
        if (!loadedURL) return;
        if (!msg.navigator) return;
        const url = msg.url;
        if (loadedURL === url) return;
        loadedURL = url;
        const versionInfo = await getOdooVersion();
        loadFeatures(url, versionInfo, 'navigate');
    });
}

function canContinue(url) {
    if (!url || !url.startsWith('http')) return false;
    return true;
    // TODO[VERSION] Limited feature like runbot, can work without version check
    // const { isOdoo, version } = getOdooVersion();
    // return isOdoo && isSupportedOdoo(version);
}

async function loadFeatures(url, versionInfo, trigger) {
    const response = await Runtime.sendMessage({
        action: MESSAGE_ACTION.GET_FEATURES_LIST,
    });
    const features = response.features.filter((f) => f.trigger[trigger]);

    let importer = async (feature) => await importFeatureContentFile(feature.id);
    if (trigger === 'background') {
        importer = async (feature) => await importFeatureBackgroundTriggerFile(feature.id);
    }

    for (const feature of features) {
        const loader = await importer(feature);
        loader.load(url, versionInfo);
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
    for (const el of document.getElementsByClassName('joorney-landing-extension-state')) {
        el.style.color = '#fca311';
    }
}
