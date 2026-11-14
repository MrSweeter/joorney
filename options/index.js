import { closeAnnounce } from '../src/api/local.js';
import { getNextTourID } from '../src/checklist/index.js';
import ChecklistManager from '../src/checklist/manager.js';
import { isDevMode } from '../src/utils/browser.js';
import { getAnnounce, refreshSupportedVersions } from '../src/utils/check_version.js';
import { initImportExport } from './import_export.js';
import { PAGES } from './menu.js';
import { load as loadShortcut } from './src/keyboard_shortcut.js';
import { loadManifest, loadMenus } from './src/layout.js';

async function onDOMContentLoaded() {
    document.getElementById('copyright-year').innerText = new Date().getFullYear();
    //document.getElementById('copyright-link').href = Runtime.getManifest().homepage_url; Not public API

    initImportExport();

    const announce = await getAnnounce();
    await refreshSupportedVersions();

    await loadOptionMenus(announce);
    loadShortcut();

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
    loadMenus(PAGES, defaultMenu, (page) => updateMenuTour(page.tour));
}

async function getDefaultMenu(pageMenus, announce) {
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
        document.getElementById('ja-version').innerText = announce.version ? `[${announce.version}] ` : '';
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
