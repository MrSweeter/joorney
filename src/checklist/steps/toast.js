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
        name: 'Notification Look',
        description: 'Display some notifications with your current configuration!',
        trigger: [{ selector: '#joorney-toast-mode-showme', run: 'click' }],
        next: 'step_toast_switchMode',
        progression: 25,
    },
    step_toast_switchMode: {
        id: 'step_toast_switchMode',
        tour: 'tour_toasts',
        name: 'Switch Mode',
        description: 'Change the display of notification, larger or hide in console!',
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
        name: 'Disable Type',
        description: 'Choose your prefered notifications types!',
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
        name: 'Notification Look',
        description: 'Display some notifications with your current configuration!',
        progression: 25,
    },
};
