// TODO[IMP] additionalDescription + video

export const features = [
    {
        id: 'assignMeTask',
        icon: 'user-plus-solid',
        title: 'Assign Me',
        longDescription:
            '<em>Assign Me</em> is a feature that enhances task management by adding a convenient button to the task form. This button allows you to quickly assign any task to yourself with a single click. Whether you are organizing your workload or taking on new responsibilities, <em>Assign Me</em> streamlines the process, ensuring you can take ownership of tasks efficiently.',
        textDescription: 'Add a new button to the task form that you can click to assign yourself the task.',
        video: './assets/video/2715412-hd_1280_720_60fps.webm',
        additionalDescription: `<div class="additional-info">
            <p class="fw-bold">Additional Information:</p>
            <ul>
                <li class="pb-3"><strong>Nostalgia:</strong> Before Odoo 16.3, Odoo had a standard button to assign you to a task/ticket. As this button disappear, it's time to add it back!</li>
                <li class="pb-3"><strong>Page reloaded:</strong> As not standard the button will trigger a reload of the page, that can lead to navigation history lose.</li>
                <li class="pb-3"><strong>Developer option:</strong> Instead of page reload, choose to append simulated UI.</li>
            </ul>
        </div>`,
        amico: 'add_tasks-amico',
    },
    {
        id: 'saveKnowledge',
        icon: 'bookmark-floppy-disk-solid',
        title: 'Save Article',
        longDescription:
            '<em>Save Article</em> simplifies content management by adding a save button to the top right corner of article pages. This button ensures that you can easily save important articles for later reference with just one click. This feature is perfect for users who frequently research or need to keep track of various articles and information.',
        textDescription:
            'Add a new button on the top right corner of the article page that you can click to force the save of it.',
        video: '',
        additionalDescription: `<div class="additional-info">
            <p class="fw-bold">Additional Information:</p>
            <ul>
                <li class="pb-3"><strong>Odoo WIP:</strong> Between the knowledge app addition and Odoo 17.0, there was not an easy way to force the save of an article.</li>
            </ul>
        </div>`,
        amico: 'floppy_disk-amico',
        deprecated: true,
        deprecatedReason: 'This feature has been added in standard version of Odoo!',
    },
    {
        id: 'unfocusApp',
        icon: 'ghost-solid',
        title: 'Unfocus Apps',
        longDescription:
            '<em>Unfocus Apps</em> helps you maintain productivity by allowing you to hide apps that are not frequently used. By clicking the star next to the app name on the Odoo home page, you can toggle the visibility of these apps, focusing on those more relevant to your work. Additionally, you can highlight an app by double-clicking the star to add a background image around the app icon.',
        textDescription:
            'Hide the apps that you are not using frequently, so you can focus on the ones that are more relevant to your work.',
        video: '',
        additionalDescription: `<div class="additional-info">
            <p class="fw-bold">Additional Information:</p>
            <ul>
                <li class="pb-3"><strong>Focus Enhancement:</strong> Hide less-used apps to concentrate on the most important tools for your tasks.</li>
                <li class="pb-3"><strong>Customizable Workspace:</strong> Easily toggle visibility of apps to create a personalized and efficient workspace.</li>
                <li class="pb-3"><strong>Visual Clarity:</strong> Reduce clutter on your Odoo home page, making it easier to find and use essential apps.</li>
                <li class="pb-3"><strong>Highlight Key Apps:</strong> Double-click the star icon to visually emphasize the most critical apps with a background image.</li>
            </ul>
        </div>`,
        amico: 'social_strategy-amico',
    },
    {
        id: 'newServerActionCode',
        icon: 'code-solid',
        title: 'Server Action Code',
        longDescription:
            '<em>Server Action Code</em> optimizes your workflow by automatically selecting "Execute code" as the type for Server Action. This allows you to focus directly on writing code without manually setting the action type, making the coding process more efficient and streamlined.',
        textDescription: 'Automatically select "Execute code" as type for Server Action',
        video: '',
        additionalDescription: `<div class="additional-info">
            <p class="fw-bold">Additional Information:</p>
            <ul>
                <li class="pb-3"><strong>Automated Setup:</strong> Automatically selects "Execute code" for server actions, reducing setup time.</li>
                <li class="pb-3"><strong>Developer Friendly:</strong> Allows developers to focus directly on writing and testing code without additional steps.</li>
                <li class="pb-3"><strong>Efficiency Boost:</strong> Streamlines the coding process, making development and debugging faster and easier.</li>
            </ul>
        </div>`,
        amico: 'hand_coding-amico',
    },
    {
        id: 'tooltipMetadata',
        icon: 'file-lines-solid',
        title: 'Tooltip Metadata',
        longDescription: `<em>Tooltip Metadata</em> provides quick access to record metadata. By hovering over the debug icon, you can instantly view the current record's metadata, making it easier to gather essential information without navigating away from the current view.`,
        textDescription: 'Show you current record metadata by hovering the debug icon.',
        video: '',
        additionalDescription: `<div class="additional-info">
            <p class="fw-bold">Additional Information:</p>
            <ul>
                <li class="pb-3"><strong>Instant Information:</strong> View metadata quickly by hovering over the debug icon, saving time on data retrieval.</li>
                <li class="pb-3"><strong>Improved Debugging:</strong> Access important metadata without navigating away from the current view, streamlining the debugging process.</li>
                <li class="pb-3"><strong>Enhanced Usability:</strong> Provides a seamless way to gather necessary information for record analysis and troubleshooting.</li>
                <li class="pb-3"><strong>Time-Saving:</strong> Reduces the need for multiple clicks and page loads, improving overall efficiency.</li>
            </ul>
        </div>`,
        amico: 'static_assets-amico',
    },
    {
        id: 'contextOdooMenus',
        icon: 'location-arrow-solid',
        title: 'Context OdooMenus',
        longDescription: `<em>Context OdooMenus</em> integrates Odoo's menus into the browser context menu. This addition allows you to access Odoo's functionalities directly from the browser's right-click menu, providing a more seamless and integrated user experience.`,
        textDescription: "Add Odoo's menus to the browser context menu",
        video: '',
        additionalDescription: `<div class="additional-info">
            <p class="fw-bold">Additional Information:</p>
            <ul>
                <li class="pb-3"><strong>Convenient Access:</strong> Adds Odoo's menus to the browser context menu for quick and easy access.</li>
                <li class="pb-3"><strong>Streamlined Navigation:</strong> Navigate Odoo functionalities directly from the right-click menu, saving time.</li>
                <li class="pb-3"><strong>User-Friendly:</strong> Enhances the user experience by integrating Odoo menus into familiar browser controls.</li>
                <li class="pb-3"><strong>Efficiency Improvement:</strong> Reduces the number of steps needed to access Odoo features, increasing productivity.</li>
            </ul>
        </div>`,
        amico: 'dropdown_menu-amico',
    },
    {
        id: 'autoOpenRunbot',
        icon: 'jet-fighter-solid',
        title: 'Auto-Open Runbot',
        longDescription:
            '<em>Auto-Open Runbot</em> facilitates quick access to specific runbot instances. By adding a search parameter to the URL, you can open a runbot instance in a specific version as an admin user in debug mode. For example, accessing a runbot in version 17.0 can be done through a URL like <a target="_blank" href="https://runbot.odoo.com?joorney-runbot=17.0">https://runbot.odoo.com?joorney-runbot=17.0</a>.',
        textDescription:
            'Open a runbot instance in a specific version: <a target="_blank" href="https://runbot.odoo.com?joorney-runbot=17.0">https://runbot.odoo.com?joorney-runbot=17.0</a>',
        video: '',
        additionalDescription: `<div class="additional-info">
            <p class="fw-bold">Additional Information:</p>
            <ul>
                <li class="pb-3"><strong>Version Specific:</strong> Open a runbot instance in a specific version quickly by adding a parameter to the URL.</li>
                <li class="pb-3"><strong>Admin Access:</strong> Automatically opens the instance as an admin user in debug mode for enhanced testing and debugging.</li>
                <li class="pb-3"><strong>URL Customization:</strong> Easily customize the URL to access different runbot versions as needed.</li>
                <li class="pb-3"><strong>Time-Saving:</strong> Streamlines the process of opening and configuring runbot instances, improving workflow efficiency.</li>
            </ul>
        </div>`,
        amico: 'product_tour-amico',
    },
    {
        id: 'impersonateLoginRunbot',
        icon: 'masks-theater-solid',
        title: 'Impersonate User',
        longDescription:
            '<em>Impersonate User</em> allows you to test and support effectively by impersonating default users on a runbot, such as admin, demo, or portal. This feature adds options to the login page menu, enabling you to select and impersonate different default users for various purposes.',
        textDescription: 'Impersonate a default user on a runbot, such as admin, demo, or portal.',
        video: '',
        additionalDescription: `<div class="additional-info">
            <p class="fw-bold">Additional Information:</p>
            <ul>
                <li class="pb-3"><strong>Testing Flexibility:</strong> Easily impersonate default users like admin, demo, or portal for comprehensive testing.</li>
                <li class="pb-3"><strong>Support Enhancement:</strong> Provide better support by experiencing the system from different user perspectives.</li>
                <li class="pb-3"><strong>Quick Switching:</strong> Add options to the login page menu to seamlessly switch between different user roles.</li>
                <li class="pb-3"><strong>Debugging Aid:</strong> Simplifies the process of identifying and resolving user-specific issues.</li>
            </ul>
        </div>`,
        amico: 'add_user-amico',
    },
    {
        id: 'adminDebugLoginRunbot',
        icon: 'rocket-solid',
        title: 'Admin-Debug Login',
        longDescription:
            '<em>Admin-Debug Login</em> provides an easy way to open a runbot instance from the runbot page as an admin user in debug mode. This feature adds a new icon next to the database name, allowing you to access the runbot instance with a single click, facilitating easier debugging and developer tasks.',
        textDescription: 'Open a runbot instance from the runbot page as an admin user in debug mode.',
        video: '',
        additionalDescription: `<div class="additional-info">
            <p class="fw-bold">Additional Information:</p>
            <ul>
                <li class="pb-3"><strong>Instant Access:</strong> Quickly open a runbot instance from the runbot page as an admin user in debug mode.</li>
                <li class="pb-3"><strong>Simplified Debugging:</strong> Adds a new icon next to the database name for easy access to the debug mode.</li>
                <li class="pb-3"><strong>Efficiency Boost:</strong> Reduces the steps needed to access and debug runbot instances, saving time.</li>
            </ul>
        </div>`,
        amico: 'superhero-amico',
    },
    {
        id: 'themeSwitch',
        icon: 'sun-moon-solid',
        title: 'Switch <span class="odoo">Odoo</span> Theme',
        longDescription:
            '<em>Switch Odoo Theme</em> allows you to dynamically change the Odoo theme based on configured options. You can switch themes depending on location, time range, or simply choose a preferred one, enhancing the visual and functional experience of using Odoo.',
        textDescription: 'Switch the Odoo theme dynamically based on a configured option',
        video: '',
        additionalDescription: `<div class="additional-info">
            <p class="fw-bold">Additional Information:</p>
            <ul>
                <li class="pb-3"><strong>Dynamic Themes:</strong> Switch Odoo themes based on location, time range, or user preference.</li>
            </ul>
        </div>`,
        amico: 'google_sitemap-amico',
    },
    {
        id: 'awesomeStyle',
        icon: 'css3-alt',
        title: 'Awesome CSS',
        longDescription:
            '<em>Awesome CSS</em> gives you the power to customize the appearance of your Odoo database page by applying custom CSS styles. This feature is perfect for users who want to personalize and enhance the visual aspects of their Odoo interface.',
        textDescription: 'Apply custom CSS styles on your Odoo database page.',
        video: '',
        additionalDescription: `<div class="additional-info">
            <p class="fw-bold">Additional Information:</p>
            <ul>
                <li class="pb-3"><strong>Customization:</strong> Apply custom CSS styles to personalize the appearance of your Odoo database page.</li>
                <li class="pb-3"><strong>Visual Enhancement:</strong> Improve the aesthetics of your Odoo interface to suit your preferences.</li>
                <li class="pb-3"><strong>User-Friendly:</strong> Easily implement CSS changes without needing advanced technical skills.</li>
                <li class="pb-3"><strong>Enhanced Interface:</strong> Make your Odoo experience more engaging and visually appealing.</li>
            </ul>
        </div>`,
        amico: 'design_process-amico',
    },
    {
        id: 'awesomeLoading',
        sub: ['awesomeLoadingLarge', 'awesomeLoadingSmall'],
        icon: 'spinner-solid',
        title: 'Awesome Loading',
        longDescription:
            '<em>Awesome Loading</em> allows you to customize the loading design of Odoo. You can choose between a large loading design, which displays a spinning circle in fullscreen, or a small one, which shows a "Loading" text at the bottom right of the page. This feature enhances the user experience during load times.<br /><br /><i>Note that the large loading has been removed in Odoo 17.0</i>',
        textDescription: 'Change the loading design of Odoo, the large one or the small one.',
        video: '',
        additionalDescription: `<div class="additional-info">
            <p class="fw-bold">Additional Information:</p>
            <ul>
                <li class="pb-3"><strong>Visual Appeal:</strong> Customize the loading indicator to enhance the visual experience during load times.</li>
                <li class="pb-3"><strong>User Engagement:</strong> Keeps users informed and engaged while waiting for pages to load.</li>
                <li class="pb-3"><strong>Easy Switching:</strong> Quickly switch between different loading designs to suit your needs.</li>
            </ul>
        </div>`,
        amico: 'progress_indicator-amico',
    },
    {
        id: 'starringTaskEffect',
        icon: 'star-solid',
        title: 'Stars Effect',
        longDescription:
            '<em>Stars Effect</em> adds a touch of magic to task prioritization. When you prioritize a task, it triggers a stars particles effect, adding a visually pleasing element to task management and making the prioritization process more engaging.',
        textDescription: 'Trigger stars particles effect when you prioritize a task.',
        video: '',
        additionalDescription: `<div class="additional-info">
            <p class="fw-bold">Additional Information:</p>
            <ul>
                <li class="pb-3"><strong>Visual Feedback:</strong> Adds a visually pleasing stars particle effect when prioritizing tasks/tickets.</li>
                <li class="pb-3"><strong>Engaging Experience:</strong> Makes task/ticket prioritization more enjoyable and interactive.</li>
                <li class="pb-3"><strong>Instant Recognition:</strong> Provides immediate visual confirmation when a task/ticket is prioritized.</li>
                <li class="pb-3"><strong>Motivation Boost:</strong> Enhances user satisfaction and motivation through engaging visuals.</li>
            </ul>
        </div>`,
        amico: 'launching_with_balloons-amico',
    },
    {
        id: 'showMyBadge',
        icon: 'user-certificate-solid',
        title: 'Show my Badge',
        longDescription: `<em>Show My Badge</em> displays user badges in the user card, highlighting achievements. This feature is ideal for recognizing and showcasing users' accomplishments within the Odoo interface, promoting a sense of achievement and community.`,
        textDescription: "Show user's badges in the user card.",
        video: '',
        additionalDescription: `<div class="additional-info">
            <p class="fw-bold">Additional Information:</p>
            <ul>
                <li class="pb-3"><strong>Recognition:</strong> Displays user badges in the user card, highlighting achievements and rewards.</li>
                <li class="pb-3"><strong>Enhanced Profiles:</strong> Makes user profiles more informative and visually appealing.</li>
                <li class="pb-3"><strong>Community Building:</strong> Promotes a sense of achievement.</li>
            </ul>
        </div>`,
        amico: 'brand_loyalty-amico',
    },
    {
        id: 'pinMessage',
        icon: 'thumbtack-solid',
        title: 'Pin Message',
        longDescription: `<em>Pin Message</em> allows users to quickly pin important messages of the chatter. By pinning a message, you ensure that critical information is easily accessible. Enhance communication efficiency by keeping key message highlighted and easy to find.<br /><br /><i>Note that due to high dependency to Odoo chatter, it's not the stablest feature!</i>`,
        textDescription: 'Pin message to the top of chatter fo easy access.',
        video: '',
        additionalDescription: `<div class="additional-info">
            <p class="fw-bold">Additional Information:</p>
            <ul>
                <li class="pb-3"><strong>Odoo Feature appropriation:</strong> Starring a message in chatter doesn't have impact on it, keep this standard feature but transform it as a "Pin".</li>
                <li class="pb-3"><strong>Priority Access:</strong> Ensures important messages are always at the top of the chat, preventing the from getting lost in the conversation flow.</li>
                <li class="pb-3"><strong>Easy management:</strong> Simple pin and unpin actions allow for dynamic management of important messages.</li>
                <li class="pb-3"><strong>Improved communication:</strong> Reduces the need to scroll through long chat histories to find critical messages, enhancing overall communication efficiency.</li>
            </ul>
        </div>`,
        amico: 'my_answer-amico',
    },
];
