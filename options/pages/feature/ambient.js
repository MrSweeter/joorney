import { getAmbientDates } from '../../../src/api/local.js';
import { ambients, estimateAmbientDuration } from '../../../src/features/ambient/ambient.js';
import AmbientLoader from '../../../src/features/ambient/ambient_loader.js';
import AmbientManager from '../../../src/features/ambient/ambient_manager.js';
import { escapeHTML, stringToHTML } from '../../../src/html_generator.js';
import { createTitleFromJSON, StorageSync } from '../../../src/utils/browser.js';
import Confetti from '../../../src/utils/confetti.js';
import { getLocaleTag, t } from '../../../src/utils/i18n.js';
import { iconHTML, setIcon } from '../../../src/utils/icons.js';
import { setCancellableTimeout } from '../../../src/utils/timeout.js';
import { toLocaleDateStringFormatted, toLocaleDateTimeStringFormatted } from '../../../src/utils/util.js';
import { enqueue } from '../../src/ui/state.js';

let ambientConfetti;
let ambientManager;
let ambientLoader;
let playTimeout;
const ambientsData = {};

export function ambientSettingsHTML() {
    return `
        <div class="joorney-amb-tools">
            <button type="button" class="joorney-btn is-secondary" id="joorney-ambient-all">${iconHTML('done_all')}${escapeHTML(t('optionsAmbient_all'))}</button>
            <button type="button" class="joorney-btn is-secondary" id="joorney-ambient-none">${iconHTML('remove_done')}${escapeHTML(t('optionsAmbient_none'))}</button>
        </div>
        <div id="joorney-ambient-list"></div>
        <!-- Ambients play full page on Odoo: the preview covers the viewport while one plays -->
        <div class="joorney-amb-stage" id="joorney-ambient-stage" role="dialog" aria-modal="true" aria-labelledby="joorney-playing-ambient-info" hidden>
            <div class="images-comparison">
                <!-- https://github.com/livebloggerofficial/Image-Comparison/tree/main -->
                <div class="themes-container">
                    <img class="left-image" src="../../../images/odoo_homepage_light.webp" alt="">
                    <img class="right-image" src="../../../images/odoo_homepage_dark.webp" alt="">
                    <div class="slider-line"></div>
                    <div class="slider-icon">
                        ${iconHTML('chevron_left', { filled: true, classes: 'joorney-icon-2x' })}
                        ${iconHTML('chevron_right', { filled: true, classes: 'joorney-icon-2x' })}
                    </div>
                    <input type="range" class="slider" min="0" max="100" aria-label="${escapeHTML(t('optionsFeature_ambientSlider'))}">
                </div>
                <span class="joorney-amb-tag is-light">${escapeHTML(t('optionsAmbient_light'))}</span>
                <span class="joorney-amb-tag is-dark">${escapeHTML(t('optionsAmbient_dark'))}</span>
                <canvas id="previewAmbient"></canvas>
            </div>
            <div class="joorney-amb-stagebar">
                <span id="joorney-playing-ambient-info" role="status"></span>
                <button type="button" class="joorney-btn is-secondary" id="joorney-ambient-stop">${iconHTML('close')}${escapeHTML(t('optionsAmbient_stop'))}</button>
            </div>
        </div>
    `;
}

export async function loadAmbientSettings() {
    setupSlider();

    const canva = document.getElementById('previewAmbient');
    ambientConfetti = new Confetti(canva);
    ambientManager = new AmbientManager(ambientConfetti);
    ambientLoader = new AmbientLoader(ambientConfetti);

    document.getElementById('joorney-ambient-all').onclick = () => setAll(true);
    document.getElementById('joorney-ambient-none').onclick = () => setAll(false);
    document.getElementById('joorney-ambient-stop').onclick = () => playTimeout?.trigger();

    await loadAmbientList();
}

export function unloadAmbientSettings() {
    playTimeout?.clear();
    playTimeout = undefined;
    closeStage(false, true);
    if (ambientLoader && !ambientLoader.stopped) ambientLoader.stop(0).catch(() => undefined);
}

