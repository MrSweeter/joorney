import { escapeHTML, stringToHTML } from '../../../src/html_generator.js';
import { t } from '../../../src/utils/i18n.js';
import { iconHTML } from '../../../src/utils/icons.js';
import { sleep } from '../../../src/utils/util.js';
import { PAGES } from '../../menu.js';
import { getCurrentPage, navigate, parseRoute } from '../layout.js';
import { Checklist, getOnboardingProgressData, TOUR_ORDER } from './index.js';
import { tours } from './tour.js';

const TECHNICAL_TOUR = 'tour_technical';

/**
 * "Get started with Joorney": one row per tour (done, in progress, not started) with its Start/Resume button,
 * and the steps of a tour when its row is expanded. The rows are built once: the steps of the tour of the
 * current page are interactive (see content.js), the others are a read-only summary.
 */
export default class ChecklistPanel {
    constructor(element) {
        this.element = element;
        this.list = element.querySelector('#joorney_checklist_tours');
        this.build();
    }

    build() {
        this.list.innerHTML = '';
        for (const id of [...TOUR_ORDER, TECHNICAL_TOUR]) {
            const tour = tours[id];
            if (!tour) continue;
            const row = stringToHTML(`
                <div class="joorney-cl-tour" data-tour="${id}">
                    <div class="joorney-cl-tour-main">
                        <span class="joorney-cl-tour-icon" data-role="state">${iconHTML('play_arrow', { filled: true })}</span>
                        <button type="button" class="joorney-disclosure joorney-cl-tour-toggle" data-action="toggle" aria-expanded="false" aria-controls="joorney_cl_steps_${id}">
                            <span class="joorney-cl-tour-text">
                                <span class="joorney-cl-tour-title">${escapeHTML(t(tour.titleKey))}</span>
                                <span class="joorney-visually-hidden" data-role="sr"></span>
                                <span class="joorney-cl-tour-desc" data-role="desc"></span>
                            </span>
                            ${iconHTML('expand_more', { classes: 'joorney-cl-chevron' })}
                        </button>
                        <button type="button" class="joorney-cl-start" data-action="start"></button>
                    </div>
                    <div class="joorney-cl-steps" id="joorney_cl_steps_${id}" data-tour="${id}" hidden></div>
                </div>
            `);
            this.list.appendChild(row);
        }
        const actions = {
            toggle: (row) => this.toggleSteps(row),
            start: (row) => this.startTour(row.dataset.tour),
        };
        this.list.onclick = (e) => {
            const button = e.target.closest('[data-action]');
            const row = button?.closest('.joorney-cl-tour');
            if (!row || !this.list.contains(row)) return;
            actions[button.dataset.action]?.(row);
        };
    }

    stepsContainer(tourID) {
        return this.list.querySelector(`.joorney-cl-steps[data-tour="${tourID}"]`);
    }

    isListed(tourID) {
        if (tourID !== TECHNICAL_TOUR) return true;
        const menu = document.querySelector('.joorney-tech-menu');
        return Boolean(menu) && !menu.classList.contains('d-none');
    }

    isDone(tour, store) {
        // Stored done by default so it never opens by itself (steps/technical.js): done once its steps are
        if (tour.id === TECHNICAL_TOUR) return Object.keys(tour.steps).every((id) => store[id]);
        return Boolean(store[tour.id]) && !(store[`${tour.id}_version`] < tour.version);
    }

