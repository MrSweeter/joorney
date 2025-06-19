import { importFeatureBackgroundTriggerFile, importFeatureContentFile } from '../configuration.js';
import { getWebsiteOff } from '../src/api/local.js';
import { getMenu } from '../src/api/odoo.js';
import { loadSessionInfo } from '../src/api/session.js';
import { getRunbotOpenUrl } from '../src/shared/limited/runbot_content.js';
import { ToastManager, loadToast } from '../src/toast/index.js';
import { Console, Runtime, sendRuntimeMessage } from '../src/utils/browser.js';
import { MESSAGE_ACTION } from '../src/utils/messaging.js';
import { createActionMenuURL } from '../src/utils/url_manager.js';
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
    // ALTERNATIVE of loadSessionInfo
    // const script = document.createElement('script');
    //script.src = Runtime.getURL('inject.js');
    //script.onload = function () {
    //    onVersionLoaded();
    //    this.remove();
    //};
    //document.documentElement.appendChild(script);
    await loadSessionInfo();
    onVersionLoaded();
});

async function onVersionLoaded() {
    const url = window.location.href;
    if (!canContinue(url)) return;

    updateLandingPage();

    await updateTabState(url);
    const versionInfo = getOdooVersion();
    await loadFeatures(url, versionInfo, 'background');
    await loadFeatures(url, versionInfo, 'load');

    loadToast(versionInfo);

    Runtime.onMessage.addListener((message, sender, sendResponse) => {
        handleMessage(message, sender)
            .then(async (r) => {
                sendResponse(r);
            })
            .catch((ex) => {
                Console.warn(ex);
                sendResponse();
            });
        return true;
    });

    sendRuntimeMessage(MESSAGE_ACTION.TO_BACKGROUND.TAB_LOADED);

    loadedURL = url;
}

async function handleMessage(message, _sender) {
    if (!message.action) return undefined;
    switch (message.action) {
        case MESSAGE_ACTION.TO_CONTENT.REQUEST_ODOO_INFO: {
            return getOdooVersion();
        }
        case MESSAGE_ACTION.TO_CONTENT.CM_OPEN_MENU: {
            openPathMenu(message.menupath);
            return {};
        }
        case MESSAGE_ACTION.TO_CONTENT.CM_OPEN_RUNBOT: {
            openRunbotWithVersion();
            return {};
        }
    }
}

function addNavigationListener() {
    // Experimental: This is an experimental technology - firefox not compatible
    // navigation.addEventListener('navigate', (e) => {
    //     checkTaskPage(e.destination.url);
    // });
    // Chrome & Firefox compatible
    Runtime.onMessage.addListener(async (msg) => {
        if (msg.action !== MESSAGE_ACTION.TO_CONTENT.TAB_NAVIGATION) return;
        if (!loadedURL) return;
        if (!msg.navigator) return;
        const url = msg.url;
        if (loadedURL === url) return;
        loadedURL = url;
        const versionInfo = getOdooVersion();
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
    const response = await sendRuntimeMessage(MESSAGE_ACTION.TO_BACKGROUND.GET_FEATURES_LIST);
    if (!response) return;
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
    const offs = await getWebsiteOff();
    if (offs.has(new URL(url).origin)) {
        await sendRuntimeMessage(MESSAGE_ACTION.TO_BACKGROUND.UPDATE_EXT_STATUS, {
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

async function openPathMenu(menupath) {
    try {
        const result = await getMenu(menupath);

        if (result.length === 0) {
            throw new Error(`Menu '${menupath}' not found.`);
        }
        if (result.length > 1) {
            throw new Error(`Too much menu found for path ${menupath}.`);
        }
        const menu = result[0];
        const windowActionID = menu.action.split(',')[1];
        const url = window.location;

        openURL(createActionMenuURL(url, windowActionID));
    } catch (err) {
        ToastManager.warn('contextOdooMenus', 'An error occur during menu opening', err.message);
    }
}

function openRunbotWithVersion() {
    const { version } = getOdooVersion();
    if (!version) return;
    openURL(getRunbotOpenUrl(version));
}

function openURL(url) {
    window.location = url;
}
