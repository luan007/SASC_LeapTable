import * as d3 from "d3"
import * as THREE from "three"
import * as $ from "webpack-zepto"
import "./styles/map.less"
import * as input from "./input.js"
import "./global.js"
import { data, event as data_event } from "./data.js"
import * as PSYS from "./math-particlesys.js"


var selection_title = $("<div class='selection_title'>国家</div>");
selection_title.appendTo($("body"));

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
        Map_State.Selection_Spot = undefined;
        if (input.mouse.highlock) {
            Map_State.Mode = -1;
            Map_State.Selection = -1;
            camera.position.ty = 0;
            camera.position.tx = 0;
            camera.position.tz = 1080;
        } else {
            Map_State.Mode = 0; //Province Selection
            camera.position.ty = (-input.mouse.ey + 1080 / 2) * 0.9;
            camera.position.tx = (+input.mouse.ex - 1080 / 2) * 0.9;
            camera.position.tz = input.mouse.ez / 1.5 + 30;
        }
    } else if (!input.mouse.highlock && Map_State.Mode >= 0) {
        //good pos
        Map_State.Mode = 1;
    }


    ease(camera.position, 'tx', 'x');
    ease(camera.position, 'ty', 'y');
    ease(camera.position, 'tz', 'z');

    if (Map_State.Mode >= 0 && input.mouse.flying) {

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
                    Map_State.Selection = hit;
                    break;
                }
            }
        }
    }


    if (Map_State.Mode == 1 && Map_State.Selection_Spot) {
        selection_title.text(Map_State.Selection_Spot.name);
    }
    else if (Map_State.Mode >= 0) {
        if (data.map.provinces[Map_State.Selection]) {
            selection_title.text(data.map.provinces[Map_State.Selection].name);
        }
    } else if (Map_State.Mode == -1) {
        selection_title.text("全国数据");
    }

    renderProvinces();
    renderer.render(scene, camera);

}


var Map_State = {
    Mode: -1,
    Selection: -1,
    Selection_Spot: undefined
};

var Provinces = {};


function setupProvinces() {
    for (var i in data.map_postfab.points_l) {
        var pv = new Province(data.map.provinces[i], data.map_postfab.points_l[i]);
        Provinces[i] = pv;
    }
}

function renderProvinces() {
    for (var i in Provinces) {
        Provinces[i].render();
    }
}


class position_2d {
    constructor(pos) {
        this.cp_vector = projector(pos);
        this.vec3 = new THREE.Vector3(
            this.cp_vector[0] - 1080 / 2, 1080 / 2 - this.cp_vector[1], 0
        );
        this.vec2 = undefined;
    }

    update2d() {
        this.vec2 = (new THREE.Vector3(this.vec3.x, this.vec3.y, this.vec3.z)).project(camera);
    }
}

