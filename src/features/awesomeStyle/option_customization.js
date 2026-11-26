import OptionCustomizationFeature from '../../generic/option_customization.js';
import { Console, StorageSync, SYNC_ITEM_BYTES, syncItemBytes } from '../../utils/browser.js';
import { t } from '../../utils/i18n.js';
import configuration from './configuration.js';

export default class AwesomeStyleOptionCustomizationFeature extends OptionCustomizationFeature {
    constructor() {
        super(configuration);
        this.saveAwesomeStyle = this.saveAwesomeStyle.bind(this);
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
        const css = textareaInput.value;

        // Refused by the sync quota anyway: say it before trying, with the size to cut
        const bytes = syncItemBytes('awesomeStyleCSS', css);
        if (bytes > SYNC_ITEM_BYTES) {
            this.showError(t('optionsPreferences_error_syncQuota', String(bytes), String(SYNC_ITEM_BYTES)));
            return;
        }

        textareaInput.disabled = true;
        try {
            await StorageSync.set({ awesomeStyleCSS: css });
            this.showError('');
        } catch (error) {
            Console.error(error);
            this.showError(t('optionsPreferences_error_save', error?.message ?? String(error)));
        } finally {
            textareaInput.disabled = false;
        }
    }

    showError(message) {
        const errorElement = document.getElementById('joorney_awe_style_error');
        errorElement.querySelector('span').textContent = message;
        errorElement.hidden = !message;
    }
}
