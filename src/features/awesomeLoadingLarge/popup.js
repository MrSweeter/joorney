import AwesomeLoadingSharePopupFeature from '../../shared/awesomeLoadingShare/popup.js';
import { StorageSync } from '../../utils/browser';
import configuration from './configuration.js';

export default class AwesomeLoadingLargePopupFeature extends AwesomeLoadingSharePopupFeature {
    constructor() {
        super(configuration);
        this.htmlID = 'updateAwesomeLoadingLargeImage';
        this.previewHtmlID = 'awesomeLoadingLargeImagePreview';
    }

    getNotificationMessage(data) {
        return { awesomeLoadingLargeImage: data.image };
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
}
