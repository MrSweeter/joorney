// Based on: https://github.com/catdad/canvas-confetti/blob/master/src/confetti.js

const global = globalThis;

export default class Confetti {
    constructor(canvas = null, globalOpts = { resize: true, disableForReducedMotion: true }) {
        this.cannon = new ConfettiCannon(canvas, globalOpts);
    }

    fire(options) {
        this.cannon.fire(options);
    }

    reset() {
        this.cannon.reset();
    }
}

class ConfettiCannon {
    constructor(canvas, globalOpts) {
        this.isLibCanvas = !canvas;
        this.allowResize = !!prop(globalOpts || {}, 'resize');
        this.disableForReducedMotion = prop(globalOpts, 'disableForReducedMotion', Boolean);
        this.resizer = this.isLibCanvas ? this.setCanvasWindowSize : this.setCanvasRectSize;
        this.initialized = false;
        this.preferLessMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion)').matches;
        this.animationObj = undefined;
        this.canvas = canvas;

        this.animator = new ConfettiAnimator();
    }

    //#region Canvas
    loadCanvas(zIndex) {
        if (this.isLibCanvas && this.animationObj) {
            // use existing canvas from in-progress animation
            this.canvas = this.animationObj.canvas;
        } else if (this.isLibCanvas && !this.canvas) {
            // create and initialize a new canvas
            this.canvas = this.getCanvas(zIndex);
            document.body.appendChild(this.canvas);
        }

        if (this.allowResize && !this.initialized) {
            // initialize the size of a user-supplied canvas
            this.resizer(this.canvas);
        }

        return this.canvas;
    }

    getCanvas(zIndex) {
        const canvas = document.createElement('canvas');

        canvas.style.position = 'fixed';
        canvas.style.top = '0px';
        canvas.style.left = '0px';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = zIndex;

        return canvas;
    }

    setCanvasRectSize(canvas) {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }

    setCanvasWindowSize(canvas) {
        canvas.width = document.documentElement.clientWidth;
        canvas.height = document.documentElement.clientHeight;
    }
    //#endregion

    fire(options) {
        if (this.disableForReducedMotion && this.preferLessMotion) {
            return promise((resolve) => resolve());
        }

        this.loadCanvas(prop(options, 'zIndex', Number));

        const size = {
            width: this.canvas.width,
            height: this.canvas.height,
        };

        this.initialized = true;

        function onResize() {
            // don't actually query the size here, since this
            // can execute frequently and rapidly
            size.width = size.height = null;
        }

        if (this.allowResize) global.addEventListener('resize', onResize, false);

        const fireDone = () => {
            this.animationObj = null;

            if (this.allowResize) global.removeEventListener('resize', onResize);

            if (this.isLibCanvas && this.canvas) {
                document.body.removeChild(this.canvas);
                this.canvas = null;
                this.initialized = false;
            }
        };

        return this.fireLocal(options, size, fireDone);
    }

    reset() {
        if (this.animationObj) this.animationObj.reset();
    }

    fireLocal(options, size, done) {
        const particleCount = prop(options, 'particleCount', onlyPositiveInt);
        const angle = prop(options, 'angle', Number);
        const spread = prop(options, 'spread', Number);
        const startVelocity = prop(options, 'startVelocity', Number);
        const decay = prop(options, 'decay', Number);
        const gravity = prop(options, 'gravity');
        const drift = prop(options, 'drift');
        const colors = prop(options, 'colors', colorsToRgb);
        const ticks = prop(options, 'ticks', Number);
        const shapes = prop(options, 'shapes');
        const scalar = prop(options, 'scalar');
        const flat = !!prop(options, 'flat');
        const origin = getOrigin(options);
        const alpha = getAlpha(options);

        let temp = particleCount;
        const fettis = [];

        const startX = this.canvas.width * origin.x;
        const startY = this.canvas.height * origin.y;

        while (temp--) {
            fettis.push(
                Fetti.randomPhysics({
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
        if (this.animationObj) return this.animationObj.addFettis(fettis);

        this.animationObj = this.animator.animate(this.canvas, fettis, this.resizer, size, done);
        return this.animationObj.promise;
    }
}

class ConfettiAnimator {
    constructor() {
        this.TIME = Math.floor(1000 / 60);
        this.frames = {};
        this.lastFrameTime = 0;

        if (typeof requestAnimationFrame === 'function' && typeof cancelAnimationFrame === 'function') {
            this.frame = (cb) => this.frameFct(cb);
            this.cancel = (id) => this.cancelFct(id);
        } else {
            this.frame = (cb) => setTimeout(cb, this.TIME);
            this.cancel = (timer) => clearTimeout(timer);
        }
    }

    onFrame(time, id, cb) {
        if (this.lastFrameTime === time || this.lastFrameTime + this.TIME - 1 < time) {
            this.lastFrameTime = time;
            delete this.frames[id];
            cb();
            return;
        }
        this.frames[id] = requestAnimationFrame((time) => this.onFrame(time, id, cb));
    }

    frameFct(cb) {
        const id = Math.random();
        this.frames[id] = requestAnimationFrame((time) => this.onFrame(time, id, cb));
        return id;
    }

    cancelFct(id) {
        if (frames[id]) cancelAnimationFrame(frames[id]);
    }

    animate(canvas, fettis, resizer, size, done) {
        let animatingFettis = fettis.slice();
        const context = canvas.getContext('2d');
        let animationFrame;
        let destroy;

        const self = this;
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

                    animatingFettis = animatingFettis.filter((fetti) => fetti.updateFetti(context));

                    if (animatingFettis.length) {
                        animationFrame = self.frame(update);
                    } else {
                        onDone();
                    }
                }

                animationFrame = self.frame(update);
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
                if (animationFrame) this.cancel(animationFrame);
                if (destroy) destroy();
            },
        };
    }
}

