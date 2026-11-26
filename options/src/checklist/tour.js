import { steps as featureSteps, store as featureStore } from './steps/feature.js';
import { steps as featuresSteps, store as featuresStore } from './steps/features.js';
import { steps as homeSteps, store as homeStore } from './steps/home.js';
import { steps as settingsSteps, store as settingsStore } from './steps/settings.js';
import { steps as technicalSteps, store as technicalStore } from './steps/technical.js';
import { steps as toastsSteps, store as toastsStore } from './steps/toast.js';
import { steps as versionsSteps, store as versionsStore } from './steps/versions.js';

// Ids are local storage keys (tour_<id>: done)
export const tours = {
    tour_hostControls: {
        id: 'tour_hostControls',
        version: 1,
        titleKey: 'checklist_tourHome_title',
        descriptionKey: 'checklist_tourHome_description',
        steps: homeSteps,
        store: homeStore,
    },
    tour_features: {
        id: 'tour_features',
        version: 1,
        titleKey: 'checklist_tourFeatures_title',
        descriptionKey: 'checklist_tourFeatures_description',
        steps: featuresSteps,
        store: featuresStore,
    },
    tour_preferences: {
        id: 'tour_preferences',
        version: 1,
        titleKey: 'checklist_tourFeature_title',
        descriptionKey: 'checklist_tourFeature_description',
        steps: featureSteps,
        store: featureStore,
    },
    tour_settings: {
        id: 'tour_settings',
        version: 1,
        titleKey: 'checklist_tourSettings_title',
        descriptionKey: 'checklist_tourSettings_description',
        steps: settingsSteps,
        store: settingsStore,
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
