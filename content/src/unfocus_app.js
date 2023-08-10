const FOCUS_OPACITY = 1;
const UNFOCUS_OPACITY = 0.1;
const STAR_ELEMENT_CLASS = 'qol-focus-app';
const FOCUS_ICON = 'fa-star';
const UNFOCUS_ICON = 'fa-star-o';
const SHARED_ORIGIN = 'unfocus_app_shared';

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
        const isUnfocus = unfocusAppList[app];
        element.style.opacity = isUnfocus ? UNFOCUS_OPACITY : FOCUS_OPACITY;

        const divElement = element.getElementsByClassName('o_caption')[0];
        for (let star of divElement.getElementsByClassName(STAR_ELEMENT_CLASS)) {
            star.remove();
        }

        divElement.innerHTML = `<i class="qol-focus-app fa
            ${isUnfocus ? UNFOCUS_ICON : FOCUS_ICON} me-1">
        </i>${divElement.innerHTML}`.trim();
    }

    const container = document.getElementsByClassName('o_apps')[0];

    // Manage "star" click
    const apps = Array.from(document.getElementsByClassName(STAR_ELEMENT_CLASS));
    apps.forEach((app) => {
        app.onclick = (e) => onStarClick(app, e);

        if (configuration.unfocusAppReorderEnabled && app.className.includes('fa-star-o')) {
            let parent = app.parentElement.parentElement;
            // 16.4+ introduce draggable feature, a new parent has been added
            if (parent.parentElement.classList.contains('o_draggable')) {
                parent = parent.parentElement;
            }
            container.appendChild(parent);
        }
    });
}

async function onStarClick(element, event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

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

    if (unfocusAppOrigins[origin][app]) {
        unfocusAppOrigins[origin][app] = false;
    } else {
        unfocusAppOrigins[origin][app] = true;
    }

    await chrome.storage.sync.set({ unfocusAppOrigins: unfocusAppOrigins });

    if (unfocusAppOrigins[origin][app]) {
        parent.style.opacity = UNFOCUS_OPACITY;
        element.classList.remove(FOCUS_ICON);
        element.classList.add(UNFOCUS_ICON);
    } else {
        parent.style.opacity = FOCUS_OPACITY;
        element.classList.remove(UNFOCUS_ICON);
        element.classList.add(FOCUS_ICON);
    }
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