class Province extends position_2d {
    //point cloud
    //0.05 + Math.random() * 0.1
    constructor(d, points) {
        super(d.cp);

        this.data = d;
        this.name = this.data.name;
        this.points = points;
        this.id = d.id;

        this.spotsArr = [];
        this.spots = {};
        this.spotCount = 0;
        for (var i = 0; i < data.map.markers.cities.length; i++) {
            var cur = data.map.markers.cities[i]
            if (cur.area == this.name) {
                this.spots[cur.name] = new Spot(cur, 'city');
                this.spotsArr.push(this.spots[cur.name]);
                this.spotCount++;
            }
        }

        for (var i = 0; i < data.map.markers.counties.length; i++) {
            var cur = data.map.markers.counties[i]
            if (cur.area == this.name) {
                this.spots[cur.name] = new Spot(cur, 'county');
                this.spotsArr.push(this.spots[cur.name]);
                this.spotCount++;
            }
        }

        this.collisionRemoval = new Array(this.spotCount);


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
            this.three_geometry.vertices.push(new THREE.Vector3(this.psys.Points[i].x, this.psys.Points[i].y, this.psys.Points[i].z));
        }
        this.three_pointCloud = new THREE.Points(this.three_geometry, this.three_material);
        scene.add(this.three_pointCloud);


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
        super.update2d();
        if (this.label) {
            var scale = this.selection * 0.3 + 1;
            this.label.style.opacity = (0.5 - this.selection / 2) * (
                Map_State.Mode >= 0 ? 1 : 0
            );
            this.label.style.transform = `translate3d(${(this.vec2.x + 1) / 2 * 1080}px, ${(1 - this.vec2.y) / 2 * 1080}px, -1px) scale(${scale}, ${scale})`;
            this.label.style.backgroundColor = `rgba(0, 0, 0, ${this.selection})`;
        }
        this.tselection = 0;
        if (this.id == Map_State.Selection) {
            //selected!
            this.three_material.tsize = Math.min(1, Math.max(Math.sqrt(camera.position.z / 150 - 0.7), 0.01)) * (5 + 2 * Math.abs(Math.sin(t * 20)));
            this.color.to = 1 // - camera.position.z / 1000;
            this.color.tl = 2 //camera.position.z / 100;
            this.tselection = 1;
        }
        else if (!input.mouse.flying && Map_State.Mode >= 0) {
            this.three_material.tsize = 4;
            this.color.tl = 0.2;
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
        // this.psys.update();
        // for (var i = 0; i < this.psys.Points.length; i++) {
        //     var p = this.psys.Points[i];
        //     this.three_geometry.vertices[i].x = p.x;
        //     this.three_geometry.vertices[i].y = p.y;
        //     this.three_geometry.vertices[i].z = p.z;
        //     // this.three_geometry.colors[i].r = p.r;
        //     // this.three_geometry.colors[i].g = p.g;
        //     // this.three_geometry.colors[i].b = p.b;
        // }

        // var dt = [];
        if (this.tselection && Map_State.Mode == 1) {
            var minsq = 99999;
            var minid = undefined;
            for (var i in this.spots) {
                if (this.spots.hasOwnProperty(i)) {
                    this.spots[i].update2d();
                    var dx = (this.spots[i].vec2.x + 1) / 2 * 1080 - input.mouse.ex;
                    var dy = (1 - this.spots[i].vec2.y) / 2 * 1080 - input.mouse.ey;
                    var val = (dx * dx) + (dy * dy)
                    // console.log(val);
                    if (val < 100 * 100 && val < minsq) {
                        minsq = val;
                        minid = i;
                    }
                }
            }
            if (minid) {
                this.spots[minid].selecting = true;
            }
        }

        // var strategy = layoutTool.layoutAnnealing();
        // var result = strategy(dt);
        // var count = 0;

        for (var i in this.spots) {
            this.spots[i].update2d();
            this.spots[i].show = this.tselection;
            if (this.spots.hasOwnProperty(i)) {
                // this.spots[i].vec2.x = result[count].x;
                // this.spots[i].vec2.y = result[count].y;
                this.spots[i].render();
                // count++;
                this.spots[i].selecting = false; //restore
            }
        }
    }

}

//city, county
class Spot extends position_2d {

