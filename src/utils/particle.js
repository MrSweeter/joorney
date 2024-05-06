// Based on: https://github.com/catdad/canvas-confetti/blob/master/src/confetti.js

const global = globalThis;

//#region Confetti
export function confetti(options) {
    getDefaultCanoon().fire(options);
}
export function reset() {
    getDefaultCanoon().reset();
}

// Make default export lazy to defer worker creation until called (worker logic removed for now).
let defaultCanoon;
function getDefaultCanoon() {
    if (!defaultCanoon) {
        defaultCanoon = confettiCannon(null, { resize: true });
    }
    return defaultCanoon;
}

function confettiCannon(canvasArg, globalOpts) {
    let canvas = canvasArg;
    const isLibCanvas = !canvas;
    const allowResize = !!prop(globalOpts || {}, 'resize');
    const globalDisableForReducedMotion = prop(globalOpts, 'disableForReducedMotion', Boolean);
    const resizer = isLibCanvas ? setCanvasWindowSize : setCanvasRectSize;
    let initialized = false;
    const preferLessMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion)').matches;
    let animationObj;

    function fireLocal(options, size, done) {
        const particleCount = prop(options, 'particleCount', onlyPositiveInt);
        const angle = prop(options, 'angle', Number);
        const spread = prop(options, 'spread', Number);
        const startVelocity = prop(options, 'startVelocity', Number);
        const decay = prop(options, 'decay', Number);
        const gravity = prop(options, 'gravity', Number);
        const drift = prop(options, 'drift', Number);
        const colors = prop(options, 'colors', colorsToRgb);
        const ticks = prop(options, 'ticks', Number);
        const shapes = prop(options, 'shapes');
        const scalar = prop(options, 'scalar');
        const origin = getOrigin(options);

        let temp = particleCount;
        const fettis = [];

        const startX = canvas.width * origin.x;
        const startY = canvas.height * origin.y;

        while (temp--) {
            fettis.push(
                randomPhysics({
                    x: startX,
                    y: startY,
                    angle: angle,
                    spread: spread,
                    startVelocity: startVelocity,
                    color: colors[temp % colors.length],
                    shape: shapes[randomInt(0, shapes.length)],
                    ticks: ticks,
                    decay: decay,
                    gravity: gravity,
                    drift: drift,
                    scalar: scalar,
                })
            );
        }

        // if we have a previous canvas already animating, add to it
        if (animationObj) return animationObj.addFettis(fettis);

        animationObj = animate(canvas, fettis, resizer, size, done);
        return animationObj.promise;
    }

    const canoon = {};
    canoon.fire = (options) => {
        const disableForReducedMotion =
            globalDisableForReducedMotion || prop(options, 'disableForReducedMotion', Boolean);
        const zIndex = prop(options, 'zIndex', Number);

        if (disableForReducedMotion && preferLessMotion) {
            return promise((resolve) => resolve());
        }

        if (isLibCanvas && animationObj) {
            // use existing canvas from in-progress animation
            canvas = animationObj.canvas;
        } else if (isLibCanvas && !canvas) {
            // create and initialize a new canvas
            canvas = getCanvas(zIndex);
            document.body.appendChild(canvas);
        }

        if (allowResize && !initialized) {
            // initialize the size of a user-supplied canvas
            resizer(canvas);
        }

        const size = {
            width: canvas.width,
            height: canvas.height,
        };

        initialized = true;

        function onResize() {
            // don't actually query the size here, since this
            // can execute frequently and rapidly
            size.width = size.height = null;
        }

        function done() {
            animationObj = null;

            if (allowResize) global.removeEventListener('resize', onResize);

            if (isLibCanvas && canvas) {
                document.body.removeChild(canvas);
                canvas = null;
                initialized = false;
            }
        }

        if (allowResize) global.addEventListener('resize', onResize, false);

        return fireLocal(options, size, done);
    };

    canoon.reset = () => {
        if (animationObj) animationObj.reset();
    };

    return canoon;
}

