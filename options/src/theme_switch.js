import { StorageSync } from '../../utils/browser.js';
import { defaultThemeSwitchSetting } from '../../utils/feature_default_configuration.js';
import { loadFeature } from './features.js';

export async function load() {
    await loadFeature('themeSwitch');

    restore();
}

async function restore() {
    const configuration = await StorageSync.get(defaultThemeSwitchSetting);

    const latitudeElement = document.getElementById('qol_theme_switch_latitude');
    latitudeElement.value = configuration.themeSwitchLocationLatitude;
    latitudeElement.onchange = async (e) =>
        await StorageSync.set({ themeSwitchLocationLatitude: e.target.value });

    const longitudeElement = document.getElementById('qol_theme_switch_longitude');
    longitudeElement.value = configuration.themeSwitchLocationLongitude;
    longitudeElement.onchange = async (e) =>
        await StorageSync.set({ themeSwitchLocationLongitude: e.target.value });

    const getLocationElement = document.getElementById('qol_theme_switch_get_location_button');
    getLocationElement.onclick = updateLocation;

    const darkStartTime = document.getElementById('qol_theme_switch_dark_start');
    darkStartTime.value = configuration.themeSwitchDarkStartTime;
    darkStartTime.onchange = async (e) =>
        await StorageSync.set({ themeSwitchDarkStartTime: e.target.value });

    const darkStopTime = document.getElementById('qol_theme_switch_dark_stop');
    darkStopTime.value = configuration.themeSwitchDarkStopTime;
    darkStopTime.onchange = async (e) =>
        await StorageSync.set({ themeSwitchDarkStopTime: e.target.value });
}

async function updateLocation(e) {
    const coords = await getUserLocation();
    document.getElementById('qol_theme_switch_latitude').value = coords.latitude;
    document.getElementById('qol_theme_switch_longitude').value = coords.longitude;

    await StorageSync.set({
        themeSwitchLocationLatitude: coords.latitude,
        themeSwitchLocationLongitude: coords.longitude,
    });
}

async function getUserLocation() {
    return await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (loc) => resolve(loc.coords),
            (error) => reject(error)
        );
    });
}