    constructor(data, type) {
        super(data.pos);
        this.data = data;
        this.type = type;

        this.selecting = false;
        this.selectionHold = 0;

        this.show = false;
        this.name = this.data.name;
        this.province = this.data.area;


        this.three_material = new THREE.MeshBasicMaterial({
            opacity: 1,
            // blending: THREE.AdditiveBlending,
            // depthTest: false,
            color: new THREE.Color(1, 1, 1),
            transparent: true
        });
        this.three_geometry = new THREE.CircleGeometry(1, 90);
        this.three_mesh = new THREE.Mesh(this.three_geometry, this.three_material);

        this.three_mesh.position.x = this.vec3.x;
        this.three_mesh.position.y = this.vec3.y;
        this.three_mesh.position.z = 2;

        scene.add(this.three_mesh);


        this.three_selection_material = new THREE.MeshBasicMaterial({
            opacity: 1,
            // blending: THREE.AdditiveBlending,
            // depthTest: false,
            color: new THREE.Color(1, 1, 1),
            transparent: true
        });

        this.three_selection_geometry = new THREE.CircleGeometry(9, 90);
        this.three_selection_mesh = new THREE.Mesh(this.three_selection_geometry,
            this.three_selection_material);

        this.three_selection_mesh.position.x = this.vec3.x;
        this.three_selection_mesh.position.y = this.vec3.y;
        this.three_selection_mesh.position.z = 1;
        this.three_selection_mesh.scale.setLength(0.1);

        scene.add(this.three_selection_mesh);


        this.label = $(`<div class='label-tiny'>${this.name}</div>`).css({
            'transform-origin': "50% 50%",
            transform: "translate3d(540px, 540px, 0px)",
            position: "absolute"
        }).appendTo(container).get(0);
        this.selection = 0;
        this.tselection = 0;

        this.meshScale = 0;
        this.tmeshScale = 0;
        if (this.type == 'city') {
            this.color = {
                th: 0.55, ts: 1, tl: 0.5,
                h: 0.55, s: 1, l: 0.5
            }
            this.colorScheme = {
                th: 0.55, ts: 1, tl: 0.5,
                h: 0.55, s: 1, l: 0.5
            }
            this.scale = 3;
        }
        else {
            this.color = {
                th: 0.4, ts: 1, tl: 0.5,
                h: 0.4, s: 1, l: 0.5
            }
            this.colorScheme = {
                th: 0.4, ts: 1, tl: 0.5,
                h: 0.4, s: 1, l: 0.5
            }
            this.scale = 2;
        }

    }

    render() {
        ease(this, 'tselection', 'selection', 0.1, 0.01);

        var ox = Math.sin(t * 50 + this.vec2.x * 4);
        var offset = 1 + 0.3 * ox;

        if (this.show) {
            this.color.th = this.colorScheme.th;
            this.color.ts = this.colorScheme.ts;
            this.color.tl = this.colorScheme.tl;

            this.tmeshScale = this.scale * (offset * (0.5 + this.selection * 0.7)) * 1.5;
            this.label.style.display = 'block';
            var scale = this.selection * 0.3 + 1;
            this.label.style.opacity = 1;
            this.label.style.transform = `translate3d(${(this.vec2.x + 1) / 2 * 1080}px, ${(1 - this.vec2.y) / 2 * 1080 + 30}px, -1px) scale(${scale}, ${scale})`;
            this.label.style.backgroundColor = `rgba(0, 0, 0, 1)`;
            if(this.tselection) {
                this.label.style.zIndex = 888888;
            } else {
                this.label.style.zIndex = 10;
            }

        } else if (input.mouse.flying || Map_State.Mode < 0) {
            this.tmeshScale = offset * offset;
            this.color.ts = 1;
            this.color.tl = 2;
            this.label.style.display = 'none';
        } else {
            this.tmeshScale = 1;
            this.color.ts = 0.8;
            this.color.tl = .1;
            this.three_material.color.setRGB(0.3, 0.3, 0.3);
            this.label.style.display = 'none';
        }

        ease(this.color, 'th', 'h');
        ease(this.color, 'ts', 's');
        ease(this.color, 'tl', 'l');
        ease(this, 'tmeshScale', 'meshScale');

        var rgb = hsl_raw(this.color.h, this.color.s, this.color.l);
        this.three_material.color.setRGB(rgb[0], rgb[1], rgb[2]);
        this.three_mesh.scale.set(this.meshScale, this.meshScale, this.meshScale);

        if (this.selecting && !this.tselection) {
            this.selectionHold += (2 - this.selectionHold) * 0.03;
            if (this.selectionHold > 1.8) {
                Map_State.Selection_Spot = this.data;
            }
        } else {
            this.selectionHold += (0.1 - this.selectionHold) * 0.1;
        }

        if (this.data == Map_State.Selection_Spot) {
            this.tselection = 1;
        } else {
            this.tselection = 0;
        }

        ease(this, 'tselection', 'selection');
        this.three_selection_mesh.scale.setLength(this.selectionHold + this.selection);

    }

}