class Fetti {
    static randomPhysics(opts) {
        const radAngle = opts.angle * (Math.PI / 180);
        const radSpread = opts.spread * (Math.PI / 180);
        let scalar = opts.scalar;
        if (typeof scalar === 'function') {
            scalar = scalar() ?? 1;
        }
        let gravity = opts.gravity;
        if (typeof gravity === 'function') {
            gravity = gravity() ?? 1;
        }
        let drift = opts.drift;
        if (typeof drift === 'function') {
            drift = drift() ?? 1;
        }

        return new Fetti(
            opts.x,
            opts.y,
            Math.random() * 10,
            Math.min(0.11, Math.random() * 0.1 + 0.05),
            opts.startVelocity * 0.5 + Math.random() * opts.startVelocity,
            -radAngle + (0.5 * radSpread - Math.random() * radSpread),
            (Math.random() * (0.75 - 0.25) + 0.25) * Math.PI,
            opts.color,
            opts.shape,
            0,
            opts.ticks,
            opts.decay,
            drift,
            Math.random() + 2,
            0,
            0,
            0,
            0,
            gravity * 3,
            0.6,
            scalar,
            opts.flat,
            opts.alpha
        );
    }

    constructor(
        x,
        y,
        wobble,
        wobbleSpeed,
        velocity,
        angle2D,
        tiltAngle,
        color,
        shape,
        tick,
        totalTicks,
        decay,
        drift,
        random,
        tiltSin,
        tiltCos,
        wobbleX,
        wobbleY,
        gravity,
        ovalScalar,
        scalar,
        flat,
        alpha
    ) {
        this.x = x;
        this.y = y;
        this.wobble = wobble;
        this.wobbleSpeed = wobbleSpeed;
        this.velocity = velocity;
        this.angle2D = angle2D;
        this.tiltAngle = tiltAngle;
        this.color = color;
        this.shape = shape;
        this.tick = tick;
        this.totalTicks = totalTicks;
        this.decay = decay;
        this.drift = drift;
        this.random = random;
        this.tiltSin = tiltSin;
        this.tiltCos = tiltCos;
        this.wobbleX = wobbleX;
        this.wobbleY = wobbleY;
        this.gravity = gravity;
        this.ovalScalar = ovalScalar;
        this.scalar = scalar;
        this.flat = flat;
        this.alpha = alpha;
    }

    ellipse(context, x, y, radiusX, radiusY, rotation, startAngle, endAngle, antiClockwise) {
        context.save();
        context.translate(x, y);
        context.rotate(rotation);
        context.scale(radiusX, radiusY);
        context.arc(0, 0, 1, startAngle, endAngle, antiClockwise);
        context.restore();
    }

    updateFettiBitmap(context, x1, x2, y1, y2, alpha) {
        const rotation = (Math.PI / 10) * this.wobble;
        const scaleX = Math.abs(x2 - x1) * 0.1;
        const scaleY = Math.abs(y2 - y1) * 0.1;
        const width = this.shape.bitmap.width * this.scalar;
        const height = this.shape.bitmap.height * this.scalar;

        const matrix = new DOMMatrix([
            Math.cos(rotation) * scaleX,
            Math.sin(rotation) * scaleX,
            -Math.sin(rotation) * scaleY,
            Math.cos(rotation) * scaleY,
            this.x,
            this.y,
        ]);

        // apply the transform matrix from the confetti shape
        matrix.multiplySelf(new DOMMatrix(this.shape.matrix));

        const pattern = context.createPattern(this.shape.bitmap, 'no-repeat');
        pattern.setTransform(matrix);

        context.globalAlpha = alpha;
        context.fillStyle = pattern;
        context.fillRect(this.x - width / 2, this.y - height / 2, width, height);
        context.globalAlpha = 1;
    }

