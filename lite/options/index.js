import { getFeaturesAndCurrentSettings } from '../../configuration.js';
import { PAGE as CONFIGURATION_PAGE } from '../../options/pages/configuration/index.js';
import { PAGE as TOAST_PAGE } from '../../options/pages/toast/index.js';
import { PAGE as VERSION_PAGE } from '../../options/pages/version/index.js';
import { PAGE as WEBSITE_PAGE } from '../../options/pages/website/index.js';
import { loadManifest, loadMenus } from '../../options/src/layout.js';
import { Runtime } from '../../src/utils/browser.js';
import { refreshSupportedVersions } from '../../src/utils/check_version.js';

/**
 * Options of a lite feature build (see rollup.lite.config.mjs): a subset of the full options pages,
 * without announcement, onboarding checklist, import/export or technical pages.
 */

const PAGES = [
    WEBSITE_PAGE,
    // Only the option customizations of the build features
    { ...CONFIGURATION_PAGE, isAvailable: (features) => features.some((f) => f.customization.option) },
    VERSION_PAGE,
    TOAST_PAGE,
];

async function onDOMContentLoaded() {
    document.getElementById('copyright-year').textContent = new Date().getFullYear();
    const name = Runtime.getManifest().name;
    document.title = `${name} Configuration`;
    document.getElementById('joorney-brand-name').textContent = name;

    // Versions page lists the available versions from the remote data
    await refreshSupportedVersions();

    const { features } = await getFeaturesAndCurrentSettings();
    const pages = PAGES.filter((p) => !p.isAvailable || p.isAvailable(features));
    loadMenus(pages, pages.find((p) => p.default) ?? pages[0]);
    loadManifest(name);
}

document.removeEventListener('DOMContentLoaded', onDOMContentLoaded);
document.addEventListener('DOMContentLoaded', onDOMContentLoaded);
