import { restore as restoreThemeSwitch } from './src/theme_switch.js';
import { restore as restoreAwesomeLoading } from './src/awesome_loading.js';
import { restore as restoreAwesomeStyle } from './src/awesome_style.js';
import { restore as restoreUnfocusApp } from './src/unfocus_app.js';
import { initImportExport } from './import_export.js';
import { StorageSync } from '../utils/browser.js';
import { QOL_DEFAULT_CONFIGURATION } from '../utils/feature_default_configuration.js';

async function onDOMContentLoaded() {
    document.getElementById('copyright-year').innerText = new Date().getFullYear();
    //document.getElementById('copyright-link').href = Runtime.getManifest().homepage_url; Not public API

    restoreThemeSwitch();
    restoreAwesomeLoading();
    restoreAwesomeStyle();
    restoreUnfocusApp();
    initImportExport();

    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('debug') == 1) {
        const debug = document.getElementById('qol-debug-configuration');
        const config = await StorageSync.get(QOL_DEFAULT_CONFIGURATION);
        debug.innerHTML = JSON.stringify(config, null, 4);
    }
}

document.removeEventListener('DOMContentLoaded', onDOMContentLoaded);
document.addEventListener('DOMContentLoaded', onDOMContentLoaded);