    updateFettiCircle(context, x1, x2, y1, y2) {
        context.ellipse
            ? context.ellipse(
                  this.x,
                  this.y,
                  Math.abs(x2 - x1) * this.ovalScalar,
                  Math.abs(y2 - y1) * this.ovalScalar,
                  (Math.PI / 10) * this.wobble,
                  0,
                  2 * Math.PI
              )
            : this.ellipse(
                  context,
                  this.x,
                  this.y,
                  Math.abs(x2 - x1) * this.ovalScalar,
                  Math.abs(y2 - y1) * this.ovalScalar,
                  (Math.PI / 10) * this.wobble,
                  0,
                  2 * Math.PI
              );
    }

    updateFettiStar(context) {
        let rot = (Math.PI / 2) * 3;
        const innerRadius = 4 * this.scalar;
        const outerRadius = 8 * this.scalar;
        let x = this.x;
        let y = this.y;
        let spikes = 5;
        const step = Math.PI / spikes;

        while (spikes--) {
            x = this.x + Math.cos(rot) * outerRadius;
            y = this.y + Math.sin(rot) * outerRadius;
            context.lineTo(x, y);
            rot += step;

            x = this.x + Math.cos(rot) * innerRadius;
            y = this.y + Math.sin(rot) * innerRadius;
            context.lineTo(x, y);
            rot += step;
        }
    }

    updateFetti(context) {
        this.x += Math.cos(this.angle2D) * this.velocity + this.drift;
        this.y += Math.sin(this.angle2D) * this.velocity + this.gravity;
        this.velocity *= this.decay;

        if (this.flat) {
            this.wobble = 0;
            this.wobbleX = this.x + 10 * this.scalar;
            this.wobbleY = this.y + 10 * this.scalar;

            this.tiltSin = 0;
            this.tiltCos = 0;
            this.random = 1;
        } else {
            this.wobble += this.wobbleSpeed;
            this.wobbleX = this.x + 10 * this.scalar * Math.cos(this.wobble);
            this.wobbleY = this.y + 10 * this.scalar * Math.sin(this.wobble);

            this.tiltAngle += 0.1;
            this.tiltSin = Math.sin(this.tiltAngle);
            this.tiltCos = Math.cos(this.tiltAngle);
            this.random = Math.random() + 2;
        }

        const progress = this.tick++ / this.totalTicks;

        const x1 = this.x + this.random * this.tiltCos;
        const y1 = this.y + this.random * this.tiltSin;
        const x2 = this.wobbleX + this.random * this.tiltCos;
        const y2 = this.wobbleY + this.random * this.tiltSin;

        let alpha = 1 - progress;
        if (this.alpha.invert) {
            alpha = progress;
        } else if (this.alpha.double) {
            alpha = progress < 0.5 ? progress / 0.5 : progress > 0.5 ? 1 - (progress / 0.5 - 1) : 1;
        }
        if (this.alpha.max) {
            alpha *= this.alpha.max;
        }

        context.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`;
        context.beginPath();

        if (this.shape.type === 'bitmap') {
            this.updateFettiBitmap(context, x1, x2, y1, y2, alpha);
        } else if (this.shape === 'circle') {
            this.updateFettiCircle(context, x1, x2, y1, y2);
        } else if (this.shape === 'star') {
            this.updateFettiStar(context);
        } else {
            context.moveTo(Math.floor(this.x), Math.floor(this.y));
            context.lineTo(Math.floor(this.wobbleX), Math.floor(y1));
            context.lineTo(Math.floor(x2), Math.floor(y2));
            context.lineTo(Math.floor(x1), Math.floor(this.wobbleY));
        }

        context.closePath();
        context.fill();

        return this.tick < this.totalTicks;
    }
}

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

function getAlpha(options) {
    const alpha = prop(options, 'alpha', Object);
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

export function shapeFromText(textData) {
    let text;
    let scalar = 1;
    let color = '#000000';
    let // see https://nolanlawson.com/2022/04/08/the-struggle-of-using-native-emoji-on-the-web/
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
    const fontSize = 10 * scalar;
    const font = `${fontSize}px ${fontFamily}`;

    let canvas = new OffscreenCanvas(fontSize, fontSize);
    let ctx = canvas.getContext('2d');

    ctx.font = font;
    const size = ctx.measureText(text);
    const width = Math.floor(size.width);
    const height = Math.floor(size.fontBoundingBoxAscent + size.fontBoundingBoxDescent);

    canvas = new OffscreenCanvas(width, height);
    ctx = canvas.getContext('2d');
    ctx.font = font;
    ctx.fillStyle = color;

    ctx.fillText(text, 0, fontSize);

    const scale = 1 / scalar;

    return {
        type: 'bitmap',
        // TODO these probably need to be transfered for workers
        bitmap: canvas.transferToImageBitmap(),
        matrix: [scale, 0, 0, scale, (-width * scale) / 2, (-height * scale) / 2],
    };
}

//#endregion

function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}
