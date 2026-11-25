import { addUnfocusAppNames } from '../../api/local.js';
import ContentFeature from '../../generic/content.js';
import { escapeHTML } from '../../html_generator.js';
import { isOdooWebsite, isStillSameWebsite } from '../../utils/authorize.js';
import { StorageSync } from '../../utils/browser.js';
import { isDarkCookie } from '../../utils/cookies.js';
import { t } from '../../utils/i18n.js';
import { sanitizeURL, sleep } from '../../utils/util.js';
import configuration from './configuration.js';

const UNFOCUS_STATE = Object.freeze({
    UNFOCUS: 0,
    DEFAULT: 1,
    SUPER: 2,
    MAX: 2,
});

const FOCUS_OPACITY = 1;
const UNFOCUS_OPACITY = 0.1;
const STAR_ELEMENT_CLASS = 'joorney-focus-app';
const FOCUS_ICON = 'fa-star';
const UNFOCUS_ICON = 'fa-star-o';
const SHARED_ORIGIN = 'unfocus_app_shared';

export default class UnfocusApp extends ContentFeature {
    constructor() {
        super(configuration);
        this.clickCount = 0;
    }

    async loadFeature(url) {
        if (!(await isStillSameWebsite(0, url))) return;

        this.appendUnfocusApp(url);
    }

    async appendUnfocusApp(urlArg, count = 0) {
        const url = sanitizeURL(urlArg);

        const {
            unfocusAppReorderEnabled,
            unfocusAppShareEnabled,
            unfocusAppLightImageURL,
            unfocusAppDarkImageURL,
            unfocusAppOrigins,
        } = await StorageSync.get(this.defaultSettings);

        const elements = document.getElementsByClassName('o_app');
        if (elements.length === 0 && count === 0) {
            await sleep(2500);
            return this.appendUnfocusApp(url, count + 1);
        }

        const origin = unfocusAppShareEnabled ? SHARED_ORIGIN : url.origin;
        const unfocusAppList = unfocusAppOrigins[origin] || {};

        this.appendStar(elements, unfocusAppList, {
            unfocusAppLightImageURL,
            unfocusAppDarkImageURL,
        });
        this.handleStar(unfocusAppReorderEnabled);
        await this.rememberAppNames(elements);
    }

    // The options page lists the remembered apps by xmlid: keep the names it can show instead
    async rememberAppNames(elements) {
        const names = {};
        for (const element of elements) {
            const app = element.getAttribute('data-menu-xmlid');
            const name = element.getElementsByClassName('o_caption')[0]?.textContent.trim();
            if (app && name) names[app] = name;
        }
        await addUnfocusAppNames(names);
    }

    appendStar(elements, unfocusAppList, configuration) {
        for (const element of elements) {
            const app = element.getAttribute('data-menu-xmlid');
            let state = unfocusAppList[app];
            if (state === undefined) state = UNFOCUS_STATE.DEFAULT;
            if (state === true) state = UNFOCUS_STATE.UNFOCUS;
            this.updateAppElement(element, state, null, configuration);

            const divElement = element.getElementsByClassName('o_caption')[0];
            for (const star of divElement.getElementsByClassName(STAR_ELEMENT_CLASS)) {
                star.remove();
            }

            const isUnfocus = state === UNFOCUS_STATE.UNFOCUS;
            divElement.innerHTML =
                `<i title="${escapeHTML(t('unfocusApp_changeFocusState'))}" class="joorney-focus-app fa
                ${isUnfocus ? UNFOCUS_ICON : FOCUS_ICON} me-1" data-joorney-state="${state}">
            </i>${divElement.innerHTML}`.trim();
        }
    }

    handleStar(reorderEnabled) {
        const container = document.getElementsByClassName('o_apps')[0];
        const apps = Array.from(document.getElementsByClassName(STAR_ELEMENT_CLASS));
        const defaultApps = [];
        const unfocusApps = [];

        for (const app of apps) {
            app.onclick = (e) => this.onStarClick(app, e);

            if (reorderEnabled) {
                let parent = app.parentElement.parentElement;
                // [ODOO] 16.4+ introduce draggable feature, a new parent has been added
                if (parent.parentElement.classList.contains('o_draggable')) {
                    parent = parent.parentElement;
                }

                const state = app.getAttribute('data-joorney-state');

                switch (state) {
                    case `${UNFOCUS_STATE.DEFAULT}`: {
                        // TODO[IMP] Why not: defaultApps.push(parent);
                        break;
                    }
                    case `${UNFOCUS_STATE.UNFOCUS}`: {
                        unfocusApps.push(parent);
                        break;
                    }
                }
            }
        }
        for (const p of defaultApps) container.appendChild(p);
        for (const p of unfocusApps) container.appendChild(p);
    }

