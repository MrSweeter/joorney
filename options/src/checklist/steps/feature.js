// Id kept from the previous Preferences tour (the customization blocks it showed now live on the feature
// pages), so finished tours stay finished. Meant to run on a feature with customization (see tourParams).
export const store = {
    tour_preferences: false,
    tour_preferences_version: 1,
    step_feature_active: false,
    step_feature_settings: false,
    step_feature_where: false,
};

export const steps = {
    step_feature_active: {
        id: 'step_feature_active',
        nameKey: 'checklist_feature_active_name',
        descriptionKey: 'checklist_feature_active_description',
        trigger: [{ selector: '#joorney-feature #joorney-feature-active', run: 'click' }],
        next: 'step_feature_settings',
    },
    step_feature_settings: {
        id: 'step_feature_settings',
        nameKey: 'checklist_feature_settings_name',
        descriptionKey: 'checklist_feature_settings_description',
        // Features without customization have no Settings card: the step is then ticked by hand
        trigger: [
            { selector: '#joorney-feature [data-role="settings"] :is(button, input, select, textarea)', run: 'click' },
        ],
        next: 'step_feature_where',
    },
    step_feature_where: {
        id: 'step_feature_where',
        nameKey: 'checklist_feature_where_name',
        descriptionKey: 'checklist_feature_where_description',
        trigger: [
            {
                selector: '#joorney-feature [data-action="mode"], #joorney-feature [data-action="add-host"]',
                run: 'click',
            },
        ],
    },
};
