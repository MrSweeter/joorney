import { getFeaturesAndCurrentSettings } from '../../configuration.js';
import { escapeHTML } from '../../src/html_generator.js';
import { Console, Runtime } from '../../src/utils/browser.js';
import { applyI18n, initI18n, t } from '../../src/utils/i18n.js';
import { iconHTML } from '../../src/utils/icons.js';
import { dispatchUIEvent, UI_EVENTS } from './ui/events.js';

/**
 * Options page layout: menu rendering (top items + "More" dropdown), routing and page loading.
 *
 * Routes are query strings: '?page=<page id>' plus page parameters (e.g. '&feature=<id>'). Same-page links
 * to a route ('<a href="?page=...">') load the page without reloading the options page; the history keeps
 * them (back/forward). 'debug' is kept across routes, it shows the developer menus on reload.
 */

const MENU_ITEMS_CONTAINER = 'joorney-menu-items-container';
const PAGE_CONTAINER = 'joorney-page-container';
const MORE_BUTTON = 'joorney-menu-more';
const MORE_LIST = 'joorney-menu-more-list';
const KEPT_PARAMS = ['debug'];

let registeredPages = [];
let pageLoadedCallback;
let loadToken = 0;
let currentPage;
let routingReady = false;

//#region Routes
export function parseRoute(search = window.location.search) {
    const searchParams = new URLSearchParams(search);
    const page = searchParams.get('page');
    searchParams.delete('page');
    return { page, params: Object.fromEntries(searchParams) };
}

/**
 * @param {string} pageID
 * @param {object} [params] e.g. { feature: 'themeSwitch' }
 * @returns {string} '?page=<id>&...' with the kept parameters of the current URL (debug)
 */
export function routeURL(pageID, params = {}) {
    const current = new URLSearchParams(window.location.search);
    const searchParams = new URLSearchParams({ page: pageID });
    for (const key of KEPT_PARAMS) if (current.has(key) && !(key in params)) searchParams.set(key, current.get(key));
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) searchParams.set(key, value);
    }
    return `?${searchParams.toString()}`;
}

export function getCurrentPage() {
    return currentPage;
}

export async function navigate(pageID, params = {}, { push = true } = {}) {
    const page = registeredPages.find((p) => p.id === pageID);
    if (!page) return false;
    const url = routeURL(pageID, params);
    if (push && url !== window.location.search) window.history.pushState({ page: pageID }, '', url);
    else window.history.replaceState({ page: pageID }, '', url);
    await loadPage(page, params);
    return true;
}

function isRouteLink(link, event) {
    if (!link || event.defaultPrevented || event.button !== 0) return false;
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return false;
    if (link.target && link.target !== '_self') return false;
    if (link.hasAttribute('download')) return false;
    const href = link.getAttribute('href');
    return Boolean(href?.startsWith('?'));
}

async function onDocumentClick(event) {
    const link = event.target.closest('a[href]');
    if (!isRouteLink(link, event)) return;
    const { page, params } = parseRoute(link.getAttribute('href'));
    if (!page) return;
    event.preventDefault();
    closeMoreMenu();
    delete params.debug;
    await navigate(page, params);
}

function onPopState() {
    const { page, params } = parseRoute();
    const target = registeredPages.find((p) => p.id === page);
    if (target) loadPage(target, params);
}

function setupRouting() {
    if (routingReady) return;
    routingReady = true;
    document.addEventListener('click', onDocumentClick);
    window.addEventListener('popstate', onPopState);
}
//#endregion

//#region Menus
/**
 * Render the menu of the pages and open the default one.
 * Pages without group are top items (page.hidden: not in the menu, page.activeMenu: the entry shown active); group 'more' goes in the "More" dropdown, 'technical' pages are hidden
 * unless debug (class joorney-tech-menu, see options/index.js).
 * @param {object[]} pages page definitions, see options/menu.js
 * @param {object} defaultPage page opened first
 * @param {function} [onPageLoaded] called with the page once it is loaded
 * @param {object} [defaultParams] parameters of the default page (from the URL)
 */
