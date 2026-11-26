import { UI_EVENTS } from '../../ui/events.js';

export const store = {
    tour_technical: true,
    tour_technical_version: 1,
    step_technical_experimentalOption: false,
    step_technical_addWAFallback: false,
    step_technical_removeWAFallback: false,
    step_technical_extensionState: false,
    step_technical_onboardingProgress: false,
    step_technical_extensionFeaturesConfiguration: false,
    step_technical_extensionConfiguration: false,
};

export const steps = {
    step_technical_experimentalOption: {
        id: 'step_technical_experimentalOption',
        nameKey: 'checklist_technical_experimentalOption_name',
        descriptionKey: 'checklist_technical_experimentalOption_description',
        // Read-only: ticked by hand
        trigger: [{ selector: '#joorney_experimentalDeveloperModeUI' }],
        next: 'step_technical_addWAFallback',
    },
    step_technical_addWAFallback: {
        id: 'step_technical_addWAFallback',
        nameKey: 'checklist_technical_addWAFallback_name',
        descriptionKey: 'checklist_technical_addWAFallback_description',
        // Completes once a fallback is saved, not on a click with an invalid form
        trigger: [
            {
                selector: '#joorney_window_action_fallback_new_path_save',
                run: UI_EVENTS.ACTION_DONE,
                conditional: (e) => e.detail?.action === 'add-fallback',
            },
        ],
        next: 'step_technical_removeWAFallback',
    },
    step_technical_removeWAFallback: {
        id: 'step_technical_removeWAFallback',
        nameKey: 'checklist_technical_removeWAFallback_name',
        descriptionKey: 'checklist_technical_removeWAFallback_description',
        // The delete button only asks (Cancel / Remove): the walk points at it, the step completes once removed
        trigger: [
            { selector: '.joorney-tech-origin-delete' },
            {
                selector: '#joorney_window_action_fallback_list',
                run: UI_EVENTS.ACTION_DONE,
                conditional: (e) => e.detail?.action === 'remove-fallback',
            },
        ],
        next: 'step_technical_extensionState',
    },
    step_technical_extensionState: {
        id: 'step_technical_extensionState',
        nameKey: 'checklist_technical_extensionState_name',
        // Only the selected tab is rendered: until it is, the walk points to the view button
        trigger: [
            { selector: '#joorney-extension-state .expander', run: 'click' },
            { selector: '#joorney-tech-view-state' },
        ],
        next: 'step_technical_onboardingProgress',
    },
    step_technical_onboardingProgress: {
        id: 'step_technical_onboardingProgress',
        nameKey: 'checklist_technical_onboardingProgress_name',
        trigger: [
            { selector: '#joorney-onboarding-progression .expander', run: 'click' },
            { selector: '#joorney-tech-tab-onboarding' },
        ],
        next: 'step_technical_extensionFeaturesConfiguration',
    },
    step_technical_extensionFeaturesConfiguration: {
        id: 'step_technical_extensionFeaturesConfiguration',
        nameKey: 'checklist_technical_extensionFeaturesConfiguration_name',
        trigger: [
            { selector: '#joorney-extension-features .expander', run: 'click' },
            { selector: '#joorney-tech-view-features' },
        ],
        next: 'step_technical_extensionConfiguration',
    },
    step_technical_extensionConfiguration: {
        id: 'step_technical_extensionConfiguration',
        nameKey: 'checklist_technical_extensionConfiguration_name',
        trigger: [
            { selector: '#joorney-storage-configuration .expander', run: 'click' },
            { selector: '#joorney-tech-view-config' },
        ],
    },
};
