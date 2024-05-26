import { baseSettings } from '../../configuration.js';
import { StorageLocal, StorageSync } from './browser';
import { ValueIsNaN, sanitizeURL } from './util';
import { sanitizeVersion } from './version';

export const regexSchemePrefix = 'regex://';

export function isOdooWebsite(url: string): boolean {
    const regex = /^https?:\/\/(.+?\.odoo\.com|localhost|127\.0\.0\.\d+)(:\d+)?.*$/;
    return regex.test(url);
}

export async function isStillSamePage(timeout: number, url: URL): Promise<boolean> {
    if (timeout > 0) await new Promise((r) => setTimeout(r, timeout));
    const currentURL = sanitizeURL(window.location.href);
    return currentURL.href === url.href;
}

export async function isStillSameWebsite(timeout: number, url: URL): Promise<boolean> {
    if (timeout > 0) await new Promise((r) => setTimeout(r, timeout));
    return window.location.origin === url.origin;
}

export async function isSupportedFeature(
    versionInfo: GuessVersion,
    featureSupportedVersion: string[]
): Promise<boolean> {
    const { isOdoo, version } = versionInfo;
    if (!isOdoo) return false;
    if (!version) return false;

    const odooSupported = await isSupportedOdoo(version);
    if (!odooSupported) return false;

    return includeVersion(featureSupportedVersion, version, true);
}

export async function isSupportedOdoo(version: string): Promise<boolean> {
    const { supportedVersions } = await StorageSync.get(baseSettings);
    return includeVersion(supportedVersions, version);
}

export async function isAuthorizedFeature(featureID: string, url: URL): Promise<boolean> {
    const key = `${featureID}Enabled`;
    const configuration = await StorageSync.get({
        [key]: false,
    });
    if (!configuration[key]) return false;

    const authorizedFeature = await authorizeFeature(featureID, url.origin);
    return authorizedFeature;
}

export async function isAuthorizedLimitedFeature(featureID: string, url: URL): Promise<boolean> {
    const key = `${featureID}Enabled`;
    const configKey = `${featureID}LimitedOrigins`;
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
        .filter((o: string) => o.startsWith(regexSchemePrefix))
        .map((o: string) => new RegExp(o.replace(regexSchemePrefix, '')));
    const validRegex = activeRegex.some((r: RegExp) => r.test(origin));

    return validRegex;
}

async function authorizeFeature(featureID: string, origin: string): Promise<boolean> {
    const { offs } = await StorageLocal.get({ offs: [] });
    if (offs.includes(origin)) {
        return false;
    }

    const configuration = await StorageSync.get({
        originsFilterOrigins: {},
        [`${featureID}Enabled`]: false,
        [`${featureID}WhitelistMode`]: true,
    });

    if (!configuration[`${featureID}Enabled`]) return false;

    const activeOrigins = getActiveFeatureOrigins(configuration.originsFilterOrigins, featureID);
    const activeRegex = activeOrigins
        .filter((o) => o.startsWith(regexSchemePrefix))
        .map((o) => new RegExp(o.replace(regexSchemePrefix, '')));

    const originExist = activeOrigins.includes(origin) || activeRegex.some((r) => r.test(origin));

    const isWhitelistMode = configuration[`${featureID}WhitelistMode`];
    if (isWhitelistMode) {
        return originExist;
    }

    if (!isWhitelistMode) {
        return !originExist;
    }

    return false;
}

function getActiveFeatureOrigins(originsFilterOrigins: object, featureID: string | number): string[] {
    const enabledOrigins = Object.entries(originsFilterOrigins)
        .filter((origin) => origin[1][featureID] === true)
        .map((origin) => origin[0]);
    return enabledOrigins;
}

export function includeVersion(versions: string[], version: string, empty = false): boolean {
    const supportedVersions = Array.isArray(versions) ? versions : [versions];
    if (supportedVersions.length === 0) return empty;
    if (supportedVersions.includes(version)) return true;

    const versionNum = sanitizeVersion(version);
    if (ValueIsNaN(versionNum)) return false;

    const uniqueOperator = versions.length === 1;

    for (const supportedVersion of supportedVersions) {
        const sanitizedVersion = sanitizeVersion(supportedVersion);
        if (!sanitizedVersion) continue;
        if (isVersionSupported(sanitizedVersion, versionNum, uniqueOperator)) return true;
    }

    return false;
}

function isVersionSupported(supportedVersion: string, version: string, uniqueOperator: boolean): boolean {
    const supportedVersionNum = Number.parseFloat(supportedVersion);
    if (ValueIsNaN(supportedVersionNum)) return false;

    const versionNum = Number.parseFloat(version);
    if (ValueIsNaN(versionNum)) return false;

    if (supportedVersion.endsWith('+')) {
        if (uniqueOperator) return versionNum >= supportedVersionNum;
        console.warn('Version operator "+" cannot be used with other values, with ":" for range');
        return false;
    }

    if (supportedVersion.endsWith('-')) {
        if (uniqueOperator) return versionNum < supportedVersionNum;
        console.warn('Version operator "-" cannot be used with other values, with ":" for range');
        return false;
    }

    if (supportedVersion.includes(':')) {
        const fromTo = supportedVersion.split(':');
        const minimum = Number.parseFloat(fromTo[0]);
        const maximum = Number.parseFloat(fromTo[1]);
        if (ValueIsNaN(minimum) || ValueIsNaN(maximum)) {
            console.warn(`Invalid range for operator ":" --> ${supportedVersion}`);
            return false;
        }
        return versionNum >= minimum && versionNum < maximum;
    }
    return versionNum === supportedVersionNum;
}
