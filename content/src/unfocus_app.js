const UNFOCUS_STATE = {
    UNFOCUS: 0,
    DEFAULT: 1,
    SUPER: 2,
};
UNFOCUS_STATE.MAX = UNFOCUS_STATE.SUPER;

const FOCUS_OPACITY = 1;
const UNFOCUS_OPACITY = 0.1;
const STAR_ELEMENT_CLASS = 'qol-focus-app';
const FOCUS_ICON = 'fa-star';
const UNFOCUS_ICON = 'fa-star-o';
const SHARED_ORIGIN = 'unfocus_app_shared';

let currentTheme = 'light';

async function appendUnfocusApp(url, count = 0) {
    const configuration = await chrome.storage.sync.get({
        unfocusAppEnabled: false,
        unfocusAppReorderEnabled: false,
        unfocusAppShareEnabled: false,
        unfocusAppOrigins: {},
    });
    if (!configuration.unfocusAppEnabled) return;

    let origin = new URL(url).origin;
    const authorizedFeature = await authorizeFeature('unfocusApp', origin);
    if (!authorizedFeature) return;

    if (window.location.origin !== origin) return;

    currentTheme = await getThemeModeCookie(origin);

    const elements = document.getElementsByClassName('o_app');
    if (elements.length == 0 && count == 0) {
        await new Promise((r) => setTimeout(r, 2500));
        appendUnfocusApp(url, count + 1);
        return;
    }

    if (configuration.unfocusAppShareEnabled) {
        origin = SHARED_ORIGIN;
    }

    unfocusAppList = configuration.unfocusAppOrigins[origin] || {};

    // Append "star" before app name
    for (let element of elements) {
        const app = element.getAttribute('data-menu-xmlid');
        let state = unfocusAppList[app];
        if (state === undefined) state = UNFOCUS_STATE.DEFAULT;
        updateAppElement(element, state);

        const divElement = element.getElementsByClassName('o_caption')[0];
        for (let star of divElement.getElementsByClassName(STAR_ELEMENT_CLASS)) {
            star.remove();
        }

        const isUnfocus = state === UNFOCUS_STATE.UNFOCUS;
        divElement.innerHTML = `<i class="qol-focus-app fa
            ${isUnfocus ? UNFOCUS_ICON : FOCUS_ICON} me-1" data-qol-state="${state}">
        </i>${divElement.innerHTML}`.trim();
    }

    const container = document.getElementsByClassName('o_apps')[0];

    // Manage "star" click
    const apps = Array.from(document.getElementsByClassName(STAR_ELEMENT_CLASS));
    const defaultApps = [];
    const unfocusApps = [];
    apps.forEach((app) => {
        app.onclick = (e) => onStarClick(app, e);

        if (configuration.unfocusAppReorderEnabled) {
            let parent = app.parentElement.parentElement;
            // 16.4+ introduce draggable feature, a new parent has been added
            if (parent.parentElement.classList.contains('o_draggable')) {
                parent = parent.parentElement;
            }

            const state = app.getAttribute('data-qol-state');

            switch (state) {
                case `${UNFOCUS_STATE.DEFAULT}`: {
                    // MAYBE defaultApps.push(parent);
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

let clickCount = 0;
async function onStarClick(element, event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    // debounce
    clickCount += 1;
    currentClickCount = clickCount;
    await new Promise((r) => setTimeout(r, 200));
    if (clickCount != currentClickCount || clickCount === 0) return;

    let origin = window.location.origin;
    const parent = event.target.parentElement.parentElement;
    const app = parent.getAttribute('data-menu-xmlid');

    const { unfocusAppOrigins, unfocusAppShareEnabled } = await chrome.storage.sync.get({
        unfocusAppOrigins: {},
        unfocusAppShareEnabled: false,
    });

    if (unfocusAppShareEnabled) {
        origin = SHARED_ORIGIN;
    }

    unfocusAppOrigins[origin] = unfocusAppOrigins[origin] || {};

    const currentState = unfocusAppOrigins[origin][app];
    const newState = clickCount > UNFOCUS_STATE.MAX ? UNFOCUS_STATE.MAX : clickCount;
    if (
        currentState === true || // true was the previous version logic
        currentState === UNFOCUS_STATE.UNFOCUS ||
        (currentState !== newState &&
            (currentState > UNFOCUS_STATE.UNFOCUS || currentState === undefined)) // undefined === default state(1)
    ) {
        unfocusAppOrigins[origin][app] =
            clickCount > UNFOCUS_STATE.MAX ? UNFOCUS_STATE.MAX : clickCount;
    } else {
        unfocusAppOrigins[origin][app] = UNFOCUS_STATE.UNFOCUS;
    }

    await chrome.storage.sync.set({ unfocusAppOrigins: unfocusAppOrigins });

    updateAppElement(parent, unfocusAppOrigins[origin][app], element);

    clickCount = 0;
}

function updateAppElement(element, state, starElement) {
    const isUnfocus = state === UNFOCUS_STATE.UNFOCUS;
    if (starElement) {
        starElement.classList.remove(isUnfocus ? FOCUS_ICON : UNFOCUS_ICON);
        starElement.classList.add(isUnfocus ? UNFOCUS_ICON : FOCUS_ICON);
    }
    element.style.opacity = isUnfocus ? UNFOCUS_OPACITY : FOCUS_OPACITY;

    const isSuperfocus = state === UNFOCUS_STATE.SUPER;
    const parent = element.parentElement;
    parent.style.backgroundImage = isSuperfocus
        ? `url("${
              currentTheme === 'light'
                  ? 'https://i.imgur.com/4ycbXUW.png'
                  : 'https://i.imgur.com/QL7wm9b.png'
          }")`
        : null;
    parent.style.backgroundSize = isSuperfocus ? 'contain' : null;
    parent.style.backgroundRepeat = isSuperfocus ? 'no-repeat' : null;
    parent.style.backgroundPosition = 'center';
}

async function getThemeModeCookie(origin) {
    if (!origin.startsWith('http')) return 'light';

    let decodedCookie = decodeURIComponent(document.cookie);
    let cookieName = decodedCookie.includes('configured_color_scheme')
        ? 'configured_color_scheme'
        : decodedCookie.includes('color_scheme')
        ? 'color_scheme'
        : null;

    if (!cookieName) return 'light';

    let cookies = decodedCookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.indexOf(cookieName) === 0) {
            return cookie.substring(cookieName.length + 1, cookie.length);
        }
    }

    return 'light';
}

chrome.runtime.onMessage.addListener((msg) => {
    const checked = msg.enableUnfocusApp;

    if (typeof checked === 'boolean') {
        const exist = Array.from(document.getElementsByClassName(STAR_ELEMENT_CLASS));
        if (exist)
            exist.forEach((e) => {
                e.parentElement.parentElement.style.opacity = FOCUS_OPACITY;
                e.remove();
            });
        if (checked && isOdooTab(msg.url)) appendUnfocusApp(msg.url);
    }
});
