import { escapeHTML } from '../../../src/html_generator.js';
import { categoryName, featureDescription, featureName, t, tagName } from '../../../src/utils/i18n.js';
import { iconHTML } from '../../../src/utils/icons.js';
import { FEATURE_STATE } from './state.js';

/**
 * Compact feature card (icon tile, name, one-line description, chips, optional switch/grip, info
 * button) and the shared labels of the feature states.
 */

export const FEATURE_PAGE_ID = 'page-feature';
const CARD_SELECTOR = '.joorney-fcard[data-feature-id]';

const STATE_LABELS = {
    [FEATURE_STATE.EVERYWHERE]: {
        labelKey: 'optionsUi_state_everywhere',
        shortKey: 'optionsUi_state_everywhereShort',
        helpKey: 'optionsUi_state_everywhereHelp',
    },
    [FEATURE_STATE.LISTED]: {
        labelKey: 'optionsUi_state_listed',
        shortKey: 'optionsUi_state_listedShort',
        helpKey: 'optionsUi_state_listedHelp',
    },
    [FEATURE_STATE.DEACTIVATED]: {
        labelKey: 'optionsUi_state_deactivated',
        shortKey: 'optionsUi_state_deactivated',
        helpKey: 'optionsUi_state_deactivatedHelp',
    },
};
const LIMITED_ACTIVE = { labelKey: 'optionsUi_state_limited', shortKey: 'optionsUi_state_active' };

//#region Labels
export function featurePageURL(id) {
    return `?page=${FEATURE_PAGE_ID}&feature=${encodeURIComponent(id)}`;
}

export function stateLabel(state, { short = false, limited = false } = {}) {
    const labels = limited && state !== FEATURE_STATE.DEACTIVATED ? LIMITED_ACTIVE : STATE_LABELS[state];
    if (!labels) return state;
    return t(short ? labels.shortKey : labels.labelKey);
}

export function stateHelp(state) {
    const key = STATE_LABELS[state]?.helpKey;
    return key ? t(key) : '';
}

export function stateBadgeHTML(state, { short = true, limited = false } = {}) {
    const cls = limited && state !== FEATURE_STATE.DEACTIVATED ? 'active' : state;
    const title = short ? ` title="${escapeHTML(stateLabel(state, { limited }))}"` : '';
    return `<span class="joorney-state-badge is-${escapeHTML(cls)}"${title}>${escapeHTML(stateLabel(state, { short, limited }))}</span>`;
}

function formatVersion(version) {
    return /^\d+$/.test(version) ? `${version}.0` : version;
}

export function formatSupportedVersions(feature) {
    const versions = feature.supported_version ?? [];
    if (versions.length === 0) return [t('optionsUi_versionAll')];
    return versions.map((raw) => {
        const version = `${raw}`.trim();
        if (version.endsWith('+')) return `${formatVersion(version.slice(0, -1))}+`;
        if (version.endsWith('-')) return t('optionsUi_versionBefore', formatVersion(version.slice(0, -1)));
        if (version.includes(':')) {
            const [from, to] = version.split(':');
            return t('optionsUi_versionRange', formatVersion(from), formatVersion(to));
        }
        return formatVersion(version);
    });
}

export function featureChipsHTML(feature, { category = true, details = true } = {}) {
    const chips = [];
    if (category && feature.category)
        chips.push(`<span class="joorney-chip">${escapeHTML(categoryName(feature.category))}</span>`);
    if (details) {
        for (const tag of feature.tags ?? [])
            chips.push(`<span class="joorney-chip is-tag">${escapeHTML(tagName(tag))}</span>`);
        for (const version of formatSupportedVersions(feature))
            chips.push(
                `<span class="joorney-chip is-version">${escapeHTML(t('optionsUi_versionChip', version))}</span>`
            );
    }
    return chips.join('');
}
//#endregion

//#region Card
export function hasFeatureSettings(feature) {
    return Boolean(feature.customization?.option) || feature.id === 'ambient';
}

export function switchHTML({ on, label, title = '', disabled = false, attributes = '' }) {
    return `<button type="button" role="switch" class="joorney-switch" aria-checked="${on ? 'true' : 'false'}" aria-label="${escapeHTML(label)}"${title ? ` title="${escapeHTML(title)}"` : ''}${disabled ? ' disabled' : ''}${attributes ? ` ${attributes}` : ''}></button>`;
}

/**
 * @param {object} feature feature configuration
 * @param {object} [opts]
 * @param {'everywhere'|'listed'|'deactivated'} [opts.state] shows the state badge
 * @param {boolean} [opts.switchOn] shows a switch (data-action="switch") when a boolean
 * @param {string} [opts.switchLabel] accessible name of the switch (default: "<name>: on here")
 * @param {string} [opts.switchTitle] tooltip of the switch (e.g. what the click changes)
 * @param {boolean} [opts.switchDisabled]
 * @param {boolean} [opts.grip] drag handle (data-grip), the card gets draggable="true"
 * @param {boolean} [opts.muted] dimmed (e.g. deactivated globally)
 * @param {boolean} [opts.expanded] tags and versions visible
 * @param {boolean} [opts.category] category chip (default true)
 * @param {boolean} [opts.info] info button (data-action="info", default true), a settings link when the feature has settings
 * @param {string|null} [opts.href] name link, default featurePageURL(id); null renders plain text
 * @param {string} [opts.classes] extra classes on the card
 * @returns {string} the card HTML, root: .joorney-fcard[data-feature-id]
 */
