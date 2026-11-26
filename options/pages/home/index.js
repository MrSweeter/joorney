import { escapeHTML } from '../../../src/html_generator.js';
import { regexSchemePrefix } from '../../../src/utils/authorize.js';
import { Runtime } from '../../../src/utils/browser.js';
import { categoryName, featureName, t } from '../../../src/utils/i18n.js';
import { iconHTML } from '../../../src/utils/icons.js';
import { MESSAGE_ACTION } from '../../../src/utils/messaging.js';
import { isAdvancedHostView, setAdvancedHostView } from '../../src/host_view.js';
import {
    anchorRegexOrigin,
    isRegexOrigin,
    isUnanchoredRegexOrigin,
    OriginError,
    regexAnchorHintHTML,
} from '../../src/origins.js';
import { dispatchActionDone, UI_EVENTS } from '../../src/ui/events.js';
import {
    bindFeatureCards,
    CATEGORY_ORDER,
    featureCardHTML,
    featurePageURL,
    hostStatus,
    stateLabel,
} from '../../src/ui/feature_card.js';
import { openInfoModal } from '../../src/ui/info_modal.js';
import { openModeMenu } from '../../src/ui/mode_menu.js';
import {
    addHost,
    FEATURE_STATE,
    getFeatureMode,
    getFeatureState,
    getListingHosts,
    isActiveOnHost,
    listHosts,
    readStateSettings,
    removeHost,
    renameHost,
    setFeatureActive,
    setHostFeature,
    setHostFeatures,
} from '../../src/ui/state.js';

/**
 * Home: the features per host. Simple view: one host at a time (cards). Advanced view
 * ('optionsAdvancedHostView'): the hosts x features matrix. Every write goes through options/src/ui/state.js
 * and the page re-renders on its STATE_CHANGE event.
 */

const ALL = 'all';
// Selection key of the pinned built-in row. Not an origin and not stored: never pass it to state.js host functions
const RUNBOT_HOST = '__joorney_runbot__';
const MODE_CLASS = {
    [FEATURE_STATE.EVERYWHERE]: 'is-ev',
    [FEATURE_STATE.LISTED]: 'is-li',
    [FEATURE_STATE.DEACTIVATED]: 'is-off',
};

