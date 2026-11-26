import { escapeHTML, stringToHTML } from '../../../src/html_generator.js';
import { t } from '../../../src/utils/i18n.js';
import { iconHTML } from '../../../src/utils/icons.js';

// Distinct from each other and from the track; the total bar uses the navy of the page
const COLORS = [
    '#2456c9',
    '#fca311',
    '#8a5300',
    '#5b6474',
    '#7aa2ff',
    '#3b4a6b',
    '#d98c00',
    '#9aa3b2',
    '#1b429c',
    '#c4c9d2',
    '#13213c',
    '#b8860b',
];

/**
 * Storage usage bar: used vs quota, or (swapped) each section vs the used total.
 */
export default class DoubleProgressBar {
    constructor(container, name, maximum, total, sections) {
        this.container = container;
        this.name = name;
        this.maximum = maximum;
        this.total = total;
        this.sections = sections;
        this.bySection = false;
        this.render();
    }

    switch() {
        this.bySection = !this.bySection;
        this.render();
        this.container.querySelector('.joorney-tech-swap')?.focus();
    }

    get percent() {
        return this.maximum ? (this.total / this.maximum) * 100 : 0;
    }

    segments() {
        if (!this.bySection) {
            return [
                {
                    title: `${this.total} / ${this.maximum}`,
                    width: this.percent,
                    color: 'var(--joorney-navy)',
                },
            ];
        }
        return this.sections.map((section, i) => ({
            title: `${section.label}: ${section.usage} / ${this.total}`,
            width: this.total ? (section.usage / this.total) * 100 : 0,
            color: COLORS[i % COLORS.length],
        }));
    }

    render() {
        const segments = this.segments();
        const percent = this.percent.toFixed(1);
        const usage = t('optionsTechnical_storageUsage', this.name, this.total, this.maximum);
        const ariaLabel = escapeHTML(t('optionsTechnical_usageAria', this.name, percent));
        const swapLabel = escapeHTML(t('optionsTechnical_swapUsage'));
        const bars = segments
            .map(
                (s) =>
                    `<div title="${escapeHTML(s.title)}" style="width: ${s.width.toFixed(2)}%; background: ${s.color}"></div>`
            )
            .join('');
        const legend = this.bySection
            ? `<ul class="joorney-tech-legend">${segments
                  .map((s) => `<li><i style="background: ${s.color}"></i>${escapeHTML(s.title)}</li>`)
                  .join('')}</ul>`
            : '';

        this.container.replaceChildren(
            stringToHTML(`
                <div>
                    <div class="joorney-tech-usage-head">
                        <b>${escapeHTML(this.name)}</b><span>${escapeHTML(usage)} (${percent}%)</span>
                    </div>
                    <div class="joorney-tech-usage-row">
                        <div class="joorney-tech-bar" role="img" aria-label="${ariaLabel}">${bars}</div>
                        <button type="button" class="joorney-icon-btn joorney-tech-swap" title="${swapLabel}" aria-label="${swapLabel}" aria-pressed="${this.bySection}">
                            ${iconHTML('swap_horiz')}
                        </button>
                    </div>
                    ${legend}
                </div>
            `)
        );
        this.container.querySelector('.joorney-tech-swap').onclick = () => this.switch();
    }
}
