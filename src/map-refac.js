import * as d3 from "d3"
import * as THREE from "three"
import * as $ from "webpack-zepto"
import "./styles/map.less"
import * as input from "./input.js"
import "./global.js"
import { data, event as data_event } from "./data.js"
import * as PSYS from "./math-particlesys.js"


var container = $(`<div class='labelContainer'></div>`);
container.appendTo($("body"));

var svg = d3.select("svg");
var projector = d3.geoMercator().center([105.5, 38.7]).scale(800).translate([1080 / 2, 1080 / 2]);

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 6000);
var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas: document.querySelector('#canvasMap') });
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

var plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1080, 1080),
    new THREE.MeshBasicMaterial({ color: 0xffaaff, transparent: true, opacity: 0.0 })
);

function setup() {

    var geoPathGenerator = d3.geoPath()
        .projection(projector);
    svg.append("g")
        .attr("class", "map states")
        .selectAll("path")
        .data(data.map.geojson.features)
        .enter().append("path")
        .attr("d", geoPathGenerator);

    camera.position.set(0, 0, 1080 + 80);
    camera.position.tx = 0;
    camera.position.ty = 0;
    camera.position.tz = 0;

    plane.position.z = 0;
    scene.add(camera);
    scene.add(plane);

    renderer.setClearColor(0x000000, 0);
    renderer.setSize(1080, 1080);

    setupProvinces();
}


data_event.on("ready", setup);

export function render() {

    if (!data.ready) return;

    if (input.mouse.flying) {
        // pointCloudMat.tsize = 7 * ((camera.position.z / 2000));
        camera.position.ty = (-input.mouse.ey + 1080 / 2) * 0.9;
        camera.position.tx = (+input.mouse.ex - 1080 / 2) * 0.9;
        camera.position.tz = input.mouse.ez / 1.5 + 30;

    } else {
        // pointCloudMat.tsize = 4;
    }

    ease(camera.position, 'tx', 'x');
    ease(camera.position, 'ty', 'y');
    ease(camera.position, 'tz', 'z');


    //raycast
    mouse.x = input.mouse.ex / 1080 * 2 - 1;
    mouse.y = 1 - input.mouse.ey / 1080 * 2;
    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObject(plane);
    if (intersects.length) {
        var point = intersects[0].point;
        var x = point.x + 1080 / 2;
        var y = 1080 / 2 - point.y;
        var elems = document.elementsFromPoint(x, y);
        for (var i = 0; i < elems.length; i++) {
            if (elems[i].tagName.toUpperCase() == "PATH") {
                // console.log("hit", elems[i].__data__.properties.id);
                // test_set_highlight(parseInt())
                var hit = parseInt(elems[i].__data__.properties.id);
                Map_State.SelectedProvince = hit;
                break;
            }
        }
    }



    renderProvinces();
    renderer.render(scene, camera);
}


var Map_State = {
    SelectedProvince: -1
};

var Provinces = {};

function setupProvinces() {
    for (var i in data.map_postfab.points_l) {
        var pv = new Province(data.map.provinces[i], data.map_postfab.points_l[i]);
        Provinces[i] = pv;
        scene.add(pv.three_pointCloud);
    }
}

function renderProvinces() {
    for (var i in Provinces) {
        Provinces[i].render();
    }
}

class Province {
    //point cloud
    //0.05 + Math.random() * 0.1
    constructor(data, points) {
        this.data = data;
        this.name = this.data.name;
        this.points = points;
        this.id = data.id;
        this.cp_vector = projector(data.cp);
        this.label_vector3 = new THREE.Vector3(
            this.cp_vector[0] - 1080 / 2, 1080 / 2 - this.cp_vector[1], 0
        );

        this.color = {
            o: 1, to: 1, h: 0.55, s: 1, l: 0.5, tl: 1, ol: 1
        };
        this.psys = new PSYS.ParticleSys(points.length);
        this.three_material = new THREE.PointsMaterial({
            size: 3, sizeAttenuation: true,
            // vertexColors: THREE.VertexColors,
            color: new THREE.Color(0.2, 0.2, 0.2),
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: false
        });
        this.three_geometry = new THREE.Geometry();
        for (var i = 0; i < points.length; i++) {
            var pt = points[i];
            this.psys.Points[i].x = pt.x - 1080 / 2;
            this.psys.Points[i].y = 1080 / 2 - pt.y;
            this.psys.Points[i].z = 0;

            this.three_geometry.colors.push(new THREE.Color(1, 1, 1));
            this.three_geometry.vertices.push(new THREE.Vector3(0, 0, 0));
        }
        this.three_pointCloud = new THREE.Points(this.three_geometry, this.three_material);


        if (!/香港|澳门|台湾/.test(this.name)) {
            this.label = $(`<div class='label'>${this.name}</div>`).css({
                'transform-origin': "50% 50%",
                transform: "translate3d(540px, 540px, 0px)",
                position: "absolute"
            }).appendTo(container).get(0);
        }
        this.selection = 0;
        this.tselection = 0;
    }

    render() {
        if (this.label) {
            var p = new THREE.Vector3(this.label_vector3.x, this.label_vector3.y, this.label_vector3.z);
            var v = p.project(camera);
            var scale = this.selection * 0.3 + 1;
            this.label.style.opacity = 0.5 + this.selection / 3;
            this.label.style.transform = `translate3d(${(v.x + 1) / 2 * 1080}px, ${(1 - v.y) / 2 * 1080}px, -1px) scale(${scale}, ${scale})`;
            this.label.style.backgroundColor = `rgba(0, 0, 0, ${this.selection})`;
        }
        this.tselection = 0;
        if (this.id == Map_State.SelectedProvince) {
            //selected!
            this.three_material.tsize = 5 + 2 * Math.abs(Math.sin(t * 20));
            this.color.to = 1;
            this.color.tl = 2;
            this.tselection = 1;
        }
        else if (!input.mouse.flying) {
            this.three_material.tsize = 4;
            this.color.tl = 0.4;
            this.color.to = 0;
        }
        else {
            this.color.tl = 0.4;
            this.color.to = 1;
            this.three_material.tsize = 4 + Math.abs(Math.sin(this.data.cp[0] / 2) * 3);
        }

        ease(this, 'tselection', 'selection', 0.1, 0.01);
        ease(this.color, 'to', 'o', 0.1, 0.001);
        ease(this.color, 'tl', 'ol', 0.1, 0.001);
        var hsl = hsl_raw(this.color.h, this.color.s * this.color.o, this.color.l * this.color.ol);
        this.three_material.color.setRGB(
            hsl[0], hsl[1], hsl[2]);
        ease(this.three_material, "tsize", "size", 0.08, 0.01);
        this.psys.update();
        for (var i = 0; i < this.psys.Points.length; i++) {
            var p = this.psys.Points[i];
            this.three_geometry.vertices[i].x = p.x;
            this.three_geometry.vertices[i].y = p.y;
            this.three_geometry.vertices[i].z = p.z;
            // this.three_geometry.colors[i].r = p.r;
            // this.three_geometry.colors[i].g = p.g;
            // this.three_geometry.colors[i].b = p.b;
        }
    }

}

//city, county
class Spot {

}

