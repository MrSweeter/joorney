import ChecklistContent from './content.js';
import Guide from './guide.js';
import { Checklist } from './index.js';
import ChecklistPanel from './panel.js';

// A page can announce its tour before the checklist is loaded
let pendingTourID;
let hasPendingTour = false;

export default class ChecklistManager {
    static load() {
        Checklist.manager?.destroy();
        Checklist.guide?.destroy();
        Checklist.content?.destroy();
        Checklist.manager = new ChecklistManager(document.getElementById('joorney_checklist'));
        Checklist.panel = new ChecklistPanel(Checklist.manager.element);
        Checklist.guide = new Guide();
        Checklist.panel.refresh();
        if (hasPendingTour) ChecklistManager.onboard(pendingTourID);
        hasPendingTour = false;
    }

    static onboard(tourID) {
        if (!Checklist.manager) {
            pendingTourID = tourID;
            hasPendingTour = true;
            return;
        }
        // Its triggers listen on the document: a page without tour must not complete the steps of the previous one
        Checklist.content?.destroy();
        // Pages without a tour (Import/export, Migration): nothing to load
        Checklist.content = tourID ? new ChecklistContent(tourID) : undefined;
    }

    constructor(element) {
        this.element = element;
        this.button = document.getElementById('joorney_checklist_show_btn');

        this.onWindowResize = this.onWindowResize.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.init();
    }

    init() {
        this.button.onclick = () => this.toggle(this.element.classList.contains('d-none'));
        document.getElementById('joorney_checklist_hide_btn').onclick = () => this.toggle(false);

        window.addEventListener('resize', this.onWindowResize);
        document.addEventListener('keydown', this.onKeyDown);
    }

    // The walk handles its own Esc (and stops it), so this one only sees the panel
    onKeyDown(e) {
        if (e.key !== 'Escape' || e.defaultPrevented || this.element.classList.contains('d-none')) return;
        this.toggle(false);
        this.button.focus();
    }

    // The navbar can wrap on narrow screens: dock the panel under the navbar, below the button, wherever it wraps to
    dock() {
        this.element.style.top = `${Math.round((this.button.closest('nav') ?? this.button).getBoundingClientRect().bottom + 6)}px`;
    }

    onWindowResize() {
        if (!this.element.classList.contains('d-none')) this.dock();
    }

    destroy() {
        window.removeEventListener('resize', this.onWindowResize);
        document.removeEventListener('keydown', this.onKeyDown);
    }

    toggle(isOpen) {
        this.element.classList.toggle('d-none', !isOpen);
        if (isOpen) this.dock();
        this.button.setAttribute('aria-expanded', String(Boolean(isOpen)));
        if (isOpen) Checklist.panel?.refresh();
    }
}
