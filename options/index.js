import { getFeaturesAndCurrentSettings } from '../configuration.js';
import { closeAnnounce } from '../src/api/local.js';
import { getNextTourID } from '../src/checklist/index.js';
import ChecklistManager from '../src/checklist/manager.js';
import { getAnnounce, isDevMode } from '../src/utils/check_version.js';
import { initImportExport } from './import_export.js';
import { PAGES } from './menu.js';
import { load as loadShortcut } from './src/keyboard_shortcut.js';

const MENU_ITEMS_CONTAINER = 'joorney-menu-items-container';
const PAGE_CONTAINER = 'joorney-page-container';

async function onDOMContentLoaded() {
    document.getElementById('copyright-year').innerText = new Date().getFullYear();
    //document.getElementById('copyright-link').href = Runtime.getManifest().homepage_url; Not public API

    initImportExport();

    await loadMenus();
    loadShortcut();

    const searchParams = new URLSearchParams(window.location.search);
    toggleTechnicalMenus(!searchParams.get('debug') && !(await isDevMode()));
    document.getElementById('joorney-brand-debug').onclick = () => toggleTechnicalMenus();

    ChecklistManager.load();

    loadAnnouncement();
}

document.removeEventListener('DOMContentLoaded', onDOMContentLoaded);
document.addEventListener('DOMContentLoaded', onDOMContentLoaded);

function toggleTechnicalMenus(force = undefined) {
    for (const element of document.getElementsByClassName('joorney-tech-menu')) {
        element.classList.toggle('d-none', force);
    }
}

async function loadMenus() {
    const container = document.getElementById(MENU_ITEMS_CONTAINER);
    container.innerHTML = '';
    const pageMenus = PAGES.filter((p) => p.menu);
    for (const page of pageMenus) {
        loadMenu(page, container);
    }

    const defaultMenu = await getDefaultMenu(pageMenus);

    document.getElementById(defaultMenu.id).click();
}

async function getDefaultMenu(pageMenus) {
    const defaultMenuTour = await getNextTourID();
    const defaultMenu =
        pageMenus.find((m) => (defaultMenuTour ? m.tour === defaultMenuTour : m.default)) ?? pageMenus[0];

    return defaultMenu;
}

function loadMenu(page, container) {
    const template = document.createElement('template');
    template.innerHTML = `
        <li id="${page.menu}" class="joorney-menu-item ${
            page.technical ? 'joorney-tech-menu' : ''
        } nav-item nav-link">${page.label}</li>
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
    if (page.menu) updateActiveMenu(page.menu);
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

async function loadAnnouncement() {
    const announce = await getAnnounce();
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
