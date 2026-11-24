import OptionCustomizationFeature from '../../generic/option_customization.js';
import { escapeHTML, stringToHTML } from '../../html_generator.js';
import { Console, StorageSync } from '../../utils/browser.js';
import { t } from '../../utils/i18n.js';
import { iconHTML } from '../../utils/icons.js';
import configuration from './configuration.js';

export default class UnfocusAppOptionCustomizationFeature extends OptionCustomizationFeature {
    constructor() {
        super(configuration);
    }

    async load() {
        super.load();
        const origins = await this.readUnfocusAppOrigins();

        await this.restoreImage();
        await this.renderOriginsObject(origins);
    }

    //#region CRUD
    async readUnfocusAppOrigins() {
        const { unfocusAppOrigins } = await StorageSync.get({
            unfocusAppOrigins: this.defaultSettings.unfocusAppOrigins,
        });
        return unfocusAppOrigins;
    }

    async deleteUnfocusAppOrigin(origin) {
        const origins = await this.readUnfocusAppOrigins();
        delete origins[origin];
        this.pendingOrigin = null;
        await this.renderOriginsObject(origins);
    }
    //#endregion

    //#region UI
    async renderOriginsObject(origins) {
        await StorageSync.set({ unfocusAppOrigins: origins });
        this.origins = origins;

        const container = document.getElementById('joorney_unfocus_app_hosts');
        container.replaceChildren();
        const entries = Object.entries(origins);
        if (!entries.length) {
            container.appendChild(
                stringToHTML(`<p class="joorney-empty">${escapeHTML(t('optionsUnfocus_empty'))}</p>`)
            );
            return;
        }

        const list = stringToHTML('<div class="joorney-unfocus-hosts"></div>');
        for (const [origin, apps] of entries) {
            const values = Object.values(apps);
            list.appendChild(
                this.renderOrigin(
                    origin,
                    values.filter((v) => v === 2).length,
                    values.filter((v) => v === true || v === 0).length
                )
            );
        }
        container.appendChild(list);
    }

    // Asks inline (Cancel / Forget, no confirm()): the question takes the place of the row
    renderOrigin(origin, superfocusCount, unfocusCount) {
        if (this.pendingOrigin === origin) return this.renderOriginConfirm(origin);

        const label = escapeHTML(t('optionsUnfocus_forgetHost', origin));
        const element = stringToHTML(`
            <div class="joorney-unfocus-host">
                <span class="joorney-unfocus-name">${escapeHTML(origin)}</span>
                <span class="joorney-chips">
                    <span class="joorney-chip is-superfocus">${escapeHTML(t('optionsUnfocus_superfocused', String(superfocusCount)))}</span>
                    <span class="joorney-chip">${escapeHTML(t('optionsUnfocus_unfocused', String(unfocusCount)))}</span>
                </span>
                <button type="button" class="joorney-icon-btn is-small" title="${label}" aria-label="${label}">
                    ${iconHTML('delete')}
                </button>
            </div>
        `);
        element.querySelector('button').onclick = async () => {
            this.pendingOrigin = origin;
            await this.renderOriginsObject(this.origins);
            document.querySelector('#joorney_unfocus_app_hosts [data-action="cancel"]')?.focus();
        };
        return element;
    }

    renderOriginConfirm(origin) {
        const question = escapeHTML(t('optionsUnfocus_confirmForget', origin));
        const element = stringToHTML(`
            <div class="joorney-unfocus-host is-confirm">
                <div class="joorney-ask joorney-unfocus-ask" role="group" aria-label="${question}">
                    <span>${question}</span>
                    <button type="button" class="joorney-btn is-secondary" data-action="cancel">${escapeHTML(t('optionsUnfocus_cancel'))}</button>
                    <button type="button" class="joorney-btn" data-action="forget">${escapeHTML(t('optionsUnfocus_forget'))}</button>
                </div>
            </div>
        `);
        element.querySelector('[data-action="cancel"]').onclick = async () => {
            this.pendingOrigin = null;
            await this.renderOriginsObject(this.origins);
            for (const button of document.querySelectorAll('#joorney_unfocus_app_hosts .joorney-icon-btn')) {
                if (button.getAttribute('aria-label') === t('optionsUnfocus_forgetHost', origin)) button.focus();
            }
        };
        element.querySelector('[data-action="forget"]').onclick = () => this.deleteUnfocusAppOrigin(origin);
        return element;
    }
    //#endregion

