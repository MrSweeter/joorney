import { Cookies, Runtime, StorageLocal, StorageSync, Tabs } from '../../utils/browser.js';
import { defaultThemeSwitchSetting } from '../../utils/feature_default_configuration.js';
import { authorizeFeature } from './features.js';
import { getSunRiseSunSet } from './weather.js';

const dateFormat = 'MM-DD-YYYY';
const themeCookieName = 'color_scheme';

export async function switchThemeIfNeeded(tab) {
    if (!tab.url) return;
    const origin = new URL(tab.url).origin;
    if (!origin || !origin.startsWith('http')) return;

    const {
        themeSwitchEnabled,
        themeSwitchMode /* "autoDark", "autoLight", "dynamicLocation", "dynamicTime" */,
        themeSwitchLocationLatitude,
        themeSwitchLocationLongitude,
        themeSwitchDarkStartTime,
        themeSwitchDarkStopTime,
    } = await StorageSync.get(defaultThemeSwitchSetting);

    if (!themeSwitchEnabled) return;
    const authorizedFeature = await authorizeFeature('themeSwitch', origin);
    if (!authorizedFeature) return;

    let expectedMode = false;
    let today = new Date();
    const time = today.getHours() * 60 + today.getMinutes();

    switch (themeSwitchMode) {
        case 'autoDark':
            expectedMode = 'dark';
            break;
        case 'autoLight':
            expectedMode = 'light';
            break;
        case 'dynamicLocation':
            const sunData = await getSunRiseSunSet(
                themeSwitchLocationLatitude,
                themeSwitchLocationLongitude
            );

            expectedMode =
                time > sunData.qol_sunrise && time < sunData.qol_sunset ? 'light' : 'dark';
            break;
        case 'dynamicTime':
            let start = themeSwitchDarkStartTime.split(':');
            start = parseInt(start[0]) * 60 + parseInt(start[1]);
            let stop = themeSwitchDarkStopTime.split(':');
            stop = parseInt(stop[0]) * 60 + parseInt(stop[1]);

            expectedMode = time > start && time < stop ? 'dark' : 'light';
    }

    if (!expectedMode) return;

    const setCookie = await Cookies.get({
        name: themeCookieName,
        url: origin,
    });
    const currentMode = setCookie?.value ?? 'light';

    if (currentMode != expectedMode) {
        await Cookies.set({
            name: themeCookieName,
            value: expectedMode,
            url: origin,
        });
        Tabs.reload(tab.id);
    }
}
