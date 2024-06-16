import { steps as hostControlsSteps, store as hostControlsStore } from './steps/host_controls.js';
import { steps as preferencesSteps, store as preferencesStore } from './steps/preferences.js';
import { steps as technicalSteps, store as technicalStore } from './steps/technical.js';
import { steps as toastsSteps, store as toastsStore } from './steps/toast.js';
import { steps as versionsSteps, store as versionsStore } from './steps/versions.js';

export const tours = {
    tour_hostControls: {
        id: 'tour_hostControls',
        title: 'Hosts control',
        description: 'Manage feature by host!',
        steps: hostControlsSteps,
        store: hostControlsStore,
    },
    tour_preferences: {
        id: 'tour_preferences',
        title: 'Preferences',
        description: 'Setup your preferences for many features.',
        steps: preferencesSteps,
        store: preferencesStore,
    },
    tour_versions: {
        id: 'tour_versions',
        title: 'Versions',
        description: 'Choose in which version you want to use Joorney!',
        steps: versionsSteps,
        store: versionsStore,
    },
    tour_toasts: {
        id: 'tour_toasts',
        title: 'Notifications',
        description: 'Setup your notification preferences!',
        steps: toastsSteps,
        store: toastsStore,
    },
    tour_technical: {
        id: 'tour_technical',
        title: 'Technical / Developers',
        description: 'Welcome to the dark side, we have cookies!',
        steps: technicalSteps,
        store: technicalStore,
    },
};
