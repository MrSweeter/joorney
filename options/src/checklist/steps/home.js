import { UI_EVENTS } from '../../ui/events.js';

// Steps are written for the simple view of the Home page; the advanced view (matrix) gets its own targets as
// the second selector of a trigger, so the tour does not dead-end for someone who switched view.
// Id kept from the previous Hosts control tour: whoever finished it is not sent back into this one.
export const store = {
    tour_hostControls: false,
    tour_hostControls_version: 1,
    step_home_addHost: false,
    step_home_pickHost: false,
    step_home_switchFeature: false,
    step_home_bulk: false,
    step_home_runbot: false,
};

export const steps = {
    step_home_addHost: {
        id: 'step_home_addHost',
        nameKey: 'checklist_home_addHost_name',
        descriptionKey: 'checklist_home_addHost_description',
        // The field is what the walk points at; the step completes once a host is added (Enter or Add), not on an
        // invalid one
        trigger: [
            {
                selector: '#joorney-home [data-role="new-host"]',
                run: UI_EVENTS.ACTION_DONE,
                conditional: (e) => e.detail?.action === 'add-host',
            },
        ],
        next: 'step_home_pickHost',
    },
    step_home_pickHost: {
        id: 'step_home_pickHost',
        nameKey: 'checklist_home_pickHost_name',
        descriptionKey: 'checklist_home_pickHost_description',
        trigger: [
            { selector: '#joorney-home [data-action="select-host"]', run: 'click' },
            { selector: '#joorney-home .joorney-mx tbody tr', run: 'click' },
        ],
        next: 'step_home_switchFeature',
    },
    step_home_switchFeature: {
        id: 'step_home_switchFeature',
        nameKey: 'checklist_home_switchFeature_name',
        descriptionKey: 'checklist_home_switchFeature_description',
        // The runbot cards carry a global switch too: only the ones of a real host count. A deactivated card has
        // Activate in place of its switch, it can turn the feature on for the host too
        trigger: [
            { selector: '#joorney-home .joorney-home-item:not(.is-runbot) [data-action="switch"]', run: 'click' },
            { selector: '#joorney-home .joorney-home-item:not(.is-runbot) [data-action="activate"]', run: 'click' },
            { selector: '#joorney-home .joorney-mx [data-action="mx-cell"]', run: 'click' },
        ],
        next: 'step_home_bulk',
    },
    step_home_bulk: {
        id: 'step_home_bulk',
        nameKey: 'checklist_home_bulk_name',
        descriptionKey: 'checklist_home_bulk_description',
        trigger: [
            { selector: '#joorney-home [data-action="all-on"]', run: 'click' },
            { selector: '#joorney-home [data-action="all-off"]', run: 'click' },
        ],
        next: 'step_home_runbot',
    },
    step_home_runbot: {
        id: 'step_home_runbot',
        nameKey: 'checklist_home_runbot_name',
        descriptionKey: 'checklist_home_runbot_description',
        // The pinned Runbot row in the simple view, the Runbot block above the grid in the advanced one
        trigger: [
            { selector: '#joorney-home [data-action="select-runbot"]', run: 'click' },
            { selector: '#joorney-home [data-role="runbot-block"]', run: 'click' },
        ],
    },
};
