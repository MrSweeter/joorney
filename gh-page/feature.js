import { features } from './configuration.js';
const featuresName = features.map((f) => f.id);

document.addEventListener('DOMContentLoaded', () => {
    const currentHash = window.location.hash.slice(1);
    if (currentHash) loadFeature(currentHash);
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

function loadFeature(featureName) {
    const feature = features.find((f) => f.id === featureName || f.sub?.includes(featureName));
    if (!feature) return;

    document.getElementById('feature-icon').src = `./assets/custom-fa-icons/${feature.icon}.svg`;
    document.getElementById('feature-title').innerHTML = feature.title;
    document.getElementById('feature-description').innerHTML = `${
        feature.deprecated
            ? '<span class="text-danger">[DEPRECATED] This feature is no more supported in recent Odoo versions</span><br />'
            : ''
    }${feature.description}`;

    for (const el of document.getElementsByClassName('feature-amico')) {
        el.src = `./assets/storyset-amico/${feature.amico}.svg`;
    }

    const currentFeatureIndex = featuresName.indexOf(featureName);
    document.getElementById('joorney-previous-feature').onclick = () => previousFeature(currentFeatureIndex - 1);
    document.getElementById('joorney-next-feature').onclick = () => nextFeature(currentFeatureIndex + 1);
}

function previousFeature(indexArg) {
    let index = indexArg;
    if (index < 0) index = featuresName.length - 1;
    window.location.hash = featuresName[index];
    loadFeature(featuresName[index]);
}

function nextFeature(indexArg) {
    let index = indexArg;
    if (index >= featuresName.length) index = 0;
    window.location.hash = featuresName[index];
    loadFeature(featuresName[index]);
}
