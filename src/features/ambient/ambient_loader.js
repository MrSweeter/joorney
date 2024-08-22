export default class AmbientLoader {
    constructor(ambientConfetti) {
        this.ambientConfetti = ambientConfetti;
        this.stopped = true;
    }

    async stop(delay) {
        this.stopped = true;
        await this.ambientConfetti.reset();
        await new Promise((r) => setTimeout(r, delay + 10));
    }

    async load(ambientData) {
        if (!ambientData) return;
        switch (ambientData.type) {
            case 'long':
                this.loadAmbient(ambientData.load, ambientData.duration);
                break;
            case 'count':
                this.loadAmbientCount(ambientData.load, ambientData.count, ambientData.delay);
                break;
            case 'onetime':
                this.loadOneTimeAmbient(ambientData.load);
                break;
        }
    }

    async loadAmbientCount(ambientLoader, count, delay) {
        await this.stop(0);
        this.stopped = false;
        this.loadAmbient(ambientLoader, count * delay, count);
    }

    async loadOneTimeAmbient(ambientLoader) {
        await this.stop(0);
        this.stopped = false;
        const ambients = await ambientLoader();
        this.playAmbients(ambients);
    }

    async loadAmbient(
        ambientLoader,
        duration,
        countArg = undefined,
        animationStartArg = Date.now(),
        animationEnd = animationStartArg + duration,
        delay = countArg ? duration / Number.parseFloat(countArg) : 1
    ) {
        await this.stop(delay);
        this.stopped = false;
        this._loadAmbient(ambientLoader, duration, countArg, animationStartArg, animationEnd, delay);
    }

    async _loadAmbient(ambientLoader, duration, countArg, animationStartArg, animationEnd, delay) {
        const now = Date.now();
        const timeLeft = animationEnd - now;
        const ticks = Math.max(200, 500 * (timeLeft / duration));
        const ambients = await ambientLoader(ticks);

        let count = countArg;
        let animationStart = animationStartArg;

        if (count) {
            const ellapsed = now - animationStart;

            if (ellapsed >= delay) {
                this.playAmbients(ambients);
                count--;
                animationStart = now;
            }
        } else if (count === undefined) {
            this.playAmbients(ambients);
        }

        if (timeLeft > 0 && !this.stopped) {
            requestAnimationFrame(() =>
                this._loadAmbient(ambientLoader, duration, count, animationStart, animationEnd, delay)
            );
        }
    }

    playAmbients(ambientsArg) {
        const ambients = Array.isArray(ambientsArg) ? ambientsArg : [ambientsArg];
        for (const ambient of ambients) {
            this.ambientConfetti.fire(ambient);
        }
    }
}
