import { StorageSync } from '../../src/utils/browser.js';

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
export function updateInputColor(feature, isEnable, isWhitelist) {
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