export function loadMenus(pages, defaultPage, onPageLoaded = undefined, defaultParams = {}) {
    registeredPages = pages;
    pageLoadedCallback = onPageLoaded;
    setupRouting();

    const container = document.getElementById(MENU_ITEMS_CONTAINER);
    container.innerHTML = '';
    const morePages = [];
    for (const page of pages.filter((p) => !p.hidden)) {
        if (page.group === 'more') morePages.push(page);
        else container.appendChild(menuItemElement(page));
    }
    if (morePages.length) container.appendChild(moreMenuElement(morePages));

    navigate(defaultPage.id, defaultParams, { push: false });
}

function menuItemElement(page) {
    const template = document.createElement('template');
    template.innerHTML = `
        <li class="joorney-nav-item ${page.technical ? 'joorney-tech-menu' : ''}">
            <a id="${escapeHTML(page.id)}" class="joorney-menu-item joorney-nav-link" href="${escapeHTML(routeURL(page.id))}">
                ${escapeHTML(t(page.labelKey))}
            </a>
        </li>
    `.trim();
    return template.content.firstChild;
}

function moreItemHTML(page) {
    return `
        <li role="none" class="${page.technical ? 'joorney-tech-menu' : ''}">
            <a id="${escapeHTML(page.id)}" role="menuitem" tabindex="-1" class="joorney-menu-item joorney-dropdown-item" href="${escapeHTML(routeURL(page.id))}">
                ${page.icon ? iconHTML(page.icon) : ''}
                <span>${escapeHTML(t(page.labelKey))}</span>
                ${page.technical ? `<span class="joorney-chip">${escapeHTML(t('options_menu_debugChip'))}</span>` : ''}
                <span class="joorney-nav-badge d-none" data-menu-badge aria-hidden="true"></span>
            </a>
        </li>
    `;
}

function moreMenuElement(pages) {
    const items = [];
    for (const [index, page] of pages.entries()) {
        // Developer pages are set apart; the separator hides with them
        if (page.technical && index > 0 && !pages[index - 1].technical)
            items.push('<li role="separator" class="joorney-dropdown-separator joorney-tech-menu"></li>');
        items.push(moreItemHTML(page));
    }

    const template = document.createElement('template');
    template.innerHTML = `
        <li class="joorney-nav-item">
            <button type="button" id="${MORE_BUTTON}" class="joorney-nav-link" aria-haspopup="menu" aria-expanded="false" aria-controls="${MORE_LIST}">
                <span>${escapeHTML(t('options_menu_more'))}</span>
                <span class="joorney-nav-badge d-none" data-menu-badge aria-hidden="true"></span>
                ${iconHTML('expand_more')}
            </button>
            <ul id="${MORE_LIST}" class="joorney-dropdown" role="menu" aria-labelledby="${MORE_BUTTON}" hidden>
                ${items.join('')}
            </ul>
        </li>
    `.trim();
    const element = template.content.firstChild;
    setupMoreMenu(element.querySelector(`#${MORE_BUTTON}`), element.querySelector(`#${MORE_LIST}`));
    return element;
}

function visibleMoreItems(list) {
    return Array.from(list.querySelectorAll('[role="menuitem"]')).filter((i) => !i.closest('.d-none'));
}

let moreMenuCleanup;
function closeMoreMenu({ focusButton = false } = {}) {
    const button = document.getElementById(MORE_BUTTON);
    const list = document.getElementById(MORE_LIST);
    if (!button || !list || list.hidden) return;
    list.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    moreMenuCleanup?.();
    moreMenuCleanup = undefined;
    if (focusButton) button.focus();
}

function openMoreMenu(focus = undefined) {
    const button = document.getElementById(MORE_BUTTON);
    const list = document.getElementById(MORE_LIST);
    list.hidden = false;
    button.setAttribute('aria-expanded', 'true');

    const onOutside = (event) => {
        if (!button.contains(event.target) && !list.contains(event.target)) closeMoreMenu();
    };
    document.addEventListener('pointerdown', onOutside, true);
    moreMenuCleanup = () => document.removeEventListener('pointerdown', onOutside, true);

    const items = visibleMoreItems(list);
    if (focus === 'first') items[0]?.focus();
    else if (focus === 'last') items.at(-1)?.focus();
}

