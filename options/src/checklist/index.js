import { StorageLocal } from '../../../src/utils/browser';
import { store as featureStore } from './steps/feature.js';
import { store as featuresStore } from './steps/features.js';
import { store as homeStore } from './steps/home.js';
import { store as settingsStore } from './steps/settings.js';
import { store as technicalStore } from './steps/technical.js';
import { store as toastsStore } from './steps/toast.js';
import { store as versionsStore } from './steps/versions.js';

// biome-ignore lint/complexity/noStaticOnlyClass: shared checklist state, used as a namespace
export class Checklist {
    static manager = undefined;
    static content = undefined;
    static panel = undefined;
    static guide = undefined;
}

// Tours offered in turn (the technical one is debug only and not part of the walk), in the order of the menu
export const TOUR_ORDER = [
    'tour_hostControls',
    'tour_features',
    'tour_preferences',
    'tour_settings',
    'tour_versions',
    'tour_toasts',
];

export async function getOnboardingProgressData() {
    const progress = await StorageLocal.get({
        ...homeStore,
        ...featuresStore,
        ...featureStore,
        ...settingsStore,
        ...versionsStore,
        ...toastsStore,
        ...technicalStore,
    });
    return progress;
}

export async function getNextTourID() {
    const tourState = await StorageLocal.get(Object.fromEntries(TOUR_ORDER.map((id) => [id, false])));
    return TOUR_ORDER.find((id) => !tourState[id]);
}
