import OptionCustomizationFeature from '../../generic/option_customization.js';
import { escapeHTML } from '../../html_generator.js';
import { Console, StorageSync, SYNC_ITEM_BYTES, sendTabMessage, syncItemBytes, Tabs } from '../../utils/browser.js';
import { t } from '../../utils/i18n.js';
import { iconHTML } from '../../utils/icons.js';
import { MESSAGE_ACTION } from '../../utils/messaging.js';
import { JOORNEY_LOADER, JOORNEY_LOADER_LABEL, resolveLoaderImage, withBuiltInLoader } from './loader.js';

// '' is Odoo's own spinner: no image, the content script removes its style
const DEFAULT_LOADER = '';

/**
 * Loader tiles of the feature page: one tile per loader (Joorney, Odoo's default, the stored images), the
 * selected one is written in `<id>Image` and pushed to the open Odoo tabs like the popup does.
 */
export default class AwesomeLoadingShareOptionCustomizationFeature extends OptionCustomizationFeature {
    constructor(configuration) {
        super(configuration);
        this.images = [];
        this.selected = DEFAULT_LOADER;
        this.confirming = undefined;
        this.adding = false;
        this.newUrl = '';
        this.error = '';
        this.tilesEl = undefined;
        // data-action of the tile buttons -> handler, called with the button's data-value
        this.actions = {
            select: (value) => this.pick(value),
            'ask-delete': (value) => this.askDelete(value),
            keep: (value) => this.keepImage(value),
            remove: (value) => this.deleteImage(value),
            'start-add': () => this.startAdd(),
            add: () => this.addImage(),
            'cancel-add': () => this.cancelAdd(),
        };
    }

    async load() {
        const container = document.querySelector(`div[data-feature-customization="awesomeLoading"]`);
        if (!container) throw new Error(`Invalid state for feature: ${this.configuration.id}`);
        container.classList.remove('d-none');

        this.tilesEl = document.getElementById('joorney_awe_loading_tiles');
        this.tilesEl.onclick = (e) => this.onClick(e);
        this.tilesEl.onkeydown = (e) => this.onKeydown(e);
        this.tilesEl.oninput = (e) => {
            if (e.target.matches('.joorney-awl-input')) this.newUrl = e.target.value;
        };

        const configuration = await StorageSync.get(this.configuration.defaultSettings);
        // The built-in loader is injected at render time, so it is never stored
        this.images = this.cleanImages(configuration.awesomeLoadingImages);
        this.selected = configuration[this.imageKey] ?? DEFAULT_LOADER;

        this.render();
    }

    get imageKey() {
        return `${this.configuration.id}Image`;
    }

    cleanImages(images) {
        return Array.from(new Set(images || []))
            .filter((img) => img !== JOORNEY_LOADER)
            .sort();
    }

    //#region CRUD
    async readImages() {
        const { awesomeLoadingImages } = await StorageSync.get({ awesomeLoadingImages: [] });
        return this.cleanImages(awesomeLoadingImages);
    }

    async saveImages(images) {
        this.images = this.cleanImages(images);
        await StorageSync.set({ awesomeLoadingImages: this.images });
    }

    async select(value) {
        this.selected = value;
        await StorageSync.set({ [this.imageKey]: value });
        await this.notifyTabs(value);
    }

    // Same message as the popup. The popup never picks '' (Default); here it means no image: false removes the
    // style, '' would be ignored by the content script. Nothing is injected while the feature is deactivated.
    async notifyTabs(image) {
        const enabled = (await StorageSync.get({ [`${this.configuration.id}Enabled`]: false }))[
            `${this.configuration.id}Enabled`
        ];
        if (!enabled) return;
        // The wildcard * for scheme only matches http or https, same pattern as content_scripts in manifest
        const tabs = await Tabs.query({ url: '*://*/*' });
        for (const tab of tabs) {
            sendTabMessage(tab.id, MESSAGE_ACTION.TO_CONTENT.POPUP_HAS_CHANGE, {
                [this.imageKey]: image || false,
                url: tab.url,
            });
        }
    }

    validateUrl(raw) {
        const value = (raw || '').trim().replace(/\s/g, '');
        if (!value) return { error: t('optionsPreferences_error_missingUrl') };
        let href;
        try {
            const url = new URL(value);
            if (url.protocol === 'https:') href = url.href;
        } catch (ex) {
            Console.warn(ex);
        }
        if (!href) return { error: t('optionsPreferences_error_invalidUrl') };
        return { href };
    }

