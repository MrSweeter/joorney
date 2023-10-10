/**
 * Entry point for content scripts.
 *
 * This file is inserted after every other content script.
 * Hence, every function / variable created by other content scripts are available here.
 */

//#region Navigation Event

window.addEventListener('load', async () => {
    const url = window.location.href;

    await updateTabState(url);

    checkTaskPage(url);
    checkKnowledge(url);
    appendLargeLoading(url);
    appendSmallLoading(url);
    appendAwesomeStyle(url);
    appendUnfocusApp(url);
    appendSmartLogin(url);
});

// Experimental: This is an experimental technology - firefox not compatible
// navigation.addEventListener('navigate', (e) => {
//     checkTaskPage(e.destination.url);
// });
// Chrome & Firefox compatible
chrome.runtime.onMessage.addListener((msg) => {
    const url = msg.url;
    if (url) {
        checkTaskPage(url);
        checkKnowledge(url);
        appendUnfocusApp(url);
    }
});

//#endregion

//#region Utils

let rpcIndex = 0; // ID of rpc_call

function hrefFragmentToURLParameters(href) {
    // Odoo url can manage fragment for some parameter, need to merge fragment and classic parameter
    const url = new URL(href.replace(/#/g, href.includes('?') ? '&' : '?'));
    return url;
}

function isOdooTab(url) {
    const regex = /^https?:\/\/(.+?\.odoo\.com|localhost|127\.0\.0\.\d+)(:\d+)?.*$/;
    if (!url.match(regex)) return false;
    return true;
}

function getActiveFeatureOrigins(originsFilterOrigins, featureName) {
    const enabledOrigins = Object.entries(originsFilterOrigins)
        .filter((origin) => origin[1][featureName] === true)
        .map((origin) => origin[0]);
    return enabledOrigins;
}

async function authorizeFeature(featureName, origin) {
    let { offs } = await chrome.storage.local.get({ offs: [] });
    if (offs.includes(origin)) {
        return false;
    }

    const { originsFilterOrigins, originsFilterIsBlacklist } = await chrome.storage.sync.get({
        originsFilterOrigins: {},
        originsFilterIsBlacklist: false,
    });

    const activeOrigins = getActiveFeatureOrigins(originsFilterOrigins, featureName);
    const activeRegex = activeOrigins
        .filter((o) => o.startsWith('regex://'))
        .map((o) => new RegExp(o.replace('regex://', '')));

    const originExist = activeOrigins.includes(origin) || activeRegex.some((r) => r.test(origin));

    if (originsFilterIsBlacklist && originExist) {
        return false;
    }

    if (!originsFilterIsBlacklist && originExist) {
        return true;
    }

    return originsFilterIsBlacklist;
}

async function authorizeLimitedFeature(featureName, origin) {
    configKey = `${featureName}LimitedOrigins`;
    const configuration = await chrome.storage.sync.get({
        [configKey]: [],
    });

    // Check URL
    if (configuration[configKey].includes(origin)) {
        return true;
    }

    // Check Regex
    const activeRegex = configuration[configKey]
        .filter((o) => o.startsWith('regex://'))
        .map((o) => new RegExp(o.replace('regex://', '')));
    const validRegex = activeRegex.some((r) => r.test(origin));

    return validRegex;
}

//#endregion
