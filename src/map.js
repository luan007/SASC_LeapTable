import * as d3 from "d3"
import * as THREE from "three"
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
        tr: 1,
        tg: 1,
        tb: 1,
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
    //add some force here
    shuffle = 20;
    highlight = "" + id;
}

function particle_set_highlight(p, i) {
    if (i >= data.map.points_l.length) return;
    if (data.map.points_l[i].id !== highlight) {
        p.tr = p.tg = p.tb = Math.abs(Math.sin(t * 10) * 0.4);
    } else {
        p.tr = p.tg = p.tb = 1;
    }
}

function particle_rushTo(p) {
    if (!p.targetChase) return;
    //force allocation here -< bad
    p.life = 1; //always alive
    //calculate acc
    p.ax = (p.tx - p.x - 1080 / 2) * 0.01;
    p.ay = (1080 / 2 - p.ty - p.y) * 0.01;
    p.az = (-p.z) * 0.1;
    p.vx *= 0.85;
    p.vy *= 0.85;
    p.vz *= 0.85;
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

        // particle_set_highlight(cur, i);

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
    size: 7, sizeAttenuation: true,
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

        // for (var i = 0; i < 10; i++) {
        //     emitParticleAt(0, 0, 0);
        // }
        renderParticles();
        camera.position.y = (-input.mouse.ey + 1080 / 2) * 0.9;
        camera.position.x = (+input.mouse.ex - 1080 / 2) * 0.9;
        camera.position.z = input.mouse.ez / 1.5 + 50;

        //try pos..
        mouse.x = input.mouse.ex / 1080 * 2 - 1;
        mouse.y = 1 - input.mouse.ey / 1080 * 2;
        // console.log(mouse);
        raycaster.setFromCamera(mouse, camera);

        var intersects = raycaster.intersectObject(plane);
        if(intersects.length > 0) {
            var point = intersects[0].point;
            var x = point.x + 1080 / 2;
            var y = 1080 / 2 - point.y;
            // console.log(x, y);
            var elems = document.elementsFromPoint(x, y);
            for(var i = 0; i < elems.length; i++) {
                if(elems[i].tagName.toUpperCase() == "PATH") {
                    console.log("hit", elems[i].__data__.properties.id);
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

pointCloud.frustumCulled = false;

data_event.on("ready", init);


