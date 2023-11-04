import { StorageSync } from '../../utils/browser.js';
import { defaultAwesomeStyleSetting } from '../../utils/feature_default_configuration.js';
import { loadFeature } from './features.js';

export async function load() {
    await loadFeature('awesomeStyle');
}

export async function restore() {
    document.getElementById('qol_awe_style_save').onclick = saveAwesomeStyle;

    const configuration = await StorageSync.get(defaultAwesomeStyleSetting);

    const textareaInput = document.getElementById('qol_awe_style_css');
    textareaInput.value = configuration.awesomeStyleCSS;
    const linesCount = configuration.awesomeStyleCSS.split(/\r\n|\r|\n/).length;
    textareaInput.setAttribute('rows', Math.max(linesCount + 2, 10));

    textareaInput.onkeydown = (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveAwesomeStyle();
        }
    };
}

export async function saveAwesomeStyle() {
    const textareaInput = document.getElementById('qol_awe_style_css');

    textareaInput.disabled = true;
    await StorageSync.set({ awesomeStyleCSS: textareaInput.value });
    textareaInput.disabled = false;
}
