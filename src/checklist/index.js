import { StorageLocal } from '../utils/browser';
import { store as hostControlsStore } from './steps/host_controls.js';
import { store as preferencesStore } from './steps/preferences.js';
import { store as technicalStore } from './steps/technical.js';
import { store as versionsStore } from './steps/versions.js';

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class Checklist {
    static manager = undefined;
    static bubble = undefined;
    static content = undefined;
}

export async function getOnboardingProgressData() {
    const progress = await StorageLocal.get({
        ...hostControlsStore,
        ...preferencesStore,
        ...versionsStore,
        ...technicalStore,
    });
    return progress;
}
