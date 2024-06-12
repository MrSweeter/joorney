import { stringToHTML } from '../../../src/html_generator.js';

const colors = [
    'red',
    'blue',
    'green',
    'yellow',
    'orange',
    'purple',
    'pink',
    'brown',
    'cyan',
    'magenta',
    'lime',
    'indigo',
    'violet',
    'turquoise',
    'maroon',
    'olive',
    'teal',
    'coral',
    'gold',
];

export default class DoubleProgressBar {
    constructor(progressName, labelID, switcherID, totalBarID, partialBarID, maximum, total, sections) {
        this.label = document.getElementById(labelID);
        this.switcher = document.getElementById(switcherID);
        this.totalBar = document.getElementById(totalBarID);
        this.partialBar = document.getElementById(partialBarID);

        this.maximum = maximum;
        this.total = total;
        this.sections = sections;

        this.loadTotal();
        this.loadPartial();

        this.switcher.onclick = () => this.switch();
        this.label.innerHTML = `${progressName}: ${this.total} / ${this.maximum} bytes`;
    }

    switch() {
        this.totalBar.classList.toggle('d-none');
        this.partialBar.classList.toggle('d-none');
    }

    loadTotal() {
        this.totalBar.innerHTML = '';
        this.totalBar.title = `${this.maximum}`;
        const usageElement = this.getSectionElement(
            `${this.total} / ${this.maximum}`,
            (this.total / this.maximum) * 100,
            'var(--joorney-secondary)'
        );
        usageElement.onclick = () => this.switch();
        this.totalBar.appendChild(usageElement);
    }

    loadPartial() {
        this.partialBar.innerHTML = '';
        this.partialBar.title = `${this.total}`;
        let usageElement = undefined;
        let i = 0;
        for (const section of this.sections) {
            usageElement = this.getSectionElement(
                `${section.label}: ${section.usage} / ${this.total}`,
                (section.usage / this.total) * 100,
                colors[i % colors.length]
            );
            this.partialBar.appendChild(usageElement);
            i++;
        }
    }

    getSectionElement(label, value, color) {
        return stringToHTML(
            `<div title="${label}" class="progress-bar" style="width: ${value}%; background-color: ${color}"></div>`
        );
    }
}
