function getActiveFeatureOrigins(originsFilterOrigins, featureName) {
    const enabledOrigins = Object.entries(originsFilterOrigins)
        .filter((origin) => origin[1][featureName] === true)
        .map((origin) => origin[0]);
    return enabledOrigins;
}

export async function authorizeFeature(featureName, origin) {
    const { originsFilterOrigins, originsFilterIsBlacklist } = await chrome.storage.sync.get({
        originsFilterOrigins: {},
        originsFilterIsBlacklist: false,
    });

    const activeOrigins = getActiveFeatureOrigins(originsFilterOrigins, featureName);
    const activeRegex = activeOrigins
        .filter((o) => o.startsWith('regex://'))
        .map((o) => new RegExp(o.replace('regex://', '')));

    // Check URL
    const blacklistBlock = originsFilterIsBlacklist && activeOrigins.includes(origin);
    if (blacklistBlock && activeRegex.length == 0) {
        return false;
    }

    if (isWhitelist && activeOrigins.includes(origin)) {
        return true;
    }
    // Check Regex
    const validRegex = activeRegex.some((r) => r.test(origin));

    if (originsFilterIsBlacklist && validRegex) {
        return false;
    }

    if (isWhitelist && validRegex) {
        return true;
    }

    if (blacklistBlock) {
        return false;
    }

    // If blacklist enabled, default authorization is true else false
    return originsFilterIsBlacklist;
}
