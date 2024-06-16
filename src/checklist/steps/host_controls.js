export const store = {
    tour_hostControls: false,
    step_hostControls_moveFeature: false,
    step_hostControls_addHost: false,
    step_hostControls_configureHost: false,
    step_hostControls_deleteHost: false,
};

export const steps = {
    step_hostControls_moveFeature: {
        id: 'step_hostControls_moveFeature',
        tour: 'joorney_tour_hostControls',
        name: 'Manage Features',
        description: 'Drag and drop to enable or disable a feature for optimal control.',
        trigger: [{ selector: '#joorney_showMyBadge_feature', run: 'dragend' }],
        next: 'step_hostControls_addHost',
        progression: 30,
    },
    step_hostControls_addHost: {
        id: 'step_hostControls_addHost',
        tour: 'joorney_tour_hostControls',
        name: 'Add your own origin',
        description: "Add a new origin by saving your changes or pressing 'Enter'.",
        trigger: [
            { selector: '#joorney_origins_filter_new_origin_save', run: 'click' },
            { selector: '#joorney_origins_filter_new_origin', run: 'onkeydown', conditional: (e) => e.key === 'Enter' },
        ],
        next: 'step_hostControls_configureHost',
        progression: 20,
    },
    step_hostControls_configureHost: {
        id: 'step_hostControls_configureHost',
        tour: 'joorney_tour_hostControls',
        name: 'Configure your origin',
        description: 'Adjust the settings for each origin by enabling or disabling features using the checkboxes.',
        trigger: [{ selector: '.joorney_origins_filter_origin_0_showMyBadge', run: 'click' }],
        next: 'step_hostControls_deleteHost',
        progression: 30,
    },
    step_hostControls_deleteHost: {
        id: 'step_hostControls_deleteHost',
        tour: 'joorney_tour_hostControls',
        name: 'Remove your origin',
        description: 'Initiate and confirm origin deletion in the prompt.',
        trigger: [{ selector: '.joorney_origins_filter_origin_delete_0', run: 'click' }],
        progression: 20,
    },
};
