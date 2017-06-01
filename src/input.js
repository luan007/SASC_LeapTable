import { ctx2d } from './global.js'
import * as Leap from "leapjs"

const EASE_THRESHOLD = 0.1;
const EASE_RATIO = 0.2;

global.hoveringElement = undefined;

export var mouse = {
    x: 0,
    y: 0,
    z: 2080,
    ex: 0,
    ey: 0,
    ez: 0,
    px: 0,
    py: 0,
    pz: 0,
    dx: 0,
    dy: 0,
    dz: 0,
    grab: 0,
    pick: false,
    flying: false
};

function map(val, a, b, c, d) {
    return ((val - a) / (b - a)) * (d - c) + c;
}

global.NOLEAP = false;

Leap.loop(function (frame) {
    if (!global.NOLEAP) {
        if (frame.hands.length > 0) {

            var h = frame.hands[0].palmPosition;
            //   console.log(frame.hands[0]);
            mouse.x = map(h[0], -150, 150, 0, 1080);
            mouse.y = map(h[2], -150, 150, 0, 1080);
            mouse.z = map(h[1], 120, 500, 50, 2080);

            mouse.grab = frame.hands[0].grabStrength;
            mouse.pick = frame.hands[0].indexFinger.extended && mouse.grab > 0.8;
            mouse.flying = (mouse.grab < 0.4 && frame.hands[0].middleFinger.extended
                && frame.hands[0].indexFinger.extended && frame.hands[0].pinchStrength < 0.2);
        } else {
            mouse.flying = false;
        }
    }
});

document.addEventListener("mousedown", function (e) {
    mouse.flying = true;
});

document.addEventListener("mouseup", function (e) {
    mouse.flying = false;
});

document.addEventListener("mousemove", function (e) {
    mouse.x = e.pageX;
    mouse.y = e.pageY;
    mouse.z = 2080;
    if(mouse.flying) {
        mouse.z = 1000;
    }
});

export function updateInputEase() {
    ease(mouse, 'x', 'ex', EASE_RATIO, EASE_THRESHOLD);
    ease(mouse, 'y', 'ey', EASE_RATIO, EASE_THRESHOLD);
    ease(mouse, 'z', 'ez', EASE_RATIO, EASE_THRESHOLD);

    mouse.dx = mouse.ex - mouse.px;
    mouse.dy = mouse.ey - mouse.py;
    mouse.dz = mouse.ez - mouse.pz;
    mouse.px = mouse.ex;
    mouse.py = mouse.ey;
    mouse.pz = mouse.ez;
    // console.log(mouse.z);

    global.hoveringElement = document.elementFromPoint(mouse.ex, mouse.ey);

}

export function render_debug() {
    if (mouse.flying) {
        pushMatrix(ctx2d, () => {
            ctx2d.translate(mouse.ex, mouse.ey);
            ctx2d.scale(mouse.ez / 1080 * 3 + 1, mouse.ez / 1080 * 3 + 1);
            ctx2d.fillStyle = ("#fff");
            ctx2d.beginPath();
            ctx2d.arc(0, 0, 5, 0, Math.PI * 2);
            ctx2d.fill();
        });
    } else {
        pushMatrix(ctx2d, () => {
            ctx2d.translate(mouse.ex, mouse.ey);
            ctx2d.scale(mouse.ez / 1080 * 2 + 1, mouse.ez / 1080 * 2 + 1);
            ctx2d.strokeStyle = ("#fff");
            ctx2d.lineCap = "round";
            ctx2d.lineJoin = "round";
            ctx2d.lineWidth = 1;
            ctx2d.beginPath();
            ctx2d.moveTo(-5, 0);
            ctx2d.lineTo(5, 0);
            ctx2d.moveTo(0, -5);
            ctx2d.lineTo(0, 5);
            ctx2d.stroke();
        });
    }
}


global.mouse = mouse;