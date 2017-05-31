import * as d3 from "d3"
import { EventEmitter } from "events"

export var event = new EventEmitter();
export var data = {
    map: {
        geojson: undefined,  //for svg
        points_h: undefined, //high
        points_l: undefined, //low
        points_uh: undefined,//ultra high,
        markers: undefined   //positions / cities + counties
    },
};
//grab json

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
    "mapdata/map-highres.json",
    "mapdata/map-lowres.json",
    "mapdata/map-uhighres.json",
], (d) => {
    console.log(d);
});
