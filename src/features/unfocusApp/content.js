import ContentFeature from '../../generic/content.js';
import { sanitizeURL } from '../../utils/url_manager.js';
import { isOdooWebsite, isStillSameWebsite } from '../../utils/authorize.js';
import { Runtime, StorageSync } from '../../utils/browser.js';
import { getThemeModeCookie } from '../../utils/cookies.js';
import configuration from './configuration.js';

const UNFOCUS_STATE = Object.freeze({
    UNFOCUS: 0,
    DEFAULT: 1,
    SUPER: 2,
    MAX: 2,
});

const FOCUS_OPACITY = 1;
const UNFOCUS_OPACITY = 0.1;
const STAR_ELEMENT_CLASS = 'qol-focus-app';
const FOCUS_ICON = 'fa-star';
const UNFOCUS_ICON = 'fa-star-o';
const SHARED_ORIGIN = 'unfocus_app_shared';

export default class UnfocusApp extends ContentFeature {
    constructor() {
        super(configuration);
        this.clickCount = 0;
        this.handleUpdateMessage();
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
            await new Promise((r) => setTimeout(r, 2500));
            return this.appendUnfocusApp(url, count + 1);
        }

        const origin = unfocusAppShareEnabled ? SHARED_ORIGIN : url.origin;
        const unfocusAppList = unfocusAppOrigins[origin] || {};

        this.appendStar(elements, unfocusAppList, {
            unfocusAppLightImageURL,
            unfocusAppDarkImageURL,
        });
        this.handleStar(unfocusAppReorderEnabled);
    }

    appendStar(elements, unfocusAppList, configuration) {
        for (let element of elements) {
            const app = element.getAttribute('data-menu-xmlid');
            let state = unfocusAppList[app];
            if (state === undefined) state = UNFOCUS_STATE.DEFAULT;
            if (state === true) state = UNFOCUS_STATE.UNFOCUS;
            this.updateAppElement(element, state, configuration);

            const divElement = element.getElementsByClassName('o_caption')[0];
            for (let star of divElement.getElementsByClassName(STAR_ELEMENT_CLASS)) {
                star.remove();
            }

            const isUnfocus = state === UNFOCUS_STATE.UNFOCUS;
            divElement.innerHTML = `<i class="qol-focus-app fa
                ${isUnfocus ? UNFOCUS_ICON : FOCUS_ICON} me-1" data-qol-state="${state}">
            </i>${divElement.innerHTML}`.trim();
        }
    }

    handleStar(reorderEnabled) {
        const container = document.getElementsByClassName('o_apps')[0];
        const apps = Array.from(document.getElementsByClassName(STAR_ELEMENT_CLASS));
        const defaultApps = [];
        const unfocusApps = [];

        apps.forEach((app) => {
            app.onclick = (e) => this.onStarClick(app, e);

            if (reorderEnabled) {
                let parent = app.parentElement.parentElement;
                // 16.4+ introduce draggable feature, a new parent has been added
                if (parent.parentElement.classList.contains('o_draggable')) {
                    parent = parent.parentElement;
                }

                const state = app.getAttribute('data-qol-state');

                switch (state) {
                    case `${UNFOCUS_STATE.DEFAULT}`: {
                        // TODO Why not: defaultApps.push(parent);
                        break;
                    }
                    case `${UNFOCUS_STATE.UNFOCUS}`: {
                        unfocusApps.push(parent);
                        break;
                    }
                }
            }
        });
        defaultApps.forEach((p) => container.appendChild(p));
        unfocusApps.forEach((p) => container.appendChild(p));
    }

    async onStarClick(element, event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        // debounce
        this.clickCount += 1;
        currentthis.clickCount = this.clickCount;
        await new Promise((r) => setTimeout(r, 200));
        if (this.clickCount != currentthis.clickCount || this.clickCount === 0) return;

        let origin = window.location.origin;
        const parent = event.target.parentElement.parentElement;
        const app = parent.getAttribute('data-menu-xmlid');

        const {
            unfocusAppOrigins,
            unfocusAppShareEnabled,
            unfocusAppLightImageURL,
            unfocusAppDarkImageURL,
        } = await StorageSync.get(this.defaultSettings);

        if (unfocusAppShareEnabled) {
            origin = SHARED_ORIGIN;
        }

        unfocusAppOrigins[origin] = unfocusAppOrigins[origin] || {};

        let currentState = unfocusAppOrigins[origin][app];
        if (currentState === undefined) currentState = UNFOCUS_STATE.DEFAULT;
        if (currentState === true) currentState = UNFOCUS_STATE.UNFOCUS; // true was the previous version logic

        const newState = this.clickCount > UNFOCUS_STATE.MAX ? UNFOCUS_STATE.MAX : this.clickCount;

        if (
            currentState === UNFOCUS_STATE.UNFOCUS ||
            (currentState !== newState && currentState > UNFOCUS_STATE.UNFOCUS)
        ) {
            unfocusAppOrigins[origin][app] =
                this.clickCount > UNFOCUS_STATE.MAX ? UNFOCUS_STATE.MAX : this.clickCount;
        } else {
            unfocusAppOrigins[origin][app] = UNFOCUS_STATE.UNFOCUS;
        }

        await StorageSync.set({ unfocusAppOrigins: unfocusAppOrigins });

        this.updateAppElement(parent, unfocusAppOrigins[origin][app], element, {
            unfocusAppLightImageURL,
            unfocusAppDarkImageURL,
        });

        this.clickCount = 0;
    }

    async updateAppElement(element, state, starElement, configuration) {
        const superfocusImageURL =
            (await getThemeModeCookie(origin)) === 'light'
                ? configuration.unfocusAppLightImageURL
                : configuration.unfocusAppDarkImageURL;

        const isUnfocus = state === UNFOCUS_STATE.UNFOCUS;
        if (starElement) {
            starElement.classList.remove(isUnfocus ? FOCUS_ICON : UNFOCUS_ICON);
            starElement.classList.add(isUnfocus ? UNFOCUS_ICON : FOCUS_ICON);
        }
        element.style.opacity = isUnfocus ? UNFOCUS_OPACITY : FOCUS_OPACITY;

        const isSuperfocus = state === UNFOCUS_STATE.SUPER;
        const parent = element.parentElement.classList.contains('o_draggable')
            ? element.parentElement
            : element;
        parent.style.backgroundImage = isSuperfocus ? `url("${superfocusImageURL}")` : null;
        parent.style.backgroundSize = isSuperfocus ? 'contain' : null;
        parent.style.backgroundRepeat = isSuperfocus ? 'no-repeat' : null;
        parent.style.backgroundPosition = 'center top';
    }

    handleUpdateMessage() {
        Runtime.onMessage.addListener((msg) => {
            const checked = msg.enableUnfocusApp;

            if (typeof checked === 'boolean') {
                const exist = Array.from(document.getElementsByClassName(STAR_ELEMENT_CLASS));
                if (exist)
                    exist.forEach((e) => {
                        e.parentElement.parentElement.style.opacity = FOCUS_OPACITY;
                        e.remove();
                    });
                if (checked && isOdooWebsite(msg.url)) this.appendUnfocusApp(msg.url);
            }
        });
    }
}
