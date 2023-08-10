import { Runtime, StorageSync } from '../../utils/browser.js';

export async function loadFeature(feature, defaultConfiguration) {
    Runtime.onMessage.addListener((msg) => {
        const enableFeature = msg[`enable${feature.charAt(0).toUpperCase()}${feature.slice(1)}`];
        if (enableFeature === true || enableFeature === false)
            restoreFeature(feature, enableFeature);
    });

    const configuration = await StorageSync.get(defaultConfiguration);
    restoreFeature(feature, configuration[`${feature}Enabled`]);
    return configuration;
}

export function restoreFeature(feature, enabled) {
    if (enabled) enableFeatureInput(feature);
    else disableFeatureInput(feature);

    const featureInput = document.getElementById(`qol_${feature}_feature`);
    featureInput.checked = enabled;

    featureInput.onchange = async (e) => {
        const toUpdate = {};
        const checked = e.target.checked;
        toUpdate[`${feature}Enabled`] = checked;
        await StorageSync.set(toUpdate);
        restoreFeature(feature, checked);
    };
}

export function disableFeatureInput(feature) {
    const inputs = Array.from(
        document.getElementsByClassName(`qol_origins_filter_feature_input_${feature}`)
    );
    inputs.forEach((i) => {
        i.disabled = true;
        i.classList.add(`feature-disabled`);
    });

    document.getElementById(`qol_origins_filter_feature_header_${feature}`).style.opacity = 0.5;
}

export function enableFeatureInput(feature) {
    const inputs = Array.from(
        document.getElementsByClassName(`qol_origins_filter_feature_input_${feature}`)
    );
    inputs.forEach((i) => {
        i.disabled = false;
        i.classList.remove(`feature-disabled`);
    });

    document.getElementById(`qol_origins_filter_feature_header_${feature}`).style.opacity = 1;
}
