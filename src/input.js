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
    flying: false,
    highlock: false,
    dataRingVisible: false
};

function updateMouseLogic() {
    mouse.z = Math.min(1500, Math.max(mouse.z, 100));
    var highlock = mouse.ez > 1000;
    if (highlock != mouse.highlock) {
        //highlock
        mouse.highlock = highlock;
        if (!highlock) {
            mouse.flying = true;
        }
    }
    if (mouse.highlock) {
        mouse.flying = true;
    }
    else {
        if (mouse.clicked) {
            mouse.flying = !mouse.flying;
        }
    }
    mouse.clicked = false;
    mouse.dataRingVisible = !mouse.flying || mouse.highlock;
}


function map(val, a, b, c, d) {
    return ((val - a) / (b - a)) * (d - c) + c;
}

global.NOLEAP = true;

Leap.loop(function (frame) {
    if (!global.NOLEAP) {
        if (frame.hands.length > 0) {

            var h = frame.hands[0].palmPosition;
            //   console.log(frame.hands[0]);
            mouse.x = map(h[0], -150, 150, 0, 1080);
            mouse.y = map(h[2], -150, 150, 0, 1080);
            mouse.z = Math.max(Math.min(2000, map(h[1], 120, 500, 50, 2080)), 150);

            mouse.grab = frame.hands[0].grabStrength;
            mouse.pick = frame.hands[0].indexFinger.extended && mouse.grab > 0.8;
            mouse.flying = (mouse.grab < 0.4 && frame.hands[0].middleFinger.extended
                && frame.hands[0].indexFinger.extended && frame.hands[0].pinchStrength < 0.2);
            mouse.highlock = mouse.ez > 1000;
            mouse.dataRingVisible = !(mouse.flying && !mouse.highlock);
        } else {
            mouse.flying = false;
        }
    }
});

if (global.NOLEAP) {
    window.addEventListener("wheel", function (e) {
        // if (mouse.flying) {
        mouse.z += e.deltaY * 10;
        // }
        // console.log(mouse.ez);
        // var highlock = mouse.ez > 1000;
        // if (highlock != mouse.highlock) {
        //     if (highlock) {
        //         mouse.highlock = true;
        //     } else {
        //         mouse.highlock = false;
        //     }
        //     mouse.flying = false;
        // }
        // mouse.dataRingVisible = !(mouse.flying && !mouse.highlock);

    });

    document.addEventListener("mousedown", function (e) {
        mouse.clicked = true;
    });

    document.addEventListener("mouseup", function (e) {
        // mouse.flying = !mouse.flying;
        // mouse.dataRingVisible = !(mouse.flying && !mouse.highlock);
        // mouse.z = 1000;
        // mouse.z = 1000;
    });

    document.addEventListener("mousemove", function (e) {

        // mouse.px = mouse.px || 0;
        // mouse.py = mouse.py || 0;

        mouse.x = e.pageX;
        mouse.y = e.pageY;

        // mouse.prevx = e.x;
        // mouse.prevy = e.y;

        // mouse.z = 2080;
        // if (mouse.flying) {
        //     mouse.z = 1000;
        // }
    });
}

export function updateInputEase() {


    ease(mouse, 'x', 'ex', EASE_RATIO, EASE_THRESHOLD);
    ease(mouse, 'y', 'ey', EASE_RATIO, EASE_THRESHOLD);
    ease(mouse, 'z', 'ez', 0.03, EASE_THRESHOLD);


    mouse.dx = mouse.ex - mouse.px;
    mouse.dy = mouse.ey - mouse.py;
    mouse.dz = mouse.ez - mouse.pz;
    mouse.px = mouse.ex;
    mouse.py = mouse.ey;
    mouse.pz = mouse.ez;

    updateMouseLogic();
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


mouse.z = 1000;
global.mouse = mouse;