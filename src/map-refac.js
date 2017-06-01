import * as d3 from "d3"
import * as THREE from "three"
import * as $ from "webpack-zepto"
import "./styles/map.less"
import * as input from "./input.js"
import "./global.js"
import { data, event as data_event } from "./data.js"

var svg = document.querySelector("svg");

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 6000);
function setupCamera() {
    camera.position.set(0, 0, 1080 + 80);
    camera.position.tx = 0;
    camera.position.ty = 0;
    camera.position.tz = 0;
    scene.add(camera);
}


function setupHitplane() {

}

class Province {
    
}

//city, county
class Spot {

}