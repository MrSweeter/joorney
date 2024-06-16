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
        name: 'Enable LTS version',
        description: 'Select and enable a new Long-Term Support (LTS) version.',
        trigger: [{ selector: 'label[for="joorney_16_0_version"]', run: 'click' }],
        next: 'step_versions_addSubVersion',
        progression: 30,
    },
    step_versions_addSubVersion: {
        id: 'step_versions_addSubVersion',
        tour: 'joorney_tour_versions',
        name: 'Enable Version',
        description: 'Enable a version to explore new features.',
        trigger: [{ selector: 'label[for="joorney_15_2_version"]', run: 'click' }],
        next: 'step_versions_checkCompatibility',
        progression: 30,
    },
    step_versions_checkCompatibility: {
        id: 'step_versions_checkCompatibility',
        tour: 'joorney_tour_versions',
        name: 'Compatibility Table',
        description: 'Review compatibility between features and versions.',
        next: 'step_versions_removeSubVersion',
        progression: 10,
    },
    step_versions_removeSubVersion: {
        id: 'step_versions_removeSubVersion',
        tour: 'joorney_tour_versions',
        name: 'Disable Version',
        description: 'Disable the previously enabled version.',
        trigger: [{ selector: 'label[for="joorney_15_2_version"]', run: 'click' }],
        progression: 30,
    },
};