// Material Symbol per ambient id, ambients without an entry (events fetched at runtime) use the category one
const AMBIENT_ICONS = {
    'odoo-experience-oxp-cpt': 'rocket_launch',
    'future-odoo-experience-cpt': 'schedule',
    'odoo-birthday-evt': 'cake',
    'new-year-evt': 'timer',
    'new-year-yly': 'celebration',
    'valentine-yly': 'favorite',
    'patrick-yly': 'eco',
    'aprilfool-yly': 'theater_comedy',
    'halloween-yly': 'skull',
    'new-year-eve-yly': 'auto_awesome',
};
const CATEGORY_ICONS = { compute: 'event', event: 'event', yearly: 'celebration' };

// Ambients/categories of src/features/ambient/ambient.js: translated name, except event names (no nameKey)
function ambientName(ambient) {
    return ambient.nameKey ? t(ambient.nameKey) : ambient.name;
}

async function loadAmbientList() {
    const container = document.getElementById('joorney-ambient-list');
    container.innerHTML = '';

    const ambient_dates = await getAmbientDates();
    const todayAmbient = await ambientManager.getAmbientForDate(new Date());
    const locale = getLocaleTag();
    const formatDate = (date) => toLocaleDateStringFormatted(date, locale);
    const formatDateTime = (date) => toLocaleDateTimeStringFormatted(date, locale);

    for (const [id, category] of Object.entries(ambients)) {
        const tiles = [];
        for (const v of category.ambients) {
            ambientsData[v.id] = v;

            let name = ambientName(v);
            let description = '';
            if (v.date) {
                description = formatDate(new Date(v.date));
            } else if (v.date_from && v.date_to) {
                const from = new Date(v.date_from);
                const to = new Date(v.date_to);
                description = `${formatDateTime(from)} - ${formatDateTime(to)}`;
            } else if (v.month && v.day) {
                const d = new Date();
                d.setMonth(v.month - 1);
                d.setDate(v.day);
                description = formatDate(d);
            } else if (ambient_dates[v.id]) {
                const from = new Date(ambient_dates[v.id].date_from);
                const to = new Date(ambient_dates[v.id].date_to);
                name = ambient_dates[v.id].name;
                description = `${formatDateTime(from)} - ${formatDateTime(to)}`;
            }

            tiles.push(`
                <div class="joorney-amb-tile" data-ambient-id="${escapeHTML(v.id)}" data-ambient-category="${id}" title='${createTitleFromJSON(v)}'>
                    <div class="joorney-amb-tilehead">
                        <span class="joorney-amb-icon is-${escapeHTML(id)}">${iconHTML(AMBIENT_ICONS[v.id] ?? CATEGORY_ICONS[id] ?? 'celebration', { filled: true, classes: 'joorney-icon-lg' })}</span>
                        <span class="joorney-amb-name">
                            <span class="joorney-amb-title">${escapeHTML(name)}</span>
                            ${description ? `<span class="joorney-amb-date">${escapeHTML(description)}</span>` : ''}
                            ${todayAmbient?.id === v.id ? `<span><span title="${escapeHTML(t('optionsAmbient_activeTitle'))}" class="joorney-chip is-version">${escapeHTML(t('optionsAmbient_active'))}</span></span>` : ''}
                        </span>
                        <button type="button" role="switch" class="joorney-switch" aria-checked="true" aria-label="${escapeHTML(t('optionsAmbient_enable'))}: ${escapeHTML(name)}"></button>
                    </div>
                    <div>
                        <button type="button" class="joorney-btn is-secondary joorney-play-ambient" aria-pressed="false" aria-label="${escapeHTML(t('optionsAmbient_play', name))}">${iconHTML('play_arrow', { filled: true })}${escapeHTML(t('optionsAmbient_preview'))}</button>
                    </div>
                </div>
            `);
        }

        container.appendChild(
            stringToHTML(`
            <section class="joorney-amb-category" data-ambient-category-id="${id}">
                <div class="joorney-amb-categoryhead">
                    <h3 class="joorney-amb-categorytitle">${escapeHTML(ambientName(category))}</h3>
                    <span class="joorney-amb-categoryactions">
                        <button type="button" class="joorney-link-btn ambient-category-all-toggle">${escapeHTML(t('optionsAmbient_all'))}</button>
                        <button type="button" class="joorney-link-btn ambient-category-none-toggle">${escapeHTML(t('optionsAmbient_none'))}</button>
                    </span>
                </div>
                <div class="joorney-amb-grid">${tiles.join('')}</div>
            </section>
            `)
        );
    }

    for (const el of container.getElementsByClassName('joorney-play-ambient')) {
        el.onclick = playAmbient;
    }
    for (const el of container.getElementsByClassName('ambient-category-all-toggle')) {
        el.onclick = (e) => onSwitchCategory(e, true);
    }
    for (const el of container.getElementsByClassName('ambient-category-none-toggle')) {
        el.onclick = (e) => onSwitchCategory(e, false);
    }

    const { ambientStatus } = await StorageSync.get({ ambientStatus: {} });
    updateAmbientState(ambientStatus);
}

