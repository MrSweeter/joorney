import en from '../../_locales/en/messages.json';
import fr from '../../_locales/fr/messages.json';
import { baseSettings } from '../../configuration.js';
import { getOdooLanguage } from '../api/local.js';
import { Console, I18n, StorageSync } from './browser.js';

/**
 * chrome.i18n.getMessage always follows the browser language and can't be switched at runtime.
 * _locales/ stays the single source (manifest __MSG_ keys use it natively), but JS reads the
 * catalogs bundled here, so the language can follow the system, the Odoo user or a static choice.
 */

// Keyed by _locales folder code ('en', 'fr', a regional one would be 'pt_BR')
export const LANGUAGES = {
    en: { label: 'English', messages: indexCatalog(en) },
    fr: { label: 'Français', messages: indexCatalog(fr) },
};
const DEFAULT_LANGUAGE = 'en';

// Message and placeholder names are case-insensitive (Chrome i18n message format)
function indexCatalog(catalog) {
    const index = new Map();
    for (const [name, entry] of Object.entries(catalog)) {
        const placeholders = Object.fromEntries(
            Object.entries(entry.placeholders ?? {}).map(([placeholder, value]) => [placeholder.toLowerCase(), value])
        );
        index.set(name.toLowerCase(), { ...entry, placeholders });
    }
    return index;
}

export const LANGUAGE_MODE = {
    SYSTEM: 'system',
    ODOO: 'odoo',
    STATIC: 'static',
};

// Set by initI18n only: undefined means t() is used without context (see t)
let currentLanguage = undefined;
const keysUsedBeforeInit = new Set();

function findLanguage(code) {
    const lower = code.toLowerCase();
    return Object.keys(LANGUAGES).find((lang) => lang.toLowerCase() === lower);
}

/**
 * Most specific supported language, same search as Chrome: 'fr_BE' (Odoo) / 'fr-BE' (browser) => 'fr_BE' if
 * available, else 'fr', else the default language.
 */
export function normalizeLanguage(lang) {
    const code = `${lang ?? ''}`.replaceAll('-', '_');
    return findLanguage(code) ?? findLanguage(code.split('_')[0]) ?? DEFAULT_LANGUAGE;
}

// Fallback chain for sparse catalogs: 'pt_BR' -> 'pt' -> default language
function getLanguageChain(lang) {
    return [lang, findLanguage(lang.split('_')[0]), DEFAULT_LANGUAGE].filter(Boolean);
}

function getSystemLanguage() {
    return I18n?.getUILanguage?.() ?? navigator.language;
}

async function readLanguage({ origin, odooLang }) {
    const { languageMode, languageStatic } = await StorageSync.get({
        languageMode: baseSettings.languageMode,
        languageStatic: baseSettings.languageStatic,
    });
    switch (languageMode) {
        case LANGUAGE_MODE.STATIC:
            return languageStatic;
        case LANGUAGE_MODE.ODOO: {
            const lang = odooLang ?? (origin ? await getOdooLanguage(origin) : undefined);
            if (lang) return lang;
            break;
        }
    }
    return getSystemLanguage();
}

/**
 * Resolve the language for a context, without changing the current one.
 * Use it with translate() where several contexts are served at once (background: context menu per tab, omnibox).
 * @param {{origin?: string, odooLang?: string}} context origin: last Odoo language seen on it, odooLang: from the session
 * @returns {Promise<string>} supported language code
 */
export async function resolveLanguage(context = {}) {
    try {
        return normalizeLanguage(await readLanguage(context));
    } catch (err) {
        Console.warn(err);
        return normalizeLanguage(getSystemLanguage());
    }
}

/**
 * Resolve and set the current language (used by t), call it before rendering translated strings.
 * For single-context scripts: content script, popup, options pages.
 */
export async function initI18n(context = {}) {
    currentLanguage = await resolveLanguage(context);
    return currentLanguage;
}

export function getLanguage() {
    return currentLanguage ?? normalizeLanguage(getSystemLanguage());
}

function getEntry(lang, key) {
    const name = key.toLowerCase();
    for (const code of getLanguageChain(lang)) {
        const entry = LANGUAGES[code]?.messages.get(name);
        if (entry) return entry;
    }
    return undefined;
}

export function hasMessage(key, lang = getLanguage()) {
    return Boolean(getEntry(lang, key));
}

// Same format as chrome.i18n: '$name$' -> placeholders.name.content, then '$1'..'$9' -> substitutions, '$$' -> '$'
function format(entry, substitutions) {
    const message = entry.message.replace(
        /\$([a-zA-Z0-9_@]+)\$/g,
        (match, name) => entry.placeholders[name.toLowerCase()]?.content ?? match
    );
    return message.replace(/\$(\$|[1-9])/g, (_match, group) =>
        group === '$' ? '$' : `${substitutions[Number(group) - 1] ?? ''}`
    );
}

/**
 * Translate a message of _locales/<lang>/messages.json in the given language.
 * The result is plain text: escape it (escapeHTML) before inserting it in an HTML template.
 */
export function translate(lang, key, ...substitutions) {
    const entry = getEntry(lang, key);
    if (!entry) {
        Console.warn(`[i18n] Missing message: ${key}`);
        return key;
    }
    return format(entry, substitutions);
}

/**
 * Translate in the current language, set by initI18n() (content script, popup, options pages).
 * Not for the background: it serves several tabs at once, use resolveLanguage() + translate() there.
 */
export function t(key, ...substitutions) {
    if (!currentLanguage && !keysUsedBeforeInit.has(key)) {
        // Once per key: the browser language is used, language modes ('odoo', chosen language) are ignored
        keysUsedBeforeInit.add(key);
        Console.warn(
            `[i18n] t('${key}') called before initI18n(): browser language used. In the background, use resolveLanguage() + translate()`
        );
    }
    return translate(getLanguage(), key, ...substitutions);
}

export function featureName(feature, lang = getLanguage()) {
    const key = `feature_${feature.id}_name`;
    return hasMessage(key, lang) ? translate(lang, key) : feature.display_name ?? feature.id;
}

const ATTRIBUTES = [
    ['data-i18n-title', 'title'],
    ['data-i18n-placeholder', 'placeholder'],
    ['data-i18n-aria-label', 'aria-label'],
];

export function applyI18n(root = document) {
    if (root instanceof Document) {
        // Replaces @@ui_locale / @@bidi_dir, which follow the browser and not the language mode.
        // Only LTR languages for now: use the language direction when a RTL one is added.
        root.documentElement.lang = getLanguage().replace('_', '-');
        root.documentElement.dir = 'ltr';
    }
    for (const element of root.querySelectorAll('[data-i18n]')) {
        element.textContent = t(element.getAttribute('data-i18n'));
    }
    for (const [dataAttribute, attribute] of ATTRIBUTES) {
        for (const element of root.querySelectorAll(`[${dataAttribute}]`)) {
            element.setAttribute(attribute, t(element.getAttribute(dataAttribute)));
        }
    }
}
