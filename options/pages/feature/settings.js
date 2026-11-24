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
    <div class="joorney-unfocus-tiles">
        <div class="joorney-unfocus-tile">
            <div class="joorney-unfocus-tile-head">
                <h3 data-i18n="optionsUnfocus_lightTitle">Light background</h3>
                <span class="joorney-chip" id="joorney_unfocus_app_light_image_label"></span>
            </div>
            <div class="joorney-unfocus-thumb is-light">
                <div class="joorney-unfocus-cell">
                    <img alt="Light superfocus background" data-i18n-alt="optionsPreferences_lightImageAlt" id="joorney_unfocus_app_light_image">
                </div>
            </div>
            <label class="joorney-fs-label" for="joorney_unfocus_app_light_image_input" data-i18n="optionsUnfocus_imageUrl">Image URL</label>
            <div class="joorney-unfocus-field">
                <input type="text" class="joorney-input joorney-unfocus-input" id="joorney_unfocus_app_light_image_input" aria-describedby="joorney_unfocus_app_light_image_error">
                <button type="button" class="joorney-btn is-secondary" id="joorney_unfocus_app_light_image_reset" title="Use the default light image" data-i18n-title="optionsUnfocus_resetLightTitle" hidden>
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
                <h3 data-i18n="optionsUnfocus_darkTitle">Dark background</h3>
                <span class="joorney-chip" id="joorney_unfocus_app_dark_image_label"></span>
            </div>
            <div class="joorney-unfocus-thumb is-dark">
                <div class="joorney-unfocus-cell">
                    <img alt="Dark superfocus background" data-i18n-alt="optionsPreferences_darkImageAlt" id="joorney_unfocus_app_dark_image">
                </div>
            </div>
            <label class="joorney-fs-label" for="joorney_unfocus_app_dark_image_input" data-i18n="optionsUnfocus_imageUrl">Image URL</label>
            <div class="joorney-unfocus-field">
                <input type="text" class="joorney-input joorney-unfocus-input" id="joorney_unfocus_app_dark_image_input" aria-describedby="joorney_unfocus_app_dark_image_error">
                <button type="button" class="joorney-btn is-secondary" id="joorney_unfocus_app_dark_image_reset" title="Use the default dark image" data-i18n-title="optionsUnfocus_resetDarkTitle" hidden>
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
    <h3 class="joorney-unfocus-subtitle" data-i18n="optionsUnfocus_hostsTitle">Remembered apps per host</h3>
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

const contextOdooMenus = () => `
    <div class="joorney-fs-toolbar">
        <button type="button" id="joorney_contextOdooMenus_delete_all" class="joorney-btn is-secondary" data-i18n="optionsPreferences_deleteAll">Delete all</button>
    </div>
    <table id="joorney_contextOdooMenus_table" class="table table-striped joorney-fs-table">
        <thead>
            <tr>
                <th scope="col"></th>
                <th scope="col" style="width: 80%" title="Name of ir.ui.menu, unique" data-i18n-title="optionsPreferences_menuNameTitle" data-i18n="optionsPreferences_menuName">Menu name</th>
                <th scope="col" class="action-head"></th>
            </tr>
        </thead>
        <tbody id="joorney_contextOdooMenus_table_body"></tbody>
        <tfoot>
            <tr class="joorney-fs-add">
                <td></td>
                <td class="p-1 joorney-valign-middle">
                    <input type="text" class="form-control" id="joorney_contextOdooMenus_new_path" placeholder="Lunch / Configuration / Products" aria-label="Menu name" data-i18n-aria-label="optionsPreferences_menuName">
                </td>
                <td class="p-1 joorney-valign-middle">
                    <button type="button" id="joorney_contextOdooMenus_new_save" class="joorney-btn">
                        ${iconHTML('add')}<span data-i18n="options_add">Add</span>
                    </button>
                </td>
            </tr>
            <tr>
                <td id="joorney_contextOdooMenus_new_error" class="text-danger" colspan="3"></td>
            </tr>
        </tfoot>
    </table>
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
