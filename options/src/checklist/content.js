import { escapeHTML, stringToHTML } from '../../../src/html_generator.js';
import { Console, StorageLocal } from '../../../src/utils/browser.js';
import { t } from '../../../src/utils/i18n.js';
import { sleep } from '../../../src/utils/util.js';
import { Checklist } from './index.js';
import { tours } from './tour.js';

export default class ChecklistContent {
    constructor(id) {
        this.triggerCleanups = [];
        // The steps are on screen (a guided walk starts from there)
        this.loaded = false;
        // Bumped by destroy(): a load still waiting for storage must not register its triggers afterwards
        this.loadRun = 0;
        const tour = tours[id];
        if (!tour) {
            Console.warn(`No tour: ${id}`);
            return;
        }
        if (Object.keys(tour.steps).length <= 0) {
            Console.warn(`Empty tour: ${id}`);
            return;
        }
        this.tour = tour;

        this.ready = this.load();
    }

    destroy() {
        this.loadRun++;
        for (const cleanup of this.triggerCleanups) cleanup();
        this.triggerCleanups = [];
        this.loaded = false;
        if (this.container) {
            this.container.innerHTML = '';
            delete this.container.dataset.interactive;
        }
    }

    async load() {
        // Listeners of a previous load (restart)
        this.destroy();
        const run = this.loadRun;
        this.doneSteps = new Set();

        const stepIDs = Object.keys(this.tour.steps);
        const tourStore = stepIDs.length > 0 ? await StorageLocal.get(this.tour.store) : {};
        // Another page (or a restart) took over meanwhile
        if (run !== this.loadRun) return;
        const stepCount = stepIDs.length > 0 ? stepIDs.length : 1;

        this.progressInc = (1 / stepCount) * 100;
        this.progressStatePct = 0;

        this.container = Checklist.panel.stepsContainer(this.tour.id);
        this.container.dataset.interactive = 'true';
        this.updateSteps(this.tour.steps, tourStore);

        const tourState = tourStore[this.tour.id];
        const lastTourVersion = tourStore[`${this.tour.id}_version`];
        const tourVersion = this.tour.version;

        this.loaded = true;
        await Checklist.panel.refresh();
        if (run !== this.loadRun) return;
        Checklist.manager.toggle(!tourState || lastTourVersion < tourVersion);
    }

    isTourProgressComplete() {
        // Floating sum of 100/n steps may end slightly below 100 (7 steps: 99.99999999999997)
        return this.progressStatePct >= 100 - 1e-6;
    }

    async markAll() {
        for (const step of Object.values(this.tour.steps)) {
            const isComplete = await this.markDone(step);
            if (!isComplete) await sleep(100);
        }
    }

    updateSteps(steps, tourStore) {
        this.container.innerHTML = `
            <div class="joorney-cl-tools">
                <button type="button" class="joorney-cl-link" data-action="mark-all" title="${escapeHTML(t('checklist_markAllDone_tooltip'))}">${escapeHTML(t('checklist_markAllDone'))}</button>
                <button type="button" class="joorney-cl-link" data-action="restart">${escapeHTML(t('checklist_restart'))}</button>
            </div>
            <div class="joorney-cl-steplist"></div>
        `;
        this.container.querySelector('[data-action="mark-all"]').onclick = () => this.markAll();
        this.container.querySelector('[data-action="restart"]').onclick = () => this.restart();

        const stepArray = Object.values(steps);
        if (stepArray.length <= 0) return;
        for (const step of stepArray) {
            this.createStep(step, tourStore[step.id]);
            this.lockStep(step);
            if (tourStore[step.id]) this.markDone(step);
        }

        this.loadNextStep(stepArray[0]);
    }

    createStep(step, done) {
        const stepElement = stringToHTML(`
			<div class="checklist-item">
				<input type="checkbox" id="${step.id}" ${done ? 'checked' : ''} ${done ? 'disabled' : ''} />
				<label for="${step.id}">
					<p class="m-0">${escapeHTML(t(step.nameKey))}</p>
					${step.descriptionKey ? `<small class="text-muted">${escapeHTML(t(step.descriptionKey))}</small>` : ''}
				</label>
			</div>
		`);
        this.container.querySelector('.joorney-cl-steplist').appendChild(stepElement);
        if (!done) this.loadTrigger(step);
    }

