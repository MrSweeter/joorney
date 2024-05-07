import { baseSettings } from '../../configuration.js';
import { sanitizeVersion } from '../api/odoo.js';
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

    const odooSupported = await isSupportedOdoo(version);
    if (!odooSupported) return false;

    return includeVersion(featureSupportedVersion, version, true);
}

export async function isSupportedOdoo(version) {
    const { supportedVersions } = await StorageSync.get(baseSettings);
    return includeVersion(supportedVersions, version);
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

function includeVersion(versions, version, empty = false) {
    const supportedVersions = Array.isArray(versions) ? versions : [versions];
    if (supportedVersions.length === 0) return empty;
    if (supportedVersions.includes(version)) return true;

    const versionNum = Number.parseFloat(version);
    if (Number.isNaN(versionNum)) return false;

    const uniqueOperator = versions.length === 1;

    for (const supportedVersion of supportedVersions) {
        if (isVersionSupported(supportedVersion, versionNum, uniqueOperator)) return true;
    }

    return false;
}

function isVersionSupported(supportedVersion, versionNum, uniqueOperator) {
    const sanitizedVersion = sanitizeVersion(supportedVersion);
    if (!sanitizedVersion) return false;

    const supportedVersionNum = Number.parseFloat(sanitizedVersion);
    if (Number.isNaN(supportedVersionNum)) return false;

    if (sanitizedVersion.endsWith('+')) {
        if (uniqueOperator) return versionNum >= supportedVersionNum;
        console.warn('Version operator "+" cannot be used with other values, with ":" for range');
        return false;
    }

    if (sanitizedVersion.endsWith('-')) {
        if (uniqueOperator) return versionNum < supportedVersionNum;
        console.warn('Version operator "-" cannot be used with other values, with ":" for range');
        return false;
    }

    if (sanitizedVersion.includes(':')) {
        const minimum = Number.parseFloat(sanitizedVersion.split(':')[0]);
        const maximum = Number.parseFloat(sanitizedVersion.split(':')[1]);
        if (Number.isNaN(minimum) || Number.isNaN(maximum)) return false;
        return versionNum >= minimum && versionNum < maximum;
    }
    return versionNum === supportedVersionNum;
}
