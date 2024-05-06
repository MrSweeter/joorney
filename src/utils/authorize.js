import { baseSettings } from '../../configuration.js';
import { StorageLocal, StorageSync } from './browser.js';
import { sanitizeURL } from './util.js';

export const regexSchemePrefix = 'regex://';

export function isOdooWebsite(url) {
    const regex = /^https?:\/\/(.+?\.odoo\.com|localhost|127\.0\.0\.\d+)(:\d+)?.*$/;
    return regex.test(url);
}

export async function isStillSamePage(timeout, url) {
    if (timeout > 0) await new Promise((r) => setTimeout(r, timeout));
    const currentURL = sanitizeURL(window.location.href);
    return currentURL.href === url.href;
}

export async function isStillSameWebsite(timeout, url) {
    if (timeout > 0) await new Promise((r) => setTimeout(r, timeout));
    return window.location.origin === url.origin;
}

export async function isSupportedFeature(versionInfo, featureSupportedVersion) {
    const { isOdoo, version } = versionInfo;
    if (!isOdoo) return false;
    if (!version) return false;
    if (featureSupportedVersion.length === 0) return true;

    const odooSupported = await isSupportedOdoo(version);

    return odooSupported && featureSupportedVersion.includes(version);
}

export async function isSupportedOdoo(version) {
    const { supportedVersions } = await StorageSync.get(baseSettings);
    return supportedVersions.includes(version);
}

export async function isAuthorizedFeature(feature, url) {
    const key = `${feature}Enabled`;
    const configuration = await StorageSync.get({
        [key]: false,
    });
    if (!configuration[key]) return false;

    const authorizedFeature = await authorizeFeature(feature, url.origin);
    return authorizedFeature;
}

export async function isAuthorizedLimitedFeature(featureName, url) {
    const key = `${featureName}Enabled`;
    const configKey = `${featureName}LimitedOrigins`;
    const configuration = await StorageSync.get({
        [key]: false,
        [configKey]: [],
    });
    if (!configuration[key]) return false;
    const origin = url.origin;

    // Check URL
    if (configuration[configKey].includes(origin)) {
        return true;
    }

    // Check Regex
    const activeRegex = configuration[configKey]
        .filter((o) => o.startsWith(regexSchemePrefix))
        .map((o) => new RegExp(o.replace(regexSchemePrefix, '')));
    const validRegex = activeRegex.some((r) => r.test(origin));

    return validRegex;
}

async function authorizeFeature(featureName, origin) {
    const { offs } = await StorageLocal.get({ offs: [] });
    if (offs.includes(origin)) {
        return false;
    }

    const configuration = await StorageSync.get({
        originsFilterOrigins: {},
        [`${featureName}Enabled`]: false,
        [`${featureName}WhitelistMode`]: true,
    });

    if (!configuration[`${featureName}Enabled`]) return false;

    const activeOrigins = getActiveFeatureOrigins(configuration.originsFilterOrigins, featureName);
    const activeRegex = activeOrigins
        .filter((o) => o.startsWith(regexSchemePrefix))
        .map((o) => new RegExp(o.replace(regexSchemePrefix, '')));

    const originExist = activeOrigins.includes(origin) || activeRegex.some((r) => r.test(origin));

    const isWhitelistMode = configuration[`${featureName}WhitelistMode`];
    if (isWhitelistMode) {
        return originExist;
    }

    if (!isWhitelistMode) {
        return !originExist;
    }

    return false;
}

function getActiveFeatureOrigins(originsFilterOrigins, featureName) {
    const enabledOrigins = Object.entries(originsFilterOrigins)
        .filter((origin) => origin[1][featureName] === true)
        .map((origin) => origin[0]);
    return enabledOrigins;
}
