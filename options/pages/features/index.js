import { bindFeatureCards, featureCardHTML } from '../../src/ui/feature_card.js';
import { openInfoModal } from '../../src/ui/info_modal.js';
import { FEATURE_STATE, getFeatureState, readStateSettings } from '../../src/ui/state.js';

// Placeholder until the Features board: the cards with their state and info modal
const CATEGORY_ORDER = ['ui', 'productivity', 'technical', 'runbot'];

export async function loadPage(features) {
    const container = document.getElementById('joorney-features-grid');
    const sorted = [...features].sort(
        (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
    );
    const byID = (id) => features.find((f) => f.id === id);
    const settings = await readStateSettings(features);

    const render = () => {
        container.innerHTML = sorted
            .map((feature) => {
                const state = getFeatureState(settings, feature);
                return featureCardHTML(feature, {
                    state,
                    muted: state === FEATURE_STATE.DEACTIVATED,
                    // The feature page does not exist yet
                    href: null,
                });
            })
            .join('');
    };

    const showInfo = (id) => openInfoModal(byID(id), settings, { openPage: false });

    render();
    bindFeatureCards(container, { onInfo: showInfo });
}

// Options menu entry, see options/menu.js
export const PAGE = {
    id: 'page-features',
    tour: undefined,
    labelKey: 'options_menu_features',
    path: './pages/features/index.html',
    loader: loadPage,
};
