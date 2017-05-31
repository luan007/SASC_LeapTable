import * as d3 from "d3"
import * as THREE from "three"
import "./styles/map.less"
import * as input from "./input.js"
import { data, event as data_event } from "./data.js"



//lets do a psys here


var particles = [];
var particleFree = [];
var _particleFree_swap = [];
const MAX_PARTICLES = 40000;


for (var i = 0; i < MAX_PARTICLES; i++) {
    particles.push({
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        ax: 0,
        ay: 0,
        az: 0,
        r: 1,
        g: 1,
        b: 1,
        life: 0,
        lifeV: 0.01,
        bag: {}
    });
}

function allocateParticle() {
    if (particleFree.length > 0) {
        var free = particleFree.pop();
        var cur = particles[free];
        return cur;
    }
    return undefined; //oops
}

function emitParticleAt(x, y, z) {
    var p = allocateParticle();
    if (!p) return; //failed
    p.life = 1;
    p.x = x + (0.5 - Math.random()) * 1000;
    p.y = y + (0.5 - Math.random()) * 1000;
    p.z = z + (0.5 - Math.random()) * 1000;
    p.vz = 0;
    p.az = Math.random();
    p.r = 1;
    p.g = 1;
    p.b = 1;
}


var target = undefined;

function targetParticles() {
    
}

function updateParticles() {
    var cur;
    _particleFree_swap = [];
    for (var i = 0; i < particles.length; i++) {
        cur = particles[i];
        if (cur.life <= 0) {
            _particleFree_swap.push(i);
            continue;
        }
        //cpu-heavy
        cur.life -= cur.lifeV;
        cur.vx += cur.ax;
        cur.vy += cur.ay;
        cur.vz += cur.az;
        cur.x += cur.vx;
        cur.y += cur.vy;
        cur.z += cur.vz;
    }
    particleFree = _particleFree_swap;
}

function renderParticles() {
    var cur;
    for (var i = 0; i < MAX_PARTICLES; i++) {
        cur = particles[i];
        if (cur.life <= 0) {
            cloud.colors[i].r = 0;
            cloud.colors[i].g = 0;
            cloud.colors[i].b = 0;
            cloud.vertices[i].x = -10000;
            cloud.vertices[i].y = -10000;
            cloud.vertices[i].z = -10000;
        } else {
            cloud.vertices[i].x = cur.x;
            cloud.vertices[i].y = cur.y;
            cloud.vertices[i].z = cur.z;
            cloud.colors[i].r = cur.r *  1- cur.life;
            cloud.colors[i].g = cur.g * 1 -cur.life;
            cloud.colors[i].b = cur.b * 1 -cur.life;
        }
    }
    cloud.verticesNeedUpdate = true;
    cloud.colorsNeedUpdate = true;
}

//dont ever touch these plz - -
var projector = d3.geoMercator().center([105.5, 38.7]).scale(800).translate([1080 / 2, 1080 / 2]);
var svg = d3.select("svg");
var path = d3.geoPath()
    .projection(projector);

var scene = new THREE.Scene();

var pointCloudMat = new THREE.PointCloudMaterial({
    size: 4, sizeAttenuation: true,
    vertexColors: THREE.VertexColors,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true
});


var cloud = new THREE.Geometry();
for (var i = 0; i < MAX_PARTICLES; i++) {
    cloud.vertices.push(new THREE.Vector3(0, 0, 0));
    cloud.colors.push(new THREE.Color(1, 1, 1));
}

var pointCloud = new THREE.PointCloud(cloud, pointCloudMat);
scene.add(pointCloud);

var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 30000);
camera.position.set(0, 0, 1080 + 80); //and this
scene.add(camera);

var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas: document.querySelector('#canvasMap') });
renderer.setClearColor(0x000000, 0);
renderer.setSize(1080, 1080);

global.test_state = 0;

export function render() {
    if (data.ready) {
        updateParticles();

        for (var i = 0; i < 10; i++) {
            emitParticleAt(0, 0, 0);
        }
        renderParticles();
        // camera.position.z = input.mouse.ey + 1080;
        // var points = data.map_postfab.points_uh[global.test_state] ? data.map_postfab.points_uh[global.test_state] : data.map.points_l;
        // for (var i = 0; i < cloud.vertices.length; i++) {
        //     if (i < points.length) {
        //         cloud.vertices[i].x = points[i].x - 1080 / 2 + Math.sin(t * 30 + points[i].y) * 3;
        //         cloud.vertices[i].y = -points[i].y + 1080 / 2 + Math.cos(t * 10 + points[i].x) * 3;
        //         cloud.colors[i].r = 1;
        //         cloud.colors[i].g = 1;
        //         cloud.colors[i].b = 1;
        //     } else {
        //         cloud.colors[i].r = 0;
        //         cloud.colors[i].g = 0;
        //         cloud.colors[i].b = 0;
        //     }
        // }
        renderer.render(scene, camera);
    }
}



//when data arrives
function init() {

    // var cities = d.cities;
    // var counties = d.counties;
    // d.cities = cities.map((c) => {
    //     c.proj = projector(c.pos);
    //     c.projLowRes = [
    //         Math.round(c.proj[0] / s) * s,
    //         Math.round(c.proj[1] / s) * s
    //     ];
    //     return c;
    // });
    // d.counties = counties.map((c) => {
    //     c.proj = projector(c.pos);
    //     c.projLowRes = [
    //         Math.round(c.proj[0] / s) * s,
    //         Math.round(c.proj[1] / s) * s
    //     ];
    //     return c;
    // });

    svg.append("g")
        .attr("class", "map states")
        .selectAll("path")
        .data(data.map.geojson.features)
        .enter().append("path")
        .attr("d", path);

    // loadPoints();
}


data_event.on("ready", init);


