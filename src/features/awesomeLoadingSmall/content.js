import AwesomeLoadingShareContentFeature from '../../shared/awesomeLoadingShare/content.js';
import { StorageSync } from '../../utils/browser.ts';
import configuration from './configuration.js';

export default class AwesomeLoadingSmallContentFeature extends AwesomeLoadingShareContentFeature {
    constructor() {
        super(configuration);
        this.loadingID = 'joorney-awesome-loading-small';
    }

    getInnerStyle(image) {
        return `
            <style name="${this.loadingID}" type="text/css">

                .o_loading_indicator {

                    content: url(${image});
                    background-color: unset;

                    /* Resize the image automatically */
                    max-height: 46px;
                }
            </style>
        `.trim();
    }

    async getLoadingImage() {
        const { awesomeLoadingSmallImage } = await StorageSync.get({
            awesomeLoadingSmallImage: false,
        });
        return awesomeLoadingSmallImage;
    }

    getImageFromNavigationMessage(msg) {
        return msg.awesomeLoadingSmallImage;
    }
}