function updateAmbientState(ambientStatus) {
    const container = document.getElementById('joorney-ambient-list');
    if (!container) return;
    for (const item of container.querySelectorAll('[data-ambient-id]')) {
        const toggle = item.querySelector('[role="switch"]');
        toggle.setAttribute('aria-checked', (ambientStatus[item.dataset.ambientId] ?? true) ? 'true' : 'false');
        toggle.onclick = onSwitch;
    }
}

async function onSwitchCategory(event, enable) {
    const dataElement = event.currentTarget.closest('[data-ambient-category-id]');
    const ambientsList = ambients[dataElement.dataset.ambientCategoryId].ambients ?? [];
    if (ambientsList.length === 0) return;

    await enqueue(async () => {
        const { ambientStatus } = await StorageSync.get({ ambientStatus: {} });
        for (const a of ambientsList) {
            ambientStatus[a.id] = enable;
        }
        await StorageSync.set({ ambientStatus });
        updateAmbientState(ambientStatus);
    });
}

async function setAll(enable) {
    await enqueue(async () => {
        const { ambientStatus } = await StorageSync.get({ ambientStatus: {} });
        for (const category of Object.values(ambients)) {
            for (const a of category.ambients) {
                ambientStatus[a.id] = enable;
            }
        }
        await StorageSync.set({ ambientStatus });
        updateAmbientState(ambientStatus);
    });
}

async function onSwitch(event) {
    const toggle = event.currentTarget;
    const next = toggle.getAttribute('aria-checked') !== 'true';
    toggle.setAttribute('aria-checked', next ? 'true' : 'false');
    const ambientID = toggle.closest('[data-ambient-id]').dataset.ambientId;
    // Two quick clicks would both read the same ambientStatus: the second write would drop the first
    await enqueue(async () => {
        const { ambientStatus } = await StorageSync.get({ ambientStatus: {} });
        ambientStatus[ambientID] = next;
        await StorageSync.set({ ambientStatus });
    });
}

//#region Fullscreen stage
let stageOpener;

function onStageKeyDown(event) {
    if (event.key === 'Escape') {
        event.preventDefault();
        playTimeout?.trigger();
        return;
    }
    if (event.key !== 'Tab') return;
    // Light focus trap: the slider and Stop are the only focusables of the stage
    const stage = document.getElementById('joorney-ambient-stage');
    const focusables = Array.from(stage.querySelectorAll('input, button'));
    const index = focusables.indexOf(document.activeElement);
    const next = event.shiftKey ? index - 1 : index + 1;
    event.preventDefault();
    focusables.at(next % focusables.length).focus();
}

let stageHideTimer;
const STAGE_FADE_FALLBACK = 250;

