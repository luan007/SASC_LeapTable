import * as d3 from "d3"
import { EventEmitter } from "events"

export var event = new EventEmitter();
export var data = {
    map: {
        geojson: undefined,  //for svg
        points_h: undefined, //high
        points_l: undefined, //low
        points_uh: undefined,//ultra high,
        markers: undefined,  //positions / cities + counties
        provinces: undefined
    },
    map_postfab: {
        points_h: undefined,
        points_l: undefined,
        points_uh: undefined
    },
    ready: false
};
//grab json

//split points into datastructures for further biz
function postfab_points(name, unit) {
    var pts = data.map[name];
    data.map_postfab[name] = {};
    for (var i = 0; i < pts.length; i++) {
        if (!data.map_postfab[name][pts[i].id]) {
            data.map_postfab[name][pts[i].id] = [];
        }
        var cur = pts[i];
        data.map_postfab[name][pts[i].id].push(pts[i]);
        if (unit) {
            if (i % 100 == 0) {
                console.log(i / pts.length);
            }
            var count = 0;
            for (var j = 0; j < pts.length; j++) {
                //find four n
                //stupid code
                var n = pts[j];
                if (n !== cur &&
                    n.id == cur.id
                    &&
                    ((n.x + unit == cur.x || n.x - unit == cur.x)
                        &&
                        (n.y + unit == cur.y || n.y - unit == cur.y))
                ) {
                    count++;
                }
                if (count >= 4) {
                    break;
                }
            }
            if (count < 4) {
                cur.border = true;
            }
        }
    }
}

function loadAll(data, cb) {
    var l = [];
    (function load_recur(i) {
        (i >= data.length) ?
            cb(l)
            :
            d3.json(data[i], function (e, c) {
                l[i] = c;
                load_recur(i + 1);
            });
    })(0);
}

loadAll([
    "mapdata/china.json",
    "mapdata/combined.json",
    "mapdata/particles/map-highres.json",
    "mapdata/particles/map-mres.json",
    "mapdata/particles/map-uhighres.json",
], (d) => {
    data.map.geojson = d[0];
    data.map.markers = d[1];
    data.map.points_h = d[2];
    data.map.points_l = d[3];
    data.map.points_uh = d[4];

    postfab_points("points_h");
    postfab_points("points_l", 5);
    postfab_points("points_uh");

    console.log("p.uh\nlength=", data.map.points_uh.length, " [CAP] ");
    console.log("p.h\nlength=", data.map.points_h.length);
    console.log("p.l\nlength=", data.map.points_l.length);

    data.map.provinces = {};
    for (var i = 0; i < data.map.geojson.features.length; i++) {
        var prop = data.map.geojson.features[i].properties;
        prop.id = parseInt(prop.id);
        data.map.provinces[prop.id] = prop;
    }

    data.ready = true;
    event.emit("ready");
});
