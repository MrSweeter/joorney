// import { getVersionInfo } from '../api/odoo.js';
import { SessionKey, getSessionData } from '../api/session.js';

const DEFAULT_VERSION = { isOdoo: false };

export const SUPPORTED_VERSION = [
    // '15.0', October 2024
    // 'saas-15.2',
    '16.0',
    'saas-16.1',
    'saas-16.2',
    'saas-16.3',
    'saas-16.4',
    '17.0',
    'saas-17.1',
    'saas-17.2',
    'saas-17.3',
    'saas-17.4',
    '18.0',
    'saas-18.1',
    //'saas-18.2', // master
].map((v) => sanitizeVersion(v));

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
