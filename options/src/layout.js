import { getFeaturesAndCurrentSettings } from '../../configuration.js';
import { stringToHTML } from '../../src/html_generator.js';
import { Runtime } from '../../src/utils/browser.js';

/**
 * Options page layout: menu rendering and page loading.
 */

const MENU_ITEMS_CONTAINER = 'joorney-menu-items-container';
const PAGE_CONTAINER = 'joorney-page-container';

/**
 * Render the menu of the pages and open the default one.
 * @param {object[]} pages page definitions, see options/menu.js
 * @param {object} defaultPage page opened first
 * @param {function} [onPageLoaded] called with the page once it is loaded
 */
export function loadMenus(pages, defaultPage, onPageLoaded = undefined) {
    const container = document.getElementById(MENU_ITEMS_CONTAINER);
    container.innerHTML = '';
    for (const page of pages) {
        loadMenu(page, container, onPageLoaded);
    }

    document.getElementById(defaultPage.id).click();
}

function loadMenu(page, container, onPageLoaded) {
    const template = document.createElement('template');
    template.innerHTML = `
        <li id="${page.id}" class="joorney-menu-item ${page.technical ? 'joorney-tech-menu' : ''} nav-item nav-link">
            ${page.label}
        </li>
    `.trim();

    template.content.firstChild.onclick = () => {
        loadPage(page, onPageLoaded);
    };

    container.appendChild(template.content.firstChild);
}

async function loadPage(page, onPageLoaded) {
    const response = await fetch(page.path);
    const data = await response.text();
    const { features, currentSettings } = await getFeaturesAndCurrentSettings();
    document.getElementById(PAGE_CONTAINER).innerHTML = data;
    page.loader(features, currentSettings);
    updateActiveMenu(page.id);
    onPageLoaded?.(page);
}

function updateActiveMenu(menu) {
    for (const e of document.getElementsByClassName('joorney-menu-item')) {
        if (e.id === menu) e.classList.add('active');
        else e.classList.remove('active');
    }
}

export function loadManifest() {
    const manifest = Runtime.getManifest();
    const element = document.getElementById('joorney-manifest');
    element.innerHTML = '';
    const versionElement = stringToHTML(
        `<p class="small m-0 text-muted opacity-25 position-absolute">Joorney ${manifest.version_name} (${manifest.version})`
    );
    element.appendChild(versionElement);
}
