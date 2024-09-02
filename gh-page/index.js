import { features } from './configuration.js';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('copyright-year').innerHTML = new Date().getFullYear();

    const isOdooStyle = new URL(location.href).searchParams.get('style') === 'odoo';
    if (isOdooStyle) {
        document.getElementsByTagName('body')[0].classList.add('odoo-style');
    }

    loadFeatures('list');

    document.getElementById('features-list-viewtype-list').onclick = () => loadFeatures('list');
    document.getElementById('features-list-viewtype-kanban').onclick = () => loadFeatures('kanban');
    document.getElementById('features-list-viewtype-grid').onclick = () => loadFeatures('grid');
});

function loadFeatures(viewType) {
    const featureContainer = document.getElementById('features-list');
    featureContainer.innerHTML = '';

    for (const feature of features.filter((f) => !f.deprecated)) {
        loadFeature(feature, viewType, featureContainer);
    }
}

function loadFeature(feature, viewType, container) {
    const template = document.createElement('template');

    container.classList.remove('flex-column');
    container.classList.remove('row');
    container.classList.remove('justify-content-center');

    document.getElementById('features-list-viewtype-list').classList.remove('active');
    document.getElementById('features-list-viewtype-kanban').classList.remove('active');
    document.getElementById('features-list-viewtype-grid').classList.remove('active');

    switch (viewType) {
        case 'grid': {
            template.innerHTML = `
            <a class="feature-box p-4 m-3" title="[Odoo Feature] ${feature.id}" href="./feature.html#${feature.id}">
                <i class="${feature.icon} fa-4x h-100 text-center text-dark d-flex justify-content-center align-items-center"></i>
            </a>
            `.trim();
            container.classList.add('row');
            container.classList.add('justify-content-center');
            document.getElementById('features-list-viewtype-grid').classList.add('active');
            break;
        }
        case 'kanban': {
            template.innerHTML = `
            <div class="p-1 col-12 col-md-6 col-lg-3 feature-row">
                <div class="card h-100">
                    <div class="card-body d-flex flex-column">
                        <div class="card-title w-100 px-0 col-2 d-flex align-items-center justify-content-start">
                            <a class="d-flex justify-content-center align-items-center me-3" style="height: 32px; min-width: 32px; background-color: var(--joorney-primary); border-radius: 8px;" title="[Odoo Feature] ${feature.id}" href="./feature.html#${feature.id}">
                                <i class="${feature.icon} fa-1x h-100 text-center text-dark d-flex justify-content-center align-items-center"></i>
                            </a>
                            <p class="m-0"><strong>${feature.title}</strong></p>
                        </div>
                        <p class="card-text">${feature.textDescription}</p>
                        <div class="mt-auto d-flex justify-content-end">
                            <a class="btn btn-light" title="[Odoo Feature] ${feature.id}" href="./feature.html#${feature.id}">
                                Details
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            `.trim();
            container.classList.add('row');
            document.getElementById('features-list-viewtype-kanban').classList.add('active');
            break;
        }
        default: {
            template.innerHTML = `
            <div class="row d-flex align-items-center feature-row">
                <div class="px-0 col-11 col-lg-2 d-flex align-items-center justify-content-start">
                    <a class="d-flex justify-content-center align-items-center mx-3" style="height: 32px; min-width: 32px; background-color: var(--joorney-primary); border-radius: 8px;" title="[Odoo Feature] ${feature.id}" href="./feature.html#${feature.id}">
                        <i class="${feature.icon} fa-1x h-100 text-center text-dark d-flex justify-content-center align-items-center"></i>
                    </a>
                    <p class="m-0"><strong>${feature.title}</strong></p>
                </div>
                <div class="d-none d-lg-flex align-items-center m-0 ps-5 pe-3 col-8" >
                    <p class="m-0" style="white-space: nowrap;overflow: hidden;text-overflow: ellipsis;">${feature.textDescription}</p>
                </div>

                <div class="col-2 d-flex justify-content-end align-items-center d-none d-lg-flex ">
                    <a class="feature-row-details-button btn btn-light" title="[Odoo Feature] ${feature.id}" href="./feature.html#${feature.id}">
                        Details
                    </a>
                </div>
                <a class="col-1 d-flex d-lg-none justify-content-center px-0 btn btn-link text-joorney" title="[Odoo Feature] ${feature.id}" href="./feature.html#${feature.id}">
                    <i class="fa-solid fa-chevron-right"></i>
                </a>
            </div>
            `.trim();
            container.classList.add('flex-column');
            document.getElementById('features-list-viewtype-list').classList.add('active');
        }
    }

    container.appendChild(template.content.firstChild);
}
