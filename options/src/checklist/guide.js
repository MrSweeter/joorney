import { escapeHTML, stringToHTML } from '../../../src/html_generator.js';
import { t } from '../../../src/utils/i18n.js';
import { sleep } from '../../../src/utils/util.js';
import { UI_EVENTS } from '../ui/events.js';
import { findTarget } from './content.js';
import { Checklist } from './index.js';

const SPOT_PADDING = 6;
const BUBBLE_GAP = 14;
const VIEWPORT_MARGIN = 12;
// The page re-renders after an action: let the next target settle before pointing at it
const SETTLE_DELAY = 300;

/**
 * Guided walk of a tour: the page is dimmed around the target of the current step (the target stays usable
 * through the cut-out) and a bubble next to it tells what to do. "Next" goes on whether or not the action was
 * done, doing the action completes the step and goes on by itself, "Skip tour" closes the walk and leaves the
 * tour in progress.
 */
export default class Guide {
    constructor() {
        this.content = null;
        this.steps = [];
        this.index = 0;
        this.target = null;
        this.root = null;
        this.frame = 0;
        // Where each tour was left, so Resume continues there
        this.positions = new Map();

        this.schedule = this.schedule.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onPageChange = this.onPageChange.bind(this);
        document.addEventListener(UI_EVENTS.PAGE_CHANGE, this.onPageChange);
    }

    destroy() {
        this.close({ reopenPanel: false });
        document.removeEventListener(UI_EVENTS.PAGE_CHANGE, this.onPageChange);
    }

    isActive() {
        return this.root !== null;
    }

    hasProgress(tourID) {
        return this.positions.has(tourID);
    }

    forget(tourID) {
        this.positions.delete(tourID);
    }

    start(content) {
        if (!content?.tour || !content.loaded) return;
        this.close({ reopenPanel: false });
        Checklist.manager?.toggle(false);

        this.content = content;
        this.steps = Object.values(content.tour.steps);
        const remembered = this.positions.get(content.tour.id);
        const firstUndone = this.steps.findIndex((step) => !content.doneSteps.has(step.id));
        this.build();
        this.show(remembered ?? Math.max(firstUndone, 0));
        this.listen();
    }

    build() {
        this.root = stringToHTML(`
            <div id="joorney-guide" class="joorney-guide">
                <div class="joorney-guide-dim" hidden></div>
                <div class="joorney-guide-spot" hidden></div>
                <div class="joorney-guide-bubble" role="dialog" aria-modal="false" tabindex="-1">
                    <div class="joorney-guide-arrow"></div>
                    <div class="joorney-guide-count">
                        <span data-role="count"></span>
                        <span class="joorney-guide-dots" data-role="dots" aria-hidden="true"></span>
                    </div>
                    <h2 class="joorney-guide-title" data-role="title"></h2>
                    <p class="joorney-guide-text" data-role="text"></p>
                    <p class="joorney-guide-note" data-role="note" hidden>${escapeHTML(t('checklist_guideNoTarget'))}</p>
                    <div class="joorney-guide-foot">
                        <button type="button" class="joorney-guide-btn is-ghost" data-action="back">${escapeHTML(t('checklist_guideBack'))}</button>
                        <button type="button" class="joorney-guide-skip" data-action="skip">${escapeHTML(t('checklist_guideSkip'))}</button>
                        <button type="button" class="joorney-guide-btn" data-action="next"></button>
                    </div>
                </div>
            </div>
        `);
        this.bubble = this.root.querySelector('.joorney-guide-bubble');
        this.spot = this.root.querySelector('.joorney-guide-spot');
        this.dim = this.root.querySelector('.joorney-guide-dim');
        this.root.querySelector('[data-role="dots"]').innerHTML = this.steps
            .map(() => '<span class="joorney-guide-dot"></span>')
            .join('');
        const actions = {
            back: () => this.show(this.index - 1),
            next: () => this.next(),
            skip: () => this.skip(),
        };
        this.bubble.onclick = (e) => actions[e.target.closest('[data-action]')?.dataset.action]?.();
        document.body.appendChild(this.root);
    }

