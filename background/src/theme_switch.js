import { Cookies, StorageSync, Tabs } from '../../utils/browser.js';
import { defaultThemeSwitchSetting } from '../../utils/feature_default_configuration.js';
import { authorizeFeature } from './features.js';

const themeCookieName = 'color_scheme';

export async function switchThemeIfNeeded(tab) {
    if (!tab.url) return;
    const origin = new URL(tab.url).origin;
    if (!origin) return;

    const { themeSwitchEnabled, themeSwitchDarkModeEnabled } = await StorageSync.get(
        defaultThemeSwitchSetting
    );

    if (!themeSwitchEnabled) return;
    const authorizedFeature = await authorizeFeature('themeSwitch', origin);
    if (!authorizedFeature) return;

    const expectedMode = themeSwitchDarkModeEnabled ? 'dark' : 'light';
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
