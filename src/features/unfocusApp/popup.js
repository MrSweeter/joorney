import { PopupCustomizableFeature } from '../../generic/popup.js';
import { StorageSync } from '../../utils/browser.js';
import configuration from './configuration.js';

export default class UnfocusAppPopupFeature extends PopupCustomizableFeature {
    constructor() {
        super(configuration);
    }

    async render(enabled) {
        const { unfocusAppReorderEnabled, unfocusAppShareEnabled } = await StorageSync.get({
            unfocusAppReorderEnabled: this.defaultSettings.unfocusAppReorderEnabled,
            unfocusAppShareEnabled: this.defaultSettings.unfocusAppShareEnabled,
        });

        const appOrderSwitcher = document.getElementById('joorney_unfocus_app_order_switcher');
        const appOrderInput = document.getElementById('joorney_unfocus_app_order_input');
        this.updateRenderUnfocusAppSwitcher(
            appOrderSwitcher,
            appOrderInput,
            unfocusAppReorderEnabled,
            enabled,
            this.onUnfocusAppReorderModeChange
        );

        const appShareSwitcher = document.getElementById('joorney_unfocus_app_share_switcher');
        const appShareInput = document.getElementById('joorney_unfocus_app_share_input');

        this.updateRenderUnfocusAppSwitcher(
            appShareSwitcher,
            appShareInput,
            unfocusAppShareEnabled,
            enabled,
            this.onUnfocusAppShareModeChange
        );
    }

    updateRenderUnfocusAppSwitcher(switcher, input, optionActive, featureActive, onchange) {
        input.checked = optionActive;
        input.setAttribute('indeterminate', !featureActive);
        input.onchange = onchange;

        switcher.disabled = !featureActive;
        input.disabled = !featureActive;
        switcher.style.opacity = featureActive ? 1 : 0.5;
    }

    onUnfocusAppReorderModeChange(event) {
        const unfocusAppFeature = document.getElementById('unfocusAppFeature');
        const enabled = unfocusAppFeature.checked;
        if (enabled)
            StorageSync.set({
                unfocusAppReorderEnabled: event.currentTarget.checked,
            });
        else event.preventDefault();
    }

    onUnfocusAppShareModeChange(event) {
        const unfocusAppFeature = document.getElementById('unfocusAppFeature');
        const enabled = unfocusAppFeature.checked;
        if (enabled)
            StorageSync.set({
                unfocusAppShareEnabled: event.currentTarget.checked,
            });
        else event.preventDefault();
    }
}
