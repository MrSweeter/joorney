import OptionCustomizationFeature from '../../generic/option_customization.js';
import { StorageSync } from '../../utils/browser.js';
import configuration from './configuration.js';

export default class ThemeSwitchOptionCustomizationFeature extends OptionCustomizationFeature {
    constructor() {
        super(configuration);
    }

    async load() {
        super.load();
        const configuration = await StorageSync.get(this.configuration.defaultSettings);

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

    async updateLocation() {
        const coords = await this.getUserLocation();
        document.getElementById('joorney_theme_switch_latitude').value = coords.latitude;
        document.getElementById('joorney_theme_switch_longitude').value = coords.longitude;

        await StorageSync.set({
            themeSwitchLocationLatitude: coords.latitude,
            themeSwitchLocationLongitude: coords.longitude,
        });
    }

    async getUserLocation() {
        return await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (loc) => resolve(loc.coords),
                (error) => reject(error)
            );
        });
    }
}
