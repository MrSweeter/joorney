import { Runtime } from './browser.js';

/**
 * Material Symbols icons (assets/icons): the font is a subset, add any new name to scripts/icons.json.
 * Markup: <i class="joorney-icon" data-icon="<name>" aria-hidden="true"></i>, styled by assets/icons/icons.css.
 */

const ICON_CLASS = 'joorney-icon';
const FILLED_CLASS = 'joorney-icon-filled';
const ICON_STYLESHEET_ID = 'joorney-icons-stylesheet';

/**
 * @param {string} name Material Symbols name (e.g. 'delete')
 * @param {object} [options]
 * @param {boolean} [options.filled] filled variant (FILL axis)
 * @param {string} [options.classes] extra classes (sizes like joorney-icon-lg, margins…)
 * @param {string} [options.attributes] extra raw attributes (id, title, style…)
 * @returns {string} the <i> element HTML
 */
export function iconHTML(name, { filled = false, classes = '', attributes = '' } = {}) {
    const className = [ICON_CLASS, filled ? FILLED_CLASS : '', classes].filter(Boolean).join(' ');
    return `<i class="${className}" data-icon="${name}" aria-hidden="true"${attributes ? ` ${attributes}` : ''}></i>`;
}

/**
 * Change the icon of an existing element (play/pause, star on/off…).
 * @param {HTMLElement} element
 * @param {string} name Material Symbols name
 * @param {boolean} [filled]
 */
export function setIcon(element, name, filled = undefined) {
    element.dataset.icon = name;
    if (filled !== undefined) element.classList.toggle(FILLED_CLASS, filled);
}

/**
 * Content scripts: load the icon stylesheet in the host page (Odoo, runbot), once.
 * The stylesheet and its font are web accessible resources (manifest.json); the font URL is relative to the
 * stylesheet, so it resolves inside the extension.
 */
export function injectIconStylesheet() {
    if (document.getElementById(ICON_STYLESHEET_ID)) return;
    const link = document.createElement('link');
    link.id = ICON_STYLESHEET_ID;
    link.rel = 'stylesheet';
    link.href = Runtime.getURL('assets/icons/icons.css');
    (document.head ?? document.documentElement).appendChild(link);
}
