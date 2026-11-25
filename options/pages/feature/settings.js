import { escapeHTML } from '../../../src/html_generator.js';
import { t } from '../../../src/utils/i18n.js';
import { iconHTML } from '../../../src/utils/icons.js';

/**
 * Markup of the customization blocks of the feature page "Settings" card, one per feature with
 * `customization.option`. The ids are the ones the src/features/<id>/option_customization.js files read;
 * texts use data-i18n (applyI18n runs on the page container after the injection).
 */

// Awesome Loading Large and Small share one block, and one option_customization (src/shared)
const SHARED_BLOCK = { awesomeLoadingLarge: 'awesomeLoading', awesomeLoadingSmall: 'awesomeLoading' };

// The tiles are rendered by src/shared/awesomeLoadingShare/option_customization.js
const awesomeLoading = () => `
    <div class="joorney-awl">
        <div id="joorney_awe_loading_tiles" class="joorney-awl-tiles" role="radiogroup" aria-label="${escapeHTML(t('optionsAwl_group'))}"></div>
    </div>
`;

const awesomeStyle = () => `
    <div id="joorney_awe_style_container">
        <textarea
            id="joorney_awe_style_css"
            class="form-control"
            rows="10"
            placeholder=".modal-dialog:has(.o_error_dialog)  {
    max-width: 75%;
}"
            spellcheck="false"
        ></textarea>
        <p class="joorney-error" id="joorney_awe_style_error" role="alert" hidden>${iconHTML('error')}<span></span></p>
        <button type="button" title="Save" data-i18n-title="options_save" id="joorney_awe_style_save" class="joorney-btn">
            ${iconHTML('save')}<span data-i18n="optionsPreferences_saveShortcut">Save (Ctrl+S)</span>
        </button>
    </div>
`;

const unfocusApp = () => `
    <div class="joorney-unfocus-section">
        <h3 class="joorney-unfocus-subtitle" data-i18n="optionsUnfocus_imageTitle">Superfocus image</h3>
        <p class="joorney-help is-small" data-i18n="optionsUnfocus_imageHelp">Painted behind superfocused apps. Joorney uses the one that matches the theme of the Odoo database.</p>
    </div>
    <div class="joorney-unfocus-tiles">
        <div class="joorney-unfocus-tile">
            <div class="joorney-unfocus-tile-head">
                <h3>${iconHTML('light_mode')}<span data-i18n="optionsUnfocus_lightTitle">Light theme</span></h3>
                <span class="joorney-chip" id="joorney_unfocus_app_light_image_label"></span>
            </div>
            <div class="joorney-unfocus-thumb is-light">
                <div class="joorney-unfocus-cell">
                    <img alt="Light theme superfocus image" data-i18n-alt="optionsPreferences_lightImageAlt" id="joorney_unfocus_app_light_image">
                </div>
            </div>
            <label class="joorney-fs-label" for="joorney_unfocus_app_light_image_input" data-i18n="optionsUnfocus_imageUrl">Image URL</label>
            <div class="joorney-unfocus-field">
                <input type="text" class="joorney-input joorney-unfocus-input" id="joorney_unfocus_app_light_image_input" aria-describedby="joorney_unfocus_app_light_image_error">
                <button type="button" class="joorney-btn is-secondary" id="joorney_unfocus_app_light_image_reset" title="Use the default light theme image" data-i18n-title="optionsUnfocus_resetLightTitle" hidden>
                    ${iconHTML('restart_alt')}<span data-i18n="optionsUnfocus_resetImage">Use default</span>
                </button>
            </div>
            <p class="joorney-error" id="joorney_unfocus_app_light_image_error" role="alert" hidden></p>
            <p class="joorney-unfocus-restored" id="joorney_unfocus_app_light_image_restored" role="status" hidden>
                ${iconHTML('check_circle')}<span data-i18n="optionsUnfocus_restored">Default image restored.</span>
                <button type="button" class="joorney-unfocus-undo" id="joorney_unfocus_app_light_image_undo" data-i18n="optionsUnfocus_undo">Undo</button>
            </p>
        </div>
        <div class="joorney-unfocus-tile">
            <div class="joorney-unfocus-tile-head">
                <h3>${iconHTML('circle', { filled: true })}<span data-i18n="optionsUnfocus_darkTitle">Dark theme</span></h3>
                <span class="joorney-chip" id="joorney_unfocus_app_dark_image_label"></span>
            </div>
            <div class="joorney-unfocus-thumb is-dark">
                <div class="joorney-unfocus-cell">
                    <img alt="Dark theme superfocus image" data-i18n-alt="optionsPreferences_darkImageAlt" id="joorney_unfocus_app_dark_image">
                </div>
            </div>
            <label class="joorney-fs-label" for="joorney_unfocus_app_dark_image_input" data-i18n="optionsUnfocus_imageUrl">Image URL</label>
            <div class="joorney-unfocus-field">
                <input type="text" class="joorney-input joorney-unfocus-input" id="joorney_unfocus_app_dark_image_input" aria-describedby="joorney_unfocus_app_dark_image_error">
                <button type="button" class="joorney-btn is-secondary" id="joorney_unfocus_app_dark_image_reset" title="Use the default dark theme image" data-i18n-title="optionsUnfocus_resetDarkTitle" hidden>
                    ${iconHTML('restart_alt')}<span data-i18n="optionsUnfocus_resetImage">Use default</span>
                </button>
            </div>
            <p class="joorney-error" id="joorney_unfocus_app_dark_image_error" role="alert" hidden></p>
            <p class="joorney-unfocus-restored" id="joorney_unfocus_app_dark_image_restored" role="status" hidden>
                ${iconHTML('check_circle')}<span data-i18n="optionsUnfocus_restored">Default image restored.</span>
                <button type="button" class="joorney-unfocus-undo" id="joorney_unfocus_app_dark_image_undo" data-i18n="optionsUnfocus_undo">Undo</button>
            </p>
        </div>
    </div>
    <div class="joorney-unfocus-section">
        <h3 class="joorney-unfocus-subtitle" data-i18n="optionsUnfocus_hostsTitle">Remembered apps per host</h3>
        <p class="joorney-help is-small" data-i18n="optionsUnfocus_hostsHelp">Apps show up here once you star them on the home menu of an Odoo host. Open a host to see its apps, and set one back to Normal to forget it.</p>
    </div>
    <div id="joorney_unfocus_app_hosts"></div>
`;

