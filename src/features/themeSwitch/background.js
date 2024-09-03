import { getSunRiseSunSet } from '../../api/sun.js';
import BackgroundFeature from '../../generic/background.js';
import { StorageSync, Tabs } from '../../utils/browser.js';
import { getThemeModeCookie, setThemeModeCookie } from '../../utils/cookies.js';
import configuration from './configuration.js';

export default class ThemeSwitchBackgroundFeature extends BackgroundFeature {
    constructor() {
        super(configuration);
    }

    async loadFeature(tab, url, args) {
        const {
            themeSwitchMode /* "system", "autoDark", "autoLight", "dynamicLocation", "dynamicTime" */,
            themeSwitchLocationLatitude,
            themeSwitchLocationLongitude,
            themeSwitchDarkStartTime,
            themeSwitchDarkStopTime,
        } = await StorageSync.get(this.configuration.defaultSettings);

        let expectedMode = false;
        const today = new Date();
        const time = today.getHours() * 60 + today.getMinutes();

        switch (themeSwitchMode) {
            case 'system': {
                if (!args.theme) break;
                if (!['dark', 'light'].includes(args.theme)) {
                    console.debug(
                        `Invalid theme provided: ${args.theme}\nYou can open a bug report on https://github.com/MrSweeter/joorney/issues/new/choose`
                    );
                    return;
                }
                expectedMode = args.theme;
                break;
            }
            case 'autoDark':
                expectedMode = 'dark';
                break;
            case 'autoLight':
                expectedMode = 'light';
                break;
            case 'dynamicLocation': {
                const sunData = await getSunRiseSunSet(themeSwitchLocationLatitude, themeSwitchLocationLongitude);

                expectedMode = time > sunData.joorney_sunrise && time < sunData.joorney_sunset ? 'light' : 'dark';
                break;
            }
            case 'dynamicTime': {
                let start = themeSwitchDarkStartTime.split(':');
                start = Number.parseInt(start[0]) * 60 + Number.parseInt(start[1]);
                let stop = themeSwitchDarkStopTime.split(':');
                stop = Number.parseInt(stop[0]) * 60 + Number.parseInt(stop[1]);

                if (start < stop) expectedMode = time > start && time < stop ? 'dark' : 'light';
                else expectedMode = time > start || time < stop ? 'dark' : 'light';
            }
        }

        if (!expectedMode) return;

        // [ODOO] < 17.4
        const useConfiguredCookie = args.version < 17.4;
        const origin = url.origin;
        const currentMode = await getThemeModeCookie(origin, useConfiguredCookie);

        if (currentMode !== expectedMode) {
            await setThemeModeCookie(expectedMode, origin, useConfiguredCookie);
            Tabs.reload(tab.id);
        }
    }
}