export async function loadPage(features, currentSettings) {
    const root = document.getElementById('joorney-home');
    const normal = features.filter((f) => !f.limited);
    const limited = features.filter((f) => f.limited);
    const byID = (id) => features.find((f) => f.id === id);
    // A feature without a category must not add an empty pill
    const categories = [...new Set([...CATEGORY_ORDER, ...normal.map((f) => f.category)])].filter(
        (c) => c && normal.some((f) => f.category === c)
    );

    const view = {
        settings: await readStateSettings(features, currentSettings),
        advanced: await isAdvancedHostView(),
        selected: undefined,
        filter: ALL,
        pendingRemove: undefined,
        newHost: '',
        error: '',
    };
    const hasRunbot = limited.length > 0;
    const runbotOrigins = [...new Set(limited.flatMap((f) => f.limitedOrigins ?? []))];
    const firstSelection = () => listHosts(view.settings)[0] ?? (hasRunbot ? RUNBOT_HOST : undefined);
    view.selected = firstSelection();

    //#region Rendering
    const hostsOf = () => listHosts(view.settings);
    const on = (feature, host) => isActiveOnHost(view.settings, feature, host);
    // A listed host is an exception to the default of the mode, a regex entry matching it counts
    const excepted = (feature, host) => getListingHosts(view.settings, host, feature.id).length > 0;
    const countOn = (host) => normal.filter((f) => on(f, host)).length;
    const runbotActive = (feature) => Boolean(view.settings[`${feature.id}Enabled`]);
    const runbotCount = () => limited.filter(runbotActive).length;
    const isRunbotSelected = () => hasRunbot && view.selected === RUNBOT_HOST;

    function addFormHTML(prefix) {
        const id = `joorney-home-new-${prefix}`;
        return `
            <div class="joorney-home-add">
                <label class="joorney-label" for="${id}">${escapeHTML(t('optionsHome_addHost'))}</label>
                <div class="joorney-home-addrow">
                    <input id="${id}" class="joorney-input" type="text" autocomplete="off" data-focus="add-${prefix}" data-role="new-host"
                        placeholder="${escapeHTML(t('optionsHome_addPlaceholder'))}" value="${escapeHTML(view.newHost)}">
                    <button type="button" class="joorney-btn" data-action="add" data-focus="add-btn-${prefix}">${escapeHTML(t('optionsHome_add'))}</button>
                </div>
                ${regexAnchorHintHTML(view.newHost, escapeHTML(t('options_warning_regexAnchors')), escapeHTML(t('options_anchorRegex')))}
                ${view.error ? `<p class="joorney-error is-small joorney-home-error" role="alert">${escapeHTML(view.error)}</p>` : ''}
            </div>
        `;
    }

    function confirmHTML(host) {
        return `
            <div class="joorney-home-confirm" role="group" aria-label="${escapeHTML(t('optionsHome_removeConfirm', host))}">
                <span>${escapeHTML(t('optionsHome_removeConfirm', host))}</span>
                <button type="button" class="joorney-btn" data-action="remove-yes" data-host="${escapeHTML(host)}" data-focus="remove-yes">${escapeHTML(t('optionsHome_removeYes'))}</button>
                <button type="button" class="joorney-btn is-secondary" data-action="remove-cancel" data-host="${escapeHTML(host)}" data-focus="remove-cancel">${escapeHTML(t('optionsHome_removeCancel'))}</button>
            </div>
        `;
    }

    function regexChip(host) {
        if (!isRegexOrigin(host)) return '';
        const chip = `<span class="joorney-chip">${escapeHTML(t('optionsHome_regexChip'))}</span>`;
        if (!isUnanchoredRegexOrigin(host)) return chip;
        return `${chip}<span class="joorney-chip is-warning" title="${escapeHTML(t('options_unanchoredTitle'))}">${iconHTML('warning')}${escapeHTML(t('options_unanchoredChip'))}</span>`;
    }

    // Saved regex host without ^...$: one click rewrites it anchored, keeping its features
    function anchorHostButtonHTML(host) {
        if (!isUnanchoredRegexOrigin(host)) return '';
        const label = escapeHTML(t('options_anchorHost', host));
        return `<button type="button" class="joorney-icon-btn" data-action="anchor-host" data-host="${escapeHTML(host)}" aria-label="${label}" title="${label}">${iconHTML('build')}</button>`;
    }

    // The Runbot features' regex origins are the runbot builds: a name reads better than the pattern
    function originLabel(origin) {
        return isRegexOrigin(origin) ? t('optionsHome_runbotBuilds') : origin.replace(/^https?:\/\//, '');
    }

    function runbotOriginChipsHTML(feature) {
        const origins = feature.limitedOrigins ?? [];
        if (!origins.length) return `<span class="joorney-chip">${escapeHTML(t('optionsHome_runsNowhere'))}</span>`;
        return origins
            .map(
                (o) => `<code class="joorney-home-ochip" title="${escapeHTML(o)}">${escapeHTML(originLabel(o))}</code>`
            )
            .join('');
    }

    // What "Runbot builds" stands for, under the cards
    function runbotBuildsNoteHTML() {
        return runbotOrigins
            .filter(isRegexOrigin)
            .map(
                (o) =>
                    `<p class="joorney-home-rbnote">${escapeHTML(t('optionsHome_runbotBuildsNote'))} <code title="${escapeHTML(o)}">${escapeHTML(o.slice(regexSchemePrefix.length))}</code></p>`
            )
            .join('');
    }

    function runbotRowHTML() {
        const selected = isRunbotSelected();
        const origins = runbotOrigins.join(', ');
        const name = t('optionsHome_runbotName');
        return `
            <li class="joorney-home-host is-runbot${selected ? ' is-selected' : ''}">
                ${iconHTML('lock')}
                <button type="button" class="joorney-home-hostbtn" data-action="select-runbot" data-focus="host:runbot" aria-pressed="${selected}" title="${escapeHTML(origins)}">
                    <span class="joorney-home-hostline">
                        <span class="joorney-home-hostname is-plain">${escapeHTML(name)}</span><span class="joorney-chip">${escapeHTML(t('optionsHome_builtIn'))}</span>
                    </span>
                    <span class="joorney-home-hostorigins">${escapeHTML(origins)}</span>
                    <span class="joorney-home-hostcount">${escapeHTML(t('optionsHome_hostsOn', `${runbotCount()}`))}</span>
                </button>
            </li>
            <li class="joorney-home-sep" role="separator"></li>
        `;
    }

    function hostListHTML() {
        const rows = hostsOf()
            .map((host) => {
                const selected = host === view.selected;
                const h = escapeHTML(host);
                if (view.pendingRemove === host) {
                    return `<li class="joorney-home-host${selected ? ' is-selected' : ''}">${confirmHTML(host)}</li>`;
                }
                return `
                    <li class="joorney-home-host${selected ? ' is-selected' : ''}">
                        <button type="button" class="joorney-home-hostbtn" data-action="select-host" data-host="${h}" data-focus="host:${h}" aria-pressed="${selected}" title="${h}">
                            <span class="joorney-home-hostline">
                                <span class="joorney-home-hostname">${h}</span>${regexChip(host)}
                            </span>
                            <span class="joorney-home-hostcount">${escapeHTML(t('optionsHome_hostsActive', `${countOn(host)}`))}</span>
                        </button>
                        ${anchorHostButtonHTML(host)}<button type="button" class="joorney-icon-btn" data-action="remove-ask" data-host="${h}" data-focus="remove:${h}" aria-label="${escapeHTML(t('optionsHome_removeHost', host))}" title="${escapeHTML(t('optionsHome_removeHost', host))}">${iconHTML('close')}</button>
                    </li>
                `;
            })
            .join('');
        return `<ul class="joorney-home-hostlist">${hasRunbot ? runbotRowHTML() : ''}${rows}</ul>`;
    }

    function runbotStatus(feature) {
        return runbotActive(feature) ? t('optionsHome_status_runbotOn') : t('optionsHome_status_deactivated');
    }

    function hostCardHTML(feature, host) {
        const state = getFeatureState(view.settings, feature);
        const deactivated = state === FEATURE_STATE.DEACTIVATED;
        const active = on(feature, host);
        // The switch alone carries the explanation: tooltip for the pointer, accessible name for screen readers
        const status = hostStatus(view.settings, feature, host);
        // No state badge: the muted look and the Activate button say it
        const card = featureCardHTML(feature, {
            switchOn: deactivated ? undefined : active,
            switchLabel: `${featureName(feature)}: ${status}`,
            switchTitle: status,
            switchDisabled: !host,
            // Deactivated: no host to switch it on for, Activate takes the switch's place
            action: deactivated
                ? `<button type="button" class="joorney-link-btn is-strong" data-action="activate" data-feature="${escapeHTML(feature.id)}" data-focus="activate:${escapeHTML(feature.id)}" aria-haspopup="menu" aria-expanded="false">${escapeHTML(t('optionsHome_activate'))}</button>`
                : '',
            muted: deactivated,
            category: false,
        });
        return `<div class="joorney-home-item">${card}</div>`;
    }

    // Shared by the simple and the advanced view; the switches are handled by bindFeatureCards
    function runbotCardsHTML() {
        const cards = limited
            .map((feature) => {
                const enabled = runbotActive(feature);
                // No state badge: the switch and the muted look already say whether it is on
                const card = featureCardHTML(feature, {
                    switchOn: enabled,
                    switchLabel: `${featureName(feature)}: ${runbotStatus(feature)}`,
                    switchTitle: runbotStatus(feature),
                    muted: !enabled,
                    category: false,
                    chips: runbotOriginChipsHTML(feature),
                });
                return `<div class="joorney-home-item is-runbot">${card}</div>`;
            })
            .join('');
        return `<div class="joorney-fcard-grid">${cards}</div>${runbotBuildsNoteHTML()}`;
    }

    function runbotMainHTML() {
        return `
            <div class="joorney-home-head">
                <div style="min-width: 0">
                    <h2 class="joorney-home-title is-plain">${escapeHTML(t('optionsHome_runbotName'))}</h2>
                </div>
                <div class="joorney-home-headbtns">
                    <button type="button" class="joorney-btn" data-action="all-on" data-focus="all-on">${iconHTML('toggle_on')}${escapeHTML(t('optionsHome_allOn'))}</button>
                    <button type="button" class="joorney-btn is-secondary" data-action="all-off" data-focus="all-off">${iconHTML('toggle_off')}${escapeHTML(t('optionsHome_allOff'))}</button>
                </div>
            </div>
            ${runbotCardsHTML()}
        `;
    }

    function pillsHTML() {
        const pill = (value, label) =>
            `<button type="button" class="joorney-pill" data-action="category" data-category="${escapeHTML(value)}" data-focus="pill:${escapeHTML(value)}" aria-pressed="${view.filter === value}">${escapeHTML(label)}</button>`;
        return `
            <div class="joorney-pills" role="group" aria-label="${escapeHTML(t('optionsHome_categories'))}">
                ${pill(ALL, t('optionsHome_categoryAll'))}${categories.map((c) => pill(c, categoryName(c))).join('')}
            </div>
        `;
    }

    function visibleNormal() {
        return normal.filter((f) => view.filter === ALL || f.category === view.filter);
    }

    function selectedMainHTML() {
        const host = view.selected;
        const sections = categories
            .filter((c) => view.filter === ALL || view.filter === c)
            .map((category) => {
                const list = normal.filter((f) => f.category === category);
                const onCount = list.filter((f) => host && on(f, host)).length;
                return `
                    <section aria-label="${escapeHTML(categoryName(category))}">
                        <div class="joorney-home-sechead">
                            <h2>${escapeHTML(categoryName(category))}</h2>
                            <span class="joorney-home-seccount">${escapeHTML(t('optionsHome_sectionCount', `${onCount}`, `${list.length}`))}</span>
                        </div>
                        <div class="joorney-fcard-grid">${list.map((f) => hostCardHTML(f, host)).join('')}</div>
                    </section>
                `;
            })
            .join('');
        return `
            <div class="joorney-home-head">
                <div style="min-width: 0">
                    <h2 class="joorney-home-title">${escapeHTML(host ?? t('optionsHome_noHostSelected'))}</h2>
                    <p class="joorney-home-sub">${escapeHTML(t('optionsHome_hostSubtitle'))}</p>
                </div>
                <div class="joorney-home-headbtns">
                    <button type="button" class="joorney-btn" data-action="all-on" data-focus="all-on">${iconHTML('toggle_on')}${escapeHTML(t('optionsHome_allOn'))}</button>
                    <button type="button" class="joorney-btn is-secondary" data-action="all-off" data-focus="all-off">${iconHTML('toggle_off')}${escapeHTML(t('optionsHome_allOff'))}</button>
                </div>
            </div>
            ${pillsHTML()}
            ${sections || `<div class="joorney-empty">${escapeHTML(t('optionsHome_noFeatures'))}</div>`}
        `;
    }

    function emptyPanelHTML() {
        return `
            <div class="joorney-panel joorney-home-empty">
                <h2 class="joorney-panel-title">${escapeHTML(t('optionsHome_emptyTitle'))}</h2>
                <p class="joorney-help">${escapeHTML(t('optionsHome_emptyText'))}</p>
                ${addFormHTML('empty')}
            </div>
        `;
    }

    function simpleHTML() {
        const noHost = !hostsOf().length;
        if (noHost && !hasRunbot) return emptyPanelHTML();
        let main;
        if (isRunbotSelected()) main = (noHost ? emptyPanelHTML() : '') + runbotMainHTML();
        else main = selectedMainHTML();
        return `
            <div class="joorney-home-layout">
                <aside class="joorney-panel joorney-home-side" aria-label="${escapeHTML(t('optionsHome_hosts'))}">
                    <h2 class="joorney-home-panelhead">${escapeHTML(t('optionsHome_hosts'))}</h2>
                    ${hostListHTML()}
                    ${noHost ? '' : addFormHTML('side')}
                </aside>
                <div class="joorney-home-main">
                    ${main}
                </div>
            </div>
        `;
    }

    // A section like the hosts one below it, with the switches at hand: the grid only has real hosts
    function runbotBlockHTML() {
        if (!hasRunbot) return '';
        return `
            <section class="joorney-home-rbsection" data-role="runbot-block" aria-labelledby="joorney-home-rbtitle">
                <div class="joorney-home-rbhead">
                    <h2 id="joorney-home-rbtitle" class="joorney-page-title">${escapeHTML(t('optionsHome_runbotName'))}</h2>
                    <span class="joorney-chip">${escapeHTML(t('optionsHome_builtIn'))}</span>
                </div>
                ${runbotCardsHTML()}
            </section>
        `;
    }

    function matrixHTML() {
        const hosts = hostsOf();
        const groups = categories.map((c) => ({ category: c, list: normal.filter((f) => f.category === c) }));
        const firstOfGroup = new Set(groups.map((g) => g.list[0].id));
        const modeClass = (feature) => MODE_CLASS[getFeatureState(view.settings, feature)];
        const cls = (feature, extra = '') =>
            [modeClass(feature), firstOfGroup.has(feature.id) ? 'is-gs' : '', extra].filter(Boolean).join(' ');
        const groupCells = groups
            .map(
                (g) =>
                    `<th scope="colgroup" class="is-group" colspan="${g.list.length}">${escapeHTML(categoryName(g.category))}</th>`
            )
            .join('');

        const colHeads = normal
            .map((feature) => {
                const state = getFeatureState(view.settings, feature);
                const name = featureName(feature);
                const id = escapeHTML(feature.id);
                return `
                    <th scope="col" class="is-col ${cls(feature)}" data-col="${id}">
                        <div class="joorney-mx-colin">
                            ${iconHTML(feature.icon, { filled: true })}
                            <a class="joorney-mx-fname" href="${escapeHTML(featurePageURL(feature.id))}" title="${escapeHTML(name)}">${escapeHTML(name)}</a>
                            <button type="button" class="joorney-mx-mode ${modeClass(feature)}" data-action="mode-menu" data-feature="${id}" data-focus="mode-menu:${id}"
                                aria-haspopup="menu" aria-expanded="false"
                                aria-label="${escapeHTML(t('optionsHome_modeButton', name, stateLabel(state)))}">${escapeHTML(stateLabel(state, { short: true }))}${iconHTML('expand_more')}</button>
                        </div>
                    </th>
                `;
            })
            .join('');

        const rows = hosts
            .map((host) => {
                const h = escapeHTML(host);
                const head =
                    view.pendingRemove === host
                        ? confirmHTML(host)
                        : `
                            <div class="joorney-mx-hostcell">
                                <div class="joorney-home-hostline">
                                    <span class="joorney-home-hostname" title="${h}">${h}</span>${regexChip(host)}
                                </div>
                                ${anchorHostButtonHTML(host)}<button type="button" class="joorney-icon-btn" data-action="remove-ask" data-host="${h}" data-focus="remove:${h}" aria-label="${escapeHTML(t('optionsHome_removeHost', host))}" title="${escapeHTML(t('optionsHome_removeHost', host))}">${iconHTML('delete')}</button>
                            </div>
                        `;
                const cells = normal
                    .map((feature) => {
                        const deactivated = getFeatureState(view.settings, feature) === FEATURE_STATE.DEACTIVATED;
                        const active = on(feature, host);
                        // A deactivated feature has no default to differ from
                        const exception = !deactivated && excepted(feature, host);
                        const label = t('optionsHome_cellLabel', featureName(feature), host);
                        const everywhere = getFeatureMode(view.settings, feature) !== FEATURE_STATE.LISTED;
                        let hint = everywhere ? t('optionsHome_followsEverywhere') : t('optionsHome_followsListed');
                        if (exception) hint = everywhere ? t('optionsHome_exceptionOff') : t('optionsHome_exceptionOn');
                        const id = escapeHTML(feature.id);
                        return `
                            <td class="joorney-mx-cell ${cls(feature)}" data-col="${id}">
                                <button type="button" class="joorney-mx-dotbtn${exception ? ' is-ex' : ''}" data-action="mx-cell" data-host="${h}" data-feature="${id}" data-focus="cell:${h}|${id}"
                                    aria-pressed="${active}" aria-label="${escapeHTML(label)}" title="${escapeHTML(hint)}"${exception ? ` aria-description="${escapeHTML(hint)}"` : ''}${deactivated ? ' disabled' : ''}></button>
                            </td>
                        `;
                    })
                    .join('');
                return `<tr><th scope="row" class="is-first">${head}</th>${cells}</tr>`;
            })
            .join('');

        return `
            ${runbotBlockHTML()}
            ${pageHeaderHTML()}
            <div class="joorney-mx-legend" aria-hidden="true">
                <span><i class="joorney-mx-sample is-dot"></i>${escapeHTML(t('optionsHome_legendOn'))}</span>
                <span><i class="joorney-mx-sample is-dotoff"></i>${escapeHTML(t('optionsHome_legendOff'))}</span>
                <span><i class="joorney-mx-sample is-dotex"></i>${escapeHTML(t('optionsHome_legendException'))}</span>
                <i class="joorney-mx-legendsep"></i>
                <span><i class="joorney-mx-sample is-ev"></i>${escapeHTML(stateLabel(FEATURE_STATE.EVERYWHERE))}</span>
                <span><i class="joorney-mx-sample is-li"></i>${escapeHTML(stateLabel(FEATURE_STATE.LISTED))}</span>
                <span><i class="joorney-mx-sample is-off"></i>${escapeHTML(stateLabel(FEATURE_STATE.DEACTIVATED))}</span>
            </div>
            <div class="joorney-panel joorney-mx-card">
                <div class="joorney-mx-box" tabindex="-1">
                    <table class="joorney-mx" aria-label="${escapeHTML(t('optionsHome_matrixLabel'))}">
                        <thead>
                            <tr><th scope="col" class="is-first is-group">${escapeHTML(t('optionsHome_hostsHeader'))}</th>${groupCells}</tr>
                            <tr>
                                <th scope="col" class="is-first">
                                    <span>${escapeHTML(t('optionsHome_hostCount', `${hosts.length}`, `${normal.length}`))}</span>
                                </th>
                                ${colHeads}
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                            <tr>
                                <th scope="row" class="is-first"><div class="joorney-mx-add">${addFormHTML('matrix')}</div></th>
                                <td class="joorney-mx-addcell" colspan="${normal.length}">${escapeHTML(t('optionsHome_addHint'))}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function findCardControl(token) {
        const [, id, action] = token.split(':');
        const card = Array.from(root.querySelectorAll('.joorney-fcard')).find((c) => c.dataset.featureId === id);
        return action ? card?.querySelector(`[data-action="${action}"]`) : card;
    }

    function pageHeaderHTML() {
        return `
            <div class="joorney-home-header">
                <div>
                    <h1 class="joorney-page-title">${escapeHTML(t('optionsHome_title'))}</h1>
                    <p class="joorney-page-subtitle">${escapeHTML(view.advanced ? t('optionsHome_subtitleAdvanced') : t('optionsHome_subtitleSimple'))}</p>
                </div>
                <button type="button" class="joorney-link-btn" data-action="toggle-view" data-focus="toggle-view">${escapeHTML(view.advanced ? t('optionsHome_viewSimple') : t('optionsHome_viewAdvanced'))}</button>
            </div>
        `;
    }

    function render() {
        // Re-rendering replaces the nodes: keep the focus, the typed host and the matrix scroll position
        const active = document.activeElement;
        // Card controls carry no data-focus: they are found again by card and action
        const card = active.closest?.('.joorney-fcard');
        const focus = root.contains(active)
            ? (active.dataset.focus ??
              (card ? `card:${card.dataset.featureId}:${active.dataset.action ?? ''}` : undefined))
            : undefined;
        const caret = focus && active.selectionStart !== undefined ? active.selectionStart : undefined;
        const box = root.querySelector('.joorney-mx-box');
        const scroll = box ? { left: box.scrollLeft, top: box.scrollTop } : undefined;

        root.classList.toggle('is-advanced', view.advanced);
        // The advanced view puts it under the Runbot block (matrixHTML): the title is about the hosts, Runbot is not one
        root.innerHTML = view.advanced ? matrixHTML() : `${pageHeaderHTML()}${simpleHTML()}`;

        const newBox = root.querySelector('.joorney-mx-box');
        if (scroll && newBox) {
            newBox.scrollLeft = scroll.left;
            newBox.scrollTop = scroll.top;
        }
        if (focus) {
            const target = focus.startsWith('card:')
                ? findCardControl(focus)
                : (Array.from(root.querySelectorAll('[data-focus]')).find((e) => e.dataset.focus === focus) ??
                  // Activated: the button is gone, its card's switch takes the focus
                  (focus.startsWith('activate:') ? findCardControl(`card:${focus.slice(9)}:switch`) : undefined));
            target?.focus({ preventScroll: true });
            if (caret !== undefined && target?.setSelectionRange) target.setSelectionRange(caret, caret);
        }
    }

    async function refresh() {
        view.settings = await readStateSettings(features, currentSettings);
        const hosts = hostsOf();
        if (!hosts.includes(view.selected) && !isRunbotSelected()) view.selected = firstSelection();
        if (view.pendingRemove && !hosts.includes(view.pendingRemove)) view.pendingRemove = undefined;
        if (root.isConnected) render();
    }
    //#endregion

    //#region Actions
    async function submitHost(input) {
        view.newHost = input.value;
        try {
            const key = await addHost(view.newHost);
            view.selected = key;
            view.newHost = '';
            view.error = '';
            // Before the refresh replaces the field: the Home tour step waits on it
            dispatchActionDone(input, 'add-host');
        } catch (ex) {
            if (!(ex instanceof OriginError)) throw ex;
            view.error = t(ex.messageKey);
        }
        await refresh();
    }

    const hostInput = (button) => button.closest('.joorney-home-add').querySelector('input');
    const activeFeatures = (list) => list.filter((f) => view.settings[`${f.id}Enabled`]);
    // The Runbot row acts on the global state of the limited features, the hosts on their lists
    const setHostOrRunbot = (host, value, list) => {
        if (host === RUNBOT_HOST) return setFeatureActive(limited, value);
        return host ? setHostFeatures(host, activeFeatures(list), value) : undefined;
    };

    const ACTIONS = {
        'toggle-view': async () => {
            view.advanced = !view.advanced;
            view.pendingRemove = undefined;
            await setAdvancedHostView(view.advanced);
            render();
        },
        'select-runbot': () => {
            view.selected = RUNBOT_HOST;
            render();
        },
        'select-host': (el) => {
            view.selected = el.dataset.host;
            render();
        },
        'remove-ask': (el) => {
            view.pendingRemove = el.dataset.host;
            render();
            root.querySelector('[data-focus="remove-cancel"]')?.focus();
        },
        'remove-cancel': (el) => {
            view.pendingRemove = undefined;
            render();
            root.querySelector(`[data-focus="remove:${CSS.escape(el.dataset.host)}"]`)?.focus();
        },
        'remove-yes': async (el) => {
            view.pendingRemove = undefined;
            await removeHost(el.dataset.host);
            await refresh();
        },
        add: (el) => submitHost(hostInput(el)),
        'anchor-regex': (el) => {
            const input = hostInput(el);
            input.value = anchorRegexOrigin(input.value);
            view.newHost = input.value;
            el.closest('[data-role="regex-hint"]').hidden = true;
            input.focus();
        },
        'anchor-host': async (el) => {
            try {
                const key = await renameHost(el.dataset.host, anchorRegexOrigin(el.dataset.host));
                if (key && view.selected === el.dataset.host) view.selected = key;
                view.error = '';
            } catch (ex) {
                if (!(ex instanceof OriginError)) throw ex;
                view.error = t(ex.messageKey);
            }
            await refresh();
        },
        category: (el) => {
            view.filter = el.dataset.category;
            render();
        },
        'all-on': () => setHostOrRunbot(view.selected, true, visibleNormal()),
        'all-off': () => setHostOrRunbot(view.selected, false, visibleNormal()),
        // The chosen default decides whether it runs on the selected host
        activate: (el) => openModeMenu({ trigger: el, feature: byID(el.dataset.feature), settings: view.settings }),
        'mx-cell': (el) => {
            const feature = byID(el.dataset.feature);
            return setHostFeature(el.dataset.host, feature, !on(feature, el.dataset.host));
        },
        'mode-menu': (el) => openModeMenu({ trigger: el, feature: byID(el.dataset.feature), settings: view.settings }),
    };

    const onClick = (event) => {
        const el = event.target.closest('[data-action]');
        // Card actions (switch, info) belong to bindFeatureCards, Activate stands in for the switch
        if (!el || (el.closest('.joorney-fcard') && el.dataset.action !== 'activate') || !ACTIONS[el.dataset.action]) {
            return;
        }
        ACTIONS[el.dataset.action](el);
    };
    const onKeyDown = (event) => {
        if (event.key === 'Enter' && event.target.dataset?.role === 'new-host') {
            event.preventDefault();
            submitHost(event.target);
        }
    };
    const onInput = (event) => {
        if (event.target.dataset?.role !== 'new-host') return;
        view.newHost = event.target.value;
        const hint = event.target.closest('.joorney-home-add')?.querySelector('[data-role="regex-hint"]');
        if (hint) hint.hidden = !isUnanchoredRegexOrigin(view.newHost);
        if (view.error) {
            view.error = '';
            for (const message of root.querySelectorAll('.joorney-home-error')) message.remove();
        }
    };

    // Column highlight: the row one is plain CSS (:hover), a column spans many rows
    let hoverCol;
    const onOver = (event) => {
        const col = event.target.closest('[data-col]')?.dataset.col;
        if (col === hoverCol) return;
        hoverCol = col;
        for (const e of root.querySelectorAll('.is-hc')) e.classList.remove('is-hc');
        if (col) for (const e of root.querySelectorAll(`[data-col="${CSS.escape(col)}"]`)) e.classList.add('is-hc');
    };
    const onLeave = () => onOver({ target: root });

    const showInfo = (id) => openInfoModal(byID(id), view.settings);
    //#endregion

    // Another page was loaded meanwhile (readStateSettings, isAdvancedHostView)
    if (!root.isConnected) return;
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKeyDown);
    root.addEventListener('input', onInput);
    root.addEventListener('mouseover', onOver);
    root.addEventListener('mouseleave', onLeave);
    bindFeatureCards(root, {
        onInfo: showInfo,
        onSwitch: (id, value) => {
            const feature = byID(id);
            return feature.limited ? setFeatureActive(feature, value) : setHostFeature(view.selected, feature, value);
        },
    });

    // Coalesce the events of a bulk write into one render
    let refreshTimer;
    const onStateChange = () => {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(refresh, 0);
    };
    // The popup toggles a feature from a tab: it tells the options page with this message
    const onPopupMessage = (message) => {
        if (message?.action === MESSAGE_ACTION.TO_CONTENT.POPUP_HAS_CHANGE) onStateChange();
    };
    const onPageChange = () => {
        clearTimeout(refreshTimer);
        document.removeEventListener(UI_EVENTS.STATE_CHANGE, onStateChange);
        document.removeEventListener(UI_EVENTS.PAGE_CHANGE, onPageChange);
        Runtime.onMessage.removeListener(onPopupMessage);
    };
    document.addEventListener(UI_EVENTS.STATE_CHANGE, onStateChange);
    document.addEventListener(UI_EVENTS.PAGE_CHANGE, onPageChange);
    Runtime.onMessage.addListener(onPopupMessage);

    render();
}

// Options menu entry, see options/menu.js
export const PAGE = {
    id: 'page-home',
    tour: 'tour_hostControls',
    labelKey: 'options_menu_home',
    path: './pages/home/index.html',
    loader: loadPage,
    default: true,
};
