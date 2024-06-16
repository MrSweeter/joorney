import { StorageLocal } from '../../src/utils/browser.js';
import { stringToHTML } from '../html_generator.js';
import { Checklist } from './index.js';
import { tours } from './tour.js';

export default class ChecklistContent {
    constructor(id) {
        const tour = tours[id];
        if (!tour) {
            console.warn(`No tour: ${id}`);
            Checklist.manager.hide();
            return;
        }
        if (Object.keys(tour.steps).length <= 0) {
            console.warn(`Empty tour: ${id}`);
            Checklist.manager.hide();
            return;
        }
        Checklist.manager.toggle(true);
        this.tour = tour;

        this.load();
    }

    async load() {
        this.congrats(false);
        document.getElementById('joorney_checklist_tour_title').innerText = this.tour.title;
        document.getElementById('joorney_checklist_tour_description').innerText = this.tour.description;

        const stepIDs = Object.keys(this.tour.steps);
        const stepStates = stepIDs.length > 0 ? await StorageLocal.get(this.tour.store) : {};
        const stepCount = stepIDs.length > 0 ? stepIDs.length : 1;

        this.progressInc = (1 / stepCount) * 100;
        this.progressStatePct = 0;
        this.updateProgress();

        this.updateSteps(this.tour.steps, stepStates);
        const tourState = stepStates[this.tour.id];
        Checklist.manager.toggle(!tourState);
    }

    updateProgress() {
        document.getElementById('joorney_checklist_tour_progress').style.width = `${this.progressStatePct}%`;
    }

    updateSteps(steps, stepStates) {
        document.getElementById('joorney_checklist_steps_list').innerHTML = '';
        const stepArray = Object.values(steps);
        if (stepArray.length <= 0) return;
        for (const step of stepArray) {
            this.createStep(step, stepStates[step.id]);
            this.lockStep(step);
            if (stepStates[step.id]) this.markDone(step);
        }

        this.loadNextStep(stepArray[0]);
    }

    createStep(step, done) {
        const stepElement = stringToHTML(`
			<div class="checklist-item">
				<input type="checkbox" id="${step.id}" ${done ? 'checked' : ''} ${done ? 'disabled' : ''} />
				<label for="${step.id}">
					<p class="m-0">${step.name} <i class="joorney_checklist_target_btn fa-solid fa-arrows-to-eye fa-xs d-none"></i></p>
					<small class="text-muted">${step.description}</small>
				</label>
			</div>
		`);
        if (step.trigger && step.trigger.length > 0 && Checklist.bubble) {
            const inspectButton = stepElement.querySelector('.joorney_checklist_target_btn');
            inspectButton.onclick = (e) => {
                e.preventDefault();
                this.inspect(step.trigger[0], e.target);
            };
            inspectButton.classList.remove('d-none');
        }
        document.getElementById('joorney_checklist_steps_list').appendChild(stepElement);
        if (!done) this.loadTrigger(step);
    }

    loadTrigger(step) {
        const triggers = step.trigger?.filter((t) => t.run) ?? [];
        const added = {};

        function removeTriggers() {
            for (const [triggerStr, fct] of Object.entries(added)) {
                const trigger = JSON.parse(triggerStr);
                const triggerElement = document.querySelector(trigger.selector);
                if (!triggerElement) continue;
                triggerElement.removeEventListener(trigger.run, fct);
            }
        }

        const next = () => {
            removeTriggers();
            this.markDoneAndNext(step);
        };

        for (const trigger of triggers) {
            const triggerElement = document.querySelector(trigger.selector);
            if (!triggerElement) continue;

            const run = () => next();
            added[JSON.stringify(trigger)] = run;
            triggerElement.addEventListener(trigger.run, run);
        }

        document.getElementById(step.id).onchange = (e) => {
            if (e.target.checked) next();
            else {
                this.progressStatePct -= step.progression ?? this.progressInc;
                this.updateProgress();
            }
        };
    }

    async markDone(step) {
        await StorageLocal.set({ [step.id]: true });

        const stepElement = document.getElementById(step.id);
        stepElement.setAttribute('disabled', true);
        stepElement.setAttribute('checked', true);
        const parentElement = stepElement.parentElement;
        parentElement.classList.remove('locked');

        this.progressStatePct += step.progression ?? this.progressInc;
        this.updateProgress();

        if (this.progressStatePct >= 100) {
            await StorageLocal.set({ [this.tour.id]: true });
            this.congrats(true);
            return true;
        }
        return false;
    }

    async markDoneAndNext(step) {
        const bubbleShow = Checklist.bubble.isShow();
        this.inspect(null);

        const isComplete = await this.markDone(step);
        if (isComplete) return;

        const next = this.tour.steps[step.next];
        this.loadNextStep(next, bubbleShow);
    }

    async loadNextStep(step, bubbleShow) {
        const stepStates = await StorageLocal.get(this.tour.store);
        let next = step;
        while (next && stepStates[next.id]) {
            next = this.tour.steps[next.next];
        }

        if (next) this.unlockStep(next, bubbleShow);
    }

    unlockStep(step, bubbleShow) {
        const stepElement = document.getElementById(step.id);
        stepElement.removeAttribute('disabled');
        const parentElement = stepElement.parentElement;
        parentElement.classList.remove('locked');

        if (step.trigger && step.trigger.length > 0 && bubbleShow) {
            const inspectButton = parentElement.querySelector('.joorney_checklist_target_btn');
            this.inspect(step.trigger[0], inspectButton);
        }
    }

    lockStep(step) {
        const stepElement = document.getElementById(step.id);
        stepElement.setAttribute('disabled', true);
        const parentElement = stepElement.parentElement;
        parentElement.classList.add('locked');
    }

    congrats(isShow) {
        const congratsElement = document.getElementById('joorney_checklist_congrats');
        congratsElement.classList.toggle('mt-3', isShow);
        congratsElement.style.height = isShow ? null : 0;
        congratsElement.style.maxHeight = isShow ? '1000px' : 0;
        document.getElementById('joorney_checklist_congrats_separator').classList.toggle('d-none', !isShow);
        document.getElementById('joorney_checklist_congrats_blur').classList.toggle('d-none', !isShow);
        document.getElementById('joorney_checklist_congrats_restart').onclick = () => {
            if (isShow) this.restart();
        };

        const progress = document.getElementById('joorney_checklist_tour_progress');
        progress.classList.toggle('progress-bar-striped', isShow);
        progress.classList.toggle('bg-success', isShow);
    }

    async restart() {
        const stepIDs = Object.keys(this.tour.store);
        await StorageLocal.remove(stepIDs);
        this.congrats(false);
        this.load();
    }

    inspect(trigger, btn = false) {
        if (!Checklist.bubble) return;
        if (trigger === null || Checklist.bubble.isShow()) {
            Checklist.bubble.close();

            const inspectButtons = document.getElementsByClassName('joorney_checklist_target_btn');
            for (const btn of inspectButtons) {
                btn.classList.remove('active');
            }

            if (trigger === null) return;
        }
        const target = document.querySelector(trigger.selector);
        if (!target) return;
        if (btn) btn.classList.add('active');
        target.scrollIntoView({ behavior: 'smooth', block: trigger.align ?? 'center' });
        Checklist.bubble.move(target);
    }
}