    async onStarClick(element, event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        // debounce
        this.clickCount += 1;
        const currentClickCount = this.clickCount;
        await sleep(200);
        if (this.clickCount !== currentClickCount || this.clickCount === 0) return;

        // Reset even when the write fails, or the next clicks would count from a stale number
        try {
            await this.saveStarClick(element, event);
        } finally {
            this.clickCount = 0;
        }
    }

    async saveStarClick(element, event) {
        let origin = window.location.origin;
        const parent = event.target.parentElement.parentElement;
        const app = parent.getAttribute('data-menu-xmlid');

        const { unfocusAppOrigins, unfocusAppShareEnabled, unfocusAppLightImageURL, unfocusAppDarkImageURL } =
            await StorageSync.get(this.defaultSettings);

        if (unfocusAppShareEnabled) {
            origin = SHARED_ORIGIN;
        }

        unfocusAppOrigins[origin] = unfocusAppOrigins[origin] || {};

        let currentState = unfocusAppOrigins[origin][app];
        if (currentState === undefined) currentState = UNFOCUS_STATE.DEFAULT;
        if (currentState === true) currentState = UNFOCUS_STATE.UNFOCUS; // true was the previous version logic

        const newState = Math.min(this.clickCount, UNFOCUS_STATE.MAX);

        let state = UNFOCUS_STATE.UNFOCUS;
        if (
            currentState === UNFOCUS_STATE.UNFOCUS ||
            (currentState !== newState && currentState > UNFOCUS_STATE.UNFOCUS)
        ) {
            state = newState;
        }

        // Normal is the absence of an entry: storing it would keep the app (and its host) in the options page list
        // and in the sync quota
        if (state === UNFOCUS_STATE.DEFAULT) delete unfocusAppOrigins[origin][app];
        else unfocusAppOrigins[origin][app] = state;
        if (Object.keys(unfocusAppOrigins[origin]).length === 0) delete unfocusAppOrigins[origin];

        await StorageSync.set({ unfocusAppOrigins: unfocusAppOrigins });

        this.updateAppElement(parent, state, element, {
            unfocusAppLightImageURL,
            unfocusAppDarkImageURL,
        });
    }

    async updateAppElement(element, state, starElement, configuration) {
        const superfocusImageURL = (await isDarkCookie(origin))
            ? configuration.unfocusAppDarkImageURL
            : configuration.unfocusAppLightImageURL;

        const isUnfocus = state === UNFOCUS_STATE.UNFOCUS;
        if (starElement) {
            starElement.classList.remove(isUnfocus ? FOCUS_ICON : UNFOCUS_ICON);
            starElement.classList.add(isUnfocus ? UNFOCUS_ICON : FOCUS_ICON);
        }
        element.style.opacity = isUnfocus ? UNFOCUS_OPACITY : FOCUS_OPACITY;

        const isSuperfocus = state === UNFOCUS_STATE.SUPER;
        const parent = element.parentElement.classList.contains('o_draggable') ? element.parentElement : element;
        parent.style.backgroundImage = isSuperfocus ? `url("${superfocusImageURL}")` : null;
        parent.style.backgroundSize = isSuperfocus ? 'contain' : null;
        parent.style.backgroundRepeat = isSuperfocus ? 'no-repeat' : null;
        parent.style.backgroundPosition = 'center top';
    }

    async onPopupMessage(msg) {
        const checked = msg.enableUnfocusApp;

        if (typeof checked === 'boolean') {
            const exist = Array.from(document.getElementsByClassName(STAR_ELEMENT_CLASS));
            if (exist)
                for (const e of exist) {
                    e.parentElement.parentElement.style.opacity = FOCUS_OPACITY;
                    e.parentElement.parentElement.parentElement.style.backgroundImage = null;
                    e.remove();
                }
            if (checked && isOdooWebsite(msg.url)) await this.appendUnfocusApp(msg.url);
        }
    }
}
