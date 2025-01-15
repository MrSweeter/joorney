// import { getVersionInfo } from '../api/odoo.js';
import { SessionKey, getSessionData } from '../api/session.js';

const DEFAULT_VERSION = { isOdoo: false };

export let SUPPORTED_VERSION = ['16.0']; // Minimal supported version for extension versioning

export function updateSupportedVersion(versionsArg) {
    let versions = versionsArg;
    if (!versions || versions.length === 0) versions = ['18.0']; // Use current Odoo long-term version
    SUPPORTED_VERSION = versions.map((v) => sanitizeVersion(v));
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
