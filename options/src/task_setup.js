import { defaultTaskSetupSetting } from '../../utils/feature_default_configuration.js';
import { loadFeature } from './features.js';

export async function load() {
    await loadFeature('assignMeTask');
    await loadFeature('starringTaskEffect');
}
