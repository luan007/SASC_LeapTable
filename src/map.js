import * as d3 from "d3"
import * as THREE from "three"
import * as $ from "webpack-zepto"
import "./styles/map.less"
import * as input from "./input.js"
import "./global.js"
import { data, event as data_event } from "./data.js"

var svg = document.querySelector("svg");

function shuffleArr(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}


//lets do a psys here


var particles = [];
var particleFree = [];
var _particleFree_swap = [];
const MAX_PARTICLES = 5000;


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
        tr: 1,
        tg: 1,
        tb: 1,
        shuffle: Math.random() * 0.8 + 0.1,
        shuffleSq: (Math.random() * 0.8 + 0.1) * (Math.random() * 0.8 + 0.1),
        life: 1,
        lifeV: 0.01,
        tx: 0,
        ty: 0,
        tz: 0,
        targetChase: false,
        bag: {
            tx: 0,
            ty: 0,
            tz: 0
        }
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

var highlight = 0;

var shuffle = 0;

global.test_set_target = function (id) {
    //stupid no brainer allocation
    shuffle = 50;
    var particle_target = data.map_postfab.points_l[id] ? data.map_postfab.points_l[id] : data.map.points_l;

    particles = shuffleArr(particles); //yay
    for (var i = 0; i < particles.length; i++) {
        if (i < particle_target.length) {
            particles[i].targetChase = true;
            particles[i].tx = particles[i].bag.tx = particle_target[i].x;
            particles[i].ty = particles[i].bag.ty = particle_target[i].y;
            particles[i].tr = particles[i].tg = particles[i].tb = 0.4;
        } else {
            particles[i].targetChase = false;
            particles[i].tr = particles[i].tg = particles[i].tb = 0;
        }
    }
}
global.test_set_highlight = function (id) {
    if (id !== highlight) {
        //add some force here
        // shuffle = 20;
        highlight = id;
    }
}

function particle_set_highlight(p, i) {
    if (i >= data.map.points_l.length) return;
    if (data.map.points_l[i].id !== highlight) {
        p.tr = p.tg = p.tb = Math.abs(noise.perlin3(p.x / 100, p.y / 100, 10)) * 0.8 + 0.3;
        p.tz = 0;
    } else {
        p.tr = p.tg = p.tb = 1;
        p.tz = 10;
    }
}

function particle_rushTo(p) {
    if (!p.targetChase) return;
    //force allocation here -< bad
    p.life = 1; //always alive
    //calculate acc
    p.ax = (p.tx - p.x - 1080 / 2) * 0.01;
    p.ay = (1080 / 2 - p.ty - p.y) * 0.01;
    p.az = (p.tz - p.z) * .1 * p.shuffleSq;
    p.vx *= 0.85;
    p.vy *= 0.85;
    p.vz *= 0.45;
}

function particle_shuffle(p) {
    p.ax += (Math.random() - 0.5) * .52;
    p.ay += (Math.random() - 0.5) * .52;
    p.az += (Math.random() - 0.5) * .52;
}

function updateParticles() {
    var cur;
    _particleFree_swap = [];
    shuffle = shuffle > 0 ? shuffle - 1 : 0;
    for (var i = 0; i < particles.length; i++) {
        cur = particles[i];
        cur.ax = 0;
        cur.ay = 0;

        particle_rushTo(cur);
        if (cur.life <= 0) {
            cur.x = 0;
            cur.y = 0;
            cur.z = 0;
            _particleFree_swap.push(i);
            continue;
        }

        particle_set_highlight(cur, i);

        ease(cur, 'tr', 'r');
        ease(cur, 'tg', 'g');
        ease(cur, 'tb', 'b');

        if (shuffle > 0) {
            particle_shuffle(cur);
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
            cloud.colors[i].r = cur.r;
            cloud.colors[i].g = cur.g;
            cloud.colors[i].b = cur.b;
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

var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 6000);
camera.position.set(0, 0, 1080 + 80); //and this

camera.position.tx = 0;
camera.position.ty = 0;
camera.position.tz = 0;

scene.add(camera);


var planeMaterial = new THREE.MeshBasicMaterial({ color: 0xffaaff, transparent: true, opacity: 0 });
var plane = new THREE.Mesh(new THREE.PlaneGeometry(1080, 1080), planeMaterial);
// plane.doubleSided = ;
plane.position.z = 0;
plane.rotation.z = 0;  // Not sure what this number represents.
var hitGroup = new THREE.Group();
hitGroup.add(plane);
scene.add(hitGroup);

var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas: document.querySelector('#canvasMap') });
renderer.setClearColor(0x000000, 0);
renderer.setSize(1080, 1080);