function setupMoreMenu(button, list) {
    button.addEventListener('click', () => {
        if (list.hidden) openMoreMenu();
        else closeMoreMenu();
    });
    // Key on the button -> item focused when the menu opens
    const openFocus = { ArrowDown: 'first', Enter: 'first', ' ': 'first', ArrowUp: 'last' };
    button.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMoreMenu({ focusButton: true });
            return;
        }
        const focus = openFocus[event.key];
        if (!focus) return;
        event.preventDefault();
        openMoreMenu(focus);
    });
    list.addEventListener('keydown', (event) => {
        // Tab closes the menu but keeps its default move to the next element
        if (event.key === 'Tab') {
            closeMoreMenu();
            return;
        }
        const items = visibleMoreItems(list);
        const index = items.indexOf(document.activeElement);
        const handler = {
            ArrowDown: () => items[(index + 1) % items.length]?.focus(),
            ArrowUp: () => items[(index - 1 + items.length) % items.length]?.focus(),
            Home: () => items[0]?.focus(),
            End: () => items.at(-1)?.focus(),
            Escape: () => closeMoreMenu({ focusButton: true }),
        }[event.key];
        if (!handler) return;
        event.preventDefault();
        handler();
    });
}

export function setMenuBadge(pageID, show, label = '') {
    const item = document.getElementById(pageID);
    if (!item) return;
    const badges = [item.querySelector('[data-menu-badge]')];
    if (item.closest(`#${MORE_LIST}`)) badges.push(document.querySelector(`#${MORE_BUTTON} [data-menu-badge]`));
    for (const badge of badges.filter(Boolean)) {
        badge.classList.toggle('d-none', !show);
        badge.title = show ? label : '';
    }
    if (label) item.setAttribute('aria-description', show ? label : '');
}
//#endregion

//#region Pages
async function loadPage(page, params = {}) {
    const token = ++loadToken;
    dispatchUIEvent(UI_EVENTS.PAGE_CHANGE, { page, params });
    const container = document.getElementById(PAGE_CONTAINER);
    let data;
    let settings;
    try {
        const response = await fetch(page.path);
        data = await response.text();
        settings = await getFeaturesAndCurrentSettings();
        await initI18n();
    } catch (error) {
        Console.error(error);
        if (token !== loadToken) return;
        // The previous page already dropped its listeners (PAGE_CHANGE): do not leave it on screen
        container.innerHTML = `<p class="joorney-error" role="alert">${iconHTML('error')}${escapeHTML(t('options_error_pageLoad', error?.message ?? String(error)))}</p>`;
        currentPage = page;
        updateActiveMenu(page.activeMenu ?? page.id);
        return;
    }
    // A newer navigation started meanwhile: let it win
    if (token !== loadToken) return;
    container.innerHTML = data;
    applyI18n(container);
    currentPage = page;
    Promise.resolve(page.loader(settings.features, settings.currentSettings, params)).catch((error) =>
        Console.error(error)
    );
    updateActiveMenu(page.activeMenu ?? page.id);
    pageLoadedCallback?.(page);
}

function updateActiveMenu(menu) {
    let activeInMore = false;
    for (const e of document.getElementsByClassName('joorney-menu-item')) {
        const active = e.id === menu;
        e.classList.toggle('active', active);
        if (active) e.setAttribute('aria-current', 'page');
        else e.removeAttribute('aria-current');
        if (active && e.closest(`#${MORE_LIST}`)) activeInMore = true;
    }
    document.getElementById(MORE_BUTTON)?.classList.toggle('active', activeInMore);
}
//#endregion

export function loadManifest() {
    const manifest = Runtime.getManifest();
    const element = document.getElementById('joorney-manifest');
    element.textContent = `v${manifest.version_name}`;
    element.title = `Joorney ${manifest.version_name} (${manifest.version})`;
}
