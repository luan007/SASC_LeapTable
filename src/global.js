export * from "./input.js"

export var canvas2d = document.createElement("canvas");
export var ctx2d = canvas2d.getContext('2d');

global.t = 0;
global.sinT = 0;
global.cosT = 0;

export function update() {
    t += 0.001;
    sinT = Math.sin(t);
    cosT = Math.cos(t);
}

global.pushMatrix = function (ctx, job) {
    ctx.save();
    job();
    ctx.restore();
}



canvas2d.height = 1080;
canvas2d.width = 1080;
canvas2d.id = "canvas2d";



global.hsl = function (h, s, l) {
    var r, g, b;
    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        var hue2rgb = function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}`;
}


global.hsl_raw = function (h, s, l) {
    var r, g, b;
    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        var hue2rgb = function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [r, g, b];
}


global.distsq = function (a, b, c, d) {
    return (a - c) * (a - c) + (b - d) * (b - d);
}

global.dist = function (a, b, c, d) {
    return Math.sqrt(distsq(a, b, c, d));
}


global.ease = function(obj, a, b, ratio = 0.1, threshold = 0.01) {
    if (Math.abs(obj[a] - obj[b]) > threshold ) {
        obj[b] += (obj[a] - obj[b]) * ratio;
    } else if(obj[a] !== obj[b]) {
        obj[b] = obj[a];
    }
}


canvas2d.style.zIndex = 998988;
document.body.appendChild(canvas2d);