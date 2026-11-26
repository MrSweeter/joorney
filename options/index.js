import { closeAnnounce } from '../src/api/local.js';
import { getNextTourID } from '../src/checklist/index.js';
import ChecklistManager from '../src/checklist/manager.js';
import { isDevMode } from '../src/utils/browser.js';
import { getAnnounce, refreshSupportedVersions } from '../src/utils/check_version.js';
import { applyI18n, initI18n, t } from '../src/utils/i18n.js';
import { checkConfigurationVersion } from './import_export.js';
import { PAGES } from './menu.js';
import { PAGE as IMPORT_EXPORT_PAGE } from './pages/importexport/index.js';
import { load as loadShortcut } from './src/keyboard_shortcut.js';
import { loadManifest, loadMenus, parseRoute, setMenuBadge } from './src/layout.js';

async function onDOMContentLoaded() {
    // Before the menus and the checklist: they render translated text
    await initI18n();
    applyI18n(document);
    document.getElementById('copyright-year').textContent = new Date().getFullYear();
    //document.getElementById('copyright-link').href = Runtime.getManifest().homepage_url; Not public API

    const announce = await getAnnounce();
    await refreshSupportedVersions();

    await loadOptionMenus(announce);
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
    const params = route.page === defaultMenu.id ? route.params : {};
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

async function loadAnnouncement(announce) {
    if (!announce) return;
    const announceElement = document.getElementById('joorney-announcement');
    let show = false;
    if (announce.title) {
        document.getElementById('ja-title').innerHTML = announce.title;
        document.getElementById('ja-version').textContent = announce.version ? `[${announce.version}] ` : '';
        document.getElementById('ja-title').parentElement.classList.toggle('d-none');
        show = true;
    }
    if (announce.description) {
        document.getElementById('ja-description').innerHTML = announce.description;
        document.getElementById('ja-description').classList.toggle('d-none');
        show = true;
    }
    if (announce.closeable) {
        document.getElementById('ja-close').onclick = () => {
            closeAnnounce(announce);
            announceElement.parentElement.classList.add('d-none');
        };
        document.getElementById('ja-close').classList.toggle('d-none');
    }
    if (show) announceElement.parentElement.classList.toggle('d-none');
}
