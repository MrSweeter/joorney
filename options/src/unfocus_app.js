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
}

export async function restore() {
    const origins = await readUnfocusAppOrigins();

    await restoreImage();

    await renderOriginsObject(origins);
}
//#endregion

//#region UI
async function renderOriginsObject(origins) {
    await StorageSync.set({ unfocusAppOrigins: origins });

    const container = document.getElementById('qol_unfocus_app_table_body');
    container.innerHTML = '';
    Object.keys(origins).forEach((o, id) => {
        const values = Object.values(origins[o]);
        container.appendChild(
            renderOrigin(
                id,
                o,
                values.filter((v) => v === 2).length,
                values.filter((v) => v === true || v === 0).length
            )
        );
    });
}

function renderOrigin(idx, origin, superfocusCount, unfocusCount) {
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
			<td>${superfocusCount}</td>
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

//#region Image
async function restoreImage() {
    const { unfocusAppLightImageURL, unfocusAppDarkImageURL } = await StorageSync.get({
        unfocusAppLightImageURL: '',
        unfocusAppDarkImageURL: '',
    });

    document.getElementById('qol_unfocus_app_light_image').src = unfocusAppLightImageURL;
    document.getElementById('qol_unfocus_app_dark_image').src = unfocusAppDarkImageURL;

    loadImageInput(
        'qol_unfocus_app_light_image_input',
        'qol_unfocus_app_light_image',
        'unfocusAppLightImageURL',
        unfocusAppLightImageURL
    );

    loadImageInput(
        'qol_unfocus_app_dark_image_input',
        'qol_unfocus_app_dark_image',
        'unfocusAppDarkImageURL',
        unfocusAppDarkImageURL
    );
}

function loadImageInput(inputKey, imageKey, configKey, value) {
    const imageInput = document.getElementById(inputKey);
    imageInput.value = value;

    imageInput.oninput = async (e) => {
        let imageUrl = e.target.value.trim().replace(/\s/g, '');
        if (imageUrl.length === 0) {
            await StorageSync.set({ [configKey]: '' });
            return;
        }

        try {
            imageUrl = new URL(imageUrl);
            if (!isImageUrlPath(imageUrl.pathname))
                throw new Error('Invalid image extension in the url path');

            await StorageSync.set({ [configKey]: `${imageUrl}` });
            imageInput.value = imageUrl;
            document.getElementById(imageKey).src = imageUrl;
        } catch (ex) {
            console.warn(ex);
        }
    };
}

function isImageUrlPath(path) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg']; // Add more extensions if needed
    const lowercaseUrl = path.toLowerCase();

    return imageExtensions.some((extension) => lowercaseUrl.endsWith(extension));
}
//#endregion
