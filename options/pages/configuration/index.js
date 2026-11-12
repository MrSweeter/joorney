import { importFeatureCustomizationFile } from '../../../configuration.js';
import { StorageSync } from '../../../src/utils/browser.js';
import { LANGUAGES, LANGUAGE_MODE, applyI18n, initI18n } from '../../../src/utils/i18n.js';

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
    const card = document.getElementById('joorney_language_card');
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

    const refresh = async () => {
        staticSelect.classList.toggle('d-none', modeSelect.value !== LANGUAGE_MODE.STATIC);
        await initI18n();
        applyI18n(card);
    };

    modeSelect.onchange = async () => {
        await StorageSync.set({ languageMode: modeSelect.value });
        await refresh();
    };
    staticSelect.onchange = async () => {
        await StorageSync.set({ languageStatic: staticSelect.value });
        await refresh();
    };

    await initI18n();
    applyI18n(card);
}
//#endregion
