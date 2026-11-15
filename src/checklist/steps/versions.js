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
        tour: 'joorney_tour_versions',
        nameKey: 'checklist_versions_addLTSVersion_name',
        descriptionKey: 'checklist_versions_addLTSVersion_description',
        trigger: [{ selector: 'label[for="joorney_16_0_version"]', run: 'click' }],
        next: 'step_versions_addSubVersion',
        progression: 30,
    },
    step_versions_addSubVersion: {
        id: 'step_versions_addSubVersion',
        tour: 'joorney_tour_versions',
        nameKey: 'checklist_versions_addSubVersion_name',
        descriptionKey: 'checklist_versions_addSubVersion_description',
        trigger: [{ selector: 'label[for="joorney_15_2_version"]', run: 'click' }],
        next: 'step_versions_checkCompatibility',
        progression: 30,
    },
    step_versions_checkCompatibility: {
        id: 'step_versions_checkCompatibility',
        tour: 'joorney_tour_versions',
        nameKey: 'checklist_versions_checkCompatibility_name',
        descriptionKey: 'checklist_versions_checkCompatibility_description',
        next: 'step_versions_removeSubVersion',
        progression: 10,
    },
    step_versions_removeSubVersion: {
        id: 'step_versions_removeSubVersion',
        tour: 'joorney_tour_versions',
        nameKey: 'checklist_versions_removeSubVersion_name',
        descriptionKey: 'checklist_versions_removeSubVersion_description',
        trigger: [{ selector: 'label[for="joorney_15_2_version"]', run: 'click' }],
        progression: 30,
    },
};