    async addImage() {
        const { href, error } = this.validateUrl(this.newUrl);
        if (error) return this.fail(error);
        const images = await this.readImages();
        if (images.includes(href)) return this.fail(t('optionsAwl_errorDuplicate'));

        // One sync item for the list of both loaders: refused past the quota, say it before trying
        const next = this.cleanImages([...images, href]);
        const bytes = syncItemBytes('awesomeLoadingImages', next);
        if (bytes > SYNC_ITEM_BYTES) {
            return this.fail(t('optionsPreferences_error_syncQuota', String(bytes), String(SYNC_ITEM_BYTES)));
        }
        try {
            await this.saveImages(next);
        } catch (error) {
            Console.error(error);
            return this.fail(t('optionsPreferences_error_save', error?.message ?? String(error)));
        }
        this.adding = false;
        this.newUrl = '';
        this.error = '';
        await this.select(href);
        this.render(() => this.find('.joorney-awl-radio', href));
    }

    fail(error) {
        this.error = error;
        this.render(() => this.tilesEl.querySelector('.joorney-awl-input'));
    }

    async deleteImage(image) {
        const images = await this.readImages();
        await this.saveImages(images.filter((img) => img !== image));
        this.confirming = undefined;
        if (this.selected === image) await this.select(JOORNEY_LOADER);
        this.render(() => this.find('.joorney-awl-radio', this.selected));
    }
    //#endregion

    //#region Event
    find(selector, value) {
        return Array.from(this.tilesEl.querySelectorAll(selector)).find((el) => el.dataset.value === value);
    }

    async onClick(event) {
        const el = event.target.closest('button[data-action]');
        if (!el || !this.tilesEl.contains(el)) return;
        await this.actions[el.dataset.action]?.(el.dataset.value);
    }

    async pick(value) {
        this.confirming = undefined;
        if (value !== this.selected) await this.select(value);
        this.render(() => this.find('.joorney-awl-radio', value));
    }

    askDelete(value) {
        this.confirming = value;
        this.render(() => this.find('[data-action="keep"]', value));
    }

    keepImage(value) {
        this.confirming = undefined;
        this.render(() => this.find('[data-action="ask-delete"]', value));
    }

    startAdd() {
        this.adding = true;
        this.error = '';
        this.newUrl = '';
        this.render(() => this.tilesEl.querySelector('.joorney-awl-input'));
    }

    cancelAdd() {
        this.adding = false;
        this.error = '';
        this.newUrl = '';
        this.render(() => this.tilesEl.querySelector('[data-action="start-add"]'));
    }

    async onKeydown(event) {
        if (event.target.matches('.joorney-awl-input')) {
            const handler = { Enter: () => this.addImage(), Escape: () => this.cancelAdd() }[event.key];
            if (handler) {
                event.preventDefault();
                await handler();
            }
            return;
        }
        // Radio group: the arrows move the focus and the selection
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        if (!step || !event.target.matches('.joorney-awl-radio')) return;
        event.preventDefault();
        const radios = Array.from(this.tilesEl.querySelectorAll('.joorney-awl-radio'));
        const next = radios[(radios.indexOf(event.target) + step + radios.length) % radios.length];
        await this.select(next.dataset.value);
        this.render(() => this.find('.joorney-awl-radio', next.dataset.value));
    }
    //#endregion

    //#region UI
    describe(value) {
        try {
            const url = new URL(value);
            const file = url.pathname.split('/').filter(Boolean).pop();
            return { host: url.host, label: file ? `${url.host}/${file}` : url.host };
        } catch {
            return { host: value, label: value };
        }
    }

    tileInfo(value) {
        if (value === JOORNEY_LOADER) return { label: JOORNEY_LOADER_LABEL, full: JOORNEY_LOADER_LABEL };
        if (value === DEFAULT_LOADER) {
            const label = t('optionsAwl_default');
            return { label, full: label };
        }
        return { label: this.describe(value).label, full: value };
    }

    previewHTML(value, label) {
        if (value === DEFAULT_LOADER) return `<span class="joorney-awl-ring" aria-hidden="true"></span>`;
        return `<img src="${escapeHTML(resolveLoaderImage(value))}" alt="${escapeHTML(label)}" loading="lazy">`;
    }

