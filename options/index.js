import { getFeaturesAndCurrentSettings } from '../configuration.js';
import { getOdooData } from '../src/api/github.js';
import { closeAnnounce } from '../src/api/local.js';
import { getNextTourID } from '../src/checklist/index.js';
import ChecklistManager from '../src/checklist/manager.js';
import { stringToHTML } from '../src/html_generator.js';
import { Runtime, isDevMode } from '../src/utils/browser.js';
import { getAnnounce } from '../src/utils/check_version.js';
import { updateSupportedDevelopmentVersion, updateSupportedVersion } from '../src/utils/version.js';
import { initImportExport } from './import_export.js';
import { PAGES } from './menu.js';
import { load as loadShortcut } from './src/keyboard_shortcut.js';

const MENU_ITEMS_CONTAINER = 'joorney-menu-items-container';
const PAGE_CONTAINER = 'joorney-page-container';

async function onDOMContentLoaded() {
    document.getElementById('copyright-year').innerText = new Date().getFullYear();
    //document.getElementById('copyright-link').href = Runtime.getManifest().homepage_url; Not public API

    initImportExport();

    const announce = await getAnnounce();
    const odooData = await getOdooData();
    updateSupportedVersion(odooData?.availableOdooVersions);
    await updateSupportedDevelopmentVersion(odooData?.developmentOdooVersions);

    await loadMenus(announce);
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

async function loadMenus(announce) {
    const container = document.getElementById(MENU_ITEMS_CONTAINER);
    container.innerHTML = '';
    for (const page of PAGES) {
        loadMenu(page, container);
    }

    const defaultMenu = await getDefaultMenu(PAGES, announce);

    document.getElementById(defaultMenu.id).click();
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

function loadMenu(page, container) {
    const template = document.createElement('template');
    template.innerHTML = `
        <li id="${page.id}" class="joorney-menu-item ${page.technical ? 'joorney-tech-menu' : ''} nav-item nav-link">
            ${page.label}
        </li>
    `.trim();

    template.content.firstChild.onclick = () => {
        loadPage(page);
    };

    container.appendChild(template.content.firstChild);
}

async function loadPage(page) {
    const response = await fetch(page.path);
    const data = await response.text();
    const { features, currentSettings } = await getFeaturesAndCurrentSettings();
    document.getElementById(PAGE_CONTAINER).innerHTML = data;
    page.loader(features, currentSettings);
    updateActiveMenu(page.id);
    updateMenuTour(page.tour);
}

function updateActiveMenu(menu) {
    for (const e of document.getElementsByClassName('joorney-menu-item')) {
        if (e.id === menu) e.classList.add('active');
        else e.classList.remove('active');
    }
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

async function loadManifest() {
    const manifest = Runtime.getManifest();
    const element = document.getElementById('joorney-manifest');
    element.innerHTML = '';
    const versionElement = stringToHTML(
        `<p class="small m-0 text-muted opacity-25 position-absolute">Joorney ${manifest.version_name} (${manifest.version})`
    );
    element.appendChild(versionElement);
}
