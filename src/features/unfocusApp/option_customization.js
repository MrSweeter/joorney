import { getUnfocusAppNames } from '../../api/local.js';
import OptionCustomizationFeature from '../../generic/option_customization.js';
import { escapeHTML, stringToHTML } from '../../html_generator.js';
import { Console, StorageSync } from '../../utils/browser.js';
import { t } from '../../utils/i18n.js';
import { iconHTML } from '../../utils/icons.js';
import configuration from './configuration.js';

// Same values as content.js: `true` is how older versions stored an unfocused app
const UNFOCUS_STATE = Object.freeze({ UNFOCUS: 0, DEFAULT: 1, SUPER: 2 });
const SHARED_ORIGIN = 'unfocus_app_shared';
// Order of the mode buttons of an app
const STATE_BUTTONS = [
    { state: UNFOCUS_STATE.UNFOCUS, icon: 'visibility_off', labelKey: 'optionsUnfocus_stateUnfocused' },
    { state: UNFOCUS_STATE.DEFAULT, icon: 'visibility', labelKey: 'optionsUnfocus_stateNormal' },
    { state: UNFOCUS_STATE.SUPER, icon: 'star', labelKey: 'optionsUnfocus_stateSuperfocused' },
];
// An open host lists its superfocused apps first, then the unfocused ones, each by name
const LIST_ORDER = [UNFOCUS_STATE.SUPER, UNFOCUS_STATE.UNFOCUS];

function compareApps(a, b) {
    return LIST_ORDER.indexOf(a.state) - LIST_ORDER.indexOf(b.state) || a.name.localeCompare(b.name);
}

function readState(value) {
    if (value === true || value === UNFOCUS_STATE.UNFOCUS) return UNFOCUS_STATE.UNFOCUS;
    if (value === UNFOCUS_STATE.SUPER) return UNFOCUS_STATE.SUPER;
    return UNFOCUS_STATE.DEFAULT;
}

