import { closeAnnounce, reopenAnnounce } from '../src/api/local.js';
import { escapeHTML } from '../src/html_generator.js';
import { isDevMode } from '../src/utils/browser.js';
import { getAnnounce, refreshSupportedVersions } from '../src/utils/check_version.js';
import { applyI18n, initI18n, t } from '../src/utils/i18n.js';
import { iconHTML } from '../src/utils/icons.js';
import { checkConfigurationVersion } from './import_export.js';
import { PAGES } from './menu.js';
import { PAGE as IMPORT_EXPORT_PAGE } from './pages/importexport/index.js';
import { getNextTourID } from './src/checklist/index.js';
import ChecklistManager from './src/checklist/manager.js';
import { load as loadShortcut } from './src/keyboard_shortcut.js';
import { loadManifest, loadMenus, navigate, parseRoute, setMenuBadge } from './src/layout.js';
import { UI_EVENTS } from './src/ui/events.js';

async function onDOMContentLoaded() {
    // Before the menus and the checklist: they render translated text
    await initI18n();
    applyI18n(document);
    document.getElementById('copyright-year').textContent = new Date().getFullYear();
    //document.getElementById('copyright-link').href = Runtime.getManifest().homepage_url; Not public API

    // Closed ones too: the footer offers to restore it. Only an open one chooses the page to open.
    const announce = await getAnnounce({ includeClosed: true });
    await refreshSupportedVersions();

    await loadOptionMenus(announce?.closed ? undefined : announce);
    loadShortcut();
    showMigrationBadge();

    const searchParams = new URLSearchParams(window.location.search);
    toggleTechnicalMenus(!searchParams.get('debug') && !(await isDevMode()));
    document.getElementById('joorney-brand-debug').onclick = () => toggleTechnicalMenus();

    ChecklistManager.load();

    loadAnnouncement(announce);
    loadManifest();
}

document.removeEventListener('DOMContentLoaded', onDOMContentLoaded);
document.addEventListener('DOMContentLoaded', onDOMContentLoaded);

function toggleTechnicalMenus(force = undefined) {
    for (const element of document.getElementsByClassName('joorney-tech-menu')) {
        element.classList.toggle('d-none', force);
    }
}

async function loadOptionMenus(announce) {
    const defaultMenu = await getDefaultMenu(PAGES, announce);
    // Route parameters of the opened URL (e.g. ?page=page-feature&feature=<id>), for that page only
    const route = parseRoute();
    // Opened without a route, on the page of the next tour: that page may need params (the feature page)
    const params = route.page === defaultMenu.id ? route.params : route.page ? {} : (defaultMenu.tourParams ?? {});
    loadMenus(PAGES, defaultMenu, (page) => updateMenuTour(page.tour), params);
}

async function showMigrationBadge() {
    const { outdated } = await checkConfigurationVersion();
    setMenuBadge(IMPORT_EXPORT_PAGE.id, outdated, t('options_migrateNeeded'));
}

async function getDefaultMenu(pageMenus, announce) {
    // Reopened page after a reload (language change, link to a page)
    const pageParam = parseRoute().page;
    const pageMenu = pageParam && pageMenus.find((m) => m.id === pageParam);
    if (pageMenu) return pageMenu;

    if (announce?.menu) {
        const menu = pageMenus.find((m) => m.id === announce.menu);
        if (menu) return menu;
    }

    const defaultMenuTour = await getNextTourID();
    const defaultMenu =
        pageMenus.find((m) => (defaultMenuTour ? m.tour === defaultMenuTour : m.default)) ?? pageMenus[0];

    return defaultMenu;
}

function updateMenuTour(tourID) {
    ChecklistManager.onboard(tourID);
}

//#region Announcement
const ANNOUNCE_ALLOWED_TAGS = ['B', 'STRONG', 'I', 'EM', 'CODE', 'BR'];
// Content of these is code, not a message: never shown as text
const ANNOUNCE_DROPPED_TAGS = ['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT'];

