import { PopupCustomizableFeature } from '../../generic/popup.js';
import { Runtime } from '../../utils/browser';

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

        awesomeLoadingImage.innerHTML = '<option value="" selected>Default</option>';
        awesomeLoadingImage.disabled = !enabled;
        awesomeLoadingImagePreview.src = selected;
        awesomeLoadingImagePreview.style.opacity = enabled ? 1 : 0.25;

        for (const img of images) {
            const opt = document.createElement('option');
            opt.innerHTML = img;
            opt.value = img;
            opt.selected = selected === img;
            awesomeLoadingImage.appendChild(opt);
        }

        if (images.length <= 0) {
            awesomeLoadingImage.disabled = true;
            awesomeLoadingImage.style.opacity = 0.25;

            const optionButton = document.createElement('div');
            optionButton.style.cursor = 'pointer';
            optionButton.innerHTML = '<i class="fa-solid fa-up-right-from-square"></i>';
            optionButton.onclick = () => Runtime.openOptionsPage();

            awesomeLoadingImage.parentNode.appendChild(optionButton);
        }

        awesomeLoadingImage.onchange = async (e) => {
            const value = e.target.value;
            await this.saveSelectedImage(value);
            const preview = document.getElementById(this.previewHtmlID);
            preview.src = value;
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
