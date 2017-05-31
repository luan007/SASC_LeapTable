import { ctx2d } from './global.js'
import * as Leap from "leapjs"

const EASE_THRESHOLD = 0.1;
const EASE_RATIO = 0.2;

global.hoveringElement = undefined;

export var mouse = {
    x: 0,
    y: 0,
    z: 0,
    ex: 0,
    ey: 0,
    ez: 0
};

function map(val, a, b, c, d) {
    return ((val - a) / (b - a)) * (d - c) + c;
}

Leap.loop(function (frame) {
    if (frame.hands.length > 0) {
        var h = frame.hands[0].palmPosition;
        //   console.log(h);
        mouse.x = map(h[0], -150, 150, 0, 1080);
        mouse.y = map(h[2], -150, 150, 0, 1080);
        mouse.z = map(h[1], 0, 500, 50, 2080);
        //   console.log(h[1]);
    }
});

document.addEventListener("mousemove", function (e) {
    //mouse.x = e.pageX;
    //mouse.y = e.pageY;
    // mouse.z = 0;
});

export function updateInputEase() {
    ease(mouse, 'x', 'ex', EASE_RATIO, EASE_THRESHOLD);
    ease(mouse, 'y', 'ey', EASE_RATIO, EASE_THRESHOLD);
    ease(mouse, 'z', 'ez', EASE_RATIO, EASE_THRESHOLD);
    global.hoveringElement = document.elementFromPoint(mouse.ex, mouse.ey);

}

export function render_debug() {
    pushMatrix(ctx2d, () => {
        ctx2d.translate(mouse.ex, mouse.ey);
        ctx2d.scale(mouse.ez / 1080 * 3 + 1, mouse.ez / 1080 * 3 + 1);
        ctx2d.fillStyle = ("#fff");
        ctx2d.beginPath();
        ctx2d.arc(0, 0, 5, 0, Math.PI * 2);
        ctx2d.fill();
    });
}


global.mouse = mouse;