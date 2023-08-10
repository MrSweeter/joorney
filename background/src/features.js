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

    // Check URL
    const activeOrigins = getActiveFeatureOrigins(originsFilterOrigins, featureName);

    if (originsFilterIsBlacklist && activeOrigins.includes(origin)) {
        return false;
    }

    if (!originsFilterIsBlacklist && !activeOrigins.includes(origin)) {
        return false;
    }

    // Check Regex
    const activeRegex = activeOrigins
        .filter((o) => o.startsWith('regex://'))
        .map((o) => new RegExp(o.replace('regex://', '')));
    const validRegex = activeRegex.some((r) => r.test(origin));

    if (originsFilterIsBlacklist && validRegex) {
        return false;
    }

    if (!originsFilterIsBlacklist && !validRegex) {
        return false;
    }

    return true;
}
