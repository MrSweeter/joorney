import { baseSettings, getCurrentSettings } from '../../configuration.js';
import { generateFeatureOptionTableHeadItem, stringToHTML } from '../../src/html_generator.js';
import { regexSchemePrefix } from '../../src/utils/authorize.js';
import { Runtime, StorageSync } from '../../src/utils/browser.js';
import { MESSAGE_ACTION } from '../../src/utils/messaging.js';
import { updateFeatureOriginInputs } from './features.js';

//#region CRUD
export async function createOriginsFilterOrigin() {
    const origin = document.getElementById('joorney_origins_filter_new_origin');
    let originString = origin.value.trim();
    if (!originString) {
        renderOriginsFilterError('Missing origin');
        return;
    }

    const origins = await readOriginsFilterOrigins();

    if (originString.startsWith(regexSchemePrefix)) {
        let regexString = originString.replace(regexSchemePrefix, '');
        try {
            regexString = regexSchemePrefix + new RegExp(regexString).source;
            origins[regexString] = {};
            await renderOriginsObject(origins);
            origin.value = '';
        } catch (ex) {
            renderOriginsFilterError(ex);
        }
        return;
    }

    originString = originString.trim().toLowerCase().replace(/\s/g, '');

    try {
        originString = new URL(originString).origin;
        origins[originString] = {};
        await renderOriginsObject(origins);
        origin.value = '';
    } catch (ex) {
        renderOriginsFilterError(ex);
    }
}

async function readOriginsFilterOrigins() {
    const { originsFilterOrigins } = await StorageSync.get(baseSettings);
    return originsFilterOrigins;
}

export async function deleteOriginsFilterOrigin(origin) {
    if (confirm(`Are you sure you want to remove origin: ${origin}?`)) {
        const origins = await readOriginsFilterOrigins();
        delete origins[origin];
        await renderOriginsObject(origins);
    }
}
//#endregion

//#region Event
function onKeydownHost(event) {
    if (event.key === 'Enter') createOriginsFilterOrigin();
}
export async function load() {
    const originsFilterNewOrigin = document.getElementById('joorney_origins_filter_new_origin');
    originsFilterNewOrigin.onkeydown = onKeydownHost;

    document.getElementById('joorney_origins_filter_new_origin_save').onclick = createOriginsFilterOrigin;

    await restore();
}

async function restore() {
    const configuration = await StorageSync.get(baseSettings);

    await renderOriginsObject(configuration.originsFilterOrigins);
}
//#endregion

//#region UI
function renderOriginsFilterError(errorMessage) {
    const container = document.getElementById('joorney_origins_filter_error_footer');
    container.textContent = errorMessage;
    container.style.display = errorMessage ? 'table-cell' : 'none';
}

function updateColSpan(count) {
    const footers = document.querySelectorAll('tfoot tr td:first-child');
    footers[0].colSpan = `${count + 2}`;
    footers[1].colSpan = `${count + 1}`;
    footers[2].colSpan = `${count + 2}`;
}

async function renderOriginsObject(origins) {
    const originsArray = [];
    for (const o of Object.keys(origins)) originsArray.push({ ...origins[o], origin: o });

    await StorageSync.set({ originsFilterOrigins: origins });

    const response = await Runtime.sendMessage({
        action: MESSAGE_ACTION.GET_FEATURES_LIST,
    });
    const features = response.features.filter((f) => !f.limited);

    const tableHeader = document.querySelector('#joorney_origins_filter_table thead tr');
    tableHeader.innerHTML = '';
    tableHeader.appendChild(
        stringToHTML(`<th class="joorney-origins_filter-origin-input" title="Odoo Database Origin">Origins</th>`)
    );
    for (const f of features) tableHeader.appendChild(generateFeatureOptionTableHeadItem(f));
    tableHeader.appendChild(stringToHTML(`<th class="py-0 joorney-valign-middle action-head"></th>`));

    const container = document.getElementById('joorney_origins_filter_table_body');
    container.innerHTML = '';
    for (const [id, o] of originsArray.entries())
        container.appendChild(
            renderOrigin(
                id,
                o,
                features.map((f) => f.id)
            )
        );
    renderOriginsFilterError();
    updateColSpan(features.length);

    const defaultConfiguration = await getCurrentSettings(features);

    for (const feature of features) {
        const enabled = defaultConfiguration[`${feature.id}Enabled`];
        const isWhitelist = defaultConfiguration[`${feature.id}WhitelistMode`];

        updateFeatureOriginInputs(feature.id, enabled, isWhitelist);
    }
}

function setupOriginFeature(container, idx, feature, origin) {
    const checkInput = container.getElementsByClassName(`joorney_origins_filter_origin_${idx}_${feature}`)[0];
    checkInput.onchange = (e) => updateOriginFeature(idx, origin, feature, e.currentTarget.checked);
}

async function updateOriginFeature(idx, origin, feature, checked) {
    // Disable row on update to avoid spamming/inconsistency if StorageSync.set take time
    const rowInputs = Array.from(
        document.getElementsByClassName(`joorney_origins_filter_feature_input_${idx} `)
    ).filter((i) => !i.className.includes('feature-disabled'));
    for (const i of rowInputs) i.disabled = true;

    const origins = await readOriginsFilterOrigins();
    origins[origin][feature] = checked;
    await StorageSync.set({ originsFilterOrigins: origins });

    for (const i of rowInputs) i.disabled = false;
}

function renderOrigin(idx, origin, features) {
    const originTemplate = document.createElement('template');

    const featuresUI = features
        .map((f) =>
            `
			<td>
				<input
					class="
					    joorney_origins_filter_feature_input_${idx}
                        joorney_origins_filter_feature_input_${f}
                        joorney_origins_filter_origin_${idx}_${f}
                        m-0 form-check-input
                    "
                    ${!document.getElementById(`joorney_${f}_feature`)?.checked ? 'disabled' : ''}
					type="checkbox"
					${origin[f] === true ? 'checked' : ''}
				/>
			</td>
		`.trim()
        )
        .join('\n');

    originTemplate.innerHTML = `
		<tr>
			<td class="p-1 joorney-valign-middle">
				<input
					id="joorney_origins_filter_origin_${idx}"
					class="joorney-bg-white form-control border border-0 joorney_origins_filter_origin_input"
					type="text"
					disabled
					value="${origin.origin}"
				/>
			</td>
			${featuresUI}
			<td class="p-1 joorney-valign-middle">
				<button
					class="joorney_origins_filter_origin_delete_${idx} btn btn-outline-danger border-0 btn-floating"
					title="Delete origin"
				>
					<i class="joorney-font-icon-size fa fa-trash"></i>
				</button>
			</td>
		</tr>
	`.trim();

    const originElement = originTemplate.content.firstChild;

    for (const f of features) setupOriginFeature(originElement, idx, f, origin.origin);

    const deleteButton = originElement.getElementsByClassName(`joorney_origins_filter_origin_delete_${idx}`)[0];
    deleteButton.onclick = () => deleteOriginsFilterOrigin(origin.origin);

    return originElement;
}
//#endregion
