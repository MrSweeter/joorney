import AwesomeLoadingSharePopupFeature from '../../shared/awesomeLoadingShare/popup.js';
import { StorageSync } from '../../utils/browser.js';
import configuration from './configuration.js';

export default class AwesomeLoadingSmallPopupFeature extends AwesomeLoadingSharePopupFeature {
    constructor() {
        super(configuration);
        this.htmlID = 'updateAwesomeLoadingSmallImage';
        this.previewHtmlID = 'awesomeLoadingSmallImagePreview';
    }

    getNotificationMessage(data) {
        return { awesomeLoadingSmallImage: data.image };
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
}
