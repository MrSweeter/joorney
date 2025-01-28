// import { getVersionInfo } from '../api/odoo.js';
import { SessionKey, getSessionData } from '../api/session.js';
import { isDevMode } from './browser.js';
import { setSupportedDevelopmentVersion, setSupportedVersion } from './constant.js';

const DEFAULT_VERSION = { isOdoo: false };

export function updateSupportedVersion(versionsArg) {
    let versions = versionsArg;
    if (!versions || versions.length === 0) versions = ['18.0']; // Use current Odoo long-term version
    setSupportedVersion(versions.map((v) => sanitizeVersion(v)));
}

export async function updateSupportedDevelopmentVersion(devVersionArg) {
    let versions = devVersionArg;
    const isdev = await isDevMode();
    if (!isdev || !versions) versions = [];
    setSupportedDevelopmentVersion(versions.map((v) => sanitizeVersion(v)));
}

export function getOdooVersion() {
    if (!document) return DEFAULT_VERSION;
    const serverVersionInfo = getSessionData(SessionKey.SERVER_VERSION_INFO);
    if (!serverVersionInfo) return DEFAULT_VERSION;
    return { isOdoo: true, version: serverVersionInfo.slice(0, 2).join('.') };

    // TODO[UNCOMMENT/ADAPT] only if a feature works without being logged
    // if (data.isOdoo === true && data.version === undefined) {
    //     const versionInfo = await getVersionInfo(window.location);
    //     data.version = versionInfo;
    //     element.setAttribute('content', JSON.stringify(data));
    // }
}
export function sanitizeVersion(version) {
    return `${version}`.replaceAll(/saas[~|-]/g, '');
}