function randomPhysics(opts) {
    const radAngle = opts.angle * (Math.PI / 180);
    const radSpread = opts.spread * (Math.PI / 180);

    return {
        x: opts.x,
        y: opts.y,
        wobble: Math.random() * 10,
        wobbleSpeed: Math.min(0.11, Math.random() * 0.1 + 0.05),
        velocity: opts.startVelocity * 0.5 + Math.random() * opts.startVelocity,
        angle2D: -radAngle + (0.5 * radSpread - Math.random() * radSpread),
        tiltAngle: (Math.random() * (0.75 - 0.25) + 0.25) * Math.PI,
        color: opts.color,
        shape: opts.shape,
        tick: 0,
        totalTicks: opts.ticks,
        decay: opts.decay,
        drift: opts.drift,
        random: Math.random() + 2,
        tiltSin: 0,
        tiltCos: 0,
        wobbleX: 0,
        wobbleY: 0,
        gravity: opts.gravity * 3,
        ovalScalar: 0.6,
        scalar: opts.scalar,
    };
}
//#endregion

//#region Animate
function requestAnimationFrameQoL() {
    const TIME = Math.floor(1000 / 60);
    let frame;
    let cancel;
    const frames = {};
    let lastFrameTime = 0;

    if (typeof requestAnimationFrame === 'function' && typeof cancelAnimationFrame === 'function') {
        frame = (cb) => {
            const id = Math.random();
            const onFrame = (time) => {
                if (lastFrameTime === time || lastFrameTime + TIME - 1 < time) {
                    lastFrameTime = time;
                    delete frames[id];
                    cb();
                    return;
                }
                frames[id] = requestAnimationFrame(onFrame);
            };

            frames[id] = requestAnimationFrame(onFrame);
            return id;
        };
        cancel = (id) => {
            if (frames[id]) cancelAnimationFrame(frames[id]);
        };
    } else {
        frame = (cb) => setTimeout(cb, TIME);
        cancel = (timer) => clearTimeout(timer);
    }

    return { frame: frame, cancel: cancel };
}

const raf = requestAnimationFrameQoL();

function animate(canvas, fettis, resizer, size, done) {
    let animatingFettis = fettis.slice();
    const context = canvas.getContext('2d');
    let animationFrame;
    let destroy;

    function getAnimatePromise() {
        return promise((resolve) => {
            function onDone() {
                animationFrame = destroy = null;
                context.clearRect(0, 0, size.width, size.height);

                done();
                resolve();
            }

            function update() {
                if (!size.width && !size.height) {
                    resizer(canvas);
                    size.width = canvas.width;
                    size.height = canvas.height;
                }

                context.clearRect(0, 0, size.width, size.height);

                animatingFettis = animatingFettis.filter((fetti) => updateFetti(context, fetti));

                if (animatingFettis.length) {
                    animationFrame = raf.frame(update);
                } else {
                    onDone();
                }
            }

            animationFrame = raf.frame(update);
            destroy = onDone;
        });
    }

    const prom = getAnimatePromise();

    return {
        canvas: canvas,
        promise: prom,
        addFettis: (fettis) => {
            animatingFettis = animatingFettis.concat(fettis);
            return prom;
        },
        reset: () => {
            if (animationFrame) raf.cancel(animationFrame);
            if (destroy) destroy();
        },
    };
}
//#endregion

//#region Fetti
function ellipse(context, x, y, radiusX, radiusY, rotation, startAngle, endAngle, antiClockwise) {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.scale(radiusX, radiusY);
    context.arc(0, 0, 1, startAngle, endAngle, antiClockwise);
    context.restore();
}

function updateFettiCircle(context, fetti, x1, x2, y1, y2) {
    context.ellipse
        ? context.ellipse(
              fetti.x,
              fetti.y,
              Math.abs(x2 - x1) * fetti.ovalScalar,
              Math.abs(y2 - y1) * fetti.ovalScalar,
              (Math.PI / 10) * fetti.wobble,
              0,
              2 * Math.PI
          )
        : ellipse(
              context,
              fetti.x,
              fetti.y,
              Math.abs(x2 - x1) * fetti.ovalScalar,
              Math.abs(y2 - y1) * fetti.ovalScalar,
              (Math.PI / 10) * fetti.wobble,
              0,
              2 * Math.PI
          );
}

function updateFettiStar(context, fetti) {
    let rot = (Math.PI / 2) * 3;
    const innerRadius = 4 * fetti.scalar;
    const outerRadius = 8 * fetti.scalar;
    let x = fetti.x;
    let y = fetti.y;
    let spikes = 5;
    const step = Math.PI / spikes;

    while (spikes--) {
        x = fetti.x + Math.cos(rot) * outerRadius;
        y = fetti.y + Math.sin(rot) * outerRadius;
        context.lineTo(x, y);
        rot += step;

        x = fetti.x + Math.cos(rot) * innerRadius;
        y = fetti.y + Math.sin(rot) * innerRadius;
        context.lineTo(x, y);
        rot += step;
    }
}

