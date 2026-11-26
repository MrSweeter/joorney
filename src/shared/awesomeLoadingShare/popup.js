import { PopupCustomizableFeature } from '../../generic/popup.js';
import { t } from '../../utils/i18n.js';
import { JOORNEY_LOADER, JOORNEY_LOADER_LABEL, resolveLoaderImage, withBuiltInLoader } from './loader.js';

export default class AwesomeLoadingSharePopupFeature extends PopupCustomizableFeature {
    constructor(configuration) {
        super(configuration);
        this.htmlID = '';
        this.previewHtmlID = '';
    }

    async render(enabled) {
        const awesomeLoadingImage = document.getElementById(this.htmlID);
        const awesomeLoadingImagePreview = document.getElementById(this.previewHtmlID);

        const { images, selected } = await this.getImagesConfiguration();

        awesomeLoadingImage.replaceChildren(new Option(t('common_default'), '', false, true));
        awesomeLoadingImage.disabled = !enabled;
        awesomeLoadingImagePreview.src = resolveLoaderImage(selected);
        awesomeLoadingImagePreview.style.opacity = enabled ? 1 : 0.25;

        for (const img of withBuiltInLoader(images)) {
            const opt = document.createElement('option');
            opt.textContent = img === JOORNEY_LOADER ? JOORNEY_LOADER_LABEL : img;
            opt.value = img;
            opt.selected = selected === img;
            awesomeLoadingImage.appendChild(opt);
        }

        awesomeLoadingImage.onchange = async (e) => {
            const value = e.target.value;
            await this.saveSelectedImage(value);
            const preview = document.getElementById(this.previewHtmlID);
            preview.src = resolveLoaderImage(value);
            this.notifyTabs({ image: value });
        };

        this.notifyTabs({ image: enabled ? selected : false });
    }

    getNotificationMessage(_data) {
        return {};
    }

    async getImagesConfiguration() {
        return { images: [], selected: '' };
    }

    async saveSelectedImage(_value) {}
}
