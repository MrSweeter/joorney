import { StorageLocal } from '../../utils/browser.js';

function getActiveFeatureOrigins(originsFilterOrigins, featureName) {
    const enabledOrigins = Object.entries(originsFilterOrigins)
        .filter((origin) => origin[1][featureName] === true)
        .map((origin) => origin[0]);
    return enabledOrigins;
}

export async function authorizeFeature(featureName, origin) {
    let { offs } = await StorageLocal.get({ offs: [] });
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
