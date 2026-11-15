export const store = {
    tour_toasts: false,
    tour_toasts_version: 1,
    step_toast_showMe_1: false,
    step_toast_switchMode: false,
    step_toast_disableType: false,
    step_toast_showMe_2: false,
};

export const steps = {
    step_toast_showMe_1: {
        id: 'step_toast_showMe_1',
        tour: 'tour_toasts',
        nameKey: 'checklist_toast_showMe_name',
        descriptionKey: 'checklist_toast_showMe_description',
        trigger: [{ selector: '#joorney-toast-mode-showme', run: 'click' }],
        next: 'step_toast_switchMode',
        progression: 25,
    },
    step_toast_switchMode: {
        id: 'step_toast_switchMode',
        tour: 'tour_toasts',
        nameKey: 'checklist_toast_switchMode_name',
        descriptionKey: 'checklist_toast_switchMode_description',
        trigger: [
            { selector: 'label[for="joorney-toast-mode-log"]', run: 'click' },
            { selector: 'label[for="joorney-toast-mode-small"]', run: 'click' },
            { selector: 'label[for="joorney-toast-mode-large"]', run: 'click' },
        ],
        next: 'step_toast_disableType',
        progression: 25,
    },
    step_toast_disableType: {
        id: 'step_toast_disableType',
        tour: 'tour_toasts',
        nameKey: 'checklist_toast_disableType_name',
        descriptionKey: 'checklist_toast_disableType_description',
        trigger: [
            { selector: 'label[for="joorney-toast-mode-info"]', run: 'click' },
            { selector: 'label[for="joorney-toast-mode-warn"]', run: 'click' },
            { selector: 'label[for="joorney-toast-mode-error"]', run: 'click' },
            { selector: 'label[for="joorney-toast-mode-succss"]', run: 'click' },
        ],
        next: 'step_toast_showMe_2',
        progression: 25,
    },
    step_toast_showMe_2: {
        id: 'step_toast_showMe_2',
        tour: 'tour_toasts',
        nameKey: 'checklist_toast_showMe_name',
        descriptionKey: 'checklist_toast_showMe_description',
        progression: 25,
    },
};
