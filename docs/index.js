import { categories, features } from './configuration.js';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('copyright-year').innerHTML = new Date().getFullYear();

    if (new URL(location.href).searchParams.get('odoo') != null) {
        document.getElementsByTagName('body')[0].classList.add('odoo-style');
    }

    loadFeatures();
    loadCategories();
});

function loadCategories() {
    const categoryContainer = document.getElementById('categories-list-container');

    categoryContainer.innerHTML = '';

    categories.forEach((c, i) => {
        loadCategory(c, categoryContainer, i % 2 === 0);
    });
}

function loadCategory(category, container, featureOnTheRight = true) {
    const innerFeatures = features.filter((f) => f.category === category.id && !f.deprecated);

    const featuresContent = innerFeatures.map((f) => {
        return `
            <a class="feature-box p-4 m-3" title="[Odoo Feature] ${f.id}" href="./feature.html#${f.id}">
                <img class="w-100 h-100 svg-image-primary-text" alt="${f.id}, Icon" src="./assets/custom-fa-icons/${f.icon}.svg" />
            </a>
            `.trim();
    });
    while (featuresContent.length < 5) {
        featuresContent.push(`<div class="feature-box disable m-3"></div>`);
    }

    const titleElement = `
    <div class="col-4 ${featureOnTheRight ? '' : 'ps-5'}">
        <div class="feature-group-box p-2">
            <img class="w-100 h-100 svg-image-primary-text" src="./assets/custom-fa-icons/${category.icon}.svg" />
        </div>
        <h5>${category.label}</h5>
        <p>${category.description}</p>
    </div>
    `.trim();

    const sectionTemplate = document.createElement('template');
    sectionTemplate.innerHTML = `
    <section class="py-3 row align-items-center">
        ${featureOnTheRight ? titleElement : ''}
        <div class="${featureOnTheRight ? 'ps-5' : 'flex-row-reverse'} col-8 row flex-nowrap overflow-auto hide-scrollbar">
            ${featuresContent.join('')}
        </div>
        ${featureOnTheRight ? '' : titleElement}
    </section>
    `.trim();

    container.appendChild(sectionTemplate.content.firstChild);
}

function loadFeatures() {
    const featureContainer = document.getElementById('features-list-mobile');
    featureContainer.innerHTML = '';

    for (const feature of features.filter((f) => !f.deprecated)) {
        loadFeature(feature, featureContainer);
    }
}

function loadFeature(feature, container) {
    const mobileTemplate = document.createElement('template');
    mobileTemplate.innerHTML = `
    <a class="feature-box p-4 m-3" title="[Odoo Feature] ${feature.id}" href="./feature.html#${feature.id}">
        <img class="w-100 h-100 svg-image-primary-text" alt="${feature.id}, Icon" src="./assets/custom-fa-icons/${feature.icon}.svg" />
    </a>
    `.trim();
    container.appendChild(mobileTemplate.content.firstChild);
}
