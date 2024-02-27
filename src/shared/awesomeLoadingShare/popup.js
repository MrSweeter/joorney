import PopupFeature from '../../generic/popup.js';
import { Tabs } from '../../utils/browser.js';

export default class AwesomeLoadingSharePopupFeature extends PopupFeature {
    constructor(configuration) {
        super(configuration);
        this.htmlID = '';
        this.previewHtmlID = '';
    }

    async getImagesConfiguration() {
        return { images: [], selected: '' };
    }

    async saveSelectedImage(value) {}

    async updateRenderAwesomeLoading(checked) {
        const awesomeLoadingImage = document.getElementById(this.htmlID);
        const awesomeLoadingImagePreview = document.getElementById(this.previewHtmlID);

        const { images, selected } = await this.getImagesConfiguration();

        awesomeLoadingImage.innerHTML = '<option value="" selected>Default</option>';
        awesomeLoadingImage.disabled = !checked;
        awesomeLoadingImagePreview.src = selected;
        awesomeLoadingImagePreview.style.opacity = checked ? 1 : 0.25;

        images.forEach((img) => {
            const opt = document.createElement('option');
            opt.innerHTML = img;
            opt.value = img;
            opt.selected = selected === img;
            awesomeLoadingImage.appendChild(opt);
        });

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
            let value = e.target.value;
            await this.saveSelectedImage(value);
            const preview = document.getElementById(this.previewHtmlID);
            preview.src = value;
            notifyTabs(value);
        };

        notifyTabs(checked ? selected : false);
    }

    getNotificationMessage(img, url) {
        return {};
    }

    notifyTabs(img) {
        // The wildcard * for scheme only matches http or https
        // Same url pattern than content_scripts in manifest
        Tabs.query({ url: '*://*/*' }, (tabs) => {
            tabs.forEach((t) => Tabs.sendMessage(t.id, this.getNotificationMessage(img, t.url)));
        });
    }
}