    // Everything on the document: the pages replace their nodes, a listener on a node would be lost
    listen() {
        window.addEventListener('scroll', this.schedule, true);
        window.addEventListener('resize', this.schedule);
        document.addEventListener('keydown', this.onKeyDown, true);
        const container = document.getElementById('joorney-page-container');
        if (container) {
            this.observer = new MutationObserver(this.schedule);
            this.observer.observe(container, { childList: true, subtree: true, attributes: true });
        }
    }

    unlisten() {
        window.removeEventListener('scroll', this.schedule, true);
        window.removeEventListener('resize', this.schedule);
        document.removeEventListener('keydown', this.onKeyDown, true);
        this.observer?.disconnect();
        this.observer = null;
        cancelAnimationFrame(this.frame);
        this.frame = 0;
    }

    schedule() {
        if (this.frame) return;
        this.frame = requestAnimationFrame(() => {
            this.frame = 0;
            this.place();
        });
    }

    show(index) {
        if (!this.isActive()) return;
        this.index = Math.min(Math.max(index, 0), this.steps.length - 1);
        this.positions.set(this.content.tour.id, this.index);
        const step = this.steps[this.index];
        const isLast = this.index === this.steps.length - 1;

        // The step may be reached before the ones before it: its action then counts
        this.content.unlockStep(step);

        this.bubble.setAttribute(
            'aria-label',
            t('checklist_guideLabel', t(this.content.tour.titleKey), t(step.nameKey))
        );
        this.root.querySelector('[data-role="count"]').textContent = t(
            'checklist_guideStep',
            this.index + 1,
            this.steps.length
        );
        this.root.querySelectorAll('.joorney-guide-dot').forEach((dot, i) => {
            dot.classList.toggle('is-on', i === this.index);
        });
        this.root.querySelector('[data-role="title"]').textContent = t(step.nameKey);
        const text = this.root.querySelector('[data-role="text"]');
        text.textContent = step.descriptionKey ? t(step.descriptionKey) : '';
        text.hidden = !step.descriptionKey;
        this.bubble.querySelector('[data-action="back"]').disabled = this.index === 0;
        this.bubble.querySelector('[data-action="next"]').textContent = isLast
            ? t('checklist_guideFinish')
            : t('checklist_guideNext');

        this.target = findTarget(step.trigger) ?? null;
        if (this.target && !isInView(this.target)) {
            this.target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
        }
        this.place();
        this.bubble.querySelector('[data-action="next"]').focus({ preventScroll: true });
    }