function sanitizeAnnounceHTML(html) {
    const fragment = document.createDocumentFragment();
    const source = new DOMParser().parseFromString(`<body>${String(html ?? '')}</body>`, 'text/html').body;
    copyAllowed(source, fragment);
    return fragment;
}

function copyAllowed(source, target) {
    for (const node of source.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            target.appendChild(document.createTextNode(node.textContent));
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (ANNOUNCE_DROPPED_TAGS.includes(node.tagName)) continue;
            if (ANNOUNCE_ALLOWED_TAGS.includes(node.tagName)) {
                const element = document.createElement(node.tagName.toLowerCase());
                copyAllowed(node, element);
                target.appendChild(element);
            } else if (node.tagName === 'A' && isHttpsLink(node.getAttribute('href'))) {
                const link = document.createElement('a');
                link.href = node.getAttribute('href');
                link.target = '_blank';
                link.rel = 'noopener';
                copyAllowed(node, link);
                target.appendChild(link);
            } else {
                copyAllowed(node, target);
            }
        }
    }
}

function isHttpsLink(href) {
    if (!href?.startsWith('https://')) return false;
    try {
        return new URL(href).protocol === 'https:';
    } catch {
        return false;
    }
}

const ANNOUNCE_KINDS = {
    release: {
        icon: 'campaign',
        labelKey: 'options_announce_label_release',
        detailsKey: 'options_announce_seeWhatsNew',
    },
    info: { icon: 'info', labelKey: 'options_announce_label_info', detailsKey: 'options_announce_seeDetails' },
    warning: { icon: 'warning', labelKey: 'options_announce_label_warning', detailsKey: 'options_announce_seeDetails' },
};
const ANNOUNCE_COLLAPSE_MS = 300;

function announceHTML(announce, targetPage) {
    const { kind } = announce;
    const hasItems = announce.items.length > 0;
    const chip = kind === 'release' && announce.version ? announce.version.split('.').slice(0, 2).join('.') : '';
    const detailsLabel = t(ANNOUNCE_KINDS[kind].detailsKey);
    return `
        <div class="joorney-announce-clip">
            <div class="joorney-announce-inner">
                <section class="joorney-announce is-${kind}" aria-label="${escapeHTML(t(ANNOUNCE_KINDS[kind].labelKey))}">
                    <div class="joorney-announce-row">
                        <span class="joorney-announce-tile">${iconHTML(ANNOUNCE_KINDS[kind].icon, { classes: 'joorney-icon-lg' })}</span>
                        <div class="joorney-announce-body">
                            <div class="joorney-announce-heading">
                                ${chip ? `<span class="joorney-announce-chip">${escapeHTML(t('options_announce_newIn', chip))}</span>` : ''}
                                <h2 class="joorney-announce-title" tabindex="-1" data-announce="title"></h2>
                            </div>
                            <p class="joorney-announce-message" data-announce="message"></p>
                        </div>
                        <div class="joorney-announce-actions">
                            ${
                                hasItems
                                    ? `<button type="button" class="joorney-btn" data-announce="details" data-label="${escapeHTML(detailsLabel)}" aria-expanded="false" aria-controls="joorney-announce-panel">${escapeHTML(detailsLabel)}</button>`
                                    : ''
                            }
                            ${
                                targetPage
                                    ? `<button type="button" class="joorney-btn is-secondary" data-announce="open"><span>${escapeHTML(t('options_announce_openPage', t(targetPage.labelKey)))}</span>${iconHTML('arrow_forward')}</button>`
                                    : ''
                            }
                            ${
                                announce.closeable
                                    ? `<button type="button" class="joorney-icon-btn" data-announce="close" title="${escapeHTML(t('options_announce_close'))}" aria-label="${escapeHTML(t('options_announce_close'))}">${iconHTML('close')}</button>`
                                    : ''
                            }
                        </div>
                    </div>
                    ${hasItems ? announcePanelHTML(announce) : ''}
                </section>
            </div>
        </div>
    `;
}

