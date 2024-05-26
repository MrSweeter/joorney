import { StorageSync } from '../../src/utils/browser';

export function disableFeatureInput(feature) {
    const inputs = Array.from(document.getElementsByClassName(`joorney_origins_filter_feature_input_${feature}`));
    for (const i of inputs) {
        i.disabled = true;
        i.classList.add('feature-disabled');
    }

    document.getElementById(`joorney_origins_filter_feature_header_${feature}`).style.opacity = 0.5;
}

export function enableFeatureInput(feature) {
    const inputs = Array.from(document.getElementsByClassName(`joorney_origins_filter_feature_input_${feature}`));

    for (const i of inputs) {
        i.disabled = false;
        i.classList.remove('feature-disabled');
    }

    document.getElementById(`joorney_origins_filter_feature_header_${feature}`).style.opacity = 1;
}

//#region Drag and Drop
export function setupDragAndDrop() {
    const whitelistFeature = document.getElementById('joorney-whitelist-feature');
    whitelistFeature.ondrop = (e) => {
        dropElement(e, true, true);
    };
    whitelistFeature.ondragover = allowDropInArea;

    const blacklistFeature = document.getElementById('joorney-blacklist-feature');
    blacklistFeature.ondrop = (e) => {
        dropElement(e, true, false);
    };
    blacklistFeature.ondragover = allowDropInArea;

    const disableFeature = document.getElementById('joorney-disable-feature');
    disableFeature.ondrop = (e) => {
        dropElement(e, false, undefined);
    };
    disableFeature.ondragover = allowDropInArea;
}

function allowDropInArea(e) {
    e.preventDefault();
}

export function startDrag(e) {
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
    if (container.id === element.parentElement.id) return;
    container.appendChild(document.getElementById(dataID));
    updateInputColor(dataFeature, enable, isWhitelist);
}
//#endregion

//#region Element dragging
const dragStart = (e) => e.currentTarget.classList.add('feature-dragging');
const dragEnd = (e) => e.currentTarget.classList.remove('feature-dragging');
for (const card of document.querySelectorAll('.draggable-feature')) {
    card.addEventListener('dragstart', dragStart);
    card.addEventListener('dragend', dragEnd);
}

/*const dragEnter = (e) => e.currentTarget.classList.add('drop');
const dragLeave = (e) => e.currentTarget.classList.remove('drop');
for (const column of document.querySelectorAll('.joorney-state-feature')) {
    column.addEventListener('dragenter', dragEnter);
    column.addEventListener('dragleave', dragLeave);
};*/
//#endregion

//#region Update Origins
export async function updateFeatureOriginInputs(featureID, isEnable, isWhitelist) {
    updateInputColor(featureID, isEnable, isWhitelist);

    if (isEnable) enableFeatureInput(featureID);
    else disableFeatureInput(featureID);
}

export function updateInputColor(feature, isEnable, isWhitelist) {
    for (const el of document.getElementsByClassName(`joorney_origins_filter_feature_input_${feature}`)) {
        el.classList.remove('joorney_f_whitelist');
        el.classList.remove('joorney_f_blacklist');
        el.classList.remove('joorney_f_disable');
        let toAdd = 'joorney_f_disable';
        if (isEnable) {
            if (isWhitelist) {
                toAdd = 'joorney_f_whitelist';
            } else {
                toAdd = 'joorney_f_blacklist';
            }
        }
        el.classList.add(toAdd);
    }
}
//#endregion
