import BackgroundFeature from '../../generic/background.js';
import { StorageLocal, StorageSync, Tabs } from '../../utils/browser.js';
import { getThemeModeCookie, setThemeModeCookie } from '../../utils/cookies.js';
import configuration from './configuration.js';

export default class ThemeSwitchBackgroundFeature extends BackgroundFeature {
    constructor() {
        super(configuration);
    }

    async loadFeature(tab, url) {
        const {
            themeSwitchMode /* "autoDark", "autoLight", "dynamicLocation", "dynamicTime" */,
            themeSwitchLocationLatitude,
            themeSwitchLocationLongitude,
            themeSwitchDarkStartTime,
            themeSwitchDarkStopTime,
        } = await StorageSync.get(this.configuration.defaultSettings);

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
                const sunData = await this.getSunRiseSunSet(
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

        const origin = url.origin;
        const currentMode = await getThemeModeCookie(origin);

        if (currentMode != expectedMode) {
            await setThemeModeCookie(expectedMode, origin);
            Tabs.reload(tab.id);
        }
    }

    async getSunRiseSunSet(latitude, longitude) {
        let today = new Date();
        today = today.getMonth() + 1 + '-' + today.getDate() + '-' + today.getFullYear();
        const cached = await StorageLocal.get({
            qol_sunrise: 0,
            qol_sunset: 23 * 60 + 59,
            qol_date: '',
        });

        if (cached.qol_sunrise && cached.qol_sunset && cached.qol_date === today) {
            return cached;
        }

        const response = await fetch(
            `https://api.sunrisesunset.io/json?lat=${latitude}&lng=${longitude}`
        );

        const json = await response.json();

        let sunrise = json.results.sunrise.split(':');
        sunrise =
            parseInt(sunrise[0]) * 60 +
            parseInt(sunrise[1]) +
            (sunrise[2].endsWith('PM') ? 12 * 60 : 0);

        let sunset = json.results.sunset.split(':');
        sunset =
            parseInt(sunset[0]) * 60 +
            parseInt(sunset[1]) +
            (sunset[2].endsWith('PM') ? 12 * 60 : 0);

        const data = {
            qol_sunrise: sunrise,
            qol_sunset: sunset,
            qol_date: today,
        };

        await StorageLocal.set(data);
        return data;
    }
}
