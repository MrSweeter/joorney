import { ambients, estimateAmbientDuration } from '../../../src/features/ambient/ambient.js';
import AmbientLoader from '../../../src/features/ambient/ambient_loader.js';
import { stringToHTML } from '../../../src/html_generator.js';
import Confetti from '../../../src/utils/confetti.js';
import { setCancellableTimeout } from '../../../src/utils/timeout.js';

let ambientLoader = undefined;
let ambientConfetti = undefined;
const ambientsData = {};

export async function loadPage(_features, _currentSettings) {
    setupSlider();

    const canva = document.getElementById('previewAmbient');
    ambientConfetti = new Confetti(canva);
    ambientLoader = new AmbientLoader(ambientConfetti);

    loadAmbientList();
}

function loadAmbientList() {
    const container = document.getElementById('joorney-ambient-list');
    container.innerHTML = '';

    for (const [type, category] of Object.entries(ambients)) {
        if (type === 'test') continue;

        container.appendChild(
            stringToHTML(`<h6 class="bg-body-tertiary p-2 border-top border-bottom">${category.name}</h6>`)
        );

        for (const [k, v] of Object.entries(category.ambients)) {
            if (k.startsWith('_')) return;
            ambientsData[`${type}_${k}`] = v;

            container.appendChild(
                stringToHTML(`
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <button class="joorney-play-ambient btn me-3" data-ambient-key="${type}_${k}"><i class="fa-solid fa-play"></i></button>
                        <label class="form-check-label">${v.name}</label>
                    </div>
                    <span class="badge rounded-pill badge-success">Active</span>
                </li>
            `)
            );
        }
    }

    for (const el of container.getElementsByClassName('joorney-play-ambient')) {
        el.onclick = playAmbient;
    }
}

function playAmbient(event) {
    disableAllButtons();

    const button = event.currentTarget;
    const ambient = ambientsData[button.dataset.ambientKey];
    if (!ambient) {
        enableAllButtons();
        return;
    }
    const estimatedDuration = estimateAmbientDuration(ambient);

    document.getElementById('joorney-playing-ambient-info').innerText =
        `Ambient: "${ambient.name}" - Duration: ${estimatedDuration}ms`;

    ambientLoader?.load(ambient);
    const timeout = setCancellableTimeout(() => {
        stopAmbient();
    }, estimatedDuration);

    const iconClass = button.querySelector('i').classList;
    iconClass.remove('fa-pause');
    iconClass.add('fa-stop');
    button.onclick = () => {
        timeout.trigger();
    };

    button.removeAttribute('disabled');
}

function stopAmbient() {
    ambientLoader.stop();
    document.getElementById('joorney-playing-ambient-info').innerText = '';
    enableAllButtons();
}

function disableAllButtons() {
    for (const btn of document.getElementsByClassName('joorney-play-ambient')) {
        btn.onclick = null;
        btn.setAttribute('disabled', true);
        const iconClass = btn.querySelector('i').classList;
        iconClass.add('fa-pause');
        iconClass.remove('fa-play');
        iconClass.remove('fa-stop');
    }
}

function enableAllButtons() {
    for (const btn of document.getElementsByClassName('joorney-play-ambient')) {
        btn.onclick = playAmbient;
        btn.removeAttribute('disabled');
        const iconClass = btn.querySelector('i').classList;
        iconClass.add('fa-play');
        iconClass.remove('fa-pause');
        iconClass.remove('fa-stop');
    }
}

function setupSlider() {
    const slider = document.querySelector('.images-comparison .slider');
    const leftImageElement = document.querySelector('.images-comparison .left-image');
    const sliderLineElement = document.querySelector('.images-comparison .slider-line');
    const sliderIconElement = document.querySelector('.images-comparison .slider-icon');

    slider.addEventListener('input', (e) => {
        const sliderValue = `${e.target.value}%`;

        leftImageElement.style.width = sliderValue;
        sliderLineElement.style.left = sliderValue;
        sliderIconElement.style.left = sliderValue;
    });
}
