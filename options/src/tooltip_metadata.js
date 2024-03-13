import { loadFeature } from './features.js';

export async function load() {
    await loadFeature('tooltipMetadata');
}
