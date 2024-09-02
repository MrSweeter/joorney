import { features } from './configuration.js';

const state = {
    featuresName: features.map((f) => f.id),
    currentIndex: 0,
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('copyright-year').innerHTML = new Date().getFullYear();

    const isOdooStyle = new URL(location.href).searchParams.get('style') === 'odoo';
    if (isOdooStyle) {
        document.getElementsByTagName('body')[0].classList.add('odoo-style');
    }

    const currentHash = window.location.hash.slice(1);
    state.currentIndex = Math.max(state.featuresName.indexOf(currentHash), 0);
    loadFeature();

    handleTouch();
});

document.addEventListener('wheel', (e) => {
    if (e.deltaX > 0) {
        document.getElementById('joorney-next-feature').click();
    } else if (e.deltaX < 0) {
        document.getElementById('joorney-previous-feature').click();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowRight') {
        document.getElementById('joorney-next-feature').click();
    } else if (e.code === 'ArrowLeft') {
        document.getElementById('joorney-previous-feature').click();
    }
});

function updateIndex(newIndex) {
    state.currentIndex = newIndex;
    loadFeature();
}

function loadFeature() {
    const feature = getFeature(state.currentIndex);
    if (!feature) return;
    window.location.hash = feature.id;

    document.getElementById('feature-icon').className =
        `fa-2x w-100 h-100 text-joorney d-flex justify-content-center align-items-center ${feature.icon}`;
    document.getElementById('feature-title').innerHTML = feature.title;
    document.getElementById('feature-description').innerHTML = `
        ${feature.deprecated ? `<span class="text-danger">[DEPRECATED] ${feature.deprecatedReason}</span><br />` : ''}
        ${feature.soon ? `<span class="text-success">[SOON]</span><br />` : ''}
        ${feature.longDescription || feature.textDescription}`;

    if (feature.additionalDescription) {
        document.getElementById('joorney-additional-feature-info').classList.remove('d-none');
        document.getElementById('feature-additional-description').innerHTML = feature.additionalDescription;
        const source = document.getElementById('feature-video-source');
        source.src = feature.video;
        source.parentElement.load();
    } else {
        document.getElementById('joorney-additional-feature-info').classList.add('d-none');
    }

    for (const el of document.getElementsByClassName('feature-amico')) {
        el.src = `./assets/storyset-amico/${feature.amico}.svg`;
        el.alt = `${feature.id}, Amico`;
    }

    document.getElementById('joorney-previous-feature').onclick = () => updateIndex(state.currentIndex - 1);
    document.getElementById('joorney-next-feature').onclick = () => updateIndex(state.currentIndex + 1);

    updateFeatureMenu();
}

function getFeature(index) {
    const length = features.length;
    return features[((index % length) + length) % length];
}

function updateFeatureMenu() {
    const indexArg = state.currentIndex;
    const np2 = getFeature(indexArg - 2);
    const np1 = getFeature(indexArg - 1);
    const active = getFeature(indexArg);
    const nn1 = getFeature(indexArg + 1);
    const nn2 = getFeature(indexArg + 2);

    document.getElementById('feature-navbar-np2').innerHTML = np2.title;
    document.getElementById('feature-navbar-np1').innerHTML = np1.title;
    document.getElementById('feature-navbar-active').innerHTML = active.title;
    document.getElementById('feature-navbar-nn1').innerHTML = nn1.title;
    document.getElementById('feature-navbar-nn2').innerHTML = nn2.title;

    document.getElementById('feature-navbar-np2').onclick = () => updateIndex(state.currentIndex - 2);
    document.getElementById('feature-navbar-np1').onclick = () => updateIndex(state.currentIndex - 1);
    document.getElementById('feature-navbar-active').onclick = () => updateIndex(state.currentIndex);
    document.getElementById('feature-navbar-nn1').onclick = () => updateIndex(state.currentIndex + 1);
    document.getElementById('feature-navbar-nn2').onclick = () => updateIndex(state.currentIndex + 2);
}

function handleTouch() {
    let touchStartX = 0;
    let touchEndX = 0;
    const threshold = window.innerWidth > 600 ? 50 : 30; // Adjust threshold based on screen width

    function checkDirection() {
        const delta = touchEndX - touchStartX;
        if (delta > threshold) updateIndex(state.currentIndex - 1);
        if (delta < -threshold) updateIndex(state.currentIndex + 1);
    }

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        checkDirection();
    });
}