global.test_state = 0;


var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

export function render() {
    if (data.ready) {
        updateParticles();

        ease(camera.position, 'tx', 'x');
        ease(camera.position, 'ty', 'y');
        ease(camera.position, 'tz', 'z');

        // for (var i = 0; i < 10; i++) {
        //     emitParticleAt(0, 0, 0);
        // }
        renderParticles();

        if (input.mouse.flying) {
            camera.position.ty = (-input.mouse.ey + 1080 / 2) * 0.9;
            camera.position.tx = (+input.mouse.ex - 1080 / 2) * 0.9;
            // camera.position.y += (-input.mouse.dy) / (1000 / input.mouse.ez);
            // camera.position.x += (input.mouse.dx) / (1000 / input.mouse.ez);
            camera.position.tz = input.mouse.ez / 1.5 + 30;
        } else {
            // camera.position.y = (-input.mouse.ey + 1080 / 2) * 0.9;
            // camera.position.x = (+input.mouse.ex - 1080 / 2) * 0.9;
        }
        // if (input.mouse.grab > 0.6) {
        //     // camera.position.y = (-input.mouse.ey + 1080 / 2) * 0.9;
        //     // camera.position.x = (+input.mouse.ex - 1080 / 2) * 0.9;
        //     // camera.position.z = input.mouse.ez / 1.5 + 30;
        //       camera.position.y += (-input.mouse.dy) / 2;
        //       camera.position.x += (input.mouse.dx) / 2;
        //       camera.position.z += (input.mouse.dz) / 1;

        //     //   camera.position.y = Math.max(Math.min(camera.position.y, 1080), -1080);
        //     //   camera.position.x = Math.max(Math.min(camera.position.x, 1080), -1080);
        //       camera.position.z = Math.max(Math.min(camera.position.z, 2000), 100);
        // }
        //try pos..

        mouse.x = input.mouse.ex / 1080 * 2 - 1;
        mouse.y = 1 - input.mouse.ey / 1080 * 2;
        // console.log(mouse);
        raycaster.setFromCamera(mouse, camera);

        var intersects = raycaster.intersectObject(plane);
        if (intersects.length > 0) {
            var point = intersects[0].point;
            var x = point.x + 1080 / 2;
            var y = 1080 / 2 - point.y;
            // console.log(x, y);
            var elems = document.elementsFromPoint(x, y);
            for (var i = 0; i < elems.length; i++) {
                if (elems[i].tagName.toUpperCase() == "PATH") {
                    // console.log("hit", elems[i].__data__.properties.id);
                    test_set_highlight(parseInt(elems[i].__data__.properties.id))
                    break;
                }
            }

        }
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
        updateLabels();
    }
}



