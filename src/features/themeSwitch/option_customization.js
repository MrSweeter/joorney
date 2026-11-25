import OptionCustomizationFeature from '../../generic/option_customization.js';
import { getUserLocation, StorageSync } from '../../utils/browser.js';
import configuration from './configuration.js';

export default class ThemeSwitchOptionCustomizationFeature extends OptionCustomizationFeature {
    constructor() {
        super(configuration);
        this.updateLocation = this.updateLocation.bind(this);
    }

    async load() {
        await super.load();
        const configuration = await StorageSync.get(this.configuration.defaultSettings);

        this.renderMode(configuration.themeSwitchMode);
        for (const tile of document.querySelectorAll('.joorney-ts-opts [data-mode]')) {
            tile.onclick = async () => {
                const themeSwitchMode = tile.dataset.mode;
                this.renderMode(themeSwitchMode);
                await StorageSync.set({ themeSwitchMode });
            };
        }

        const latitudeElement = document.getElementById('joorney_theme_switch_latitude');
        latitudeElement.value = configuration.themeSwitchLocationLatitude;
        latitudeElement.onchange = async (e) => await StorageSync.set({ themeSwitchLocationLatitude: e.target.value });

        const longitudeElement = document.getElementById('joorney_theme_switch_longitude');
        longitudeElement.value = configuration.themeSwitchLocationLongitude;
        longitudeElement.onchange = async (e) =>
            await StorageSync.set({ themeSwitchLocationLongitude: e.target.value });

        const getLocationElement = document.getElementById('joorney_theme_switch_get_location_button');
        getLocationElement.onclick = this.updateLocation;

        const darkStartTime = document.getElementById('joorney_theme_switch_dark_start');
        darkStartTime.value = configuration.themeSwitchDarkStartTime;
        darkStartTime.onchange = async (e) => await StorageSync.set({ themeSwitchDarkStartTime: e.target.value });

        const darkStopTime = document.getElementById('joorney_theme_switch_dark_stop');
        darkStopTime.value = configuration.themeSwitchDarkStopTime;
        darkStopTime.onchange = async (e) => await StorageSync.set({ themeSwitchDarkStopTime: e.target.value });
    }

    renderMode(mode) {
        for (const tile of document.querySelectorAll('.joorney-ts-opts [data-mode]')) {
            const selected = tile.dataset.mode === mode;
            tile.classList.toggle('is-selected', selected);
            tile.setAttribute('aria-pressed', String(selected));
        }
        const hasLocation = mode === 'dynamicLocation';
        const hasTime = mode === 'dynamicTime';
        document.getElementById('joorney-ts-location').hidden = !hasLocation;
        document.getElementById('joorney-ts-time').hidden = !hasTime;
        document.getElementById('joorney-ts-none').hidden = hasLocation || hasTime;
    }

    async updateLocation() {
        const coords = await getUserLocation();
        document.getElementById('joorney_theme_switch_latitude').value = coords.latitude;
        document.getElementById('joorney_theme_switch_longitude').value = coords.longitude;

        await StorageSync.set({
            themeSwitchLocationLatitude: coords.latitude,
            themeSwitchLocationLongitude: coords.longitude,
        });
    }
}
