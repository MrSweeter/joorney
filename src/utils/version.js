// import { getVersionInfo } from '../api/odoo.js';

// name hardcoded by inject.js
export const META_GUESS_ELEMENT_NAME = 'odoo-qol-guess';
const DEFAULT_VERSION = { isOdoo: false };

export async function getOdooVersion() {
    if (!document) return DEFAULT_VERSION;

    const element = document.querySelector(`meta[name="${META_GUESS_ELEMENT_NAME}"]`);
    if (!element) return DEFAULT_VERSION;

    const data = JSON.parse(element.getAttribute('content')) ?? DEFAULT_VERSION;
    // TODO[UNCOMMENT] only if a feature works without being logged
    // if (data.isOdoo === true && data.version === undefined) {
    //     const versionInfo = await getVersionInfo(window.location);
    //     data.version = versionInfo;
    //     element.setAttribute('content', JSON.stringify(data));
    // }

    return data;
}