export function featureCardHTML(feature, opts = {}) {
    const {
        state,
        switchOn,
        switchLabel,
        switchTitle = '',
        switchDisabled = false,
        grip = false,
        muted = false,
        expanded = false,
        category = true,
        info = true,
        href = featurePageURL(feature.id),
        classes = '',
    } = opts;
    const id = escapeHTML(feature.id);
    const name = featureName(feature);
    const nameID = `joorney-fcard-name-${id}`;
    const description = featureDescription(feature);
    const cardClasses = ['joorney-fcard', muted ? 'is-muted' : '', expanded ? 'is-expanded' : '', classes]
        .filter(Boolean)
        .join(' ');

    const nameHTML = href
        ? `<a id="${nameID}" class="joorney-fcard-name" href="${escapeHTML(href)}">${escapeHTML(name)}</a>`
        : `<span id="${nameID}" class="joorney-fcard-name">${escapeHTML(name)}</span>`;

    const switchPart =
        typeof switchOn === 'boolean'
            ? switchHTML({
                  on: switchOn,
                  label: switchLabel ?? t('optionsUi_switchOnHere', name),
                  title: switchTitle,
                  disabled: switchDisabled,
                  attributes: 'data-action="switch"',
              })
            : '';
    let infoPart = '';
    if (info && hasFeatureSettings(feature)) {
        const label = escapeHTML(t('optionsUi_featureSettings', name));
        infoPart = `<a class="joorney-icon-btn is-small" href="${escapeHTML(featurePageURL(feature.id))}" aria-label="${label}" title="${label}">${iconHTML('settings')}</a>`;
    } else if (info) {
        infoPart = `<button type="button" class="joorney-icon-btn is-small" data-action="info" aria-label="${escapeHTML(t('optionsUi_aboutFeature', name))}" title="${escapeHTML(t('optionsUi_aboutFeature', name))}">${iconHTML('info')}</button>`;
    }

    return `
        <div class="${cardClasses}" data-feature-id="${id}" data-state="${escapeHTML(state ?? '')}" tabindex="0" role="group" aria-labelledby="${nameID}"${grip ? ' draggable="true"' : ''}>
            ${grip ? `<span class="joorney-fcard-grip" data-grip aria-hidden="true" title="${escapeHTML(t('optionsUi_dragHandle'))}"></span>` : ''}
            <span class="joorney-icon-box joorney-fcard-icon">${iconHTML(feature.icon, { filled: true })}</span>
            <div class="joorney-fcard-body">
                ${nameHTML}
                <p class="joorney-fcard-desc"${description ? ` title="${escapeHTML(description)}"` : ''}>${escapeHTML(description)}</p>
                <div class="joorney-fcard-chips">
                    ${state ? stateBadgeHTML(state, { limited: feature.limited }) : ''}
                    ${featureChipsHTML(feature, { category, details: false })}
                    <span class="joorney-fcard-more">${featureChipsHTML(feature, { category: false, details: true })}</span>
                </div>
            </div>
            <div class="joorney-fcard-side">${switchPart}${infoPart}</div>
        </div>
    `.trim();
}

export function getFeatureCard(container, id) {
    return container.querySelector(`.joorney-fcard[data-feature-id="${CSS.escape(id)}"]`);
}

export function toggleCardExpanded(card, force = undefined) {
    return card.classList.toggle('is-expanded', force);
}

export function updateCardState(card, state, feature = undefined) {
    card.dataset.state = state;
    const badge = card.querySelector('.joorney-state-badge');
    if (badge) badge.outerHTML = stateBadgeHTML(state, { limited: feature?.limited });
}

export function setCardSwitch(card, on) {
    card.querySelector('[data-action="switch"]')?.setAttribute('aria-checked', on ? 'true' : 'false');
}

const INTERACTIVE = 'a, button, input, select, textarea, label, [data-grip]';

export function bindFeatureCards(container, { onInfo, onSwitch } = {}) {
    const cardOf = (event) => {
        const card = event.target.closest(CARD_SELECTOR);
        return card && container.contains(card) ? card : null;
    };

    const onClick = async (event) => {
        const card = cardOf(event);
        if (!card) return;
        const action = event.target.closest('[data-action]')?.dataset.action;
        if (action === 'info') {
            event.preventDefault();
            onInfo?.(card.dataset.featureId, card, event);
            return;
        }
        if (action === 'switch') {
            event.preventDefault();
            const button = event.target.closest('[data-action="switch"]');
            const next = button.getAttribute('aria-checked') !== 'true';
            button.setAttribute('aria-checked', next ? 'true' : 'false');
            try {
                const result = await onSwitch?.(card.dataset.featureId, next, card, event);
                if (result === false) button.setAttribute('aria-checked', next ? 'false' : 'true');
            } catch (ex) {
                button.setAttribute('aria-checked', next ? 'false' : 'true');
                throw ex;
            }
            return;
        }
        if (event.target.closest(INTERACTIVE)) return;
        toggleCardExpanded(card);
    };

    const onDoubleClick = (event) => {
        const card = cardOf(event);
        if (!card || event.target.closest(INTERACTIVE)) return;
        toggleCardExpanded(card);
    };

    const onKeyDown = (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const card = cardOf(event);
        if (!card || event.target !== card) return;
        event.preventDefault();
        toggleCardExpanded(card);
    };

    container.addEventListener('click', onClick);
    container.addEventListener('dblclick', onDoubleClick);
    container.addEventListener('keydown', onKeyDown);
    return () => {
        container.removeEventListener('click', onClick);
        container.removeEventListener('dblclick', onDoubleClick);
        container.removeEventListener('keydown', onKeyDown);
    };
}
//#endregion
