// name hardcoded by inject.js
export const META_GUESS_ELEMENT_NAME = 'odoo-qol-guess';
const DEFAULT_VERSION = { isOdoo: false };

export function getOdooVersion() {
    if (!document) return DEFAULT_VERSION;

    const element = document.querySelector(`meta[name="${META_GUESS_ELEMENT_NAME}"]`);
    if (!element) return DEFAULT_VERSION;
    return element.getAttribute('content') ?? DEFAULT_VERSION;
}
