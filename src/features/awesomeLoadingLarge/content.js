import AwesomeLoadingShareContentFeature from '../../shared/awesomeLoadingShare/content.js';
import { StorageSync } from '../../utils/browser.js';
import configuration from './configuration.js';

export default class AwesomeLoadingLargeContentFeature extends AwesomeLoadingShareContentFeature {
    constructor() {
        super(configuration);
        this.loadingID = 'odoo-qol-awesome-loading-large';
    }

    getInnerStyle(image) {
        return `
            <style name="${this.loadingID}" type="text/css">

                .o_spinner > img[src^="/web/static/img/spin."]:first-child,
                .oe_blockui_spin > img[src="/web/static/src/img/spin.png"]:first-child {

                    content: url(${image});

                    /* Resize the image automatically */
                    max-height: 46px;

                    /* Remove the spinning animation */
                    if spin {
                        animation: fa-spin 1s infinite linear !important;
                    } else {
                        animation: none !important;
                    }
                }

                /* Use same backdrop effect as Odoo 16 (slightly less blurred) */
                .o_blockUI, .blockUI.blockOverlay {
                    backdrop-filter: blur(1px);
                    background-color: rgba(0, 0, 0, 0.5) !important;
                    opacity: 1;
                }

            </style>
        `.trim();
    }

    async getLoadingImage() {
        const { awesomeLoadingLargeImage } = await StorageSync.get({
            awesomeLoadingLargeImage: false,
        });
        return awesomeLoadingLargeImage;
    }

    getImageFromNavigationMessage(msg) {
        return msg.awesomeLoadingLargeImage;
    }
}