    place() {
        if (!this.isActive()) return;
        const step = this.steps[this.index];
        // The page re-rendered (or the target appeared since): find it again
        if (!this.target?.isConnected || this.target.getClientRects().length === 0) {
            this.target = findTarget(step.trigger) ?? null;
        }
        this.root.querySelector('[data-role="note"]').hidden = Boolean(this.target);
        this.dim.hidden = Boolean(this.target);
        this.spot.hidden = !this.target;
        this.bubble.classList.toggle('is-centered', !this.target);

        const viewWidth = document.documentElement.clientWidth;
        const viewHeight = document.documentElement.clientHeight;
        const width = this.bubble.offsetWidth;
        const height = this.bubble.offsetHeight;

        if (!this.target) {
            this.setBubble((viewWidth - width) / 2, (viewHeight - height) / 2);
            return;
        }

        const rect = this.target.getBoundingClientRect();
        const spot = {
            left: rect.left - SPOT_PADDING,
            top: rect.top - SPOT_PADDING,
            width: rect.width + SPOT_PADDING * 2,
            height: rect.height + SPOT_PADDING * 2,
        };
        this.spot.style.left = `${spot.left}px`;
        this.spot.style.top = `${spot.top}px`;
        this.spot.style.width = `${spot.width}px`;
        this.spot.style.height = `${spot.height}px`;

        // Beside the cut-out where it fits (right, left, below, above), else over the best fit
        const fits = {
            right: spot.left + spot.width + BUBBLE_GAP + width <= viewWidth - VIEWPORT_MARGIN,
            left: spot.left - BUBBLE_GAP - width >= VIEWPORT_MARGIN,
            bottom: spot.top + spot.height + BUBBLE_GAP + height <= viewHeight - VIEWPORT_MARGIN,
            top: spot.top - BUBBLE_GAP - height >= VIEWPORT_MARGIN,
        };
        const side = ['right', 'bottom', 'left', 'top'].find((s) => fits[s]) ?? 'bottom';
        let x;
        let y;
        if (side === 'right' || side === 'left') {
            x = side === 'right' ? spot.left + spot.width + BUBBLE_GAP : spot.left - BUBBLE_GAP - width;
            y = spot.top + spot.height / 2 - height / 2;
        } else {
            x = spot.left + spot.width / 2 - width / 2;
            y = side === 'bottom' ? spot.top + spot.height + BUBBLE_GAP : spot.top - BUBBLE_GAP - height;
        }
        x = clamp(x, VIEWPORT_MARGIN, viewWidth - width - VIEWPORT_MARGIN);
        y = clamp(y, VIEWPORT_MARGIN, viewHeight - height - VIEWPORT_MARGIN);
        this.setBubble(x, y);

        // The arrow points at the middle of the cut-out, kept on the bubble edge
        const arrow = this.bubble.querySelector('.joorney-guide-arrow');
        this.bubble.dataset.side = side;
        if (side === 'right' || side === 'left') {
            arrow.style.top = `${clamp(spot.top + spot.height / 2 - y - 6, 14, height - 26)}px`;
            arrow.style.left = '';
        } else {
            arrow.style.left = `${clamp(spot.left + spot.width / 2 - x - 6, 14, width - 26)}px`;
            arrow.style.top = '';
        }
    }

    setBubble(x, y) {
        this.bubble.style.left = `${Math.round(x)}px`;
        this.bubble.style.top = `${Math.round(y)}px`;
        if (!this.target) delete this.bubble.dataset.side;
    }

    async next() {
        if (this.index < this.steps.length - 1) {
            this.show(this.index + 1);
            return;
        }
        await this.finish();
    }

    // Walked to the end: the tour counts as done, whatever steps were left to the guide
    async finish() {
        const content = this.content;
        await content.markAll();
        // markAll completes the tour (which closes the walk), unless it was already marked
        if (this.content === content) this.close({ reopenPanel: true });
    }

    skip() {
        this.close({ reopenPanel: true });
    }

    async stepDone(step) {
        if (!this.isActive()) return;
        const content = this.content;
        const index = this.steps.findIndex((s) => s.id === step.id);
        // Only the step on screen moves the walk
        if (index !== this.index) return;
        await sleep(SETTLE_DELAY);
        if (!this.isActive() || this.content !== content || this.index !== index) return;
        if (index < this.steps.length - 1) this.show(index + 1);
    }

    close({ reopenPanel = false } = {}) {
        if (!this.isActive()) return;
        this.unlisten();
        this.root.remove();
        this.root = null;
        this.target = null;
        this.content = null;
        if (reopenPanel) Checklist.manager?.toggle(true);
        else Checklist.panel?.refresh();
    }

    onPageChange() {
        this.close({ reopenPanel: false });
    }

    onKeyDown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            this.skip();
            return;
        }
        if (e.key !== 'Tab' || !this.bubble.contains(document.activeElement)) return;
        // Tab cycles inside the bubble while the focus is in it
        const focusable = [...this.bubble.querySelectorAll('button:not([disabled])')];
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(value, Math.max(min, max)));
}

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isInView(element) {
    const rect = element.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= document.documentElement.clientHeight;
}
