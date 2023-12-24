import { Runtime, StorageSync } from '../../utils/browser.js';

export async function loadLimitedFeature(feature, defaultConfiguration) {
    Runtime.onMessage.addListener((msg) => {
        const enableFeature = msg[`enable${feature.charAt(0).toUpperCase()}${feature.slice(1)}`];
        if (enableFeature === true || enableFeature === false)
            restoreLimitedFeature(feature, enableFeature);
    });

    const configuration = await StorageSync.get(defaultConfiguration);
    restoreLimitedFeature(feature, configuration[`${feature}Enabled`]);
    return configuration;
}

export function restoreLimitedFeature(feature, enabled) {
    const featureInput = document.getElementById(`qol_${feature}_limited_feature`);
    featureInput.checked = enabled;

    featureInput.onchange = async (e) => {
        const toUpdate = {};
        const checked = e.target.checked;
        toUpdate[`${feature}Enabled`] = checked;
        await StorageSync.set(toUpdate);
        restoreLimitedFeature(feature, checked);
    };
}
