function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

// Based on: https://github.com/catdad/canvas-confetti/blob/master/src/confetti.js

const global = globalThis;

//#region Confetti
function confetti(options) {
    getDefaultCanoon().fire(options);
}
function reset() {
    getDefaultCanoon().reset();
}

// Make default export lazy to defer worker creation until called (worker logic removed for now).
var defaultCanoon;
function getDefaultCanoon() {
    if (!defaultCanoon) {
        defaultCanoon = confettiCannon(null, { resize: true });
    }
    return defaultCanoon;
}

function confettiCannon(canvas, globalOpts) {
    var isLibCanvas = !canvas;
    var allowResize = !!prop(globalOpts || {}, 'resize');
    var globalDisableForReducedMotion = prop(globalOpts, 'disableForReducedMotion', Boolean);
    var resizer = isLibCanvas ? setCanvasWindowSize : setCanvasRectSize;
    var initialized = false;
    var preferLessMotion =
        typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion)').matches;
    var animationObj;

    function fireLocal(options, size, done) {
        var particleCount = prop(options, 'particleCount', onlyPositiveInt);
        var angle = prop(options, 'angle', Number);
        var spread = prop(options, 'spread', Number);
        var startVelocity = prop(options, 'startVelocity', Number);
        var decay = prop(options, 'decay', Number);
        var gravity = prop(options, 'gravity');
        var drift = prop(options, 'drift');
        var colors = prop(options, 'colors', colorsToRgb);
        var ticks = prop(options, 'ticks', Number);
        var shapes = prop(options, 'shapes');
        var scalar = prop(options, 'scalar');
        var flat = !!prop(options, 'flat');
        var origin = getOrigin(options);
        var alpha = getAlpha(options);

        var temp = particleCount;
        var fettis = [];

        var startX = canvas.width * origin.x;
        var startY = canvas.height * origin.y;

        while (temp--) {
            fettis.push(
                randomPhysics({
                    x: startX,
                    y: startY,
                    angle: angle,
                    spread: spread,
                    startVelocity: startVelocity,
                    color:
                        colors.length <= particleCount
                            ? colors[temp % colors.length]
                            : colors[Math.round(randomInRange(0, colors.length - 1))],
                    shape: shapes[randomInt(0, shapes.length)],
                    ticks: ticks,
                    decay: decay,
                    gravity: gravity,
                    drift: drift,
                    scalar: scalar,
                    flat: flat,
                    alpha: alpha,
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
        var disableForReducedMotion =
            globalDisableForReducedMotion || prop(options, 'disableForReducedMotion', Boolean);
        var zIndex = prop(options, 'zIndex', Number);

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

        var size = {
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
    var radAngle = opts.angle * (Math.PI / 180);
    var radSpread = opts.spread * (Math.PI / 180);
    var scalar = opts.scalar;
    if (typeof scalar === 'function') {
        scalar = scalar() ?? 1;
    }
    var gravity = opts.gravity;
    if (typeof gravity === 'function') {
        gravity = gravity() ?? 1;
    }
    var drift = opts.drift;
    if (typeof drift === 'function') {
        drift = drift() ?? 1;
    }

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
        drift: drift,
        random: Math.random() + 2,
        tiltSin: 0,
        tiltCos: 0,
        wobbleX: 0,
        wobbleY: 0,
        gravity: gravity * 3,
        ovalScalar: 0.6,
        scalar: scalar,
        flat: opts.flat,
        alpha: opts.alpha,
    };
}
//#endregion

//#region Animate
function requestAnimationFrameQoL() {
    var TIME = Math.floor(1000 / 60);
    var frame, cancel;
    var frames = {};
    var lastFrameTime = 0;

    if (typeof requestAnimationFrame === 'function' && typeof cancelAnimationFrame === 'function') {
        frame = (cb) => {
            var id = Math.random();
            var onFrame = (time) => {
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
    var animatingFettis = fettis.slice();
    var context = canvas.getContext('2d');
    var animationFrame;
    var destroy;

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

                animatingFettis = animatingFettis.filter(function (fetti) {
                    return updateFetti(context, fetti);
                });

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

    var prom = getAnimatePromise();

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

function updateFettiBitmap(context, fetti, x1, x2, y1, y2, alpha) {
    var rotation = (Math.PI / 10) * fetti.wobble;
    var scaleX = Math.abs(x2 - x1) * 0.1;
    var scaleY = Math.abs(y2 - y1) * 0.1;
    var width = fetti.shape.bitmap.width * fetti.scalar;
    var height = fetti.shape.bitmap.height * fetti.scalar;

    var matrix = new DOMMatrix([
        Math.cos(rotation) * scaleX,
        Math.sin(rotation) * scaleX,
        -Math.sin(rotation) * scaleY,
        Math.cos(rotation) * scaleY,
        fetti.x,
        fetti.y,
    ]);

    // apply the transform matrix from the confetti shape
    matrix.multiplySelf(new DOMMatrix(fetti.shape.matrix));

    var pattern = context.createPattern(fetti.shape.bitmap, 'no-repeat');
    pattern.setTransform(matrix);

    context.globalAlpha = alpha;
    context.fillStyle = pattern;
    context.fillRect(fetti.x - width / 2, fetti.y - height / 2, width, height);
    context.globalAlpha = 1;
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
    var rot = (Math.PI / 2) * 3;
    var innerRadius = 4 * fetti.scalar;
    var outerRadius = 8 * fetti.scalar;
    var x = fetti.x;
    var y = fetti.y;
    var spikes = 5;
    var step = Math.PI / spikes;

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
    fetti.velocity *= fetti.decay;

    if (fetti.flat) {
        fetti.wobble = 0;
        fetti.wobbleX = fetti.x + 10 * fetti.scalar;
        fetti.wobbleY = fetti.y + 10 * fetti.scalar;

        fetti.tiltSin = 0;
        fetti.tiltCos = 0;
        fetti.random = 1;
    } else {
        fetti.wobble += fetti.wobbleSpeed;
        fetti.wobbleX = fetti.x + 10 * fetti.scalar * Math.cos(fetti.wobble);
        fetti.wobbleY = fetti.y + 10 * fetti.scalar * Math.sin(fetti.wobble);

        fetti.tiltAngle += 0.1;
        fetti.tiltSin = Math.sin(fetti.tiltAngle);
        fetti.tiltCos = Math.cos(fetti.tiltAngle);
        fetti.random = Math.random() + 2;
    }

    var progress = fetti.tick++ / fetti.totalTicks;

    var x1 = fetti.x + fetti.random * fetti.tiltCos;
    var y1 = fetti.y + fetti.random * fetti.tiltSin;
    var x2 = fetti.wobbleX + fetti.random * fetti.tiltCos;
    var y2 = fetti.wobbleY + fetti.random * fetti.tiltSin;

    var alpha = 1 - progress;
    if (fetti.alpha.invert) {
        alpha = progress;
    } else if (fetti.alpha.double) {
        alpha = progress < 0.5 ? progress / 0.5 : progress > 0.5 ? 1 - (progress / 0.5 - 1) : 1;
    }
    if (fetti.alpha.max) {
        alpha *= fetti.alpha.max;
    }

    context.fillStyle =
        'rgba(' + fetti.color.r + ', ' + fetti.color.g + ', ' + fetti.color.b + ', ' + alpha + ')';
    context.beginPath();

    if (fetti.shape.type === 'bitmap') {
        updateFettiBitmap(context, fetti, x1, x2, y1, y2, alpha);
    } else if (fetti.shape === 'circle') {
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
var defaults = {
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
    var origin = prop(options, 'origin', Object);
    origin.x = prop(origin, 'x', Number);
    origin.y = prop(origin, 'y', Number);

    return origin;
}

function getAlpha(options) {
    var alpha = prop(options, 'alpha', Object);
    alpha.max = prop(alpha, 'max', Number);
    alpha.double = prop(alpha, 'double', Boolean);
    alpha.invert = prop(alpha, 'invert', Boolean);

    return alpha;
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
    var canvas = document.createElement('canvas');

    canvas.style.position = 'fixed';
    canvas.style.top = '0px';
    canvas.style.left = '0px';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = zIndex;

    return canvas;
}

function setCanvasRectSize(canvas) {
    var rect = canvas.getBoundingClientRect();
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
    return parseInt(str, 16);
}

function colorsToRgb(colors) {
    return colors.map(hexToRgb);
}

function hexToRgb(str) {
    var val = String(str).replace(/[^0-9a-f]/gi, '');

    if (val.length < 6) {
        val = val[0] + val[0] + val[1] + val[1] + val[2] + val[2];
    }

    return {
        r: toDecimal(val.substring(0, 2)),
        g: toDecimal(val.substring(2, 4)),
        b: toDecimal(val.substring(4, 6)),
    };
}

function shapeFromText(textData) {
    var text,
        scalar = 1,
        color = '#000000',
        // see https://nolanlawson.com/2022/04/08/the-struggle-of-using-native-emoji-on-the-web/
        fontFamily =
            '"Twemoji Mozilla", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "EmojiOne Color", "Android Emoji", "system emoji", sans-serif';

    if (typeof textData === 'string') {
        text = textData;
    } else {
        text = textData.text;
        scalar = 'scalar' in textData ? textData.scalar : scalar;
        fontFamily = 'fontFamily' in textData ? textData.fontFamily : fontFamily;
        color = 'color' in textData ? textData.color : color;
    }

    // all other confetti are 10 pixels,
    // so this pixel size is the de-facto 100% scale confetti
    var fontSize = 10 * scalar;
    var font = '' + fontSize + 'px ' + fontFamily;

    var canvas = new OffscreenCanvas(fontSize, fontSize);
    var ctx = canvas.getContext('2d');

    ctx.font = font;
    var size = ctx.measureText(text);
    var width = Math.floor(size.width);
    var height = Math.floor(size.fontBoundingBoxAscent + size.fontBoundingBoxDescent);

    canvas = new OffscreenCanvas(width, height);
    ctx = canvas.getContext('2d');
    ctx.font = font;
    ctx.fillStyle = color;

    ctx.fillText(text, 0, fontSize);

    var scale = 1 / scalar;

    return {
        type: 'bitmap',
        // TODO these probably need to be transfered for workers
        bitmap: canvas.transferToImageBitmap(),
        matrix: [scale, 0, 0, scale, (-width * scale) / 2, (-height * scale) / 2],
    };
}

//#endregion
