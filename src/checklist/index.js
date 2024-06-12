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

export async function getNextTourID() {
    const tourState = await StorageLocal.get({
        tour_hostControls: false,
        tour_preferences: false,
        tour_versions: false,
        tour_toasts: false,
    });
    const tourOrder = ['tour_versions', 'tour_hostControls', 'tour_preferences', 'tour_toasts'];
    const defaultMenuTour = tourOrder.find((t) => !tourState[t]);
    return defaultMenuTour;
}
