import OptionCustomizationFeature from '../../generic/option_customization.js';
import { Console, StorageSync } from '../../utils/browser.js';

export default class AwesomeLoadingShareOptionCustomizationFeature extends OptionCustomizationFeature {
    async load() {
        const container = document.querySelector(`div[data-feature-customization="awesomeLoading"]`);
        if (!container) throw new Error(`Invalid state for feature: ${this.configuration.id}`);
        container.classList.remove('d-none');

        const awesomeLoadingNewImage = document.getElementById('joorney_awe_loading_new_image');
        awesomeLoadingNewImage.onkeydown = (e) => this.onKeydownHost(e);
        awesomeLoadingNewImage.oninput = (e) => this.onImageChange(e);

        document.getElementById('joorney_awe_loading_new_image_save').onclick = () => this.createAwesomeLoadingImage();

        const configuration = await StorageSync.get(this.configuration.defaultSettings);

        this.renderImagesList(configuration.awesomeLoadingImages);

        this.setupCollapse(container);
    }

    //#region CRUD
    async createAwesomeLoadingImage() {
        const imageInput = document.getElementById('joorney_awe_loading_new_image');
        let imageUrl = imageInput.value;
        if (!imageUrl) {
            this.renderAwesomeLoadingError('Missing url');
            return;
        }

        const images = await this.readAwesomeLoadingImages();

        imageUrl = imageUrl.trim().replace(/\s/g, '');

        try {
            imageUrl = new URL(imageUrl).href;
            images.push(imageUrl);
            await this.renderImagesList(images);
            imageInput.value = '';
        } catch (ex) {
            this.renderAwesomeLoadingError(ex);
        }
    }

    async readAwesomeLoadingImages() {
        const { awesomeLoadingImages } = await StorageSync.get({
            awesomeLoadingImages: '',
        });
        return awesomeLoadingImages;
    }

    async deleteAwesomeLoadingImage(imageUrl) {
        if (confirm(`Are you sure you want to remove image: ${imageUrl}?`)) {
            const images = await this.readAwesomeLoadingImages();
            await this.renderImagesList(images.filter((img) => img !== imageUrl));
        }
    }
    //#endregion

    //#region Event
    onKeydownHost(event) {
        if (event.key === 'Enter') this.createAwesomeLoadingImage();
    }
    onImageChange(event) {
        let imageUrl = event.target.value;
        if (!imageUrl) return;

        imageUrl = imageUrl.trim().replace(/\s/g, '');

        try {
            imageUrl = new URL(imageUrl).href;
            const imagePreview = document.getElementById('joorney_awe_loading_new_image_preview');
            imagePreview.src = imageUrl;
        } catch (ex) {
            Console.warn(ex);
        }
    }
    //#endregion

    //#region UI
    renderAwesomeLoadingError(errorMessage) {
        const container = document.getElementById('joorney_awe_loading_error_footer');
        container.textContent = errorMessage;
        container.style.display = errorMessage ? 'table-cell' : 'none';
    }

    async renderImagesList(imagesArg) {
        const images = Array.from(new Set(imagesArg)).sort();
        await StorageSync.set({ awesomeLoadingImages: images });

        const container = document.getElementById('joorney_awe_loading_images_table_body');
        container.innerHTML = '';
        for (const [id, image] of images.entries()) container.appendChild(this.renderImage(id, image));
        this.renderAwesomeLoadingError();
    }

    renderImage(idx, image) {
        const imageTemplate = document.createElement('template');
        imageTemplate.innerHTML = `
            <tr>
                <td class="p-1 joorney-valign-middle">
                    <img class="joorney-awe-loading-preview" loading="lazy" src="${image}" />
                </td>
                <td class="p-1 joorney-valign-middle">
                    <input
                        id="joorney_awe_loading_image_key_${idx}"
                        class="joorney-bg-white form-control border border-0"
                        type="text"
                        disabled
                        value="${image}"
                    />
                </td>
                <td class="p-1 joorney-valign-middle">
                    <button
                        class="joorney_awe_loading_image_delete_${idx} btn btn-outline-danger border-0 btn-floating"
                        title="Delete image"
                    >
                        <i class="joorney-font-icon-size fa fa-trash"></i>
                    </button>
                </td>
            </tr>
        `.trim();

        const imageElement = imageTemplate.content.firstChild;
        const deleteButton = imageElement.getElementsByClassName(`joorney_awe_loading_image_delete_${idx}`)[0];
        deleteButton.onclick = () => this.deleteAwesomeLoadingImage(image);

        return imageElement;
    }
    //#endregion
}
