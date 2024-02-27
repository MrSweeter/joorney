import AwesomeLoadingSharePopupFeature from '../../shared/awesomeLoadingShare/popup.js';
import configuration from './configuration.js';

export default class AwesomeLoadingSmallPopupFeature extends AwesomeLoadingSharePopupFeature {
    constructor() {
        super(configuration);
    }

    load(configurationArg) {
        super.load(configurationArg);
        this.htmlID = 'updateAwesomeLoadingSmallImage';
        this.previewHtmlID = 'awesomeLoadingSmallImagePreview';

        this.updateRenderAwesomeLoadingSmall(configurationArg.awesomeLoadingSmallEnabled);
    }

    updateFeature(e) {
        super.updateFeature(e);
        const checked = e.target.checked;
        this.updateRenderAwesomeLoadingSmall(checked);
    }

    async getImagesConfiguration() {
        const configuration = await StorageSync.get({
            awesomeLoadingSmallImage: '',
            awesomeLoadingImages: [],
        });
        return {
            images: configuration.awesomeLoadingImages,
            selected: configuration.awesomeLoadingSmallImage,
        };
    }

    async saveSelectedImage(value) {
        await StorageSync.set({ awesomeLoadingSmallImage: value });
    }

    getNotificationMessage(img, url) {
        return { awesomeLoadingSmallImage: img, url: url };
    }

    updateRenderAwesomeLoadingSmall(checked) {
        this.updateRenderAwesomeLoading(checked);
    }
}
