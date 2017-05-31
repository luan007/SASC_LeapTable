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
    function load_recur(i) {
        (i >= data.length) ?
            cb(l)
            :
            d3.json(data[i], function (e, c) {
                l[i] = c;
                load_recur(i + 1);
            });
    }
}

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
