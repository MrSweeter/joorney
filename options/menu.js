import { loadPage as loadAmbientPage } from './pages/ambient/index.js';
import { loadPage as loadConfigurationPage } from './pages/configuration/index.js';
import { loadPage as loadTechnicalPage } from './pages/technical/index.js';
import { loadPage as loadToastPage } from './pages/toast/index.js';
import { loadPage as loadVersionPage } from './pages/version/index.js';
import { loadPage as loadWebsitePage } from './pages/website/index.js';

export const PAGES = [
    {
        id: 'page-website',
        menu: 'page-website',
        tour: 'tour_hostControls',
        label: 'Hosts control',
        path: './pages/website/index.html',
        loader: loadWebsitePage,
        default: true,
    },
    {
        id: 'page-configuration',
        menu: 'page-configuration',
        tour: 'tour_preferences',
        label: 'Preferences',
        path: './pages/configuration/index.html',
        loader: loadConfigurationPage,
    },
    {
        id: 'page-version',
        menu: 'page-version',
        tour: 'tour_versions',
        label: 'Versions',
        path: './pages/version/index.html',
        loader: loadVersionPage,
    },
    {
        id: 'page-toast',
        menu: 'page-toast',
        tour: 'tour_toasts',
        label: 'Notifications',
        path: './pages/toast/index.html',
        loader: loadToastPage,
    },
    {
        id: 'page-ambient',
        menu: 'page-ambient',
        tour: undefined,
        label: 'Ambient',
        path: './pages/ambient/index.html',
        loader: loadAmbientPage,
    },
    {
        id: 'page-technical',
        menu: 'page-technical',
        tour: 'tour_technical',
        label: 'Developers',
        path: './pages/technical/index.html',
        loader: loadTechnicalPage,
        technical: true,
    },
];