var labels = [];
var label_cities = [];
var label_counties = [];
var selectedArea = "";
function updateLabels() {
    for (var i = 0; i < labels.length; i++) {
        var c = labels[i].data;
        var p = new THREE.Vector3(c.vector.x, c.vector.y, c.vector.z);
        var v = p.project(camera);
        if (c.properties.id == highlight) {
            labels[i].t_zoom = 1;
            selectedArea = c.properties.name;
        } else {
            labels[i].t_zoom = 0;
        }
        ease(labels[i], "t_zoom", "zoom");
        if (input.mouse.ez >= 700) {
            labels[i].style.opacity = labels[i].zoom * 0.5 + 0.5;
        } else {
            labels[i].style.opacity = 0; //1 - input.mouse.ez / 2080;
        }
        var scale = labels[i].zoom * 0.2 + 1;
        labels[i].style.transform = `translate3d(${(v.x + 1) / 2 * 1080}px, ${(1 - v.y) / 2 * 1080}px, -1px) scale(${scale}, ${scale})`;
    }

    for (var i = 0; i < label_cities.length; i++) {
        var c = label_cities[i].data;
        var p = new THREE.Vector3(c.vector.x, c.vector.y, c.vector.z);
        var v = p.project(camera);
        if (input.mouse.ez < 700 && c.area == selectedArea) {
            label_cities[i].style.display = 'block';
            label_cities[i].style.transform = `translate3d(${(v.x + 1) / 2 * 1080}px, ${(1 - v.y) / 2 * 1080}px, -1px)`;
        } else {
            label_cities[i].style.display = 'none';
        }
    }


    for (var i = 0; i < label_counties.length; i++) {
        var c = label_counties[i].data;
        var p = new THREE.Vector3(c.vector.x, c.vector.y, c.vector.z);
        var v = p.project(camera);
        if (input.mouse.ez < 700 && c.area == selectedArea) {
            label_cities[i].style.display = 'block';
            label_cities[i].style.transform = `translate3d(${(v.x + 1) / 2 * 1080}px, ${(1 - v.y) / 2 * 1080}px, -1px)`;
        } else {
            label_cities[i].style.display = 'none';
        }
    }
}

function createLabels() {

    var container = $(`<div class='labelContainer'></div>`);
    container.appendTo($("body"));

    for (var i = 0; i < data.map.geojson.features.length; i++) {
        var c = data.map.geojson.features[i];
        var name = c.properties.name;
        var vec = projector(c.properties.cp);
        c.vector = new THREE.Vector3(
            vec[0] - 1080 / 2, 1080 / 2 - vec[1], 0
        );
        var p = $(`<div class='label'>${name}</div>`);
        p.css({
            'transform-origin': "50% 50%",
            transform: "translate3d(540px, 540px, 0px)",
            position: "absolute"
        });
        if (/香港|澳门|台湾/.test(name)) {
            continue;
        }
        labels.push(p.get(0));
        p.get(0).data = c;
        p.get(0).zoom = 0;
        p.get(0).t_zoom = 0;

        p.appendTo(container);
    }



    for (var i = 0; i < data.map.markers.cities.length; i++) {
        var c = data.map.markers.cities[i];
        var vec = projector(c.pos);

        c.vector = new THREE.Vector3(
            vec[0] - 1080 / 2, 1080 / 2 - vec[1], 0
        );
        var p = $(`<div class='label'>${c.name}</div>`);
        p.css({
            'transform-origin': "50% 50%",
            transform: "translate3d(540px, 540px, 0px)",
            position: "absolute",
            color: "#2fafff"
        });
        label_cities.push(p.get(0));

        p.get(0).data = c;
        p.get(0).zoom = 0;
        p.get(0).t_zoom = 0;
        p.appendTo(container);
    }



    for (var i = 0; i < data.map.markers.counties.length; i++) {
        var c = data.map.markers.counties[i];
        var vec = projector(c.pos);

        c.vector = new THREE.Vector3(
            vec[0] - 1080 / 2, 1080 / 2 - vec[1], 0
        );
        var p = $(`<div class='label'>${c.name}</div>`);
        p.css({
            'transform-origin': "50% 50%",
            transform: "translate3d(540px, 540px, 0px)",
            position: "absolute",
            color: "#2fffaf"
        });
        label_cities.push(p.get(0));

        p.get(0).data = c;
        p.get(0).zoom = 0;
        p.get(0).t_zoom = 0;
        p.appendTo(container);
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

    pointCloud.frustumCulled = false;
    test_set_target(0);

    createLabels();
}

data_event.on("ready", init);


