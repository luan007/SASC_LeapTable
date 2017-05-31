import * as THREE from "three"
import * as d3 from "d3"
import { ctx2d, update } from "./global.js"
import * as input from "./input.js"
import * as ring from "./ring.js"
import "./styles/main.less"

import * as map from './map.js'

function render() {
    update();
    input.updateInputEase();

    ctx2d.clearRect(0, 0, 1080, 1080);
    ring.render();
    
    input.render_debug();
    map.render();
    requestAnimationFrame(render);
}


render();