    loadTrigger(step) {
        const triggers = step.trigger?.filter((t) => t.run) ?? [];
        const added = [];

        const removeTriggers = () => {
            for (const [run, handler] of added) document.removeEventListener(run, handler, true);
            added.length = 0;
        };

        const next = () => {
            removeTriggers();
            this.markDoneAndNext(step);
        };
        this.triggerCleanups.push(removeTriggers);

        // Delegated on the document: the pages re-render their nodes (and load after the tour does), a listener
        // on the element found now would be lost
        for (const trigger of triggers) {
            const handler = (e) => {
                if (!e.target.closest?.(trigger.selector)) return;
                if (trigger.conditional && !trigger.conditional(e)) return;
                // A later step of the tour waits for the previous ones
                if (document.getElementById(step.id)?.parentElement.classList.contains('locked')) return;
                next();
            };
            added.push([trigger.run, handler]);
            document.addEventListener(trigger.run, handler, true);
        }

        document.getElementById(step.id).onchange = (e) => {
            if (e.target.checked) next();
            else {
                if (!this.doneSteps.delete(step.id)) return;
                this.progressStatePct -= step.progression ?? this.progressInc;
            }
        };
    }

    async markDone(step) {
        // Already counted ("mark all done" on partially completed tour)
        if (this.doneSteps.has(step.id)) return this.isTourProgressComplete();
        this.doneSteps.add(step.id);

        await StorageLocal.set({ [step.id]: true });

        // Gone with the page while the storage was written
        const stepElement = document.getElementById(step.id);
        if (stepElement) {
            stepElement.setAttribute('disabled', true);
            stepElement.checked = true;
            stepElement.parentElement.classList.remove('locked');
        }

        this.progressStatePct += step.progression ?? this.progressInc;

        if (this.isTourProgressComplete()) {
            await this.completeTour();
            return true;
        }
        return false;
    }

    async markDoneAndNext(step) {
        const isComplete = await this.markDone(step);
        Checklist.panel?.refresh();
        if (isComplete) return;
        // The guided walk goes on by itself
        Checklist.guide?.stepDone(step);

        this.loadNextStep(this.tour.steps[step.next]);
    }

    async loadNextStep(step) {
        const tourStore = await StorageLocal.get(this.tour.store);
        let next = step;
        while (next && tourStore[next.id]) {
            next = this.tour.steps[next.next];
        }

        if (next) this.unlockStep(next);
    }

    unlockStep(step) {
        // A done step stays ticked and locked
        if (this.doneSteps.has(step.id)) return;
        const stepElement = document.getElementById(step.id);
        if (!stepElement) return;
        stepElement.removeAttribute('disabled');
        const parentElement = stepElement.parentElement;
        parentElement.classList.remove('locked');
    }

    lockStep(step) {
        const stepElement = document.getElementById(step.id);
        stepElement.setAttribute('disabled', true);
        const parentElement = stepElement.parentElement;
        parentElement.classList.add('locked');
    }

    async completeTour() {
        await StorageLocal.set({ [this.tour.id]: true, [`${this.tour.id}_version`]: this.tour.version });
        // Walked or done by hand: the panel shows the tour as done and takes the focus back from the walk
        if (Checklist.guide?.isActive()) Checklist.guide.close({ reopenPanel: true });
        else await Checklist.panel?.refresh();
    }

    async restart() {
        await StorageLocal.remove(Object.keys(this.tour.store));
        Checklist.guide?.forget(this.tour.id);
        await this.load();
    }
}

// Several selectors cover the variants of a page (empty state, advanced view): the first one on screen wins
export function findTarget(triggers) {
    for (const { selector } of triggers ?? []) {
        for (const element of document.querySelectorAll(selector)) {
            if (element.getClientRects().length > 0) return element;
        }
    }
    return undefined;
}
