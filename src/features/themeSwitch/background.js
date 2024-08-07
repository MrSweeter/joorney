import BackgroundFeature from '../../generic/background.js';
import { StorageLocal, StorageSync, Tabs } from '../../utils/browser.js';
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
                const sunData = await this.getSunRiseSunSet(themeSwitchLocationLatitude, themeSwitchLocationLongitude);

                expectedMode = time > sunData.joorney_sunrise && time < sunData.joorney_sunset ? 'light' : 'dark';
                break;
            }
            case 'dynamicTime': {
                let start = themeSwitchDarkStartTime.split(':');
                start = Number.parseInt(start[0]) * 60 + Number.parseInt(start[1]);
                let stop = themeSwitchDarkStopTime.split(':');
                stop = Number.parseInt(stop[0]) * 60 + Number.parseInt(stop[1]);

                expectedMode = time > start && time < stop ? 'dark' : 'light';
            }
        }

        if (!expectedMode) return;

        const useConfiguredCookie = args.version < 17.4;
        const origin = url.origin;
        const currentMode = await getThemeModeCookie(origin, useConfiguredCookie);
        console.log(currentMode);

        if (currentMode !== expectedMode) {
            await setThemeModeCookie(expectedMode, origin, useConfiguredCookie);
            Tabs.reload(tab.id);
        }
    }

    async getSunRiseSunSet(latitude, longitude) {
        let today = new Date();
        today = `${today.getMonth() + 1}-${today.getDate()}-${today.getFullYear()}`;
        const cached = await StorageLocal.get({
            joorney_sunrise: 0,
            joorney_sunset: 23 * 60 + 59,
            joorney_date: '',
        });

        if (cached.joorney_sunrise && cached.joorney_sunset && cached.joorney_date === today) {
            return cached;
        }

        const response = await fetch(`https://api.sunrisesunset.io/json?lat=${latitude}&lng=${longitude}`);

        const json = await response.json();

        let sunrise = json.results.sunrise.split(':');
        sunrise =
            Number.parseInt(sunrise[0]) * 60 + Number.parseInt(sunrise[1]) + (sunrise[2].endsWith('PM') ? 12 * 60 : 0);

        let sunset = json.results.sunset.split(':');
        sunset =
            Number.parseInt(sunset[0]) * 60 + Number.parseInt(sunset[1]) + (sunset[2].endsWith('PM') ? 12 * 60 : 0);

        const data = {
            joorney_sunrise: sunrise,
            joorney_sunset: sunset,
            joorney_date: today,
        };

        await StorageLocal.set(data);
        return data;
    }
}
