import ContentFeature from '../../generic/content.js';
import { isStillSamePage } from '../../utils/authorize.js';
import { sanitizeURL } from '../../utils/util.js';
import configuration from './configuration.js';

export default class EggsContentFeature extends ContentFeature {
    constructor() {
        super(configuration);
    }

    async loadFeature(urlArg) {
        const url = sanitizeURL(urlArg);
        if (url.pathname !== '/odoo') return;
        if (!(await isStillSamePage(1000, url))) return;
        this.start();
    }

    start(count = 1, delay = 1000) {
        if (window.location.pathname !== '/odoo') return;
        setTimeout(() => {
            const appIcons = this.getApps(count, false);
            if (appIcons.length > 0) {
                appIcons[0].src = 'https://mrsweeter.github.io/joorney/assets/icon_128.svg';
            }
            for (const appIcon of appIcons) {
                this.shakeAndRotate(appIcon);
            }
            this.start(count + 1, 1000);
        }, delay);
    }

    shakeAndRotate(element) {
        const animationName = 'shakeRotateAnim';

        if (!document.getElementById('shakeRotateAnimStyle')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'shakeRotateAnimStyle';
            styleSheet.textContent = `
                @keyframes ${animationName} {
                0% { transform: rotate(0deg); }
                15% { transform: rotate(15deg); }
                30% { transform: rotate(-15deg); }
                45% { transform: rotate(10deg); }
                60% { transform: rotate(-10deg); }
                75% { transform: rotate(5deg); }
                90% { transform: rotate(-5deg); }
                100% { transform: rotate(0deg); }
                }
            `;
            document.head.appendChild(styleSheet);
        }

        element.style.animation = `${animationName} 0.8s ease-in-out`;

        element.addEventListener(
            'animationend',
            () => {
                element.style.animation = '';
            },
            { once: true }
        );
    }

    getApps(count, onlyVisible) {
        const icons = document.getElementsByClassName('o_app_icon');
        const visibleInViewport = onlyVisible
            ? Array.from(icons).filter((icon) => {
                  const rect = icon.getBoundingClientRect();
                  return (
                      rect.top < window.innerHeight &&
                      rect.bottom > 0 &&
                      rect.left < window.innerWidth &&
                      rect.right > 0
                  );
              })
            : Array.from(icons);

        function shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

        const shuffled = shuffle(visibleInViewport);
        return shuffled.slice(0, count);
    }
}
