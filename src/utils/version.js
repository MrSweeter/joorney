// import { getVersionInfo } from '../api/odoo.js';
import { SessionKey, getSessionData } from '../api/session.js';

const DEFAULT_VERSION = { isOdoo: false };

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
