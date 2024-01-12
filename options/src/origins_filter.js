import { StorageSync } from '../../utils/browser.js';
import { defaultOriginsFilterSetting } from '../../utils/feature_default_configuration.js';

//#region CRUD
export async function createOriginsFilterOrigin() {
    const origin = document.getElementById('qol_origins_filter_new_origin');
    let originString = origin.value.trim();
    if (!originString) {
        renderOriginsFilterError('Missing origin');
        return;
    }

    const origins = await readOriginsFilterOrigins();

    if (originString.startsWith('regex://')) {
        let regexString = originString.replace('regex://', '');
        try {
            regexString = 'regex://' + new RegExp(regexString).source;
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
    const { originsFilterOrigins } = await StorageSync.get({
        originsFilterOrigins: defaultOriginsFilterSetting.originsFilterOrigins,
    });
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
    const originsFilterNewOrigin = document.getElementById('qol_origins_filter_new_origin');
    originsFilterNewOrigin.onkeydown = onKeydownHost;

    document.getElementById('qol_origins_filter_new_origin_save').onclick =
        createOriginsFilterOrigin;

    await restore();
}

async function restore() {
    const configuration = await StorageSync.get(defaultOriginsFilterSetting);

    await renderOriginsObject(configuration.originsFilterOrigins);
}
//#endregion

//#region UI
function renderOriginsFilterError(errorMessage) {
    const container = document.getElementById('qol_origins_filter_error_footer');
    container.textContent = errorMessage;
    container.style.display = errorMessage ? 'table-cell' : 'none';
}

async function renderOriginsObject(origins) {
    const originsArray = [];
    Object.keys(origins).forEach((o) =>
        originsArray.push({
            ...origins[o],
            origin: o,
        })
    );

    await StorageSync.set({ originsFilterOrigins: origins });

    const container = document.getElementById('qol_origins_filter_table_body');
    container.innerHTML = '';
    originsArray.forEach((o, id) => container.appendChild(renderOrigin(id, o)));
    renderOriginsFilterError();
}

function setupOriginFeature(container, idx, feature, origin) {
    const checkInput = container.getElementsByClassName(
        `qol_origins_filter_origin_${idx}_${feature}`
    )[0];
    checkInput.onchange = (e) => updateOriginFeature(idx, origin, feature, e.currentTarget.checked);
}

async function updateOriginFeature(idx, origin, feature, checked) {
    // Disable row on update to avoid spamming/inconsistency if StorageSync.set take time
    const rowInputs = Array.from(
        document.getElementsByClassName(`qol_origins_filter_feature_input_${idx} `)
    ).filter((i) => !i.className.includes('feature-disabled'));
    rowInputs.forEach((i) => (i.disabled = true));

    const origins = await readOriginsFilterOrigins();
    origins[origin][feature] = checked;
    await StorageSync.set({ originsFilterOrigins: origins });

    rowInputs.forEach((i) => (i.disabled = false));
}

function renderOrigin(idx, origin, blacklist) {
    const originTemplate = document.createElement('template');

    const features = [
        'awesomeLoadingLarge',
        'awesomeLoadingSmall',
        'assignMeTask',
        'starringTaskEffect',
        'saveKnowledge',
        'themeSwitch',
        'awesomeStyle',
        'unfocusApp',
        'newServerActionCode',
    ];
    const featuresUI = features
        .map((f) =>
            `
			<td>
				<input
					class="
					    qol_origins_filter_feature_input_${idx}
                        qol_origins_filter_feature_input_${f} 
                        qol_origins_filter_origin_${idx}_${f}
                        m-0 form-check-input
                    "
                    ${!document.getElementById(`qol_${f}_feature`).checked ? 'disabled' : ''}
					type="checkbox"
					${origin[f] === true ? 'checked' : ''}
				/>
			</td>
		`.trim()
        )
        .join('\n');

    originTemplate.innerHTML = `
		<tr>
			<td class="p-1 qol-valign-middle">
				<input
					id="qol_origins_filter_origin_${idx}"
					class="qol-bg-white form-control border border-0 qol_origins_filter_origin_input"
					type="text"
					disabled
					value="${origin.origin}"
				/>
			</td>
			${featuresUI}
			<td class="p-1 qol-valign-middle">
				<button
					class="qol_origins_filter_origin_delete_${idx} btn btn-outline-danger border-0 btn-floating"
					title="Delete origin"
				>
					<i class="qol-font-icon-size fa fa-trash"></i>
				</button>
			</td>
		</tr>
	`.trim();

    const originElement = originTemplate.content.firstChild;

    features.forEach((f) => setupOriginFeature(originElement, idx, f, origin.origin));

    const deleteButton = originElement.getElementsByClassName(
        `qol_origins_filter_origin_delete_${idx}`
    )[0];
    deleteButton.onclick = (e) => deleteOriginsFilterOrigin(origin.origin);

    return originElement;
}
//#endregion
