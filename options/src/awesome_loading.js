import { Runtime, StorageSync } from '../../utils/browser.js';
import { defaultAwesomeLoadingSetting } from '../../utils/feature_default_configuration.js';
import { loadFeature } from './features.js';

//#region CRUD
export async function createAwesomeLoadingImage() {
    const imageInput = document.getElementById('qol_awe_loading_new_image');
    let imageUrl = imageInput.value;
    if (!imageUrl) {
        renderAwesomeLoadingError('Missing url');
        return;
    }

    const images = await readAwesomeLoadingImages();

    imageUrl = imageUrl.trim().replace(/\s/g, '');

    try {
        imageUrl = new URL(imageUrl).href;
        images.push(imageUrl);
        await renderImagesList(images);
        imageInput.value = '';
    } catch (ex) {
        renderAwesomeLoadingError(ex);
    }
}

async function readAwesomeLoadingImages() {
    const { awesomeLoadingImages } = await StorageSync.get({
        awesomeLoadingImages: defaultAwesomeLoadingSetting.awesomeLoadingImages,
    });
    return awesomeLoadingImages;
}

export async function deleteAwesomeLoadingImage(imageUrl) {
    if (confirm(`Are you sure you want to remove image: ${imageUrl}?`)) {
        const images = await readAwesomeLoadingImages();
        await renderImagesList(images.filter((img) => img !== imageUrl));
    }
}
//#endregion

//#region Event
function onKeydownHost(event) {
    if (event.key === 'Enter') createAwesomeLoadingImage();
}
function onImageChange(event) {
    let imageUrl = event.target.value;
    if (!imageUrl) return;

    imageUrl = imageUrl.trim().replace(/\s/g, '');

    try {
        imageUrl = new URL(imageUrl).href;
        const imagePreview = document.getElementById('qol_awe_loading_new_image_preview');
        imagePreview.src = imageUrl;
    } catch (ex) {
        console.log(ex);
    }
}
//#endregion

export async function load() {
    await loadFeature('awesomeLoadingLarge', defaultAwesomeLoadingSetting);
    await loadFeature('awesomeLoadingSmall', defaultAwesomeLoadingSetting);

    const awesomeLoadingNewImage = document.getElementById('qol_awe_loading_new_image');
    awesomeLoadingNewImage.onkeydown = onKeydownHost;
    awesomeLoadingNewImage.oninput = onImageChange;

    document.getElementById('qol_awe_loading_new_image_save').onclick = createAwesomeLoadingImage;

    restore();
}

async function restore() {
    const configuration = await StorageSync.get(defaultAwesomeLoadingSetting);

    renderImagesList(configuration.awesomeLoadingImages);
}

//#region UI
function renderAwesomeLoadingError(errorMessage) {
    const container = document.getElementById('qol_awe_loading_error_footer');
    container.textContent = errorMessage;
    container.style.display = errorMessage ? 'table-cell' : 'none';
}

async function renderImagesList(images) {
    images = Array.from(new Set(images)).sort();
    await StorageSync.set({ awesomeLoadingImages: images });

    const container = document.getElementById('qol_awe_loading_images_table_body');
    container.innerHTML = '';
    images.forEach((image, id) => container.appendChild(renderImage(id, image)));
    renderAwesomeLoadingError();
}

function renderImage(idx, image) {
    const imageTemplate = document.createElement('template');
    imageTemplate.innerHTML = `
		<tr>
			<td class="p-1 qol-valign-middle">
                <img class="qol-awe-loading-preview" loading="lazy" src="${image}" />
            </td>
			<td class="p-1 qol-valign-middle">
				<input
					id="qol_awe_loading_image_key_${idx}"
					class="qol-bg-white form-control border border-0"
					type="text"
					disabled
					value="${image}"
				/>
			</td>
			<td class="p-1 qol-valign-middle">
				<button
					class="qol_awe_loading_image_delete_${idx} btn btn-outline-danger border-0 btn-floating"
					title="Delete image"
				>
					<i class="qol-font-icon-size fa fa-trash"></i>
				</button>
			</td>
		</tr>
	`.trim();

    const imageElement = imageTemplate.content.firstChild;
    const deleteButton = imageElement.getElementsByClassName(
        `qol_awe_loading_image_delete_${idx}`
    )[0];
    deleteButton.onclick = (e) => deleteAwesomeLoadingImage(image);

    return imageElement;
}
//#endregion
