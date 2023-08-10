const defaultsStar = {
    spread: 360,
    ticks: 50,
    gravity: 0,
    decay: 0.94,
    startVelocity: 5,
    shapes: ['star'],
    colors: ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8'],
    disableForReducedMotion: true,
};

function preloadStarringTaskEffect() {
    const exist = Array.from(document.getElementsByClassName('o_priority_star'));
    exist.forEach((el) => {
        el.removeEventListener('click', addStarsGenerator);
        el.removeEventListener('click', generateStars);
    });
}

async function shoot(x, y) {
    // From utils/confetti_qol.js
    confetti({
        ...defaultsStar,
        particleCount: 1,
        scalar: 0.8,
        shapes: ['star'],
        origin: { x: x, y: y },
    });

    confetti({
        ...defaultsStar,
        particleCount: 2,
        scalar: 0.75,
        shapes: ['circle'],
        origin: { x: x, y: y },
    });
}

function addStarsGenerator(event) {
    event.target.removeEventListener('click', addStarsGenerator);
    event.target.addEventListener('click', generateStars);
}

function generateStars(event) {
    const element = event.target;
    const rect = element.getBoundingClientRect();
    const sizeX = rect.right - rect.left;
    const sizeY = rect.bottom - rect.top;

    const x = (rect.left + sizeX / 2) / window.innerWidth;
    const y = (rect.top + sizeY / 2) / window.innerHeight;
    setTimeout(() => shoot(x, y), 0);
    setTimeout(() => shoot(x, y), 100);
    setTimeout(() => shoot(x, y), 200);

    element.removeEventListener('click', generateStars);
    element.addEventListener('click', addStarsGenerator);
}

async function loadStar(starred) {
    Array.from(document.getElementsByClassName('o_priority_star')).forEach((el) => {
        // No way to detect starred state dynamically due to hover effect on the star
        if (starred) el.addEventListener('click', addStarsGenerator);
        else el.addEventListener('click', generateStars);
    });
}
