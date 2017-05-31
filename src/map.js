import * as d3 from "d3"
import * as THREE from "three"
import "./styles/map.less"
import * as input from "./input.js"

var projector = d3.geoMercator().center([105.5, 38.7]).scale(800).translate([1080 / 2, 1080 / 2]);

var svg = d3.select("svg");
var path = d3.geoPath()
    .projection(projector);


var scene = new THREE.Scene();

var pointCloudMat = new THREE.PointCloudMaterial({
    size: 2, sizeAttenuation: false,
    vertexColors: THREE.VertexColors
});

var cloud = new THREE.Geometry();
for (var i = 0; i < 30000; i++) {
    cloud.vertices.push(new THREE.Vector3(0, 0, 0));
    cloud.colors.push(new THREE.Color(1, 1, 1));
}

var pointCloud = new THREE.PointCloud(cloud, pointCloudMat);
scene.add(pointCloud);

var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 30000);
camera.position.set(0, 0, 1080 + 80);
scene.add(camera);

var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas: document.querySelector('#canvasMap') });
renderer.setClearColor(0x000000, 0);
// renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(1080, 1080);


export function render() {

    // console.log(input.mouse.ex - 1080 / 2);
    // pointCloud.position.set(0, 0, 0);
    // camera.position.x = input.mouse.ex;
    camera.position.z = input.mouse.ey + 1080;
    for (var i = 0; i < points.length; i++) {
        // var j = noise.perlin3(points[i].data.counter / 15 + t / 50, points[i].data.counter / 15 - t / 50, t / 5);
        // j = Math.round(j * 3) / 3;
        // var q = noise.perlin3(points[i].x / 155 + t / 50, points[i].y / 155 - t / 50, t / 5 + points[i].data.counter / 15);
        // j += Math.round(q * 5) / 5;
        // j = Math.max(j, 0);
        // j += 0.5;
        if (i < points.length) {
            cloud.vertices[i].x = points[i].x - 1080 / 2 + Math.sin(t * 30 + points[i].y) * 30;
            cloud.vertices[i].y = -points[i].y + 1080 / 2 + Math.cos(t * 10 + points[i].x) * 30;
        }
    }
    cloud.verticesNeedUpdate = true;
    cloud.colorsNeedUpdate = true;
    renderer.render(scene, camera);
}


var s = 6;
var counter = 0;
d3.json("mapdata/china.json", function (error, data) {
    d3.json("mapdata/combined.json", function (err, d) {
        var cities = d.cities;
        var counties = d.counties;
        d.cities = cities.map((c) => {
            c.proj = projector(c.pos);
            c.projLowRes = [
                Math.round(c.proj[0] / s) * s,
                Math.round(c.proj[1] / s) * s
            ];
            return c;
        });
        d.counties = counties.map((c) => {
            c.proj = projector(c.pos);
            c.projLowRes = [
                Math.round(c.proj[0] / s) * s,
                Math.round(c.proj[1] / s) * s
            ];
            return c;
        });
        svg.append("g")
            .attr("class", "map states")
            .selectAll("path")
            .data(data.features)
            .enter().append("path")
            .attr("d", path)
            .each((t) => {
                t.counter = counter++;
            });

        loadPoints();
        // calculateBorders();
    });
});


global.points = [];

function loadPoints() {
    d3.json("mapdata/particles/map-highres.json", function (error, pt) {
        points = pt;
        for (var i = 0; i < points.length; i += 1) {
            cloud.vertices[i] = (new THREE.Vector3(
                -1080 / 2 + points[i].x, 1080 / 2 - points[i].y, 0
            ));
            cloud.colors[i] = (new THREE.Color(1, 1, 1));
        }
    });
}



function calculateBorders() {
    if (true) {
        var svg = document.querySelector("svg");
        for (var x = 0; x < 1080; x += s) {
            console.log("Progress", Math.round(x / 1080 * 1000) / 10 + "%")
            // console.log(x);
            for (var y = 0; y < 1080; y += s) {
                var color = undefined;
                var data;
                document.elementsFromPoint(x * 1, y * 1).forEach((j) => {
                    if (j.tagName.toUpperCase() == 'PATH') {
                        color = hsl(1, 0, j.__data__.counter / 60 + 0.5);
                        color = "#fff";
                        data = j.__data__;
                    }
                });
                if (color) {
                    var p = {
                        x: x,
                        y: y,
                        id: data.properties.id
                    };
                    points.push(p);
                    // console.log(points.length);
                    // _comb.cities.forEach((d) => {
                    //     if (d.projLowRes[0] == x && d.projLowRes[1] == y) {
                    //         p.color = "#f00";
                    //     }
                    // });
                    // _comb.counties.forEach((d) => {
                    //     if (d.projLowRes[0] == x && d.projLowRes[1] == y) {
                    //         p.color = "#0f0";
                    //     }
                    // });
                }
            }
        }
    }

    global.points = points;

    for (var i = 0; i < points.length; i++) {
        cloud.vertices[i] = (new THREE.Vector3(
            points[i].x - 1080 / 2, 1080 / 2 - points[i].y, 0
        ));
        cloud.colors[i] = (new THREE.Color(1, 1, 1));
    }

}
