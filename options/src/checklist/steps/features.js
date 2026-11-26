export const store = {
    tour_features: false,
    tour_features_version: 1,
    step_features_zones: false,
    step_features_expand: false,
    step_features_drag: false,
};

const CARD = '#joorney-features .joorney-fb-zones .joorney-fcard';

export const steps = {
    step_features_zones: {
        id: 'step_features_zones',
        nameKey: 'checklist_features_zones_name',
        descriptionKey: 'checklist_features_zones_description',
        // Read-only: ticked by hand
        trigger: [{ selector: '#joorney-features .joorney-fb-zones' }],
        next: 'step_features_expand',
    },
    step_features_expand: {
        id: 'step_features_expand',
        nameKey: 'checklist_features_expand_name',
        descriptionKey: 'checklist_features_expand_description',
        // A click on the name or a button of the card does not expand it
        trigger: [{ selector: CARD, run: 'click', conditional: (e) => !e.target.closest('a, button') }],
        next: 'step_features_drag',
    },
    step_features_drag: {
        id: 'step_features_drag',
        nameKey: 'checklist_features_drag_name',
        descriptionKey: 'checklist_features_drag_description',
        // The dragged card is re-rendered in its new zone, so dragend may never reach the page: the drop does
        trigger: [{ selector: '#joorney-features .joorney-fb-zone', run: 'drop' }],
    },
};