function announcePanelHTML(announce) {
    const items = announce.items
        .map(
            (item) => `
                <li>
                    <span class="joorney-announce-itile">${iconHTML(item.icon)}</span>
                    <div>
                        <span class="joorney-announce-item-title">${escapeHTML(item.title)}</span>
                        ${item.description ? `<span class="joorney-announce-item-text">${escapeHTML(item.description)}</span>` : ''}
                    </div>
                </li>`
        )
        .join('');
    const notes = announce.notes
        ? `<div class="joorney-announce-notes">${iconHTML('description')}<a href="${escapeHTML(announce.notes)}" target="_blank" rel="noopener">${escapeHTML(t('options_announce_fullNotes'))}</a></div>`
        : '';
    return `<div class="joorney-announce-panel" id="joorney-announce-panel" hidden><ul class="joorney-announce-items">${items}</ul>${notes}</div>`;
}

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// The page's main heading, else the page container: keyboard and screen reader users must not lose their place
function focusPageStart() {
    const container = document.getElementById('joorney-page-container');
    const target = container.querySelector('h1') ?? container;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
}

function renderAnnouncement(announce, wrap) {
    const page = PAGES.find((p) => p.id === announce.menu);
    wrap.innerHTML = announceHTML(announce, page);
    wrap.querySelector('[data-announce="title"]').replaceChildren(sanitizeAnnounceHTML(announce.title));
    wrap.querySelector('[data-announce="message"]').replaceChildren(sanitizeAnnounceHTML(announce.description));
    if (!announce.description) wrap.querySelector('[data-announce="message"]').hidden = true;
    // navigate() sets the URL before the page loads: the route already names the page being opened
    syncOpenButton(announce, wrap, parseRoute().page);
    return wrap;
}

// "Open X" is pointless while X is the open page
function syncOpenButton(announce, wrap, pageID) {
    const open = wrap.querySelector('[data-announce="open"]');
    if (open) open.hidden = pageID === announce.menu;
}

async function loadAnnouncement(announce) {
    if (!announce) return;
    const wrap = document.getElementById('joorney-announcement');
    const restore = document.getElementById('joorney-announce-restore');
    // Nothing to say: same as no announcement
    if (!announce.title && !announce.description) return;

    const show = ({ focus = false } = {}) => {
        renderAnnouncement(announce, wrap);
        wrap.classList.remove('is-closing');
        wrap.hidden = false;
        restore.hidden = true;
        bindAnnouncement(announce, wrap, restore);
        if (focus) wrap.querySelector('[data-announce="title"]').focus();
    };

    document.addEventListener(UI_EVENTS.PAGE_CHANGE, ({ detail }) => syncOpenButton(announce, wrap, detail.page.id));

    restore.onclick = async () => {
        await reopenAnnounce(announce);
        show({ focus: true });
    };

    if (announce.closed) {
        restore.hidden = !announce.closeable;
        return;
    }
    show();
}

function bindAnnouncement(announce, wrap, restore) {
    const details = wrap.querySelector('[data-announce="details"]');
    details?.addEventListener('click', () => {
        const open = details.getAttribute('aria-expanded') !== 'true';
        details.setAttribute('aria-expanded', String(open));
        details.textContent = open ? t('options_announce_hideDetails') : details.dataset.label;
        wrap.querySelector('#joorney-announce-panel').hidden = !open;
    });

    // The button hides once its page opens: move focus to that page instead of losing it
    wrap.querySelector('[data-announce="open"]')?.addEventListener('click', async () => {
        if (await navigate(announce.menu)) focusPageStart();
    });

    wrap.querySelector('[data-announce="close"]')?.addEventListener('click', async () => {
        await closeAnnounce(announce);
        restore.hidden = false;
        const done = () => {
            wrap.hidden = true;
            wrap.classList.remove('is-closing');
            wrap.replaceChildren();
        };
        if (prefersReducedMotion()) done();
        else {
            wrap.classList.add('is-closing');
            // Restored meanwhile (show() drops is-closing): keep the banner it rendered
            setTimeout(() => wrap.classList.contains('is-closing') && done(), ANNOUNCE_COLLAPSE_MS);
        }
        focusPageStart();
    });
}
//#endregion
