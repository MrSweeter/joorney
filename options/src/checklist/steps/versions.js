// Odoo versions come from the remote list: no hard-coded version, an LTS is a x.0 one, any other toggle is a sub version
export const store = {
    tour_versions: false,
    tour_versions_version: 1,
    step_versions_addLTSVersion: false,
    step_versions_addSubVersion: false,
    step_versions_checkCompatibility: false,
    step_versions_removeSubVersion: false,
};

export const steps = {
    step_versions_addLTSVersion: {
        id: 'step_versions_addLTSVersion',
        nameKey: 'checklist_versions_addLTSVersion_name',
        descriptionKey: 'checklist_versions_addLTSVersion_description',
        trigger: [{ selector: '#joorney-odoo-versions label[for$="_0_version"]', run: 'click' }],
        next: 'step_versions_addSubVersion',
    },
    step_versions_addSubVersion: {
        id: 'step_versions_addSubVersion',
        nameKey: 'checklist_versions_addSubVersion_name',
        descriptionKey: 'checklist_versions_addSubVersion_description',
        trigger: [
            { selector: '#joorney-odoo-versions label:not([for$="_0_version"])', run: 'click' },
            { selector: '#joorney-odoo-dev-versions label', run: 'click' },
            { selector: '#joorney-odoo-versions label', run: 'click' },
        ],
        next: 'step_versions_checkCompatibility',
    },
    step_versions_checkCompatibility: {
        id: 'step_versions_checkCompatibility',
        nameKey: 'checklist_versions_checkCompatibility_name',
        descriptionKey: 'checklist_versions_checkCompatibility_description',
        // Read-only: ticked by hand
        trigger: [{ selector: '#joorney-feature-versions-head' }],
        next: 'step_versions_removeSubVersion',
    },
    step_versions_removeSubVersion: {
        id: 'step_versions_removeSubVersion',
        nameKey: 'checklist_versions_removeSubVersion_name',
        descriptionKey: 'checklist_versions_removeSubVersion_description',
        trigger: [
            { selector: '#joorney-odoo-versions label:not([for$="_0_version"])', run: 'click' },
            { selector: '#joorney-odoo-dev-versions label', run: 'click' },
            { selector: '#joorney-odoo-versions label', run: 'click' },
        ],
    },
};