// Before the ambient loads: the canvas is sized from its bounding rect, it must be visible by then
function openStage(opener) {
    const stage = document.getElementById('joorney-ambient-stage');
    stageOpener = opener;
    const slider = stage.querySelector('.slider');
    slider.value = 50;
    slider.dispatchEvent(new Event('input'));
    clearTimeout(stageHideTimer);
    stage.hidden = false;
    // Two frames so the browser paints the hidden state first, otherwise there is nothing to transition from
    requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.add('is-open')));
    document.body.classList.add('joorney-modal-open');
    document.addEventListener('keydown', onStageKeyDown);
    document.getElementById('joorney-ambient-stop').focus();
}

// The body class is shared with the info modal: only undo what openStage did
function closeStage(restoreFocus = true, immediate = false) {
    if (!stageOpener) return;
    document.removeEventListener('keydown', onStageKeyDown);
    document.body.classList.remove('joorney-modal-open');
    const stage = document.getElementById('joorney-ambient-stage');
    clearTimeout(stageHideTimer);
    if (stage) {
        stage.classList.remove('is-open');
        const hide = () => {
            stage.removeEventListener('transitionend', onEnd);
            clearTimeout(stageHideTimer);
            stage.hidden = true;
        };
        const onEnd = (event) => {
            // A re-open during the fade leaves this listener behind: it must not hide the reopened stage
            if (event.target === stage && event.propertyName === 'opacity' && !stage.classList.contains('is-open'))
                hide();
        };
        if (immediate) {
            hide();
        } else {
            stage.addEventListener('transitionend', onEnd);
            // transitionend never fires with reduced motion or if the tab is in the background
            stageHideTimer = setTimeout(hide, STAGE_FADE_FALLBACK);
        }
    }
    if (restoreFocus && stageOpener.isConnected) stageOpener.focus();
    stageOpener = undefined;
}
//#endregion

// One preview at a time, in the fullscreen stage: it covers the tiles until Stop, Escape or the end of the ambient
function playAmbient(event) {
    const button = event.currentTarget;
    const dataElement = button.closest('[data-ambient-id]');
    if (dataElement.classList.contains('is-playing')) {
        playTimeout?.trigger();
        return;
    }
    const ambient = ambientsData[dataElement.dataset.ambientId];
    if (!ambient) return;

    // The loader stops the previous ambient itself on load(), only the UI and the end timer are ours
    playTimeout?.clear();
    resetPlayButtons();
    const estimatedDuration = estimateAmbientDuration(ambient);

    document.getElementById('joorney-playing-ambient-info').textContent = t(
        'optionsAmbient_playingInfo',
        ambientName(ambient),
        `${estimatedDuration}`
    );

    openStage(button);
    ambientLoader?.load(ambient);
    playTimeout = setCancellableTimeout(() => {
        stopAmbient();
    }, estimatedDuration + 1000);

    dataElement.classList.add('is-playing');
    button.setAttribute('aria-pressed', 'true');
    setIcon(button.querySelector('i'), 'stop');
}

function stopAmbient() {
    playTimeout = undefined;
    ambientLoader.stop();
    resetPlayButtons();
    closeStage();
}

function resetPlayButtons() {
    for (const tile of document.getElementsByClassName('joorney-amb-tile')) tile.classList.remove('is-playing');
    for (const btn of document.getElementsByClassName('joorney-play-ambient')) {
        btn.setAttribute('aria-pressed', 'false');
        setIcon(btn.querySelector('i'), 'play_arrow');
    }
}

function setupSlider() {
    const slider = document.querySelector('.images-comparison .slider');
    const leftImageElement = document.querySelector('.images-comparison .left-image');
    const sliderLineElement = document.querySelector('.images-comparison .slider-line');
    const sliderIconElement = document.querySelector('.images-comparison .slider-icon');

    slider.addEventListener('input', (e) => {
        const sliderValue = `${e.target.value}%`;

        leftImageElement.style.clipPath = `inset(0 ${100 - e.target.value}% 0 0)`;
        sliderLineElement.style.left = sliderValue;
        sliderIconElement.style.left = sliderValue;
    });
}
