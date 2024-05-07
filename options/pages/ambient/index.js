import AmbientManager from '../../../src/features/ambient/ambient_manager';
import Confetti from '../../../src/utils/confetti';

export async function loadPage(_features, _currentSettings) {
    setupSlider();
    setupAmbientSelector();
}

function setupAmbientSelector() {
    const canva = document.getElementById('previewAmbient');
    const ambientConfetti = new Confetti(canva);
    const ambientManager = new AmbientManager(ambientConfetti);

    const selector = document.getElementById('ambientSelector');
    selector.onchange = (e) => {
        const ambient = e.target.value;
        ambientManager.loadAmbient(ambient);
    };
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
