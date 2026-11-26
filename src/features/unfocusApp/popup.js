import { PopupCustomizableFeature, settingSwitchesHTML } from '../../generic/popup.js';
import configuration from './configuration.js';

export default class UnfocusAppPopupFeature extends PopupCustomizableFeature {
    constructor() {
        super(configuration);
    }

    blockHTML() {
        return settingSwitchesHTML([
            {
                setting: 'unfocusAppReorderEnabled',
                icon: 'swap_vert',
                labelKey: 'optionsUnfocus_reorder',
                helpKey: 'optionsUnfocus_reorderHelp',
            },
            {
                setting: 'unfocusAppShareEnabled',
                icon: 'share',
                labelKey: 'optionsUnfocus_share',
                helpKey: 'optionsUnfocus_shareHelp',
            },
        ]);
    }
}
