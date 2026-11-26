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
    <div class="joorney-fs-images">
        <div>
            <label class="joorney-fs-label" for="joorney_unfocus_app_light_image_input" data-i18n="optionsPreferences_lightImage">Light image URL for superfocus</label>
            <input type="text" class="form-control mb-2" id="joorney_unfocus_app_light_image_input" placeholder="">
            <img alt="Light superfocus background" data-i18n-alt="optionsPreferences_lightImageAlt" id="joorney_unfocus_app_light_image">
        </div>
        <div>
            <label class="joorney-fs-label" for="joorney_unfocus_app_dark_image_input" data-i18n="optionsPreferences_darkImage">Dark image URL for superfocus</label>
            <input type="text" class="form-control mb-2" id="joorney_unfocus_app_dark_image_input" placeholder="">
            <img alt="Dark superfocus background" data-i18n-alt="optionsPreferences_darkImageAlt" id="joorney_unfocus_app_dark_image">
        </div>
    </div>
    <table id="joorney_unfocus_app_table" class="table table-striped joorney-fs-table">
        <thead>
            <tr>
                <th scope="col" class="joorney-unfocus_app-origin" data-i18n="options_origins">Origins</th>
                <th scope="col" data-i18n="optionsPreferences_superfocusCount">Superfocus count</th>
                <th scope="col" data-i18n="optionsPreferences_unfocusCount">Unfocus count</th>
                <th scope="col" class="action-head"></th>
            </tr>
        </thead>
        <tbody id="joorney_unfocus_app_table_body"></tbody>
    </table>
`;

const themeSwitch = () => `
    <div class="joorney-fs-fields">
        <div class="joorney-fs-group">
            <div class="joorney-fs-grouptitle" data-i18n="optionsPreferences_latLong">Latitude / Longitude</div>
            <div class="input-group">
                <input id="joorney_theme_switch_latitude" type="text" class="form-control" aria-label="Latitude">
                <span class="input-group-text">/</span>
                <input id="joorney_theme_switch_longitude" type="text" class="form-control" aria-label="Longitude">
                <button type="button" id="joorney_theme_switch_get_location_button" class="joorney-btn is-secondary" title="Get current location" data-i18n-title="optionsPreferences_getLocation">
                    ${iconHTML('my_location')}<span data-i18n="optionsPreferences_getLocation">Get current location</span>
                </button>
            </div>
        </div>
        <div class="joorney-fs-group">
            <div class="joorney-fs-grouptitle" data-i18n="optionsPreferences_darkModeRange">Dark mode: start / stop</div>
            <div class="input-group">
                <input id="joorney_theme_switch_dark_start" type="time" class="form-control" aria-label="Dark mode start">
                <span class="input-group-text">/</span>
                <input id="joorney_theme_switch_dark_stop" type="time" class="form-control" aria-label="Dark mode stop">
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
