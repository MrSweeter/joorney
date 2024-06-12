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
            if (step.button) this.createButton(step, stepStates[step.id]);
            else this.createStep(step, stepStates[step.id]);
            this.lockStep(step);
        }

        let next = stepArray[0];
        while (next && stepStates[next.id]) {
            this.markDone(next);
            next = steps[next.next];
        }

        if (next) this.loadNextStep(next);
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

    createButton(step, done) {
        const stepElement = stringToHTML(`
            <div class="checklist-item">
                <button id=${step.id} class="btn btn-info">${step.button}</button>
            </div>
        `);
        document.getElementById('joorney_checklist_steps_list').appendChild(stepElement);
        if (!done) this.loadTrigger(step);
    }

    loadTrigger(step) {
        const next = () => this.markDone(step);
        if (step.button) {
            document.getElementById(step.id).onclick = () => next();
        } else {
            document.getElementById(step.id).onchange = (e) => {
                if (e.target.checked) next();
                else {
                    this.progressStatePct -= step.progression ?? this.progressInc;
                    this.updateProgress();
                }
            };
        }
        if (!step.trigger) return;
        for (const trigger of step.trigger) {
            const triggerElement = document.querySelector(trigger.selector);
            if (!triggerElement) return;
            if (trigger.run) {
                const run = () => {
                    triggerElement.removeEventListener(trigger.run, run);
                    next();
                };
                triggerElement.addEventListener(trigger.run, run);
            }
        }
    }

    async markDone(step) {
        const stepElement = document.getElementById(step.id);
        await StorageLocal.set({ [step.id]: true });
        stepElement.setAttribute('disabled', true);
        stepElement.setAttribute('checked', true);
        const parentElement = stepElement.parentElement;
        parentElement.classList.remove('locked');

        this.progressStatePct += step.progression ?? this.progressInc;
        this.updateProgress();

        const bubbleShow = Checklist.bubble.isShow();
        this.inspect(null);

        if (step.end) {
            await StorageLocal.set({ [this.tour.id]: true });
            this.congrats(true);
            return;
        }

        const next = this.tour.steps[step.next];
        this.loadNextStep(next, bubbleShow);
    }

    loadNextStep(step, bubbleShow) {
        this.unlockStep(step, bubbleShow);
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
            if (btn) btn.classList.remove('active');
            return;
        }
        const target = document.querySelector(trigger.selector);
        if (!target) return;
        if (btn) btn.classList.add('active');
        target.scrollIntoView({ behavior: 'smooth', block: trigger.align ?? 'center' });
        Checklist.bubble.move(target);
    }
}
