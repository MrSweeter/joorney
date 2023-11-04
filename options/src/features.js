import { Runtime, StorageSync } from '../../utils/browser.js';

function disableFeatureInput(feature) {
    const inputs = Array.from(
        document.getElementsByClassName(`qol_origins_filter_feature_input_${feature}`)
    );
    inputs.forEach((i) => {
        i.disabled = true;
        i.classList.add(`feature-disabled`);
    });

    document.getElementById(`qol_origins_filter_feature_header_${feature}`).style.opacity = 0.5;
}

function enableFeatureInput(feature) {
    const inputs = Array.from(
        document.getElementsByClassName(`qol_origins_filter_feature_input_${feature}`)
    );
    inputs.forEach((i) => {
        i.disabled = false;
        i.classList.remove(`feature-disabled`);
    });

    document.getElementById(`qol_origins_filter_feature_header_${feature}`).style.opacity = 1;
}

export async function loadFeature(feature) {
    async function getDefaultConfiguration() {
        const configuration = await StorageSync.get({
            [`${feature}Enabled`]: false,
            [`${feature}WhitelistMode`]: true,
        });
        return configuration;
    }

    Runtime.onMessage.addListener(async (msg) => {
        const enableFeature = msg[`enable${feature.charAt(0).toUpperCase()}${feature.slice(1)}`];
        if (enableFeature === true || enableFeature === false) {
            const defaultConfiguration = await getDefaultConfiguration(feature);
            restoreFeatureName(feature, defaultConfiguration);
        }
    });

    const defaultConfiguration = await getDefaultConfiguration(feature);
    return restoreFeatureName(feature, defaultConfiguration);
}

async function restoreFeatureName(feature, defaultConfiguration) {
    restoreFeature(
        feature,
        defaultConfiguration[`${feature}Enabled`],
        defaultConfiguration[`${feature}WhitelistMode`]
    );
    return defaultConfiguration;
}

function restoreFeature(feature, enabled, isWhitelist) {
    if (enabled) enableFeatureInput(feature);
    else disableFeatureInput(feature);

    const featureElement = document.getElementById(`qol_${feature}_feature`);
    let container = document.getElementById('qol-disable-feature');
    if (enabled) {
        if (isWhitelist) {
            container = document.getElementById('qol-whitelist-feature');
        } else {
            container = document.getElementById('qol-blacklist-feature');
        }
    }

    container.appendChild(featureElement);
    featureElement.ondragstart = startDrag;
    updateInputColor(feature, enabled, isWhitelist);
}

//#region Drag and Drop
export function setupDragAndDrop() {
    const whitelistFeature = document.getElementById('qol-whitelist-feature');
    whitelistFeature.ondrop = (e) => {
        dropElement(e, true, true);
    };
    whitelistFeature.ondragover = allowDropInArea;

    const blacklistFeature = document.getElementById('qol-blacklist-feature');
    blacklistFeature.ondrop = (e) => {
        dropElement(e, true, false);
    };
    blacklistFeature.ondragover = allowDropInArea;

    const disableFeature = document.getElementById('qol-disable-feature');
    disableFeature.ondrop = (e) => {
        dropElement(e, false, undefined);
    };
    disableFeature.ondragover = allowDropInArea;
}

function allowDropInArea(e) {
    e.preventDefault();
}

function startDrag(e) {
    e.dataTransfer.setData('text/feature', e.currentTarget.getAttribute('data-feature'));
    e.dataTransfer.setData('text/id', e.currentTarget.id);
}

async function dropElement(e, enable, isWhitelist) {
    e.preventDefault();
    const dataFeature = e.dataTransfer.getData('text/feature');
    const dataID = e.dataTransfer.getData('text/id');
    const container = e.currentTarget;
    await StorageSync.set({
        [`${dataFeature}Enabled`]: enable,
        [`${dataFeature}WhitelistMode`]: isWhitelist,
    });
    if (enable) enableFeatureInput(dataFeature);
    else disableFeatureInput(dataFeature);
    const element = document.getElementById(dataID);
    if (container.id == element.parentElement.id) return;
    container.appendChild(document.getElementById(dataID));
    updateInputColor(dataFeature, enable, isWhitelist);
}
//#endregion

//#region Element dragging
const dragStart = (e) => e.currentTarget.classList.add('feature-dragging');
const dragEnd = (e) => e.currentTarget.classList.remove('feature-dragging');
document.querySelectorAll('.draggable-feature').forEach((card) => {
    card.addEventListener('dragstart', dragStart);
    card.addEventListener('dragend', dragEnd);
});

/*const dragEnter = (e) => e.currentTarget.classList.add('drop');
const dragLeave = (e) => e.currentTarget.classList.remove('drop');
document.querySelectorAll('.qol-state-feature').forEach((column) => {
    column.addEventListener('dragenter', dragEnter);
    column.addEventListener('dragleave', dragLeave);
});*/
//#endregion

//#region Update Origins
function updateInputColor(feature, isEnable, isWhitelist) {
    Array.from(
        document.getElementsByClassName(`qol_origins_filter_feature_input_${feature}`)
    ).forEach((el) => {
        el.classList.remove('qol_f_whitelist');
        el.classList.remove('qol_f_blacklist');
        el.classList.remove('qol_f_disable');
        let toAdd = 'qol_f_disable';
        if (isEnable) {
            if (isWhitelist) {
                toAdd = 'qol_f_whitelist';
            } else {
                toAdd = 'qol_f_blacklist';
            }
        }
        el.classList.add(toAdd);
    });
}
//#endregion
