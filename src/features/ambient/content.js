import ContentFeature from '../../generic/content.js';
import { isStillSameWebsite } from '../../utils/authorize.js';
import Confetti from '../../utils/confetti.js';
import AmbientLoader from './ambient_loader.js';
import AmbientManager from './ambient_manager.js';
import configuration from './configuration.js';

let ambientConfetti = undefined;

export default class AmbientContentFeature extends ContentFeature {
    constructor() {
        super(configuration);
        ambientConfetti = new Confetti();
        this.manager = new AmbientManager(ambientConfetti);
        this.loader = new AmbientLoader(ambientConfetti);
    }

    async loadFeature(url) {
        if (!(await isStillSameWebsite(2000, url))) return;
        if (!this.isOdooHome()) return;

        const ambientData = await this.manager.getAmbientForDate(new Date());
        this.loader.load(ambientData);
    }

    isOdooHome() {
        const container = document.getElementsByClassName('o_apps');
        return container.length > 0;
    }
}