    async refresh() {
        const store = await getOnboardingProgressData();
        let done = 0;
        let total = 0;
        for (const row of this.list.querySelectorAll('.joorney-cl-tour')) {
            const tour = tours[row.dataset.tour];
            const listed = this.isListed(tour.id);
            row.hidden = !listed;
            if (!listed) continue;

            const stepIDs = Object.keys(tour.steps);
            const stepsDone = stepIDs.filter((id) => store[id]).length;
            const isDone = this.isDone(tour, store);
            // Begun: a step done, or the guided walk left in the middle ("Skip tour")
            const isCurrent = !isDone && (stepsDone > 0 || Checklist.guide?.hasProgress(tour.id));
            total++;
            if (isDone) done++;

            row.classList.toggle('is-done', isDone);
            row.classList.toggle('is-current', isCurrent);
            row.querySelector('[data-role="desc"]').textContent = [
                t(tour.descriptionKey),
                isCurrent && stepsDone > 0
                    ? t('checklist_tourStepsDone', stepsDone, stepIDs.length)
                    : t('checklist_tourSteps', stepIDs.length),
            ].join(' ');
            row.querySelector('[data-role="state"]').innerHTML = iconHTML(isDone ? 'check' : 'play_arrow', {
                filled: true,
            });
            row.querySelector('.joorney-cl-tour-toggle').setAttribute(
                'aria-label',
                t('checklist_toggleSteps', t(tour.titleKey))
            );

            const start = row.querySelector('[data-action="start"]');
            start.hidden = isDone;
            if (!isDone) {
                const resume = isCurrent;
                start.innerHTML = `${iconHTML('play_arrow', { filled: true })}${escapeHTML(resume ? t('checklist_resume') : t('checklist_start'))}`;
                start.setAttribute(
                    'aria-label',
                    resume ? t('checklist_resumeTour', t(tour.titleKey)) : t('checklist_startTour', t(tour.titleKey))
                );
            }
            // The check icon is decorative: say the state too
            row.querySelector('[data-role="sr"]').textContent = isDone ? t('checklist_tourDone') : '';

            // Read-only summary of the other tours, refreshed while it is open
            if (!row.querySelector('.joorney-cl-steps').hidden) this.renderSummary(row, store);
        }

        // Subtle hint on the navbar button while tours remain
        Checklist.manager?.button.classList.toggle('has-progress', done < total);

        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        document.getElementById('joorney_checklist_progress').style.width = `${pct}%`;
        const bar = this.element.querySelector('[role="progressbar"]');
        bar.setAttribute('aria-valuemax', total);
        bar.setAttribute('aria-valuenow', done);
        document.getElementById('joorney_checklist_progress_label').textContent = t('checklist_progress', done, total);
    }

    async toggleSteps(row) {
        const steps = row.querySelector('.joorney-cl-steps');
        const open = steps.hidden;
        steps.hidden = !open;
        row.classList.toggle('is-open', open);
        row.querySelector('.joorney-cl-tour-toggle').setAttribute('aria-expanded', String(open));
        if (open) this.renderSummary(row, await getOnboardingProgressData());
    }

    renderSummary(row, store) {
        const steps = row.querySelector('.joorney-cl-steps');
        // The tour of this page keeps its interactive steps
        if (steps.dataset.interactive === 'true') return;
        const tour = tours[row.dataset.tour];
        steps.innerHTML = Object.values(tour.steps)
            .map(
                (step) => `
                <div class="checklist-item">
                    <input type="checkbox" disabled ${store[step.id] ? 'checked' : ''} aria-label="${escapeHTML(t(step.nameKey))}" />
                    <label>
                        <p class="m-0">${escapeHTML(t(step.nameKey))}</p>
                        ${step.descriptionKey ? `<small>${escapeHTML(t(step.descriptionKey))}</small>` : ''}
                    </label>
                </div>`
            )
            .join('');
    }

    async startTour(tourID) {
        const tour = tours[tourID];
        const page = PAGES.find((p) => p.tour === tourID);
        if (!tour || !page) return;

        const params = page.tourParams ?? {};
        const route = parseRoute();
        const isHere =
            Checklist.content?.tour?.id === tourID &&
            getCurrentPage()?.id === page.id &&
            Object.entries(params).every(([key, value]) => route.params[key] === value);
        if (!isHere) {
            if (!(await navigate(page.id, params))) return;
            if (!(await this.waitForTour(tourID))) return;
        }
        Checklist.guide?.start(Checklist.content);
    }

    // The page and its tour load after navigate() resolves
    async waitForTour(tourID) {
        for (let i = 0; i < 50; i++) {
            const content = Checklist.content;
            if (content?.tour?.id === tourID && content.loaded) {
                // Let the page render its first blocks
                await sleep(200);
                return true;
            }
            await sleep(100);
        }
        return false;
    }
}
