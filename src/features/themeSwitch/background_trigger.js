import { BackgroundTriggerContentFeature } from '../../generic/background.js';
import configuration from './configuration.js';

export default class ThemeSwitchContentFeature extends BackgroundTriggerContentFeature {
    constructor() {
        super(configuration);
    }
}
