import ContentFeature from '../../generic/content.js';
import { isStillSamePage } from '../../utils/authorize.js';
import Confetti from '../../utils/confetti.js';
import configuration from './configuration.js';

let starsConfetti = undefined;
export default class StarringPriorityEffectContentFeature extends ContentFeature {
    constructor() {
        super(configuration);
        starsConfetti = new Confetti();
        this.defaultsStar = {
            spread: 360,
            ticks: 50,
            gravity: 0,
            decay: 0.94,
            startVelocity: 5,
            shapes: ['star'],
            colors: ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8'],
        };
        this.generateStars = this.generateStars.bind(this);
        this.addStarsGenerator = this.addStarsGenerator.bind(this);
    }

    async loadFeature(url) {
        this.preloadFeature();
        if (!(await isStillSamePage(2500, url))) return;

        for (const el of document.querySelectorAll('.o_priority')) {
            this.updateWidgetFeature(el, 0, true);
        }
    }

    updateWidgetFeature(widgetElement, newPriority, initialization = false) {
        const stars = widgetElement.querySelectorAll('.o_priority_star');
        if (stars.length === 0) return;

        let priority = 0;
        let checked = false;
        for (const [i, el] of stars.entries()) {
            const starPriority = Number.parseInt(el.dataset.joorneyPriorityValue ?? 10);
            checked = starPriority <= newPriority;

            if (initialization) {
                el.dataset.joorneyPriorityValue = i + 1;
                checked = el.classList.contains('fa-star');
            }
            if (checked) priority = i + 1;

            el.dataset.joorneyChecked = checked;

            el.removeEventListener('click', this.addStarsGenerator);
            el.removeEventListener('click', this.generateStars);

            if (checked) el.addEventListener('click', this.addStarsGenerator);
            else el.addEventListener('click', this.generateStars);
        }

        widgetElement.dataset.joorneyPriorityValue = priority;
    }

    preloadFeature() {
        const exist = Array.from(document.querySelectorAll('.o_priority .o_priority_star'));
        for (const el of exist) {
            el.removeEventListener('click', this.addStarsGenerator);
            el.removeEventListener('click', this.generateStars);
        }
    }

    addStarsGenerator(event) {
        const element = event.target;
        const parent = element.closest('.o_priority');
        const currentPriority = Number.parseInt(parent.dataset.joorneyPriorityValue ?? 0);
        const priority = Number.parseInt(element.dataset.joorneyPriorityValue ?? 0);
        this.updateWidgetFeature(parent, priority === currentPriority ? 0 : priority);
    }

    generateStars(event) {
        const element = event.target;
        const rect = element.getBoundingClientRect();
        const sizeX = rect.right - rect.left;
        const sizeY = rect.bottom - rect.top;

        const x = (rect.left + sizeX / 2) / window.innerWidth;
        const y = (rect.top + sizeY / 2) / window.innerHeight;
        starsConfetti.reset();
        setTimeout(() => this.shoot(x, y), 0);
        setTimeout(() => this.shoot(x, y), 100);
        setTimeout(() => this.shoot(x, y), 200);

        this.updateWidgetFeature(element.closest('.o_priority'), Number.parseInt(element.dataset.joorneyPriorityValue));
    }

    async shoot(x, y) {
        starsConfetti.fire({
            ...this.defaultsStar,
            particleCount: 1,
            scalar: 0.8,
            shapes: ['star'],
            origin: { x: x, y: y },
        });

        starsConfetti.fire({
            ...this.defaultsStar,
            particleCount: 2,
            scalar: 0.75,
            shapes: ['circle'],
            origin: { x: x, y: y },
        });
    }
}