// "hr_expense.menu_hr_expense_root" -> "Hr Expense", for an app never seen on a home menu with this browser
function moduleName(xmlid) {
    return xmlid
        .split('.')[0]
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export default class UnfocusAppOptionCustomizationFeature extends OptionCustomizationFeature {
    constructor() {
        super(configuration);
    }

    async load() {
        super.load();
        this.openOrigins = new Set();
        this.pendingOrigin = null;
        // The app last set back to normal, for its Undo line: { origin, app, value, state }
        this.restoredApp = null;
        // Shown once above the hosts after a write failed (sync quota, storage error)
        this.saveError = '';

        const [origins, { unfocusAppShareEnabled }, appNames] = await Promise.all([
            this.readUnfocusAppOrigins(),
            StorageSync.get({ unfocusAppShareEnabled: this.defaultSettings.unfocusAppShareEnabled }),
            getUnfocusAppNames().catch((error) => {
                Console.warn(error);
                return {};
            }),
        ]);
        this.origins = origins;
        this.shareEnabled = unfocusAppShareEnabled;
        this.appNames = appNames;

        await this.restoreImage();
        this.renderOrigins();
    }

    //#region CRUD
    async readUnfocusAppOrigins() {
        const { unfocusAppOrigins } = await StorageSync.get({
            unfocusAppOrigins: this.defaultSettings.unfocusAppOrigins,
        });
        return unfocusAppOrigins;
    }

    /**
     * Read again before each write: the Odoo tabs may have starred apps since the page was opened.
     * @returns {Promise<boolean>} false when the write failed: the hosts are shown as stored, with the error
     */
    async updateUnfocusAppOrigins(update) {
        try {
            const origins = await this.readUnfocusAppOrigins();
            update(origins);
            await StorageSync.set({ unfocusAppOrigins: origins });
            this.origins = origins;
            return true;
        } catch (error) {
            Console.error(error);
            this.saveError = t('optionsUnfocus_errorSave', error?.message ?? String(error));
            this.pendingOrigin = null;
            this.restoredApp = null;
            this.origins = await this.readUnfocusAppOrigins().catch(() => this.origins);
            this.renderOrigins();
            return false;
        }
    }

    async deleteUnfocusAppOrigin(origin) {
        this.pendingOrigin = null;
        this.restoredApp = null;
        this.openOrigins.delete(origin);
        if (!(await this.updateUnfocusAppOrigins((origins) => delete origins[origin]))) return;
        this.renderOrigins();
    }

    async setAppState(origin, app, state) {
        const previous = this.origins[origin]?.[app];
        this.restoredApp =
            state === UNFOCUS_STATE.DEFAULT ? { origin, app, value: previous, state: readState(previous) } : null;
        const saved = await this.updateUnfocusAppOrigins((origins) => {
            const apps = origins[origin] ?? {};
            if (state === UNFOCUS_STATE.DEFAULT) delete apps[app];
            else apps[app] = state;
            // Normal is the absence of an entry: older content scripts stored it, it must not keep the host alive
            for (const [key, value] of Object.entries(apps)) {
                if (readState(value) === UNFOCUS_STATE.DEFAULT) delete apps[key];
            }
            // A host without any app left is forgotten, Undo brings it back
            if (Object.keys(apps).length) origins[origin] = apps;
            else delete origins[origin];
        });
        if (!saved) return;
        this.renderOrigins();

        // The pressed button moved (other group) or became the Undo line
        const host = this.hostElement(origin);
        const target = this.restoredApp
            ? host?.querySelector('.joorney-unfocus-undo')
            : host?.querySelector(`[data-app="${CSS.escape(app)}"] [aria-checked="true"]`);
        target?.focus();
    }

    async undoRestoredApp() {
        const { origin, app, value } = this.restoredApp;
        this.restoredApp = null;
        const saved = await this.updateUnfocusAppOrigins((origins) => {
            origins[origin] = { ...(origins[origin] ?? {}), [app]: value };
        });
        if (!saved) return;
        this.renderOrigins();
        this.hostElement(origin)
            ?.querySelector(`[data-app="${CSS.escape(app)}"] [aria-checked="true"]`)
            ?.focus();
    }
    //#endregion

    //#region UI
    hostElement(origin) {
        for (const host of document.querySelectorAll('#joorney_unfocus_app_hosts .joorney-unfocus-host')) {
            if (host.dataset.origin === origin) return host;
        }
        return null;
    }

    appName(app) {
        return this.appNames[app] || moduleName(app);
    }

    // Apps of an origin with a remembered state (unfocused or superfocused), by name
    rememberedApps(origin) {
        return Object.entries(this.origins[origin] ?? {})
            .map(([app, value]) => ({ app, name: this.appName(app), state: readState(value) }))
            .filter(({ state }) => state !== UNFOCUS_STATE.DEFAULT)
            .sort(compareApps);
    }

    renderOrigins() {
        const container = document.getElementById('joorney_unfocus_app_hosts');
        container.replaceChildren();
        if (this.saveError) {
            container.appendChild(
                stringToHTML(
                    `<p class="joorney-error" role="alert">${iconHTML('error')}${escapeHTML(this.saveError)}</p>`
                )
            );
            this.saveError = '';
        }

        const restoredOrigin = this.restoredApp?.origin;
        const origins = Object.keys(this.origins);
        if (restoredOrigin && !origins.includes(restoredOrigin)) origins.push(restoredOrigin);
        const entries = origins
            .map((origin) => [origin, this.rememberedApps(origin)])
            .filter(([origin, apps]) => apps.length || origin === restoredOrigin)
            // The shared list first: it is the one in use while sharing is on
            .sort(([a], [b]) => (b === SHARED_ORIGIN) - (a === SHARED_ORIGIN));

        if (!entries.length) {
            container.appendChild(
                stringToHTML(`<p class="joorney-empty">${escapeHTML(t('optionsUnfocus_empty'))}</p>`)
            );
            return;
        }

        if (this.shareEnabled) {
            container.appendChild(
                stringToHTML(`
                    <p class="joorney-unfocus-note">${iconHTML('share')}<span>${escapeHTML(t('optionsUnfocus_sharingNote'))}</span></p>
                `)
            );
        }

        const list = stringToHTML('<div class="joorney-unfocus-hosts"></div>');
        entries.forEach(([origin, apps], index) => {
            list.appendChild(this.renderOrigin(origin, apps, index));
        });
        container.appendChild(list);
    }

    // Asks inline (Cancel / Forget, no confirm()): the question takes the place of the host
    renderOrigin(origin, apps, index) {
        const isShared = origin === SHARED_ORIGIN;
        const hostName = isShared ? t('optionsUnfocus_sharedHost') : origin;
        if (this.pendingOrigin === origin) return this.renderOriginConfirm(origin, hostName);

        const isOpen = this.openOrigins.has(origin);
        const isIgnored = this.shareEnabled && !isShared;
        const panelId = `joorney_unfocus_app_apps_${index}`;
        const superfocusCount = apps.filter(({ state }) => state === UNFOCUS_STATE.SUPER).length;
        const unfocusCount = apps.filter(({ state }) => state === UNFOCUS_STATE.UNFOCUS).length;
        const forgetLabel = escapeHTML(t('optionsUnfocus_forgetHost', hostName));

        const element = stringToHTML(`
            <div class="joorney-unfocus-host${isOpen ? ' is-open' : ''}${isIgnored ? ' is-ignored' : ''}">
                <div class="joorney-unfocus-hostrow">
                    <button type="button" class="joorney-disclosure joorney-unfocus-disclosure" aria-expanded="${isOpen}" aria-controls="${panelId}">
                        ${iconHTML('expand_more')}<span class="joorney-unfocus-name">${escapeHTML(hostName)}</span>
                    </button>
                    <span class="joorney-chips">
                        ${isShared ? `<span class="joorney-chip is-shared">${iconHTML('share')}${escapeHTML(t('optionsUnfocus_sharedChip'))}</span>` : ''}
                        ${isIgnored ? `<span class="joorney-chip is-ignored">${escapeHTML(t('optionsUnfocus_notUsedWhileSharing'))}</span>` : ''}
                        ${superfocusCount ? `<span class="joorney-chip is-superfocus">${escapeHTML(t('optionsUnfocus_superfocused', String(superfocusCount)))}</span>` : ''}
                        ${unfocusCount ? `<span class="joorney-chip">${escapeHTML(t('optionsUnfocus_unfocused', String(unfocusCount)))}</span>` : ''}
                    </span>
                    <button type="button" class="joorney-icon-btn is-small" data-action="forget" title="${forgetLabel}" aria-label="${forgetLabel}">
                        ${iconHTML('delete')}
                    </button>
                </div>
            </div>
        `);
        element.dataset.origin = origin;
        if (isOpen) element.appendChild(this.renderApps(origin, apps, panelId));

        element.querySelector('.joorney-unfocus-disclosure').onclick = () => {
            if (isOpen) this.openOrigins.delete(origin);
            else this.openOrigins.add(origin);
            this.renderOrigins();
            this.hostElement(origin)?.querySelector('.joorney-unfocus-disclosure').focus();
        };
        element.querySelector('[data-action="forget"]').onclick = () => {
            this.pendingOrigin = origin;
            this.renderOrigins();
            this.hostElement(origin)?.querySelector('[data-action="cancel"]').focus();
        };
        return element;
    }

    renderOriginConfirm(origin, hostName) {
        const question = escapeHTML(t('optionsUnfocus_confirmForget', hostName));
        const element = stringToHTML(`
            <div class="joorney-unfocus-host is-confirm">
                <div class="joorney-ask joorney-unfocus-ask" role="group" aria-label="${question}">
                    <span>${question}</span>
                    <button type="button" class="joorney-btn is-secondary" data-action="cancel">${escapeHTML(t('optionsUnfocus_cancel'))}</button>
                    <button type="button" class="joorney-btn" data-action="forget">${escapeHTML(t('optionsUnfocus_forget'))}</button>
                </div>
            </div>
        `);
        element.dataset.origin = origin;
        element.querySelector('[data-action="cancel"]').onclick = () => {
            this.pendingOrigin = null;
            this.renderOrigins();
            this.hostElement(origin)?.querySelector('[data-action="forget"]').focus();
        };
        element.querySelector('[data-action="forget"]').onclick = () => this.deleteUnfocusAppOrigin(origin);
        return element;
    }

    renderApps(origin, apps, panelId) {
        const panel = stringToHTML(`<div class="joorney-unfocus-apps" id="${panelId}"></div>`);
        const rows = [...apps];
        // The Undo line stays where the app was
        if (this.restoredApp?.origin === origin) {
            const { app, state } = this.restoredApp;
            rows.push({ app, name: this.appName(app), state, isRestored: true });
            rows.sort(compareApps);
        }
        for (const row of rows) {
            panel.appendChild(row.isRestored ? this.renderRestoredApp(row) : this.renderApp(origin, row));
        }
        return panel;
    }

    renderApp(origin, { app, name, state }) {
        const buttons = STATE_BUTTONS.map((button) => {
            const checked = button.state === state;
            const label = escapeHTML(t(button.labelKey));
            const filled = checked && button.state === UNFOCUS_STATE.SUPER;
            return `
                <button type="button" role="radio" aria-checked="${checked}" tabindex="${checked ? 0 : -1}"
                    data-state="${button.state}" title="${label}" aria-label="${label}">
                    ${iconHTML(button.icon, { filled })}
                </button>
            `;
        }).join('');

        const element = stringToHTML(`
            <div class="joorney-unfocus-app">
                <span class="joorney-unfocus-appname">
                    <span class="joorney-unfocus-applabel">${escapeHTML(name)}</span>
                    <code title="${escapeHTML(app)}">${escapeHTML(app)}</code>
                </span>
                <span class="joorney-unfocus-modes" role="radiogroup" aria-label="${escapeHTML(t('optionsUnfocus_focusOf', name))}">
                    ${buttons}
                </span>
            </div>
        `);
        element.dataset.app = app;

        const radios = Array.from(element.querySelectorAll('[role="radio"]'));
        for (const radio of radios) {
            radio.onclick = () => {
                const newState = Number(radio.dataset.state);
                if (newState !== state) this.setAppState(origin, app, newState);
            };
        }
        // Radio group keys: the arrows pick the previous or next mode
        element.querySelector('[role="radiogroup"]').onkeydown = (event) => {
            const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key];
            if (!step) return;
            event.preventDefault();
            const current = STATE_BUTTONS.findIndex((button) => button.state === state);
            const next = STATE_BUTTONS[(current + step + STATE_BUTTONS.length) % STATE_BUTTONS.length];
            this.setAppState(origin, app, next.state);
        };
        return element;
    }

    renderRestoredApp({ app }) {
        const element = stringToHTML(`
            <div class="joorney-unfocus-app is-restored">
                <p class="joorney-unfocus-restored" role="status">
                    ${iconHTML('check_circle')}<span>${escapeHTML(t('optionsUnfocus_backToNormal', this.appName(app)))}</span>
                    <button type="button" class="joorney-unfocus-undo">${escapeHTML(t('optionsUnfocus_undo'))}</button>
                </p>
            </div>
        `);
        element.querySelector('.joorney-unfocus-undo').onclick = () => this.undoRestoredApp();
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
