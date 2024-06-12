import { sleep } from '../utils/util.js';
import Bubble from './bubble.js';
import ChecklistContent from './content.js';
import { Checklist } from './index.js';

export default class ChecklistManager {
    static load() {
        Checklist.manager = new ChecklistManager(document.getElementById('joorney_checklist'));
        Checklist.bubble = new Bubble();
    }

    static onboard(tourID) {
        Checklist.bubble.close();
        Checklist.content = new ChecklistContent(tourID);
    }

    constructor(element) {
        this.element = element;
        this.newX = 0;
        this.newY = 0;
        this.previousX = 0;
        this.previousY = 0;

        this.windowWidth = 0;
        this.windowHeight = 0;
        this.modalWidth = 0;
        this.modalHeight = 0;

        this.menuHeight = document.getElementById('joorney-navig-menu').offsetHeight;

        this.beginDrag = this.beginDrag.bind(this);
        this.moving = this.moving.bind(this);
        this.endDrag = this.endDrag.bind(this);

        this.init();
    }

    init() {
        this.loadSize();
        document.getElementById('joorney_checklist_show_btn').onclick = () => this.toggle(true);
        document.getElementById('joorney_checklist_hide_btn').onclick = () => this.toggle(false);

        window.addEventListener('resize', () => {
            this.reposition();
            Checklist.bubble?.reposition();
        });
        window.addEventListener('scroll', () => {
            Checklist.bubble?.reposition();
        });
    }

    toggle(isOpen = undefined) {
        this.element.style.top = null;
        this.element.style.left = null;
        if (isOpen) {
            document.getElementById('joorney_checklist_show_btn').classList.add('d-none');
            this.element.classList.remove('d-none');
        } else {
            document.getElementById('joorney_checklist_show_btn').classList.remove('d-none');
            this.element.classList.add('d-none');
        }

        this.reset();
    }

    hide() {
        document.getElementById('joorney_checklist_show_btn').classList.add('d-none');
        this.element.classList.add('d-none');
    }

    show() {
        document.getElementById('joorney_checklist_show_btn').classList.remove('d-none');
    }

    beginDrag(e) {
        e.preventDefault();
        this.previousX = e.clientX;
        this.previousY = e.clientY;
        this.loadSize();
        document.onmouseup = this.endDrag;
        document.onmousemove = this.moving;
    }

    moving(e) {
        e.preventDefault();
        this.newX = this.previousX - e.clientX;
        this.newY = this.previousY - e.clientY;
        this.previousX = e.clientX;
        this.previousY = e.clientY;

        this.safeMove(this.element.offsetLeft - this.newX, this.element.offsetTop - this.newY, false);
    }

    endDrag() {
        document.onmouseup = null;
        document.onmousemove = null;
    }

    reposition() {
        this.loadSize();
        this.safeMove(
            Number.parseFloat(this.element.style.left.replace('px', '')),
            Number.parseFloat(this.element.style.top.replace('px')),
            true
        );
    }

    async reset() {
        await sleep(100);
        this.element.onmousedown = this.beginDrag; //ODO[REF] DRAGGING BOUND
        ChecklistManager.bubble?.close();
        this.align(true, true, false, false);
    }

    align(top, right, bottom, left, transition = true) {
        this.loadSize();
        this.safeMove(
            left ? 0 : right ? Number.MAX_SAFE_INTEGER : undefined,
            top ? 0 : bottom ? Number.MAX_SAFE_INTEGER : undefined,
            transition
        );
    }

    safeMove(x, y, transition = false) {
        const margin = 12;
        const vmargin = this.menuHeight + margin;

        this.move(
            Math.min(Math.max(x, margin), this.windowWidth - this.modalWidth - margin),
            Math.min(Math.max(y, vmargin), this.windowHeight - this.modalHeight - margin),
            transition
        );
    }

    move(x, y, transition) {
        if (transition) this.element.style.transition = 'top 0.5s ease, left 0.5s ease';
        if (y || y === 0) this.element.style.top = `${y}px`;
        if (x || x === 0) this.element.style.left = `${x}px`;
        if (transition) {
            setTimeout(() => {
                this.element.style.transition = null;
            }, 500);
        }
    }

    loadSize() {
        this.windowWidth = window.innerWidth;
        this.windowHeight = window.innerHeight;
        this.modalWidth = this.element.offsetWidth;
        this.modalHeight = this.element.offsetHeight;

        this.menuHeight = document.getElementById('joorney-navig-menu').offsetHeight;
    }
}
