import { ctx2d } from './global.js'

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

document.addEventListener("mousemove", function (e) {
    mouse.x = e.pageX;
    mouse.y = e.pageY;
    mouse.z = 0;
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
        ctx2d.fillStyle = ("#fff");
        ctx2d.beginPath();
        ctx2d.arc(0, 0, 15, 0, Math.PI * 2);
        ctx2d.fill();
    });
}


global.mouse = mouse;