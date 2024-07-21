const features = [
    {
        id: 'assignMeTask',
        icon: 'user-plus-solid',
        title: 'Assign Me',
        category: 'odooFeature',
        longDescription:
            '<span class="fw-bold">Assign Me</span> is a feature that adds a new button to the task form that you can click to assign yourself the task.',
        textDescription: 'Add a new button to the task form that you can click to assign yourself the task.',
        video: './assets/video/2715412-hd_1280_720_60fps.webm',
        additionalDescription: '',
        amico: 'add_tasks-amico',
    },
    {
        id: 'saveKnowledge',
        icon: 'bookmark-floppy-disk-solid',
        title: 'Save Article',
        category: 'odooFeature',
        longDescription:
            '<span class="fw-bold">Save knowledge</span> is a feature that adds a new button on the top right corner of the article page that you can click to force the save of it.',
        textDescription:
            'Add a new button on the top right corner of the article page that you can click to force the save of it.',
        video: './assets/video/2715412-hd_1280_720_60fps.webm',
        additionalDescription: '',
        amico: 'floppy_disk-amico',
        deprecated: true,
    },
    {
        id: 'unfocusApp',
        icon: 'ghost-solid',
        title: 'Unfocus Apps',
        category: 'odooFeature',
        longDescription:
            '<span class="fw-bold">Unfocus App</span> is a feature that allows you to hide the apps that you are not using frequently, so you can focus on the ones that are more relevant to your work. It adds a small star next to the app name on the Odoo home page that you can toggle to unfocus the apps.<br/><br/>You prefer to highlight an apps, double click on the star to put a background image around the app icon.',
        textDescription:
            'Hide the apps that you are not using frequently, so you can focus on the ones that are more relevant to your work.',
        video: './assets/video/2715412-hd_1280_720_60fps.webm',
        additionalDescription: '',
        amico: 'social_strategy-amico',
    },
    {
        id: 'newServerActionCode',
        icon: 'code-solid',
        title: 'Server Action Code',
        category: 'odooFeature',
        longDescription:
            '<span class="fw-bold">Server Action Code App</span> is a feature that will automatically select "Execute code" as type for Server Action, so you can focus on writing code directly.',
        textDescription: 'Automatically select "Execute code" as type for Server Action',
        video: './assets/video/2715412-hd_1280_720_60fps.webm',
        additionalDescription: '',
        amico: 'hand_coding-amico',
    },
    {
        id: 'tooltipMetadata',
        icon: 'file-lines-solid',
        title: 'Tooltip Metadata',
        category: 'odooFeature',
        longDescription:
            '<span class="fw-bold">Tooltip Metadata</span> is a feature that will show you current record metadata by hovering the debug icon.',
        textDescription: 'Show you current record metadata by hovering the debug icon.',
        video: './assets/video/2715412-hd_1280_720_60fps.webm',
        additionalDescription: '',
        amico: 'static_assets-amico',
    },
    {
        id: 'contextOdooMenus',
        icon: 'location-arrow-solid',
        title: 'Context OdooMenus',
        category: 'odooFeature',
        longDescription: `<span class="fw-bold">Context OdooMenus</span> is a feature that will add Odoo's menus to the browser context menu`,
        textDescription: "Add Odoo's menus to the browser context menu",
        video: './assets/video/2715412-hd_1280_720_60fps.webm',
        additionalDescription: '',
        amico: 'dropdown_menu-amico',
    },
    {
        id: 'autoOpenRunbot',
        icon: 'jet-fighter-solid',
        title: 'Auto-Open Runbot',
        category: 'runbotFeature',
        longDescription:
            '<span class="fw-bold">AutoOpen Runbot</span> is a feature that allows you to open a runbot instance in a specific version as an admin user in debug mode, by adding a hash parameter to the url. For example, if you want to open a runbot in 16.3, you can use this url: <a target="_blank" href="https://runbot.odoo.com?joorney-runbot=16.3">https://runbot.odoo.com?joorney-runbot=16.3</a>.',
        textDescription:
            'Open a runbot instance in a specific version: <a target="_blank" href="https://runbot.odoo.com?joorney-runbot=17.0">https://runbot.odoo.com?joorney-runbot=17.0</a>',
        video: './assets/video/2715412-hd_1280_720_60fps.webm',
        additionalDescription: '',
        amico: 'product_tour-amico',
    },
    {
        id: 'impersonateLoginRunbot',
        icon: 'masks-theater-solid',
        title: 'Impersonate User',
        category: 'runbotFeature',
        longDescription:
            '<span class="fw-bold">Impersonate Login</span> is a feature that allows you to impersonate a default user on a runbot, such as admin, demo, or portal. This can be useful for testing purposes or for providing support to other users. It adds new options on the login page menu that you can select to impersonate one of the default user.',
        textDescription: 'Impersonate a default user on a runbot, such as admin, demo, or portal.',
        video: './assets/video/2715412-hd_1280_720_60fps.webm',
        additionalDescription: '',
        amico: 'add_user-amico',
    },
    {
        id: 'adminDebugLoginRunbot',
        icon: 'rocket-solid',
        title: 'Admin-Debug Login',
        category: 'runbotFeature',
        longDescription:
            '<span class="fw-bold">Admin-Debug Login</span> is a feature that allows you to open a runbot instance from the runbot page as an admin user in debug mode. It adds a new icon next to the database name that you can click to open the runbot instance.',
        textDescription: 'Open a runbot instance from the runbot page as an admin user in debug mode.',
        video: './assets/video/2715412-hd_1280_720_60fps.webm',
        additionalDescription: '',
        amico: 'superhero-amico',
    },
    {
        id: 'themeSwitch',
        icon: 'sun-moon-solid',
        title: 'Switch <span class="odoo">Odoo</span> Theme',
        category: 'designFeature',
        longDescription:
            '<span class="fw-bold">Switch Odoo Theme</span> is a feature that allows you to switch the Odoo theme dynamically based on a configured option. You can switch Odoo theme depending of location, time range or simply to a choosed one.',
        textDescription: 'Switch the Odoo theme dynamically based on a configured option',
        video: './assets/video/2715412-hd_1280_720_60fps.webm',
        additionalDescription: '',
        amico: 'google_sitemap-amico',
    },
    {
        id: 'awesomeStyle',
        icon: 'css3-alt',
        title: 'Awesome CSS',
        category: 'designFeature',
        longDescription:
            '<span class="fw-bold">Awesome Style</span> is a feature that allows you to apply custom CSS styles on your Odoo database page.',
        textDescription: 'Apply custom CSS styles on your Odoo database page.',
        video: './assets/video/2715412-hd_1280_720_60fps.webm',
        additionalDescription: '',
        amico: 'design_process-amico',
    },
    {
        id: 'awesomeLoading',
        sub: ['awesomeLoadingLarge', 'awesomeLoadingSmall'],
        icon: 'spinner-solid',
        title: 'Awesome Loading',
        category: 'designFeature',
        longDescription:
            '<span class="fw-bold">Awesome Loading Small/Large</span> is a feature that allows you to change the loading design of Odoo, the large one or the small one. The large one shows a spinning circle in fullscreen, while the small one shows a "Loading" text at the bottom right of the page.',
        textDescription: 'Change the loading design of Odoo, the large one or the small one.',
        video: './assets/video/2715412-hd_1280_720_60fps.webm',
        additionalDescription: '',
        amico: 'progress_indicator-amico',
    },
    {
        id: 'starringTaskEffect',
        icon: 'star-solid',
        title: 'Stars Effect',
        category: 'designFeature',
        longDescription:
            '<span class="fw-bold">Stars effect</span> is a feature that will trigger stars particles effect when you prioritize a task.',
        textDescription: 'Trigger stars particles effect when you prioritize a task.',
        video: './assets/video/2715412-hd_1280_720_60fps.webm',
        additionalDescription: '',
        amico: 'launching_with_balloons-amico',
    },
    {
        id: 'showMyBadge',
        icon: 'user-certificate-solid',
        title: 'Show my Badge',
        category: 'designFeature',
        longDescription: '<span class="fw-bold">Show My Badge</span> will show user\'s badges when showing user card.',
        textDescription: "Show user's badges in the user card.",
        video: './assets/video/2715412-hd_1280_720_60fps.webm',
        additionalDescription: '',
        amico: 'brand_loyalty-amico',
    },
];

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
                <img class="w-100 h-100 svg-image-primary-text" alt="${feature.id}, Icon" src="./assets/custom-fa-icons/${feature.icon}.svg" loading="lazy" />
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
                                <img style="height: 24px; min-width: 24px" class="svg-image-primary-text" alt="${feature.id}, Icon" src="./assets/custom-fa-icons/${feature.icon}.svg" loading="lazy" />
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
                        <img style="height: 24px; min-width: 24px" class="svg-image-primary-text" alt="${feature.id}, Icon" src="./assets/custom-fa-icons/${feature.icon}.svg" loading="lazy"/>
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
