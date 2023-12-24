import { defaultSaveKnowledgeSetting } from '../../utils/feature_default_configuration.js';
import { loadFeature } from './features.js';

export async function load() {
    await loadFeature('saveKnowledge');
}