function updateFetti(context, fetti) {
    fetti.x += Math.cos(fetti.angle2D) * fetti.velocity + fetti.drift;
    fetti.y += Math.sin(fetti.angle2D) * fetti.velocity + fetti.gravity;
    fetti.wobble += fetti.wobbleSpeed;
    fetti.velocity *= fetti.decay;
    fetti.tiltAngle += 0.1;
    fetti.tiltSin = Math.sin(fetti.tiltAngle);
    fetti.tiltCos = Math.cos(fetti.tiltAngle);
    fetti.random = Math.random() + 2;
    fetti.wobbleX = fetti.x + 10 * fetti.scalar * Math.cos(fetti.wobble);
    fetti.wobbleY = fetti.y + 10 * fetti.scalar * Math.sin(fetti.wobble);

    const progress = fetti.tick++ / fetti.totalTicks;

    const x1 = fetti.x + fetti.random * fetti.tiltCos;
    const y1 = fetti.y + fetti.random * fetti.tiltSin;
    const x2 = fetti.wobbleX + fetti.random * fetti.tiltCos;
    const y2 = fetti.wobbleY + fetti.random * fetti.tiltSin;

    context.fillStyle = `rgba(${fetti.color.r}, ${fetti.color.g}, ${fetti.color.b}, ${1 - progress})`;
    context.beginPath();

    if (fetti.shape === 'circle') {
        updateFettiCircle(context, fetti, x1, x2, y1, y2);
    } else if (fetti.shape === 'star') {
        updateFettiStar(context, fetti);
    } else {
        context.moveTo(Math.floor(fetti.x), Math.floor(fetti.y));
        context.lineTo(Math.floor(fetti.wobbleX), Math.floor(y1));
        context.lineTo(Math.floor(x2), Math.floor(y2));
        context.lineTo(Math.floor(x1), Math.floor(fetti.wobbleY));
    }

    context.closePath();
    context.fill();

    return fetti.tick < fetti.totalTicks;
}
//#endregion

//#region Options
const defaults = {
    particleCount: 50,
    angle: 90,
    spread: 45,
    startVelocity: 45,
    decay: 0.9,
    gravity: 1,
    drift: 0,
    ticks: 200,
    x: 0.5,
    y: 0.5,
    shapes: ['square', 'circle'],
    zIndex: 100,
    colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'],
    // probably should be true, but back-compat
    disableForReducedMotion: false,
    scalar: 1,
};

function getOrigin(options) {
    const origin = prop(options, 'origin', Object);
    origin.x = prop(origin, 'x', Number);
    origin.y = prop(origin, 'y', Number);

    return origin;
}

function convert(val, transform) {
    return transform ? transform(val) : val;
}

function isOk(val) {
    return !(val === null || val === undefined);
}

function prop(options, name, transform) {
    return convert(options && isOk(options[name]) ? options[name] : defaults[name], transform);
}
//#endregion

//#region Canvas
function getCanvas(zIndex) {
    const canvas = document.createElement('canvas');

    canvas.style.position = 'fixed';
    canvas.style.top = '0px';
    canvas.style.left = '0px';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = zIndex;

    return canvas;
}

function setCanvasRectSize(canvas) {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}

function setCanvasWindowSize(canvas) {
    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;
}
//#endregion

//#region Utils
function promise(func) {
    return new Promise(func);
}

function onlyPositiveInt(number) {
    return number < 0 ? 0 : Math.floor(number);
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function toDecimal(str) {
    return Number.parseInt(str, 16);
}

function colorsToRgb(colors) {
    return colors.map(hexToRgb);
}

function hexToRgb(str) {
    let val = String(str).replace(/[^0-9a-f]/gi, '');

    if (val.length < 6) {
        val = val[0] + val[0] + val[1] + val[1] + val[2] + val[2];
    }

    return {
        r: toDecimal(val.substring(0, 2)),
        g: toDecimal(val.substring(2, 4)),
        b: toDecimal(val.substring(4, 6)),
    };
}
//#endregion
