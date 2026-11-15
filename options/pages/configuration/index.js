import { importFeatureCustomizationFile } from '../../../configuration.js';
import { StorageSync } from '../../../src/utils/browser.js';
import { getLanguage, LANGUAGE_MODE, LANGUAGES, t } from '../../../src/utils/i18n.js';

export async function loadPage(features, currentSettings) {
    loadLanguage(currentSettings);
    loadFeatures(features);
}

async function loadFeatures(features) {
    for (const feature of features.filter((f) => f.customization.option)) {
        importFeatureCustomizationFile(feature.id).then((featureModule) => featureModule.load());
    }
}

//#region Language
async function loadLanguage(currentSettings) {
    const modeSelect = document.getElementById('joorney_language_mode');
    const staticSelect = document.getElementById('joorney_language_static');

    // Language names stay in their own language
    staticSelect.replaceChildren(
        ...Object.entries(LANGUAGES).map(
            ([code, { label }]) => new Option(label, code, false, code === currentSettings.languageStatic)
        )
    );
    modeSelect.value = currentSettings.languageMode;
    staticSelect.classList.toggle('d-none', modeSelect.value !== LANGUAGE_MODE.STATIC);
    for (const help of document.querySelectorAll('#joorney_language_card [data-language-help]')) {
        help.classList.toggle('d-none', help.dataset.languageHelp !== modeSelect.value);
    }
    // Resolved by the options page initI18n(): in 'odoo' mode, the last Odoo language seen
    const current = getLanguage();
    const currentLabel = LANGUAGES[current]?.label ?? current;
    const currentBadge = document.getElementById('joorney_language_current');
    currentBadge.textContent = currentLabel;
    currentBadge.title = t('language_current', currentLabel);

    // Reload to render the whole options page (menu, checklist, dynamic rows) in the new language
    const refresh = () => {
        const url = new URL(window.location.href);
        url.searchParams.set('page', PAGE.id);
        window.location.replace(url);
    };

    modeSelect.onchange = async () => {
        await StorageSync.set({ languageMode: modeSelect.value });
        refresh();
    };
    staticSelect.onchange = async () => {
        await StorageSync.set({ languageStatic: staticSelect.value });
        refresh();
    };
}
//#endregion

// Options menu entry, see options/menu.js
export const PAGE = {
    id: 'page-configuration',
    tour: 'tour_preferences',
    labelKey: 'options_menu_preferences',
    path: './pages/configuration/index.html',
    loader: loadPage,
};
