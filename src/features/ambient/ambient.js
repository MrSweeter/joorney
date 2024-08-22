import { getEventWithName } from '../../api/odoo.js';
import { shapeFromText } from '../../utils/confetti.js';
import { yyyymmdd_hhmmssToDate } from '../../utils/util.js';
import { bubbles } from './custom_path.js';

//#region Abstract Loader
const lockedState = ['circle', 'square', 'star'];
const emojisLoader = ({
    emojis,
    alpha,
    size,
    gravity,
    drift,
    xRange,
    yRange,
    color = '#ffffff',
    flat = true,
    flipHorizontal = false,
    flipVertical = false,
}) => {
    const emojisBitmap = emojis.map((emoji) =>
        lockedState.includes(emoji)
            ? emoji
            : shapeFromText(
                  { text: emoji, scalar: size?.max ?? 1, color: color },
                  { vertical: flipVertical, horizontal: flipHorizontal }
              )
    );

    return shapesLoader({
        shapes: emojisBitmap,
        alpha,
        size,
        gravity,
        drift,
        xRange,
        yRange,
        colors: [color],
        flat,
    });
};

const shapesLoader = ({
    shapes,
    alpha = { max: 1, double: true },
    size = { min: 1, max: 1, dynamic: false },
    gravity = { min: 0.4, max: 0.6, dynamic: false },
    drift = { min: -0.4, max: 0.4, dynamic: false },
    xRange = { min: 0, max: 1 },
    yRange = { min: 0, max: 1 }, // Top = 0, Bottom = 1
    colors = ['#ffffff'],
    flat = true,
}) => {
    const scalarComputed = size.dynamic ? () => Math.round(randomInRange(size.min, size.max)) : size.max;
    const gravityComputed = gravity.dynamic ? () => randomInRange(gravity.min, gravity.max) : gravity.max;
    const driftComputed = drift.dynamic ? () => randomInRange(drift.min, drift.max) : drift.max;

    return (ticks) => ({
        flat,
        particleCount: 1,
        startVelocity: 0,
        ticks,
        origin: {
            x: randomInRange(xRange.min, xRange.max),
            y: randomInRange(yRange.min, yRange.max),
        },
        colors,
        shapes,
        gravity: gravityComputed,
        scalar: scalarComputed,
        drift: driftComputed,
        alpha,
    });
};

const fireworkLoader = (colors, mixColor, smallAndLarge, doubleBurst) => {
    return (_ticks) => {
        const loads = [
            {
                startVelocity: 30,
                spread: 360,
                ticks: 60,
                zIndex: 0,
                particleCount: 50,
                origin: { x: randomInRange(0.1, 0.5), y: Math.random() - 0.2 },
                colors: mixColor ? colors : [colors[Math.round(randomInRange(0, colors.length - 1))]],
            },
            {
                startVelocity: 30,
                spread: 360,
                ticks: 60,
                zIndex: 0,
                particleCount: 50,
                origin: { x: randomInRange(0.5, 0.9), y: Math.random() - 0.2 },
                colors: mixColor ? colors : [colors[Math.round(randomInRange(0, colors.length - 1))]],
            },
        ];
        if (smallAndLarge) {
            loads.concat(
                loads.map((l) => {
                    l.particleCount *= 2;
                    return l;
                })
            );
        }

        const firework = loads[Math.round(randomInRange(0, loads.length - 1))];
        if (doubleBurst) {
            const fireworkInside = {
                ...firework,
                startVelocity: 15,
                colors: mixColor ? colors : [colors[Math.round(randomInRange(0, colors.length - 1))]],
            };
            return [firework, fireworkInside];
        }
        return firework;
    };
};
const schoolPrideLoader = (colors) => {
    return (_ticks) => {
        return [
            {
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: colors,
            },
            {
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: colors,
            },
        ];
    };
};
const floatingLoader = (emojis) => {
    return emojisLoader({
        emojis: emojis,
        alpha: { max: 0.2, double: true },
        size: { min: 8, max: 20, dynamic: true },
        gravity: { min: -0.6, max: -0.4, dynamic: true },
        drift: { min: -0.4, max: 0.4, dynamic: true },
        yRange: { min: 0.5, max: 1 },
    });
};
//#endregion

export function estimateAmbientDuration(ambient) {
    if (!ambient) return 1000;
    switch (ambient.type) {
        case 'long':
            return ambient.duration;
        case 'count':
            return ambient.count * ambient.delay;
        case 'onetime':
            return 1;
    }
    return 0;
}

