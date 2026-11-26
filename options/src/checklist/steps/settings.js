export const store = {
    tour_settings: false,
    tour_settings_version: 1,
    step_settings_language: false,
    step_settings_hostsView: false,
    step_settings_shortcut: false,
};

export const steps = {
    step_settings_language: {
        id: 'step_settings_language',
        nameKey: 'checklist_settings_language_name',
        descriptionKey: 'checklist_settings_language_description',
        // Changing the language reloads the page: the step is saved before, on the first input
        trigger: [
            { selector: '#joorney_language_card input[name="joorney_language_mode"]', run: 'click' },
            { selector: '#joorney_language_static', run: 'change' },
        ],
        next: 'step_settings_hostsView',
    },
    step_settings_hostsView: {
        id: 'step_settings_hostsView',
        nameKey: 'checklist_settings_hostsView_name',
        descriptionKey: 'checklist_settings_hostsView_description',
        trigger: [{ selector: '#joorney_advanced_host_view', run: 'click' }],
        next: 'step_settings_shortcut',
    },
    step_settings_shortcut: {
        id: 'step_settings_shortcut',
        nameKey: 'checklist_settings_shortcut_name',
        descriptionKey: 'checklist_settings_shortcut_description',
        trigger: [{ selector: '#joorney_shortcut_copy', run: 'click' }],
    },
};
