import { features } from './configuration.js';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('copyright-year').innerHTML = new Date().getFullYear();

    if (new URL(location.href).searchParams.get('odoo') != null) {
        document.getElementsByTagName('body')[0].classList.add('odoo-style');
    }

    loadFeatures();
});

function loadFeatureMobile(feature, container) {
    const mobileTemplate = document.createElement('template');
    mobileTemplate.innerHTML = `
    <a class="feature-box p-4 m-3" title="[Odoo Feature] ${feature.id}" href="./feature.html#${feature.id}">
        <img class="w-100 h-100 svg-image-primary-text" alt="${feature.id}, Icon" src="./assets/custom-fa-icons/${feature.icon}.svg" />
    </a>
    `.trim();
    container.appendChild(mobileTemplate.content.firstChild);
}

function loadFeatures(viewType) {
    const featureMobileContainer = document.getElementById('features-list-mobile');
    featureMobileContainer.innerHTML = '';

    const featureContainer = document.getElementById('features-list');
    featureContainer.innerHTML = '';

    for (const feature of features.filter((f) => !f.deprecated)) {
        loadFeatureMobile(feature, featureMobileContainer);
        loadFeature(feature, viewType, featureContainer);
    }
}

function loadFeature(feature, viewType, container) {
    const template = document.createElement('template');

    switch (viewType) {
        case 'grid': {
            template.innerHTML = `
            <a class="feature-box p-4 m-3" title="[Odoo Feature] ${feature.id}" href="./feature.html#${feature.id}">
                <img class="w-100 h-100 svg-image-primary-text" alt="${feature.id}, Icon" src="./assets/custom-fa-icons/${feature.icon}.svg" />
            </a>
            `.trim();
            break;
        }
        case 'kanban': {
            template.innerHTML = `
            <a class="feature-box p-4 m-3" title="[Odoo Feature] ${feature.id}" href="./feature.html#${feature.id}">
                <img class="w-100 h-100 svg-image-primary-text" alt="${feature.id}, Icon" src="./assets/custom-fa-icons/${feature.icon}.svg" />
            </a>
            `.trim();
            break;
        }
        default: {
            template.innerHTML = `
            <div class="row d-flex align-items-center feature-row">
                <div class="px-0 col-2 d-flex align-items-center justify-content-start">
                    <a class="d-flex justify-content-center align-items-center mx-3" style="height: 32px; width: 32px; background-color: var(--joorney-primary); border-radius: 8px;" title="[Odoo Feature] ${feature.id}" href="./feature.html#${feature.id}">
                        <img style="height: 24px; width: 24px" class="svg-image-primary-text" alt="${feature.id}, Icon" src="./assets/custom-fa-icons/${feature.icon}.svg" />
                    </a>
                    <p class="m-0"><strong>${feature.title}</strong></p>
                </div>
                <p class="px-0 m-0 ps-5 col-9" style="white-space: nowrap;overflow: hidden;text-overflow: ellipsis;">${feature.textDescription}</p>

                <a class="feature-row-details-button col-1 btn btn-light" title="[Odoo Feature] ${feature.id}" href="./feature.html#${feature.id}">
                    Details
                </a>
            </div>
            `.trim();
        }
    }

    container.appendChild(template.content.firstChild);
}
