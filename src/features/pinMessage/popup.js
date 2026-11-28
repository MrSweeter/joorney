import { PopupCustomizableFeature, settingSwitchesHTML } from '../../generic/popup.js';
import configuration from './configuration.js';

export default class PinMessagePopupFeature extends PopupCustomizableFeature {
    constructor() {
        super(configuration);
    }

    blockHTML() {
        return settingSwitchesHTML([
            {
                setting: 'pinMessageSelfAuthorEnabled',
                icon: 'chat_bubble',
                labelKey: 'optionsPinMessage_selfAuthor',
                helpKey: 'optionsPinMessage_selfAuthorHelp',
            },
            {
                setting: 'pinMessageDefaultShown',
                icon: 'visibility',
                labelKey: 'optionsPinMessage_defaultShown',
                helpKey: 'optionsPinMessage_defaultShownHelp',
            },
        ]);
    }
}
