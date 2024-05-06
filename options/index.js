import { getFeaturesAndCurrentSettings } from '../configuration.js';
import { StorageSync } from '../src/utils/browser.js';
import { initImportExport } from './import_export.js';
import { loadPage as loadConfigurationPage } from './pages/configuration/index.js';
import { loadPage as loadVersionPage } from './pages/version/index.js';
import { loadPage as loadWebsitePage } from './pages/website/index.js';

const MENU_ITEMS_CONTAINER = 'qol-menu-items-container';
const PAGE_CONTAINER = 'qol-page-container';
const MENUS = [
    {
        id: 'page-website',
        label: 'Website filter',
        path: './pages/website/index.html',
        loader: loadWebsitePage,
        default: true,
    },
    {
        id: 'page-configuration',
        label: 'Configuration',
        path: './pages/configuration/index.html',
        loader: loadConfigurationPage,
    },
    {
        id: 'page-version',
        label: 'Supported versions',
        path: './pages/version/index.html',
        loader: loadVersionPage,
    },
];

async function onDOMContentLoaded() {
    document.getElementById('copyright-year').innerText = new Date().getFullYear();
    //document.getElementById('copyright-link').href = Runtime.getManifest().homepage_url; Not public API

    const { features, currentSettings } = await getFeaturesAndCurrentSettings();

    initImportExport(currentSettings);

    const searchParams = new URLSearchParams(window.location.search);
    let htmlDebug = 1;
    if (searchParams.get('debug') === 1) {
        htmlDebug = 0;
        const debug = document.getElementById('qol-debug-configuration');
        const config = await StorageSync.get(currentSettings);
        debug.innerHTML = JSON.stringify(config, null, 4);
    }
    document.getElementById('qol-brand-debug').href = `?debug=${htmlDebug}`;

    loadMenus(features, currentSettings);
}

document.removeEventListener('DOMContentLoaded', onDOMContentLoaded);
document.addEventListener('DOMContentLoaded', onDOMContentLoaded);

function loadMenus(features, currentSettings) {
    const container = document.getElementById(MENU_ITEMS_CONTAINER);
    container.innerHTML = '';
    for (const menu of MENUS) {
        loadMenu(features, currentSettings, menu, container);
    }

    const defaultMenu = MENUS.find((m) => m.default);
    document.getElementById(defaultMenu.id).click();
}

function loadMenu(features, currentSettings, menu, container) {
    const template = document.createElement('template');
    template.innerHTML = `
        <li id="${menu.id}" class="qol-menu-item nav-item nav-link">${menu.label}</li>
    `.trim();

    template.content.firstChild.onclick = (e) => {
        fetch(menu.path)
            .then((response) => response.text())
            .then((data) => {
                document.getElementById(PAGE_CONTAINER).innerHTML = data;
                menu.loader(features, currentSettings);
                updateActiveMenu(menu);
            })
            .catch((error) => console.error(error));
    };

    container.appendChild(template.content.firstChild);
}

function updateActiveMenu(menu) {
    for (const e of document.getElementsByClassName('qol-menu-item')) {
        if (e.id === menu.id) e.classList.add('active');
        else e.classList.remove('active');
    }
}
