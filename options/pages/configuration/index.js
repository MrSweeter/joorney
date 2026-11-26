import { getDisabledWebsites, setWebsiteDisabled } from '../../../src/api/local.js';
import { StorageSync } from '../../../src/utils/browser.js';
import { getLanguage, LANGUAGE_MODE, LANGUAGES, t } from '../../../src/utils/i18n.js';
import { iconHTML } from '../../../src/utils/icons.js';
import { setAdvancedHostView } from '../../src/host_view.js';

export async function loadPage(_features, currentSettings) {
    loadLanguage(currentSettings);
    loadAdvancedHostView(currentSettings);
    loadDisabledSites();
}

//#region Advanced host view
function loadAdvancedHostView(currentSettings) {
    const toggle = document.getElementById('joorney_advanced_host_view');
    toggle.setAttribute('aria-checked', currentSettings.optionsAdvancedHostView ? 'true' : 'false');
    toggle.onclick = async () => {
        const next = toggle.getAttribute('aria-checked') !== 'true';
        toggle.setAttribute('aria-checked', next ? 'true' : 'false');
        await setAdvancedHostView(next);
    };
}
//#endregion

//#region Language
async function loadLanguage(currentSettings) {
    const modeRadios = Array.from(document.querySelectorAll('input[name="joorney_language_mode"]'));
    const staticSelect = document.getElementById('joorney_language_static');

    // Language names stay in their own language
    staticSelect.replaceChildren(
        ...Object.entries(LANGUAGES).map(
            ([code, { label }]) => new Option(label, code, false, code === currentSettings.languageStatic)
        )
    );
    const selectedMode = () => modeRadios.find((radio) => radio.checked)?.value;
    for (const radio of modeRadios) radio.checked = radio.value === currentSettings.languageMode;

    const showHelp = () => {
        staticSelect.hidden = selectedMode() !== LANGUAGE_MODE.STATIC;
        for (const help of document.querySelectorAll('#joorney_language_card [data-language-help]')) {
            help.classList.toggle('d-none', help.dataset.languageHelp !== selectedMode());
        }
    };
    showHelp();
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

    for (const radio of modeRadios) {
        radio.onchange = async () => {
            showHelp();
            await StorageSync.set({ languageMode: radio.value });
            refresh();
        };
    }
    staticSelect.onchange = async () => {
        await StorageSync.set({ languageStatic: staticSelect.value });
        refresh();
    };
}
//#endregion

//#region Sites where Joorney is disabled
// Written by the popup power button (popup/index.js), the toolbar icon of their open tabs follows the list
async function loadDisabledSites() {
    const list = document.getElementById('joorney_disabledsites_list');
    const origins = [...(await getDisabledWebsites())].sort();
    document.getElementById('joorney_disabledsites_empty').hidden = origins.length > 0;
    list.hidden = origins.length === 0;
    list.replaceChildren(
        ...origins.map((origin) => {
            const row = document.createElement('li');
            row.className = 'joorney-settings-disabledsite';
            const name = Object.assign(document.createElement('span'), {
                className: 'joorney-mono',
                textContent: origin,
            });
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'joorney-icon-btn';
            remove.title = t('optionsSettings_disabledSites_remove', origin);
            remove.setAttribute('aria-label', remove.title);
            remove.innerHTML = iconHTML('delete');
            remove.onclick = async () => {
                await setWebsiteDisabled(origin, false);
                await loadDisabledSites();
            };
            row.replaceChildren(name, remove);
            return row;
        })
    );
}
//#endregion

// Options menu entry, see options/menu.js
export const PAGE = {
    id: 'page-configuration',
    tour: 'tour_settings',
    labelKey: 'options_menu_settings',
    path: './pages/configuration/index.html',
    loader: loadPage,
};
