const lockedState = ['circle', 'square', 'star'];

const emojisLoader = ({
    emojis,
    alpha = { max: alphaMax, double: true },
    size = { min: 1, max: 1, dynamic: false },
    gravity = { min: 0.4, max: 0.6, dynamic: false },
    drift = { min: -0.4, max: 0.4, dynamic: false },
    xRange = { min: 0, max: 1 },
    yRange = { min: 0, max: 1 }, // Top = 0, Bottom = 1
    color = '#ffffff',
    flat = true,
}) => {
    const emojisBitmap = emojis.map((emoji) =>
        lockedState.includes(emoji)
            ? emoji
            : shapeFromText({ text: emoji, scalar: size.max, color: color })
    );

    const scalarComputed = size.dynamic
        ? () => Math.round(randomInRange(size.min, size.max))
        : size.max;
    const gravityComputed = gravity.dynamic
        ? () => randomInRange(gravity.min, gravity.max)
        : gravity.max;
    const driftComputed = drift.dynamic ? () => randomInRange(drift.min, drift.max) : drift.max;

    return (ticks) => {
        return {
            flat: flat,
            particleCount: 1,
            startVelocity: 0,
            ticks: ticks,
            origin: {
                x: randomInRange(xRange.min, xRange.max),
                y: randomInRange(yRange.min, yRange.max),
            },
            colors: [color],
            shapes: emojisBitmap,
            gravity: gravityComputed,
            scalar: scalarComputed,
            drift: driftComputed,
            alpha: alpha,
        };
    };
};

const defaultLoader = (falling, ...emojis) =>
    emojisLoader({
        emojis: emojis,
        alpha: { max: 1 },
        size: { min: 0.4, max: 1, dynamic: true },
        gravity: { min: falling ? 0.4 : -0.6, max: falling ? 0.6 : -0.4, dynamic: true },
        drift: { min: -0.4, max: 0.4, dynamic: true },
        flat: false,
    });

//#region DAYS

const halloweenLoader = emojisLoader({
    emojis: ['🎃'],
    alpha: { max: 0.2, double: true },
    size: { min: 8, max: 20, dynamic: true },
    gravity: { min: -0.6, max: -0.4, dynamic: true },
    drift: { min: -0.4, max: 0.4, dynamic: true },
    yRange: { min: 0.5, max: 1 },
});

const birthdayLoader = () => {
    const scalar = 2;
    const scalarName = 4;
    // 🥳🎂🎉
    const emoji1 = shapeFromText({ text: '🎂', scalar: scalar });
    const emoji2 = shapeFromText({ text: '🎉', scalar: scalar });
    const emoji3 = shapeFromText({ text: '🥳', scalar: scalar });
    const name = shapeFromText({ text: 'John', scalar: scalarName });
    return [
        {
            scalar: scalar,
            spread: 180,
            particleCount: 60,
            origin: { y: -0.1 },
            startVelocity: -25,
            shapes: [emoji1],
        },
        {
            scalar: scalar,
            spread: 180,
            particleCount: 60,
            origin: { y: -0.1 },
            startVelocity: -25,
            shapes: [emoji2],
        },
        {
            scalar: scalar,
            spread: 180,
            particleCount: 60,
            origin: { y: -0.1 },
            startVelocity: -25,
            shapes: [emoji3],
        },
        {
            scalar: scalarName,
            spread: 0,
            particleCount: 1,
            origin: { y: -0.1 },
            startVelocity: -5,
            shapes: [name],
            flat: true,
        },
    ];
};

const newYearLoader = (ticks) => [
    {
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#E46E78', '#21B799', '#5B899E', '#E4A900'],
    },
    {
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#E46E78', '#21B799', '#5B899E', '#E4A900'],
    },
];

const textLoader = (text) =>
    emojisLoader({
        emojis: [text],
        alpha: { max: 0.2, double: true },
        size: { min: 8, max: 20, dynamic: true },
        gravity: { min: -0.6, max: -0.4, dynamic: true },
        drift: { min: -0.4, max: 0.4, dynamic: true },
        yRange: { min: 0.5, max: 1 },
        color: '#E4A900', // TODO Color for text not working due to fontFamily
    });

//#endregion

//#region SEASON

const fallSeasonLoader = emojisLoader({
    emojis: ['🍂'],
    alpha: { max: 0.5 },
    size: { min: 1, max: 2, dynamic: true },
    gravity: { min: 0.4, max: 0.9, dynamic: true },
    drift: { min: -0.4, max: 0.4, dynamic: true },
    yRange: { min: 0, max: 0.75 },
    flat: false,
});

const winterSeasonLoader = emojisLoader({
    emojis: ['❄️', 'circle'],
    alpha: { max: 1 },
    size: { min: 0.4, max: 1, dynamic: true },
    gravity: { min: 0.4, max: 0.6, dynamic: true },
    drift: { min: -0.4, max: 0.4, dynamic: true },
    yRange: { min: 0, max: 0.5 },
    color: '#ffffff',
    flat: false,
});

//#endregion
