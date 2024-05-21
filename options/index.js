import { getFeaturesAndCurrentSettings } from '../configuration.js';
import { initImportExport } from './import_export.js';
import { loadPage as loadConfigurationPage } from './pages/configuration/index.js';
import { loadPage as loadVersionPage } from './pages/version/index.js';
import { loadPage as loadWebsitePage } from './pages/website/index.js';
import { load as loadShortcut } from './src/keyboard_shortcut.js';

const MENU_ITEMS_CONTAINER = 'joorney-menu-items-container';
const PAGE_CONTAINER = 'joorney-page-container';
const PAGES = [
    {
        id: 'page-website',
        menu: 'page-website',
        label: 'Hosts control',
        path: './pages/website/index.html',
        loader: loadWebsitePage,
        default: true,
    },
    {
        id: 'page-configuration',
        menu: 'page-configuration',
        label: 'Preferences',
        path: './pages/configuration/index.html',
        loader: loadConfigurationPage,
    },
    {
        id: 'page-version',
        menu: 'page-version',
        label: 'Versions',
        path: './pages/version/index.html',
        loader: loadVersionPage,
    },
];

async function onDOMContentLoaded() {
    document.getElementById('copyright-year').innerText = new Date().getFullYear();
    //document.getElementById('copyright-link').href = Runtime.getManifest().homepage_url; Not public API

    initImportExport();

    const searchParams = new URLSearchParams(window.location.search);
    let htmlDebug = 1;
    if (searchParams.get('debug')) {
        htmlDebug = '';
        const debug = document.getElementById('joorney-debug-configuration');
        const config = await getFeaturesAndCurrentSettings();
        debug.innerHTML = JSON.stringify(config, null, 4);
    }
    document.getElementById('joorney-brand-debug').href = `?debug=${htmlDebug}`;

    loadMenus();
    loadShortcut();
}

document.removeEventListener('DOMContentLoaded', onDOMContentLoaded);
document.addEventListener('DOMContentLoaded', onDOMContentLoaded);

function loadMenus() {
    const container = document.getElementById(MENU_ITEMS_CONTAINER);
    container.innerHTML = '';
    const pageMenus = PAGES.filter((p) => p.menu);
    for (const page of pageMenus) {
        loadMenu(page, container);
    }

    const defaultMenu = pageMenus.find((m) => m.default);
    document.getElementById(defaultMenu.id).click();
}

function loadMenu(page, container) {
    const template = document.createElement('template');
    template.innerHTML = `
        <li id="${page.menu}" class="joorney-menu-item nav-item nav-link">${page.label}</li>
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
}

function updateActiveMenu(menu) {
    for (const e of document.getElementsByClassName('joorney-menu-item')) {
        if (e.id === menu) e.classList.add('active');
        else e.classList.remove('active');
    }
}
