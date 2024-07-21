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

const featuresName = features.map((f) => f.id);

document.addEventListener('DOMContentLoaded', () => {
    const isOdooStyle = new URL(location.href).searchParams.get('style') === 'odoo';
    if (isOdooStyle) {
        document.getElementsByTagName('body')[0].classList.add('odoo-style');
    }

    const currentHash = window.location.hash.slice(1) || features.map((f) => f.id)[0];
    if (currentHash) loadFeature(currentHash);
});

document.addEventListener('wheel', (e) => {
    if (e.deltaX > 0) {
        document.getElementById('joorney-next-feature').click();
    } else if (e.deltaX < 0) {
        document.getElementById('joorney-previous-feature').click();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowRight') {
        document.getElementById('joorney-next-feature').click();
    } else if (e.code === 'ArrowLeft') {
        document.getElementById('joorney-previous-feature').click();
    }
});

function loadFeature(featureName) {
    const feature = features.find((f) => f.id === featureName || f.sub?.includes(featureName));
    if (!feature) return;

    document.getElementById('feature-icon').src = `./assets/custom-fa-icons/${feature.icon}.svg`;
    document.getElementById('feature-icon').alt = `${feature.id}, Icon`;
    document.getElementById('feature-title').innerHTML = feature.title;
    document.getElementById('feature-description').innerHTML = `${
        feature.deprecated
            ? '<span class="text-danger">[DEPRECATED] This feature is no more supported in recent Odoo versions</span><br />'
            : ''
    }${feature.longDescription || feature.textDescription}`;

    if (feature.additionalDescription) {
        document.getElementById('joorney-additional-feature-info').classList.remove('d-none');
        document.getElementById('feature-additional-description').innerHTML = feature.additionalDescription;
        const source = document.getElementById('feature-video-source');
        source.src = feature.video;
        source.parentElement.load();
        source.parentElement.play();
    } else {
        document.getElementById('joorney-additional-feature-info').classList.add('d-none');
    }

    for (const el of document.getElementsByClassName('feature-amico')) {
        el.src = `./assets/storyset-amico/${feature.amico}.svg`;
        el.alt = `${feature.id}, Amico`;
    }

    const currentFeatureIndex = featuresName.indexOf(featureName);
    document.getElementById('joorney-previous-feature').onclick = () => previousFeature(currentFeatureIndex - 1);
    document.getElementById('joorney-next-feature').onclick = () => nextFeature(currentFeatureIndex + 1);
}

function previousFeature(indexArg) {
    let index = indexArg;
    if (index < 0) index = featuresName.length - 1;
    window.location.hash = featuresName[index];
    loadFeature(featuresName[index]);
}

function nextFeature(indexArg) {
    let index = indexArg;
    if (index >= featuresName.length) index = 0;
    window.location.hash = featuresName[index];
    loadFeature(featuresName[index]);
}
