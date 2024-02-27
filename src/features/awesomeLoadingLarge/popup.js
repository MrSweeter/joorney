import AwesomeLoadingSharePopupFeature from '../../shared/awesomeLoadingShare/popup.js';
import configuration from './configuration.js';

export default class AwesomeLoadingLargePopupFeature extends AwesomeLoadingSharePopupFeature {
    constructor() {
        super(configuration);
    }

    load(configurationArg) {
        super.load(configurationArg);
        this.htmlID = 'updateAwesomeLoadingLargeImage';
        this.previewHtmlID = 'awesomeLoadingLargeImagePreview';

        this.updateRenderAwesomeLoadingLarge(configurationArg.awesomeLoadingLargeEnabled);
    }

    updateFeature(e) {
        super.updateFeature(e);
        const checked = e.target.checked;
        this.updateRenderAwesomeLoadingLarge(checked);
    }

    async getImagesConfiguration() {
        const configuration = await StorageSync.get({
            awesomeLoadingLargeImage: '',
            awesomeLoadingImages: [],
        });
        return {
            images: configuration.awesomeLoadingImages,
            selected: configuration.awesomeLoadingLargeImage,
        };
    }

    async saveSelectedImage(value) {
        await StorageSync.set({ awesomeLoadingLargeImage: value });
    }

    getNotificationMessage(img, url) {
        return { awesomeLoadingLargeImage: img, url: url };
    }

    updateRenderAwesomeLoadingLarge(checked) {
        this.updateRenderAwesomeLoading(checked);
    }
}