    tileHTML(value, selected, tabbable) {
        const builtIn = value === JOORNEY_LOADER;
        const custom = !builtIn && value !== DEFAULT_LOADER;
        const { label, full } = this.tileInfo(value);
        const attr = escapeHTML(value);
        const chips = [
            selected ? `<span class="joorney-chip is-selected">${escapeHTML(t('optionsAwl_inUse'))}</span>` : '',
            builtIn ? `<span class="joorney-chip">${escapeHTML(t('optionsAwl_builtIn'))}</span>` : '',
        ].join('');
        const confirming = custom && this.confirming === value;
        return `
            <div class="joorney-awl-tile${selected ? ' is-selected' : ''}">
                <button type="button" class="joorney-awl-radio" role="radio" aria-checked="${selected}" data-action="select"
                    tabindex="${tabbable ? 0 : -1}" data-value="${attr}" title="${escapeHTML(full)}" aria-label="${escapeHTML(full)}">
                    <span class="joorney-awl-pv">${this.previewHTML(value, label)}</span>
                    <span class="joorney-awl-name">${escapeHTML(label)}</span>
                    <span class="joorney-awl-chips">${chips}</span>
                </button>
                ${
                    custom && !confirming
                        ? `<button type="button" class="joorney-awl-del" data-action="ask-delete" data-value="${attr}"
                            title="${escapeHTML(t('optionsPreferences_deleteImage'))}"
                            aria-label="${escapeHTML(t('optionsAwl_deleteLabel', full))}">${iconHTML('delete')}</button>`
                        : ''
                }
                ${
                    confirming
                        ? `<div class="joorney-awl-confirm" role="alert">
                            <span>${escapeHTML(t('optionsAwl_confirmRemove'))}</span>
                            <button type="button" class="joorney-btn is-secondary is-small" data-action="remove" data-value="${attr}"
                                aria-label="${escapeHTML(t('optionsAwl_removeLabel', full))}">${escapeHTML(t('optionsAwl_remove'))}</button>
                            <button type="button" class="joorney-btn is-secondary is-small" data-action="keep" data-value="${attr}">${escapeHTML(t('optionsAwl_keep'))}</button>
                        </div>`
                        : ''
                }
            </div>
        `;
    }

    addHTML() {
        if (!this.adding) {
            return `<div class="joorney-awl-add"><button type="button" class="joorney-awl-addbtn" data-action="start-add">
                ${iconHTML('add_photo_alternate')}<span>${escapeHTML(t('optionsAwl_add'))}</span></button></div>`;
        }
        return `
            <div class="joorney-awl-add"><div class="joorney-awl-addform">
                <label class="joorney-fs-label" for="joorney_awe_loading_new_image">${escapeHTML(t('optionsPreferences_imageUrl'))}</label>
                <input id="joorney_awe_loading_new_image" class="joorney-input joorney-awl-input" type="text" inputmode="url"
                    autocomplete="off" placeholder="https://example.com/loader.gif" value="${escapeHTML(this.newUrl)}"
                    ${this.error ? 'aria-invalid="true" aria-describedby="joorney_awe_loading_error"' : ''}>
                ${this.error ? `<p class="joorney-error joorney-awl-error" id="joorney_awe_loading_error" role="alert">${iconHTML('error')}<span>${escapeHTML(this.error)}</span></p>` : ''}
                <div class="joorney-awl-addactions">
                    <button type="button" class="joorney-btn is-small" data-action="add">${escapeHTML(t('options_add'))}</button>
                    <button type="button" class="joorney-btn is-secondary is-small" data-action="cancel-add">${escapeHTML(t('optionsAwl_cancel'))}</button>
                </div>
            </div></div>
        `;
    }

    render(focus) {
        const [builtIn, ...stored] = withBuiltInLoader(this.images);
        const all = [builtIn, DEFAULT_LOADER, ...stored];
        const hasSelected = all.includes(this.selected);
        this.tilesEl.innerHTML =
            all
                .map((value, idx) =>
                    this.tileHTML(
                        value,
                        value === this.selected,
                        value === this.selected || (!hasSelected && idx === 0)
                    )
                )
                .join('') + this.addHTML();

        // A remote image that does not load must not leave an empty box
        for (const img of this.tilesEl.querySelectorAll('.joorney-awl-pv img')) {
            img.onerror = () => {
                const broken = document.createElement('span');
                broken.className = 'joorney-awl-broken';
                broken.innerHTML = iconHTML('image');
                img.replaceWith(broken);
            };
        }
        focus?.()?.focus({ preventScroll: true });
    }
    //#endregion
}
