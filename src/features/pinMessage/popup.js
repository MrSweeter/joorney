import { PopupCustomizableFeature } from '../../generic/popup.js';
import { StorageSync } from '../../utils/browser.js';
import configuration from './configuration.js';

export default class PinMessagePopupFeature extends PopupCustomizableFeature {
    constructor() {
        super(configuration);
    }

    async render(enabled) {
        const { pinMessageSelfAuthorEnabled, pinMessageDefaultShown } = await StorageSync.get({
            pinMessageSelfAuthorEnabled: this.defaultSettings.pinMessageSelfAuthorEnabled,
            pinMessageDefaultShown: this.defaultSettings.pinMessageDefaultShown,
        });

        const selfAuthorSwitcher = document.getElementById('joorney_pin_message_self_author_switcher');
        const selfAuthorInput = document.getElementById('joorney_pin_message_self_author_input');
        this.updateRenderPinMessageSelfAuthorSwitcher(
            selfAuthorSwitcher,
            selfAuthorInput,
            pinMessageSelfAuthorEnabled,
            enabled,
            this.onPinMessageSelfAuthorChange
        );

        const defaultShownSwitcher = document.getElementById('joorney_pin_message_default_shown_switcher');
        const defaultShownInput = document.getElementById('joorney_pin_message_default_shown_input');
        this.updateRenderPinMessageSelfAuthorSwitcher(
            defaultShownSwitcher,
            defaultShownInput,
            pinMessageDefaultShown,
            enabled,
            this.onPinMessageDefaultShownChange
        );
    }

    updateRenderPinMessageSelfAuthorSwitcher(switcher, input, optionActive, featureActive, onchange) {
        input.checked = optionActive;
        input.setAttribute('indeterminate', !featureActive);
        input.onchange = onchange;

        switcher.disabled = !featureActive;
        input.disabled = !featureActive;
        switcher.style.opacity = featureActive ? 1 : 0.5;
    }

    updateRenderPinMessageDefaultShownSwitcher(switcher, input, optionActive, featureActive, onchange) {
        input.checked = optionActive;
        input.setAttribute('indeterminate', !featureActive);
        input.onchange = onchange;

        switcher.disabled = !featureActive;
        input.disabled = !featureActive;
        switcher.style.opacity = featureActive ? 1 : 0.5;
    }

    onPinMessageSelfAuthorChange(event) {
        const pinMessageFeature = document.getElementById('pinMessageFeature');
        const enabled = pinMessageFeature.checked;
        if (enabled)
            StorageSync.set({
                pinMessageSelfAuthorEnabled: event.currentTarget.checked,
            });
        else event.preventDefault();
    }

    onPinMessageDefaultShownChange(event) {
        const pinMessageFeature = document.getElementById('pinMessageFeature');
        const enabled = pinMessageFeature.checked;
        if (enabled)
            StorageSync.set({
                pinMessageDefaultShown: event.currentTarget.checked,
            });
        else event.preventDefault();
    }
}
