import { Commands, Runtime, StorageSync } from '../../../src/utils/browser.js';
import { getLanguage, LANGUAGE_MODE, LANGUAGES, t } from '../../../src/utils/i18n.js';
import { iconHTML } from '../../../src/utils/icons.js';

const SHORTCUTS_URL = 'chrome://extensions/shortcuts';

export async function loadPage(_features, currentSettings) {
    loadLanguage(currentSettings);
    loadShortcut();
}

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

//#region Keyboard shortcut
// The real binding (the user may have changed it in chrome://extensions/shortcuts), else the manifest suggestion
async function readShortcut() {
    const commands = await Commands?.getAll?.().catch(() => undefined);
    const manifestCommands = Object.entries(Runtime.getManifest().commands ?? {});
    const [name, manifestCommand] = manifestCommands[0] ?? [];
    const command = commands?.find((c) => c.name === name) ?? commands?.[0];
    return command ? command.shortcut : manifestCommand?.suggested_key?.default;
}

async function loadShortcut() {
    const keys = document.getElementById('joorney_shortcut_keys');
    const shortcut = await readShortcut();
    // Chrome writes macOS shortcuts as symbols without separator ('⌥⇧F'): one key per character
    const parts = shortcut ? (shortcut.includes('+') ? shortcut.split('+') : Array.from(shortcut)) : [];
    keys.replaceChildren(
        ...(parts.length
            ? parts.flatMap((part, index) => {
                  const key = document.createElement('kbd');
                  key.textContent = part.trim();
                  if (index === 0) return [key];
                  const plus = document.createElement('span');
                  plus.setAttribute('aria-hidden', 'true');
                  plus.textContent = '+';
                  return [plus, key];
              })
            : [Object.assign(document.createElement('span'), { textContent: t('optionsSettings_shortcut_unset') })])
    );

    const button = document.getElementById('joorney_shortcut_copy');
    button.innerHTML = iconHTML('content_copy');
    const note = document.getElementById('joorney_shortcut_note');
    button.onclick = async () => {
        try {
            await navigator.clipboard.writeText(SHORTCUTS_URL);
            note.textContent = t('optionsSettings_shortcut_copied');
        } catch {
            // Clipboard refused: the text stays selectable
            note.textContent = t('optionsSettings_shortcut_change');
        }
    };
}
//#endregion

// Options menu entry, see options/menu.js
export const PAGE = {
    id: 'page-configuration',
    // Stale until the tours are rewritten: its steps point at the blocks that moved to the feature pages
    tour: 'tour_preferences',
    labelKey: 'options_menu_settings',
    path: './pages/configuration/index.html',
    loader: loadPage,
};
