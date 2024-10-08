import ProjectTaskShareContentFeature from '../../shared/projectTaskShare/content.js';
import Confetti from '../../utils/confetti.js';
import configuration from './configuration.js';

let starsConfetti = undefined;
export default class StarringTaskEffectContentFeature extends ProjectTaskShareContentFeature {
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

    async loadFeatureWithTask(task) {
        const starred = Number.parseInt(`${task.priority}`) === 1;
        for (const el of document.getElementsByClassName('o_priority_star')) {
            // No way to detect starred state dynamically due to hover effect on the star
            if (starred) el.addEventListener('click', this.addStarsGenerator);
            else el.addEventListener('click', this.generateStars);
        }
    }

    preloadFeature() {
        const exist = Array.from(document.getElementsByClassName('o_priority_star'));
        for (const el of exist) {
            el.removeEventListener('click', this.addStarsGenerator);
            el.removeEventListener('click', this.generateStars);
        }
    }

    addStarsGenerator(event) {
        event.target.removeEventListener('click', this.addStarsGenerator);
        event.target.addEventListener('click', this.generateStars);
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

        element.removeEventListener('click', this.generateStars);
        element.addEventListener('click', this.addStarsGenerator);
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
