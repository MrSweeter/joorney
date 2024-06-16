export const store = {
    tour_preferences: false,
    step_preferences_awesomeLoading: false,
    step_preferences_awesomeStyle: false,
    step_preferences_unfocusApp: false,
    step_preferences_themeSwitchLocation: false,
    step_preferences_themeSwitchTime: false,
};

export const steps = {
    step_preferences_awesomeLoading: {
        id: 'step_preferences_awesomeLoading',
        tour: 'tour_preferences',
        name: 'Custom Loading',
        description: 'Upload and set a custom loading GIF for a personalized Odoo loading.',
        trigger: [{ selector: '#joorney_awe_loading_new_image_save', run: 'click', align: 'nearest' }],
        next: 'step_preferences_awesomeStyle',
        progression: 20,
    },
    step_preferences_awesomeStyle: {
        id: 'step_preferences_awesomeStyle',
        tour: 'tour_preferences',
        name: 'Stylus Like',
        description: 'Adjust and customize the visual style to match your preferences.',
        trigger: [{ selector: '#joorney_awe_style_css', run: 'click' }],
        next: 'step_preferences_unfocusApp',
        progression: 20,
    },
    step_preferences_unfocusApp: {
        id: 'step_preferences_unfocusApp',
        tour: 'tour_preferences',
        name: 'App Icon Background',
        description: 'Personalize the app icon background, used for superfocused apps.',
        trigger: [{ selector: '#joorney_unfocus_app_light_image_input', run: 'click' }],
        next: 'step_preferences_themeSwitchLocation',
        progression: 20,
    },
    step_preferences_themeSwitchLocation: {
        id: 'step_preferences_themeSwitchLocation',
        tour: 'tour_preferences',
        name: 'Sunlight Theme Mode',
        description: 'Enable automatic theme switching based on sunrise and sunset times.',
        trigger: [{ selector: '#joorney_theme_switch_get_location_button', run: 'click' }],
        next: 'step_preferences_themeSwitchTime',
        progression: 20,
    },
    step_preferences_themeSwitchTime: {
        id: 'step_preferences_themeSwitchTime',
        tour: 'tour_preferences',
        name: 'Scheduled Theme Mode',
        description: 'Set a schedule time range for automatic theme switching.',
        trigger: [
            { selector: '#joorney_theme_switch_dark_start', run: 'click' },
            { selector: '#joorney_theme_switch_dark_stop', run: 'click' },
        ],
        progression: 20,
    },
};