export const ambients = {
    compute: {
        name: 'Computed Events',
        ambients: [
            {
                name: `Odoo Experience ${new Date().getFullYear()}`,
                id: 'odoo-experience-oxp-cpt',
                computeDates: async () => {
                    const event = await getEventWithName(`Odoo Experience ${new Date().getFullYear()}`, 'www.odoo.com');
                    if (!event) return undefined;

                    return {
                        date_from: yyyymmdd_hhmmssToDate(event.date_begin),
                        date_to: yyyymmdd_hhmmssToDate(event.date_end),
                    };
                },
                type: 'long',
                duration: 3000,
                load: schoolPrideLoader(['#FBB130', '#714b67', '#050a30']),
            },
        ],
    },
    event: {
        name: 'Events',
        ambients: [
            // experience: { // DONE ABOVE
            //     date_from: '2024-10-02T08:00:00+02:00',
            //     date_to: '2024-10-04T16:00:00+02:00',
            // },
            // tinyERPBirthday: {
            //     date: '2005-02-22T12:00:00Z',
            // },
            // openERPBirthday: {
            //     date: '2009-04-14T12:00:00Z',
            // },
            {
                name: 'Happy Birthday Odoo!',
                id: 'odoo-birthday-evt',
                date: '2014-05-15T12:00:00Z',
                type: 'count',
                count: 20,
                delay: 250,
                load: fireworkLoader(['#E46E78', '#21B799', '#5B899E', '#E4A900'], true, false, false),
            },
            {
                name: 'New Year, Countdown',
                id: 'new-year-evt',
                date_from: `${new Date().getFullYear()}-12-31T23:59:30`,
                date_to: `${new Date().getFullYear() + 1}-01-01T00:00:30`,
                type: 'count',
                count: 480,
                delay: 250,
                load: fireworkLoader(
                    [
                        // Palette 1
                        '#C63347',
                        '#F28E63',
                        '#FC7F81',
                        '#FAEFC4',
                        '#F9AE9B',
                        '#792BB2',
                        '#2E42CB',
                        '#F75781',
                        '#E365E4',
                        '#FA5348',
                        // Palette 2
                        '#FFD07E',
                        '#FA9B49',
                        '#90CA80',
                        '#62ABCC',
                        '#7984DE',
                        '#DE6C90',
                    ],
                    false,
                    true,
                    true
                ),
            },
        ],
    },
    yearly: {
        name: 'Every year, one day',
        ambients: [
            {
                name: 'New Year',
                id: 'new-year-yly',
                day: 1,
                month: 1,
                type: 'long',
                duration: 10000,
                load: schoolPrideLoader(['#BF7218', '#FADE98', '#F1A738', '#f9eb82', '#180D1C', '#514414']),
            },
            {
                name: "Valentine's Day",
                id: 'valentine-yly',
                day: 14,
                month: 2,
                type: 'count',
                count: 30,
                delay: 1000,
                load: floatingLoader(['♥️', '🌹']),
            },
            {
                name: "Lucky Day (St. Patrick's)",
                id: 'patrick-yly',
                day: 17,
                month: 3,
                type: 'onetime',
                load: (_ticks) => {
                    const emojisBitmap = ['🍻', '🪙', '🍀', '🌈'].map((emoji) =>
                        shapeFromText({ text: emoji, scalar: 4 })
                    );
                    return [
                        {
                            shapes: emojisBitmap,
                            origin: { y: 0.7 },
                            spread: 26,
                            startVelocity: 55,
                            particleCount: 50,
                            scalar: 2,
                        },
                        {
                            shapes: emojisBitmap,
                            origin: { y: 0.7 },
                            spread: 60,
                            particleCount: 40,
                            scalar: 2,
                        },
                        {
                            shapes: emojisBitmap,
                            origin: { y: 0.7 },
                            spread: 100,
                            decay: 0.91,
                            scalar: 1.6,
                            particleCount: 70,
                        },
                        {
                            shapes: emojisBitmap,
                            origin: { y: 0.7 },
                            spread: 120,
                            startVelocity: 25,
                            decay: 0.92,
                            scalar: 2.4,
                            particleCount: 20,
                        },
                        {
                            shapes: emojisBitmap,
                            origin: { y: 0.7 },
                            spread: 120,
                            scalar: 2,
                            startVelocity: 45,
                            particleCount: 20,
                        },
                    ];
                },
            },
            {
                name: "April Fool's",
                id: 'aprilfool-yly',
                day: 1,
                month: 4,
                type: 'count',
                count: 15,
                delay: 1000,
                load: (ticks) => {
                    const left = emojisLoader({
                        emojis: ['🐟', '🐠', '🐡'],
                        alpha: { max: 0.5, double: true },
                        size: { min: 4, max: 10, dynamic: true },
                        gravity: { min: -0.1, max: 0.1, dynamic: true },
                        drift: { min: -1, max: -0.3, dynamic: true },
                    })(ticks);
                    const right = emojisLoader({
                        emojis: ['🐟', '🐠', '🐡'],
                        alpha: { max: 0.5, double: true },
                        size: { min: 4, max: 10, dynamic: true },
                        gravity: { min: -0.1, max: 0.1, dynamic: true },
                        drift: { min: 0.3, max: 1, dynamic: true },
                        flipHorizontal: true,
                    })(ticks);
                    const bubble = shapesLoader({
                        shapes: [bubbles.large, bubbles.medium, bubbles.small],
                        alpha: { max: 0.2, double: true },
                        size: { min: 2, max: 5, dynamic: true },
                        gravity: { min: -0.4, max: -0.2, dynamic: true },
                        drift: { min: -0.4, max: 0.4, dynamic: true },
                        yRange: { min: 0.5, max: 1 },
                        colors: ['#89cff0', 'e7feff', '#a1caf1', '#39a78e'],
                    })(ticks);
                    return [left, right, bubble];
                },
            },
            {
                name: 'Halloween Night',
                id: 'halloween-yly',
                day: 31,
                month: 10,
                type: 'count',
                count: 30,
                delay: 1000,
                load: floatingLoader(['🎃']),
            },
            {
                name: "New Year's Eve",
                id: 'new-year-eve-yly',
                day: 31,
                month: 12,
                type: 'count',
                count: 30,
                delay: 1000,
                load: floatingLoader(['🥂']),
            },
        ],
    },
    // season: {
    //     winter: {},
    //     spring: {},
    //     summer: {},
    //     fall: {},
    // },
    // weather: {
    //     rain: {},
    //     snow: {},
    //     sun: {},
    // },
};

