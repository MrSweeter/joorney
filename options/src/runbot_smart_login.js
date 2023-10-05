import { defaultSmartLoginRunbotSetting } from '../../utils/feature_default_configuration.js';
import { loadLimitedFeature } from './limited_features.js';

export async function load() {
    await loadLimitedFeature('impersonateLoginRunbot', defaultSmartLoginRunbotSetting);
    await loadLimitedFeature('adminDebugLoginRunbot', defaultSmartLoginRunbotSetting);
}
