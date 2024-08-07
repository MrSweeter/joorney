import { BackgroundTriggerContentFeature } from '../../generic/background.js';
import { getPrefersColorScheme } from '../../utils/browser.js';
import { getOdooVersion } from '../../utils/version.js';
import configuration from './configuration.js';

export default class ThemeSwitchContentFeature extends BackgroundTriggerContentFeature {
    constructor() {
        super(configuration);
    }

    getArgs() {
        const theme = getPrefersColorScheme();
        if (!theme) return {};
        const version = getOdooVersion();
        return { theme, version };
    }
}
