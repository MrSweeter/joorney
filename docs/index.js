const categories = [
    {
        id: 'odooFeature',
        label: 'Odoo Features',
        icon: 'cubes-stacked-solid',
        description: '<span class="opacity-25">Improve your productivity with some utilitary features.</span>',
    },
    {
        id: 'runbotFeature',
        label: 'Runbot',
        icon: 'robot-solid',
        description: '<span class="opacity-25">Use runbot more efficiently!</span>',
    },
    {
        id: 'designFeature',
        label: 'Design',
        icon: 'display-newspaper-solid',
        description: '<span class="opacity-25">Improve your Odoo experience with effects and custom UI.</span>',
    },
];

const features = [
    {
        id: 'assignMeTask',
        icon: 'user-plus-solid',
        title: 'Assign Me a task',
        category: 'odooFeature',
        description:
            '<span class="fw-bold">Assign Me</span> is a feature that adds a new button to the task form that you can click to assign yourself the task.',
        amico: 'add_tasks-amico',
    },
    {
        id: 'saveKnowledge',
        icon: 'bookmark-floppy-disk-solid',
        title: 'Save knowledge article',
        category: 'odooFeature',
        description:
            '<span class="fw-bold">Save knowledge</span> is a feature that adds a new button on the top right corner of the article page that you can click to force the save of it.',
        amico: 'floppy_disk-amico',
        deprecated: true,
    },
    {
        id: 'unfocusApp',
        icon: 'ghost-solid',
        title: 'Unfocus apps',
        category: 'odooFeature',
        description:
            '<span class="fw-bold">Unfocus App</span> is a feature that allows you to hide the apps that you are not using frequently, so you can focus on the ones that are more relevant to your work. It adds a small star next to the app name on the odoo home page that you can toggle to unfocus the apps.<br/><br/>You prefer to highlight an apps, double click on the star to put a background image around the app icon.',
        amico: 'social_strategy-amico',
    },
    {
        id: 'newServerActionCode',
        icon: 'code-solid',
        title: 'Server Action Code',
        category: 'odooFeature',
        description:
            '<span class="fw-bold">Server Action Code App</span> is a feature that will automatically select "Execute code" as type for Server Action, so you can focus on writing code directly.',
        amico: 'hand_coding-amico',
    },
    {
        id: 'tooltipMetadata',
        icon: 'file-lines-solid',
        title: 'Tooltip Metadata',
        category: 'odooFeature',
        description:
            '<span class="fw-bold">Tooltip Metadata</span> is a feature that will show you current record metadata by hovering the debug icon.',
        amico: 'static_assets-amico',
    },
    {
        id: 'autoOpenRunbot',
        icon: 'jet-fighter-solid',
        title: 'Automatic Open runbot',
        category: 'runbotFeature',
        description:
            '<span class="fw-bold">AutoOpen Runbot</span> is a feature that allows you to open a runbot instance in a specific version as an admin user in debug mode, by adding a hash parameter to the url. For example, if you want to open a runbot in 16.3, you can use this url: <a target="_blank" href="https://runbot.odoo.com?joorney-runbot=16.3">https://runbot.odoo.com?joorney-runbot=16.3</a>.',
        amico: 'product_tour-amico',
    },
    {
        id: 'impersonateLoginRunbot',
        icon: 'masks-theater-solid',
        title: 'Impersonate default user',
        category: 'runbotFeature',
        description:
            '<span class="fw-bold">Impersonate Login</span> is a feature that allows you to impersonate a default user on a runbot, such as admin, demo, or portal. This can be useful for testing purposes or for providing support to other users. It adds new options on the login page menu that you can select to impersonate one of the default user.',
        amico: 'add_user-amico',
    },
    {
        id: 'adminDebugLoginRunbot',
        icon: 'rocket-solid',
        title: 'Login as admin in debug mode',
        category: 'runbotFeature',
        description:
            '<span class="fw-bold">Admin-Debug Login</span> is a feature that allows you to open a runbot instance from the runbot page as an admin user in debug mode. It adds a new icon next to the database name that you can click to open the runbot instance.',
        amico: 'superhero-amico',
    },
    {
        id: 'themeSwitch',
        icon: 'sun-moon-solid',
        title: 'Switch <span class="odoo">Odoo</span> Theme',
        category: 'designFeature',
        description:
            '<span class="fw-bold">Switch Odoo Theme</span> is a feature that allows you to switch the odoo theme dynamically based on a configured option. You can switch Odoo theme depending of location, time range or simply to a choosed one.',
        amico: 'google_sitemap-amico',
    },
    {
        id: 'awesomeStyle',
        icon: 'css3-alt',
        title: 'Apply custom CSS',
        category: 'designFeature',
        description:
            '<span class="fw-bold">Awesome Style</span> is a feature that allows you to apply custom CSS styles on your odoo database page.',
        amico: 'design_process-amico',
    },
    {
        id: 'awesomeLoading',
        sub: ['awesomeLoadingLarge', 'awesomeLoadingSmall'],
        icon: 'spinner-solid',
        title: 'Change the loading design',
        category: 'designFeature',
        description:
            '<span class="fw-bold">Awesome Loading Small/Large</span> is a feature that allows you to change the loading design of odoo, the large one or the small one. The large one shows a spinning circle in fullscreen, while the small one shows a "Loading" text at the bottom right of the page.',
        amico: 'progress_indicator-amico',
    },
    {
        id: 'starringTaskEffect',
        icon: 'star-solid',
        title: 'Stars effect on prioritizing a task',
        category: 'designFeature',
        description:
            '<span class="fw-bold">Stars effect</span> is a feature that will trigger stars particles effect when you prioritize a task.',
        amico: 'launching_with_balloons-amico',
    },
    {
        id: 'showMyBadge',
        icon: 'user-certificate-solid',
        title: 'Show my Badge on user Card',
        category: 'designFeature',
        description: '<span class="fw-bold">Show My Badge</span> will show user\'s badges when showing user card.',
        amico: 'brand_loyalty-amico',
    },
];

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
