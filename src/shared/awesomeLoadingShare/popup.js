import { PopupCustomizableFeature } from '../../generic/popup.js';
import { escapeHTML } from '../../html_generator.js';
import { StorageSync } from '../../utils/browser.js';
import { t } from '../../utils/i18n.js';
import { JOORNEY_LOADER, JOORNEY_LOADER_LABEL, resolveLoaderImage, withBuiltInLoader } from './loader.js';

/**
 * Loader image of Awesome Loading Large or Small: imageSetting is the storage key, also the POPUP_HAS_CHANGE key the
 * content script reads (getImageFromNavigationMessage).
 */
export default class AwesomeLoadingSharePopupFeature extends PopupCustomizableFeature {
    constructor(configuration, imageSetting) {
        super(configuration);
        this.imageSetting = imageSetting;
        this.selected = '';
    }

    blockHTML() {
        const id = `joorney_popup_${this.imageSetting}`;
        return `
            <div class="joorney-popup-field joorney-popup-loader">
                <label class="joorney-popup-setting-label" for="${id}">${escapeHTML(t('optionsAwl_group'))}</label>
                <select id="${id}" class="joorney-input" data-role="image"></select>
                <img class="joorney-popup-loader-preview" data-role="preview" alt="${escapeHTML(t('popup_loadingPreviewAlt'))}" hidden>
            </div>
        `;
    }

    async render(_active) {
        const select = this.container.querySelector('[data-role="image"]');
        const { [this.imageSetting]: selected, awesomeLoadingImages } = await StorageSync.get({
            [this.imageSetting]: '',
            awesomeLoadingImages: [],
        });
        this.selected = selected;

        select.replaceChildren(new Option(t('common_default'), '', false, !selected));
        for (const img of withBuiltInLoader(awesomeLoadingImages)) {
            const label = img === JOORNEY_LOADER ? JOORNEY_LOADER_LABEL : img;
            select.appendChild(new Option(label, img, false, selected === img));
        }
        this.updatePreview(selected);

        select.onchange = async () => {
            this.selected = select.value;
            this.updatePreview(this.selected);
            await this.saveSettings({ [this.imageSetting]: this.selected });
            if (this.active) this.notifyTab(this.getNotificationMessage({ checked: true }));
        };
    }

    // Default: the Odoo spinner, nothing to preview
    updatePreview(image) {
        const preview = this.container.querySelector('[data-role="preview"]');
        preview.hidden = !image;
        if (image) preview.src = resolveLoaderImage(image);
    }

    // false removes the loader: the default is Odoo's own spinner
    getNotificationMessage(data) {
        return { [this.imageSetting]: (data.checked && this.selected) || false };
    }
}
