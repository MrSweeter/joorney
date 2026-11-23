import { steps as hostControlsSteps, store as hostControlsStore } from './steps/host_controls.js';
import { steps as preferencesSteps, store as preferencesStore } from './steps/preferences.js';
import { steps as technicalSteps, store as technicalStore } from './steps/technical.js';
import { steps as toastsSteps, store as toastsStore } from './steps/toast.js';
import { steps as versionsSteps, store as versionsStore } from './steps/versions.js';

export const tours = {
    tour_hostControls: {
        id: 'tour_hostControls',
        version: 1,
        titleKey: 'checklist_tourHostControls_title',
        descriptionKey: 'checklist_tourHostControls_description',
        steps: hostControlsSteps,
        store: hostControlsStore,
    },
    tour_preferences: {
        id: 'tour_preferences',
        version: 1,
        titleKey: 'checklist_tourPreferences_title',
        descriptionKey: 'checklist_tourPreferences_description',
        steps: preferencesSteps,
        store: preferencesStore,
    },
    tour_versions: {
        id: 'tour_versions',
        version: 1,
        titleKey: 'checklist_tourVersions_title',
        descriptionKey: 'checklist_tourVersions_description',
        steps: versionsSteps,
        store: versionsStore,
    },
    tour_toasts: {
        id: 'tour_toasts',
        version: 1,
        titleKey: 'checklist_tourToasts_title',
        descriptionKey: 'checklist_tourToasts_description',
        steps: toastsSteps,
        store: toastsStore,
    },
    tour_technical: {
        id: 'tour_technical',
        version: 1,
        titleKey: 'checklist_tourTechnical_title',
        descriptionKey: 'checklist_tourTechnical_description',
        steps: technicalSteps,
        store: technicalStore,
    },
};