const themeSwitch = () => `
    <div class="joorney-ts">
        <div class="joorney-label" id="joorney-ts-mode-label" data-i18n="optionsThemeSwitch_modeLabel">Mode</div>
        <div class="joorney-feature-opts joorney-ts-opts" role="group" aria-labelledby="joorney-ts-mode-label">
            <button type="button" class="joorney-feature-opt" data-mode="system" aria-pressed="false">
                <b data-i18n="optionsThemeSwitch_modeSystem">System</b>
                <span data-i18n="optionsThemeSwitch_modeSystemHelp">Follow the system colour scheme.</span>
            </button>
            <button type="button" class="joorney-feature-opt" data-mode="autoLight" aria-pressed="false">
                <b data-i18n="optionsThemeSwitch_modeLight">Light</b>
                <span data-i18n="optionsThemeSwitch_modeLightHelp">Always use the light theme.</span>
            </button>
            <button type="button" class="joorney-feature-opt" data-mode="autoDark" aria-pressed="false">
                <b data-i18n="optionsThemeSwitch_modeDark">Dark</b>
                <span data-i18n="optionsThemeSwitch_modeDarkHelp">Always use the dark theme.</span>
            </button>
            <button type="button" class="joorney-feature-opt" data-mode="dynamicLocation" aria-pressed="false">
                <b data-i18n="optionsThemeSwitch_modeLocation">Location</b>
                <span data-i18n="optionsThemeSwitch_modeLocationHelp">Dark between sunset and sunrise.</span>
            </button>
            <button type="button" class="joorney-feature-opt" data-mode="dynamicTime" aria-pressed="false">
                <b data-i18n="optionsThemeSwitch_modeTime">Time range</b>
                <span data-i18n="optionsThemeSwitch_modeTimeHelp">Dark between two times.</span>
            </button>
        </div>
        <p class="joorney-help" id="joorney-ts-none" data-i18n="optionsThemeSwitch_noSetting" hidden>No further setting for this mode.</p>
        <div class="joorney-ts-fields" id="joorney-ts-location" hidden>
            <div class="joorney-ts-field">
                <label class="joorney-label" for="joorney_theme_switch_latitude" data-i18n="optionsThemeSwitch_latitude">Latitude</label>
                <input id="joorney_theme_switch_latitude" class="joorney-input" type="text" inputmode="decimal" autocomplete="off">
            </div>
            <div class="joorney-ts-field">
                <label class="joorney-label" for="joorney_theme_switch_longitude" data-i18n="optionsThemeSwitch_longitude">Longitude</label>
                <input id="joorney_theme_switch_longitude" class="joorney-input" type="text" inputmode="decimal" autocomplete="off">
            </div>
            <button type="button" id="joorney_theme_switch_get_location_button" class="joorney-btn is-secondary">
                ${iconHTML('my_location')}<span data-i18n="optionsPreferences_getLocation">Get current location</span>
            </button>
        </div>
        <div class="joorney-ts-fields" id="joorney-ts-time" hidden>
            <div class="joorney-ts-field">
                <label class="joorney-label" for="joorney_theme_switch_dark_start" data-i18n="optionsThemeSwitch_darkStart">Dark from</label>
                <input id="joorney_theme_switch_dark_start" class="joorney-input" type="time">
            </div>
            <div class="joorney-ts-field">
                <label class="joorney-label" for="joorney_theme_switch_dark_stop" data-i18n="optionsThemeSwitch_darkStop">Dark until</label>
                <input id="joorney_theme_switch_dark_stop" class="joorney-input" type="time">
            </div>
        </div>
    </div>
`;

