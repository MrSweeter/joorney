import { StorageSync } from '../../utils/browser.js';
import { defaultUnfocusAppSetting } from '../../utils/feature_default_configuration.js';
import { loadFeature } from './features.js';

//#region CRUD
async function readUnfocusAppOrigins() {
    const { unfocusAppOrigins } = await StorageSync.get({
        unfocusAppOrigins: defaultUnfocusAppSetting.unfocusAppOrigins,
    });
    return unfocusAppOrigins;
}

export async function deleteUnfocusAppOrigin(origin) {
    if (confirm(`Are you sure you want to remove origin: ${origin}?`)) {
        const origins = await readUnfocusAppOrigins();
        delete origins[origin];
        await renderOriginsObject(origins);
    }
}
//#endregion

//#region Event
export async function load() {
    await loadFeature('unfocusApp');

    await restore();
}

async function restore() {
    const origins = await readUnfocusAppOrigins();

    await renderOriginsObject(origins);
}
//#endregion

//#region UI
async function renderOriginsObject(origins) {
    await StorageSync.set({ unfocusAppOrigins: origins });

    const container = document.getElementById('qol_unfocus_app_table_body');
    container.innerHTML = '';
    Object.keys(origins).forEach((o, id) => {
        container.appendChild(
            renderOrigin(id, o, Object.values(origins[o]).filter((v) => v).length)
        );
    });
}

function renderOrigin(idx, origin, unfocusCount) {
    const originTemplate = document.createElement('template');

    originTemplate.innerHTML = `
		<tr>
			<td class="p-1 qol-valign-middle">
				<input
					id="qol_unfocus_app_origin_${idx}"
					class="qol-bg-white form-control border border-0 qol_unfocus_app_origin_input"
					type="text"
					disabled
					value="${origin}"
				/>
			</td>
			<td>${unfocusCount}</td>
			<td class="p-1 qol-valign-middle">
				<button
					class="qol_unfocus_app_origin_delete_${idx} btn btn-outline-danger border-0 btn-floating"
					title="Delete origin"
				>
					<i class="qol-font-icon-size fa fa-trash"></i>
				</button>
			</td>
		</tr>
	`.trim();

    const originElement = originTemplate.content.firstChild;

    const deleteButton = originElement.getElementsByClassName(
        `qol_unfocus_app_origin_delete_${idx}`
    )[0];
    deleteButton.onclick = (e) => deleteUnfocusAppOrigin(origin);

    return originElement;
}
//#endregion