// Utils
function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

//#region SEASON
// export const fallSeasonLoader = emojisLoader({
//     emojis: ['🍂'],
//     alpha: { max: 0.5 },
//     size: { min: 1, max: 2, dynamic: true },
//     gravity: { min: 0.4, max: 0.9, dynamic: true },
//     drift: { min: -0.4, max: 0.4, dynamic: true },
//     yRange: { min: 0, max: 0.75 },
//     flat: false,
// });

// export const winterSeasonLoader = emojisLoader({
//     emojis: ['❄️', 'circle'],
//     alpha: { max: 1 },
//     size: { min: 0.4, max: 1, dynamic: true },
//     gravity: { min: 0.4, max: 0.6, dynamic: true },
//     drift: { min: -0.4, max: 0.4, dynamic: true },
//     yRange: { min: 0, max: 0.5 },
//     color: '#ffffff',
//     flat: false,
// });

// export const summerSeasonLoader = emojisLoader({
//     emojis: ['☀️'],
//     alpha: { max: 0.5 },
//     size: { min: 1, max: 2, dynamic: true },
//     gravity: { min: 0.4, max: 0.9, dynamic: true },
//     drift: { min: -0.4, max: 0.4, dynamic: true },
//     yRange: { min: 0, max: 0.75 },
//     flat: false,
// });

// export const springSeasonLoader = emojisLoader({
//     emojis: ['🌸'],
//     alpha: { max: 1 },
//     size: { min: 0.4, max: 1, dynamic: true },
//     gravity: { min: 0.4, max: 0.6, dynamic: true },
//     drift: { min: -0.4, max: 0.4, dynamic: true },
//     yRange: { min: 0, max: 0.5 },
//     color: '#ffffff',
//     flat: false,
// });
//#endregion

//#region WEATHER
// export const rainWeatherLoader = emojisLoader({
//     emojis: ['💧'],
//     alpha: { max: 1 },
//     size: { min: 0.1, max: 0.6, dynamic: true },
//     gravity: { min: 4, max: 5, dynamic: true },
//     drift: { min: -0.4, max: 0.4, dynamic: true },
//     yRange: { min: -0.1, max: 0 },
//     color: '#4a6583',
//     flat: true,
// });

// export const snowWeatherLoader = emojisLoader({
//     emojis: ['circle'],
//     alpha: { max: 1 },
//     size: { min: 0.1, max: 0.6, dynamic: true },
//     gravity: { min: 0.4, max: 0.6, dynamic: true },
//     drift: { min: -0.4, max: 0.4, dynamic: true },
//     yRange: { min: -0.1, max: 0.5 },
//     color: '#ffffff',
//     flat: false,
// });
//#endregion
