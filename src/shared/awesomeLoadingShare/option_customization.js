import OptionCustomizationFeature from '../../generic/option_customization.js';
import { escapeHTML } from '../../html_generator.js';
import { Console, StorageSync } from '../../utils/browser.js';
import { t } from '../../utils/i18n.js';
import { JOORNEY_LOADER, JOORNEY_LOADER_LABEL, resolveLoaderImage, withBuiltInLoader } from './loader.js';

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
            this.renderAwesomeLoadingError(t('optionsPreferences_error_missingUrl'));
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
            Console.warn(ex);
            this.renderAwesomeLoadingError(t('optionsPreferences_error_invalidUrl'));
        }
    }

    async readAwesomeLoadingImages() {
        const { awesomeLoadingImages } = await StorageSync.get({
            awesomeLoadingImages: '',
        });
        return awesomeLoadingImages;
    }

    async deleteAwesomeLoadingImage(imageUrl) {
        if (confirm(t('optionsPreferences_confirmRemoveImage', imageUrl))) {
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
        // The built-in loader is injected at render time, so it is never stored (nor removable).
        const images = Array.from(new Set(imagesArg))
            .filter((img) => img !== JOORNEY_LOADER)
            .sort();
        await StorageSync.set({ awesomeLoadingImages: images });

        const container = document.getElementById('joorney_awe_loading_images_table_body');
        container.innerHTML = '';
        for (const [id, image] of withBuiltInLoader(images).entries())
            container.appendChild(this.renderImage(id, image));
        this.renderAwesomeLoadingError();
    }

    renderImage(idx, image) {
        const builtIn = image === JOORNEY_LOADER;
        const imageTemplate = document.createElement('template');
        imageTemplate.innerHTML = `
            <tr>
                <td class="p-1 joorney-valign-middle">
                    <img class="joorney-awe-loading-preview" loading="lazy" src="${escapeHTML(resolveLoaderImage(image))}" />
                </td>
                <td class="p-1 joorney-valign-middle">
                    <input
                        id="joorney_awe_loading_image_key_${idx}"
                        class="joorney-bg-white form-control border border-0"
                        type="text"
                        disabled
                        value="${escapeHTML(builtIn ? JOORNEY_LOADER_LABEL : image)}"
                    />
                </td>
                <td class="p-1 joorney-valign-middle">
                    ${
                        builtIn
                            ? ''
                            : `<button
                        class="joorney_awe_loading_image_delete_${idx} btn btn-outline-danger border-0 btn-floating"
                        title="${escapeHTML(t('optionsPreferences_deleteImage'))}"
                    >
                        <i class="joorney-icon joorney-icon-filled joorney-font-icon-size" data-icon="delete" aria-hidden="true"></i>
                    </button>`
                    }
                </td>
            </tr>
        `.trim();

        const imageElement = imageTemplate.content.firstChild;
        const deleteButton = imageElement.getElementsByClassName(`joorney_awe_loading_image_delete_${idx}`)[0];
        if (deleteButton) deleteButton.onclick = () => this.deleteAwesomeLoadingImage(image);

        return imageElement;
    }
    //#endregion
}
