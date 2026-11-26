import { PAGE as CONFIGURATION_PAGE } from './pages/configuration/index.js';
import { PAGE as FEATURE_PAGE } from './pages/feature/index.js';
import { PAGE as FEATURES_PAGE } from './pages/features/index.js';
import { PAGE as IMPORT_EXPORT_PAGE } from './pages/importexport/index.js';
import { PAGE as MIGRATION_PAGE } from './pages/migration/index.js';
import { PAGE as TECHNICAL_PAGE } from './pages/technical/index.js';
import { PAGE as TOAST_PAGE } from './pages/toast/index.js';
import { PAGE as VERSION_PAGE } from './pages/version/index.js';
import { PAGE as WEBSITE_PAGE } from './pages/website/index.js';

// Navbar order. group 'more': in the "More" dropdown (with its icon); technical: hidden unless debug.
const MORE = 'more';

export const PAGES = [
    // Home: the hosts page until the Home dashboard replaces it
    WEBSITE_PAGE,
    FEATURES_PAGE,
    // Route only (?page=page-feature&feature=<id>), Features stays the active entry
    FEATURE_PAGE,
    VERSION_PAGE,
    { ...CONFIGURATION_PAGE, group: MORE, icon: 'build' },
    { ...TOAST_PAGE, group: MORE, icon: 'chat_bubble' },
    { ...IMPORT_EXPORT_PAGE, group: MORE, icon: 'swap_vert' },
    // Route only (?page=page-migration), Import / export stays the active entry
    MIGRATION_PAGE,
    { ...TECHNICAL_PAGE, group: MORE, icon: 'code_blocks' },
];
