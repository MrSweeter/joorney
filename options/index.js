import { isDevMode } from '../background/src/check_version.js';
import { getFeaturesAndCurrentSettings } from '../configuration.js';
import ChecklistManager from '../src/checklist/manager.js';
import { StorageLocal } from '../src/utils/browser.js';
import { initImportExport } from './import_export.js';
import { loadPage as loadConfigurationPage } from './pages/configuration/index.js';
import { loadPage as loadTechnicalPage } from './pages/technical/index.js';
import { loadPage as loadToastPage } from './pages/toast/index.js';
import { loadPage as loadVersionPage } from './pages/version/index.js';
import { loadPage as loadWebsitePage } from './pages/website/index.js';
import { load as loadShortcut } from './src/keyboard_shortcut.js';

const MENU_ITEMS_CONTAINER = 'joorney-menu-items-container';
const PAGE_CONTAINER = 'joorney-page-container';
const PAGES = [
    {
        id: 'page-website',
        menu: 'page-website',
        tour: 'tour_hostControls',
        label: 'Hosts control',
        path: './pages/website/index.html',
        loader: loadWebsitePage,
        default: true,
    },
    {
        id: 'page-configuration',
        menu: 'page-configuration',
        tour: 'tour_preferences',
        label: 'Preferences',
        path: './pages/configuration/index.html',
        loader: loadConfigurationPage,
    },
    {
        id: 'page-version',
        menu: 'page-version',
        tour: 'tour_versions',
        label: 'Versions',
        path: './pages/version/index.html',
        loader: loadVersionPage,
    },
    {
        id: 'page-toast',
        menu: 'page-toast',
        tour: 'tour_toasts',
        label: 'Notifications',
        path: './pages/toast/index.html',
        loader: loadToastPage,
    },
    {
        id: 'page-technical',
        menu: 'page-technical',
        tour: 'tour_technical',
        label: 'Developers',
        path: './pages/technical/index.html',
        loader: loadTechnicalPage,
        technical: true,
    },
];

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
    const tourState = await StorageLocal.get({
        tour_hostControls: false,
        tour_preferences: false,
        tour_versions: false,
        tour_toasts: false,
    });
    const tourOrder = ['tour_versions', 'tour_hostControls', 'tour_preferences', 'tour_toasts'];
    const defaultMenuTour = tourOrder.find((t) => !tourState[t]);

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