// The list and the preview are rendered by src/features/contextOdooMenus/option_customization.js
const contextOdooMenus = () => `
    <div class="joorney-cm-add">
        <label class="joorney-fs-label" for="joorney_contextOdooMenus_new_path" data-i18n="optionsContextMenus_path">Menu path</label>
        <div class="joorney-cm-addrow">
            <input type="text" class="joorney-input" id="joorney_contextOdooMenus_new_path" placeholder="Lunch / Configuration / Products" autocomplete="off" spellcheck="false" aria-describedby="joorney_contextOdooMenus_new_hint joorney_contextOdooMenus_new_error">
            <button type="button" id="joorney_contextOdooMenus_new_save" class="joorney-btn">
                ${iconHTML('add')}<span data-i18n="options_add">Add</span>
            </button>
        </div>
        <p class="joorney-cm-hint" id="joorney_contextOdooMenus_new_hint" data-i18n="optionsContextMenus_addHint">Press Enter to add. New menus go to the submenu, under their app, switched on. Write the menu names in English: the same path then works whatever language Odoo is in.</p>
        <p class="joorney-error joorney-cm-error" id="joorney_contextOdooMenus_new_error" role="alert" hidden></p>
    </div>
    <div class="joorney-cm-list" id="joorney_contextOdooMenus_box">
        <div class="joorney-cm-head">
            <h3 class="joorney-cm-title" data-i18n="optionsContextMenus_listTitle">Menus</h3>
            <span class="joorney-chip" id="joorney_contextOdooMenus_count"></span>
            <div class="joorney-cm-filter">
                ${iconHTML('search')}
                <input type="search" class="joorney-input" id="joorney_contextOdooMenus_filter" autocomplete="off" spellcheck="false" placeholder="${escapeHTML(t('optionsContextMenus_filter'))}" aria-label="${escapeHTML(t('optionsContextMenus_filterLabel'))}">
            </div>
            <div class="joorney-cm-headacts" id="joorney_contextOdooMenus_head_actions"></div>
        </div>
        <p class="joorney-cm-note" id="joorney_contextOdooMenus_filter_note" hidden>
            ${iconHTML('info')}<span data-i18n="optionsContextMenus_filterNote">Clear the filter to reorder.</span>
        </p>
        <div id="joorney_contextOdooMenus_list"></div>
    </div>
    <div id="joorney_contextOdooMenus_empty" hidden></div>
    <details class="joorney-cm-preview">
        <summary>
            ${iconHTML('expand_more', { classes: 'joorney-cm-pchevron' })}
            <span class="joorney-cm-ptitle" data-i18n="optionsContextMenus_previewTitle">Preview of the right-click menu</span>
            <span class="joorney-chips" id="joorney_contextOdooMenus_preview_counts"></span>
        </summary>
        <p class="joorney-help" data-i18n="optionsContextMenus_previewHelp">What a right-click on an Odoo page shows with these settings. Starred menus sit next to the other Joorney entries, the others are grouped in a submenu. Menus switched off are left out.</p>
        <div class="joorney-cm-cascade" id="joorney_contextOdooMenus_preview"></div>
    </details>
`;

const BLOCKS = { awesomeLoading, awesomeStyle, unfocusApp, themeSwitch, contextOdooMenus };

/**
 * @param {string} featureID
 * @returns {string|undefined} the block wrapped in div[data-feature-customization], undefined if the feature has none
 */
export function settingsBlockHTML(featureID) {
    const block = SHARED_BLOCK[featureID] ?? featureID;
    if (!BLOCKS[block]) return undefined;
    return `<div data-feature-customization="${escapeHTML(block)}">${BLOCKS[block]()}</div>`;
}
