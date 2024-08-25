import { getAmbientDates } from '../../../src/api/local.js';
import { ambients, estimateAmbientDuration } from '../../../src/features/ambient/ambient.js';
import AmbientLoader from '../../../src/features/ambient/ambient_loader.js';
import { stringToHTML } from '../../../src/html_generator.js';
import { StorageSync } from '../../../src/utils/browser.js';
import Confetti from '../../../src/utils/confetti.js';
import { setCancellableTimeout } from '../../../src/utils/timeout.js';
import { toLocaleDateStringFormatted, toLocaleDateTimeStringFormatted } from '../../../src/utils/util.js';

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

async function loadAmbientList() {
    const container = document.getElementById('joorney-ambient-list');
    container.innerHTML = '';

    const ambient_dates = await getAmbientDates();

    for (const [id, category] of Object.entries(ambients)) {
        container.appendChild(
            stringToHTML(`
            <div class="d-flex justify-content-between bg-body-tertiary p-2 border-bottom" data-ambient-category-id="${id}">
                <h6 class="m-0"><span class="ambient-category-toggle me-1 opacity-25" style="cursor: pointer;"><i class="fa-fw fa-solid fa-chevron-down"></i></span>${category.name}</h6>
                <p class="m-0">
                    <small class="text-decoration-underline ambient-category-all-toggle" style="cursor: pointer;">All</small>
                    &nbsp;/&nbsp;
                    <small class="text-decoration-underline ambient-category-none-toggle" style="cursor: pointer;">None</small>
                </p>
            </div>
            `)
        );

        for (const v of category.ambients) {
            ambientsData[v.id] = v;

            let description = '';
            if (v.date) {
                description = toLocaleDateStringFormatted(new Date(v.date));
            } else if (v.date_from && v.date_to) {
                const from = new Date(v.date_from);
                const to = new Date(v.date_to);
                toLocaleDateTimeStringFormatted;
                description = `${toLocaleDateTimeStringFormatted(from)} - ${toLocaleDateTimeStringFormatted(to)}`;
            } else if (v.month && v.day) {
                const d = new Date();
                d.setMonth(v.month - 1);
                d.setDate(v.day);
                description = toLocaleDateStringFormatted(d);
            } else if (ambient_dates[v.id]) {
                const from = new Date(ambient_dates[v.id].date_from);
                const to = new Date(ambient_dates[v.id].date_to);
                description = `${toLocaleDateTimeStringFormatted(from)} - ${toLocaleDateTimeStringFormatted(to)}`;
            }

            container.appendChild(
                stringToHTML(`
                <li class="list-collapsible show list-group-item d-flex justify-content-between align-items-center" data-ambient-id="${v.id}" title='${JSON.stringify(v)}'>
                    <div class="d-flex align-items-center">
                        <button class="joorney-play-ambient btn me-3"><i class="fa-fw fa-solid fa-play"></i></button>
                        <label class="form-check-label">${v.name}${description ? `<br/><span class="small text-muted">${description}</span>` : ''}</label>
                    </div>
                    <!--<span class="badge rounded-pill badge-success">Active</span>-->
                    <div class="vc-toggle-container">
                        <label class="vc-switch" style="--vc-width: 75px;">
                            <input type="checkbox" class="vc-switch-input" checked />
                            <span class="vc-switch-label" data-on="Active" data-off="Inactive"></span>
                            <span class="vc-handle"></span>
                        </label>
                    </div>
                </li>
            `)
            );
        }
    }

    for (const el of container.getElementsByClassName('joorney-play-ambient')) {
        el.onclick = playAmbient;
    }
    for (const el of container.getElementsByClassName('ambient-category-all-toggle')) {
        el.onclick = (e) => onSwitchCategory(e, true);
    }
    for (const el of container.getElementsByClassName('ambient-category-none-toggle')) {
        el.onclick = (e) => onSwitchCategory(e, false);
    }
    for (const header of container.getElementsByClassName('ambient-category-toggle')) {
        const icon = header.querySelector('i');
        icon.style.transition = 'transform .25s';
        header.onclick = () => {
            icon.style.transform = icon.style.transform === '' ? 'rotate(-90deg)' : '';

            let sibling = header.parentElement.parentElement.nextElementSibling;
            while (sibling && sibling.tagName.toLowerCase() !== 'div') {
                if (sibling.tagName.toLowerCase() === 'li') {
                    sibling.classList.toggle('show');
                }
                sibling = sibling.nextElementSibling;
            }
        };
    }

    const { ambientStatus } = await StorageSync.get({ ambientStatus: {} });
    updateAmbientState(ambientStatus);
}

function updateAmbientState(ambientStatus) {
    const container = document.getElementById('joorney-ambient-list');
    for (const el of container.getElementsByClassName('vc-switch-input')) {
        const dataElement = el.parentElement.parentElement.parentElement;
        const ambientId = dataElement.dataset.ambientId;
        el.checked = ambientStatus[ambientId] ?? true;
        el.onchange = onSwitch;
    }
}

async function onSwitchCategory(event, enable) {
    const dataElement = event.currentTarget.parentElement.parentElement;
    const ambientsList = ambients[dataElement.dataset.ambientCategoryId].ambients ?? [];
    if (!ambientsList || ambientsList.lenght <= 0) return;

    const { ambientStatus } = await StorageSync.get({ ambientStatus: {} });
    for (const a of ambientsList) {
        ambientStatus[a.id] = enable;
    }
    await StorageSync.set({ ambientStatus });
    updateAmbientState(ambientStatus);
}

async function onSwitch(event) {
    const input = event.currentTarget;
    const dataElement = input.parentElement.parentElement.parentElement;
    const { ambientStatus } = await StorageSync.get({ ambientStatus: {} });
    ambientStatus[dataElement.dataset.ambientId] = input.checked;
    await StorageSync.set({ ambientStatus });
}

function playAmbient(event) {
    disableAllButtons();

    const button = event.currentTarget;
    const dataElement = button.parentElement.parentElement;
    const ambient = ambientsData[dataElement.dataset.ambientId];
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
    }, estimatedDuration + 1000);

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
