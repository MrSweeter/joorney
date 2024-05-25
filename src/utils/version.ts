// import { getVersionInfo } from '../api/odoo.js';

// name hardcoded by inject.js
export const META_GUESS_ELEMENT_NAME = 'joorney-guess';
const DEFAULT_VERSION = { isOdoo: false };

export async function getOdooVersion(): Promise<GuessVersion> {
    if (!document) return DEFAULT_VERSION;

    const element = document.querySelector(`meta[name="${META_GUESS_ELEMENT_NAME}"]`);
    if (!element) return DEFAULT_VERSION;

    const content = element.getAttribute('content');
    if (!content) return DEFAULT_VERSION;
    const data: GuessVersion = JSON.parse(content);
    // TODO[UNCOMMENT] only if a feature works without being logged
    // if (data.isOdoo === true && data.version === undefined) {
    //     const versionInfo = await getVersionInfo(window.location);
    //     data.version = versionInfo;
    //     element.setAttribute('content', JSON.stringify(data));
    // }

    return data;
}
export function sanitizeVersion(version: string): string {
    return `${version}`.replaceAll(/saas[~|-]/g, '');
}