    //#region Image
    async restoreImage() {
        const { unfocusAppLightImageURL, unfocusAppDarkImageURL } = await StorageSync.get({
            unfocusAppLightImageURL: this.defaultSettings.unfocusAppLightImageURL,
            unfocusAppDarkImageURL: this.defaultSettings.unfocusAppDarkImageURL,
        });

        this.loadImageInput('light', 'unfocusAppLightImageURL', unfocusAppLightImageURL);
        this.loadImageInput('dark', 'unfocusAppDarkImageURL', unfocusAppDarkImageURL);
    }

    loadImageInput(side, configKey, value) {
        const prefix = `joorney_unfocus_app_${side}_image`;
        const defaultImage = this.defaultSettings[configKey];
        const imageInput = document.getElementById(`${prefix}_input`);
        const image = document.getElementById(prefix);
        const label = document.getElementById(`${prefix}_label`);
        const error = document.getElementById(`${prefix}_error`);
        const reset = document.getElementById(`${prefix}_reset`);
        const restored = document.getElementById(`${prefix}_restored`);
        let saved = value;
        // What the field held before "Use default", for Undo (it may be an invalid URL still being typed)
        let typedBeforeReset = null;

        // "Use default" only when it changes something: a custom image, or an invalid URL to get out of
        const showReset = () => {
            reset.hidden = saved === defaultImage && imageInput.getAttribute('aria-invalid') !== 'true';
        };
        const showImage = (url) => {
            const isDefault = url === defaultImage;
            image.src = url;
            label.textContent = isDefault ? t('optionsUnfocus_defaultImage') : t('optionsUnfocus_customImage');
            label.classList.toggle('is-custom', !isDefault);
        };
        // message: '' hides it; invalid: the typed URL is the problem (not a storage failure)
        const showError = (message, invalid = false) => {
            imageInput.setAttribute('aria-invalid', String(invalid));
            error.hidden = !message;
            error.replaceChildren();
            if (message) error.append(stringToHTML(iconHTML('error')), message);
        };
        const save = async (url) => {
            try {
                await StorageSync.set({ [configKey]: url });
            } catch (ex) {
                Console.error(ex);
                showError(t('optionsUnfocus_imageSaveError', ex?.message ?? String(ex)));
                return false;
            }
            saved = url;
            showImage(url);
            return true;
        };
        const apply = async (text) => {
            const typed = text.trim().replace(/\s/g, '');
            let imageUrl;
            try {
                imageUrl = new URL(typed.length === 0 ? defaultImage : typed);
                // Odoo is served over https: an http image is blocked as mixed content, other schemes never load
                if (imageUrl.protocol !== 'https:') throw new Error('The image url must use https');
                if (!this.isImageUrlPath(imageUrl.pathname)) throw new Error('Invalid image extension in the url path');
            } catch (ex) {
                Console.warn(ex);
                showError(t('optionsUnfocus_invalidImage'), true);
                showReset();
                return;
            }
            showError('');
            await save(`${imageUrl}`);
            showReset();
        };

        imageInput.value = value;
        showImage(value);
        showError('');
        showReset();
        restored.hidden = true;

        imageInput.oninput = async (e) => {
            restored.hidden = true;
            await apply(e.target.value);
        };

        reset.onclick = async () => {
            typedBeforeReset = imageInput.value;
            imageInput.value = defaultImage;
            showError('');
            if (!(await save(defaultImage))) return;
            showReset();
            restored.hidden = false;
            // The button that had the focus is now hidden
            document.getElementById(`${prefix}_undo`).focus();
        };

        document.getElementById(`${prefix}_undo`).onclick = async () => {
            restored.hidden = true;
            imageInput.value = typedBeforeReset;
            await apply(typedBeforeReset);
            imageInput.focus();
        };
    }

    isImageUrlPath(path) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg']; // Add more extensions if needed
        const lowercaseUrl = path.toLowerCase();

        return imageExtensions.some((extension) => lowercaseUrl.endsWith(extension));
    }
    //#endregion
}
