import OptionCustomizationFeature from '../../generic/option_customization.js';
import { StorageSync } from '../../utils/browser.js';
import configuration from './configuration.js';

export default class AwesomeStyleOptionCustomizationFeature extends OptionCustomizationFeature {
    constructor() {
        super(configuration);
    }

    async load() {
        super.load();
        document.getElementById('joorney_awe_style_save').onclick = this.saveAwesomeStyle;

        const configuration = await StorageSync.get(this.configuration.defaultSettings);

        const textareaInput = document.getElementById('joorney_awe_style_css');
        textareaInput.value = configuration.awesomeStyleCSS;
        const linesCount = configuration.awesomeStyleCSS.split(/\r\n|\r|\n/).length;
        textareaInput.setAttribute('rows', Math.max(linesCount + 2, 10));

        textareaInput.onkeydown = (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveAwesomeStyle();
            }
        };
    }

    async saveAwesomeStyle() {
        const textareaInput = document.getElementById('joorney_awe_style_css');

        textareaInput.disabled = true;
        await StorageSync.set({ awesomeStyleCSS: textareaInput.value });
        textareaInput.disabled = false;
    }
}
