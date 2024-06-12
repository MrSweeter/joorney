export default class Bubble {
    constructor() {
        this.bubble = document.getElementById('bubble');
        this.target = null;
    }

    isShow() {
        return this.bubble?.classList.contains('opacity-100');
    }

    reposition() {
        this.positionBubble(this.target, this.bubble);
    }

    move(target) {
        this.target = target;
        this.positionBubble(this.target, this.bubble);
        this.bubble.classList.add('opacity-100');

        // this.observer?.disconnect();
        // this.observer = new MutationObserver(() => {
        //     this.positionBubble(this.target, this.bubble);
        // });

        // this.observer.observe(this.target, {
        //     attributes: true,
        //     childList: true,
        //     subtree: true,
        // });
    }

    close() {
        this.target = null;
        this.bubble.classList.remove('opacity-100');
    }

    positionBubble(target, bubble) {
        if (!target || !bubble) return;
        const targetRect = target.getBoundingClientRect();

        bubble.style.top = `${targetRect.y + targetRect.height / 2 - bubble.offsetHeight / 2}px`;
        bubble.style.left = `${targetRect.x + targetRect.width / 2 - bubble.offsetWidth / 2}px`;
    }
}
