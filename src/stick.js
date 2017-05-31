import $ from 'webpack-zepto'
import "./styles/stick.less"
import { ctx2d, mouse } from "./global.js"
const lineDashSegs = [3, 3];

function unitRound(unit) {
    return /万|亿/.test(unit) ? 100 :
        (/\%/.test(unit) ? 10 : 1);
}
//shit code
export class stick {
    //a stick
    constructor(stickParent, title, unit, roundTo, baseAngle, hue = 0.56) {
        this.selected = 0;
        this.hue = hue;
        this.selected_e = 0;
        this.angle_e = baseAngle;
        this.angle = baseAngle;
        this.baseAngle = baseAngle;
        this.scale = 1;
        this.title = title;
        this.data = 13392;
        this.data_e = 0;
        this.visibility_e = 0;
        this.roundTo = roundTo;
        this.scale_e = 1;
        this.hitBox = $(`<div></div>`);
        this.hitBox.css({
            width: '150px',
            height: '50px',
            opacity: 0,
            background: "Red",
            color: "#2fafff",
            position: "absolute",
            "top": '-25px',
            "left": "-75px",
            "text-align": "right",
            "font-size": "15px",
            "transform-origin": "50% 50%"
        });
        this.dataBox = $(`
        <div class='dataViz'>
            <div class='number'><span class='number-text'>18374</span><span>${unit}</span></div>
            <div class='title' style='background: ${hsl(this.hue, 0.65, 0.5)}'>${title}</div>
        </div>`);
        this.dataTitle = this.dataBox.find(".title");
        this.dataNumber = this.dataBox.find(".number-text");
        this.parent = stickParent;
        this.hitBox.appendTo(stickParent.container);
        this.dataBox.appendTo(stickParent.container);
    }

    setData(d) {
        this.data = d;
    }

    render() {

        let mirror = this.baseAngle >= 180;

        ease(this, 'angle', 'angle_e');
        ease(this, 'scale', 'scale_e');
        if (!this.selected) {
            this.data_e = 0;
        } else {
            ease(this, 'data', 'data_e', 0.4);
        }
        ease(this, 'selected', 'selected_e', 0.4);
        this.hitBox.css({
            transform: `rotate(${this.angle_e}deg) translate(-${Math.round(500 - this.visibility_e * 100)}px, 0px) scale(1, ${this.scale_e})`,
        });

        //do canvas stuff
        ctx2d.lineCap = "round";
        ctx2d.lineJoin = "round";
        let deg = this.angle_e / 180 * Math.PI;

        pushMatrix(ctx2d, () => {
            ctx2d.lineWidth = 3;
            ctx2d.rotate(deg);

            ctx2d.beginPath();
            ctx2d.strokeStyle = hsl(this.hue, 1, this.selected_e + 0.1);
            let arclen = 4 / 180 * Math.PI * this.scale_e;
            ctx2d.arc(0, 0, 600 - this.visibility_e * 100, -Math.PI - arclen, -Math.PI + arclen);
            ctx2d.stroke();

            ctx2d.beginPath();
            ctx2d.strokeStyle = hsl(this.hue, 0.8 * (this.visibility_e + 0.2), this.selected_e + 0.4);
            ctx2d.translate(-500 + this.visibility_e * 100, 0);
            ctx2d.moveTo(0, 0);
            ctx2d.lineTo(-50 * (0.1 + 0.9 * this.visibility_e) - this.selected_e * 40, 0);
            ctx2d.stroke();

        });


        if (!this.dataTitle.measured) {
            this.dataTitle.measured = this.dataTitle.width();
        }
        if (this.selected) {
            pushMatrix(ctx2d, () => {
                ctx2d.lineWidth = 2;
                ctx2d.beginPath();
                ctx2d.setLineDash(lineDashSegs);
                ctx2d.globalAlpha = this.selected_e;
                ctx2d.strokeStyle = hsl(this.hue, 0.8, this.selected_e + 0.4);
                let baseX, baseY;
                baseX = -Math.cos(deg) * 400;
                baseY = -Math.sin(deg) * 400;
                ctx2d.translate(baseX, baseY);
                ctx2d.moveTo(mirror ? -5 : 5, 0);
                ctx2d.lineTo((mirror ? -50 : 50) * this.scale_e * this.scale_e, 0);
                ctx2d.stroke();
                if (!mirror) {
                    this.dataBox.css({
                        'display': "block",
                        transform: `translate(${baseX - 50 + 50 * this.scale_e + 50}px, ${baseY - 20}px)`,
                    });
                } else {
                    this.dataBox.css({
                        'display': "block",
                        transform: `translate(${- this.dataTitle.measured + baseX - 50 * this.scale_e}px, ${baseY - 20}px)`,
                    });
                }
                this.dataNumber.text(Math.round(this.data_e * this.roundTo) / this.roundTo);
            });
        } else {
            this.dataBox.css({
                'display': "none"
            });
        }
    }
}


var managedSticks = []

export class stickHolder {

    constructor(dataSet, baseAngle = 0, hue = 0.56) {
        managedSticks.push(this);
        this.dataSet = dataSet;
        this.children = [];
        this.selection = -1;
        this.visibility = 1;
        this.baseAngle = baseAngle;
        this.visibility_e = 0;
        this.hue = hue;
        this.container = $(`
        <div 
            id='stickHolder' 
            style='position: absolute; display: block; transform: translate(540px, 540px)'></div>`);
    }

    setup() {
        this.container.appendTo(document.querySelector("body"));
        this.dataSet.forEach((dt) => {
            let s = new stick(this,
                dt.split("|")[0],
                dt.split("|")[1],
                unitRound(dt.split("|")[1]),
                this.baseAngle,
                this.hue);
            this.children.push(s);
        });
    }

    render() {

        if (this.selection >= 0) {
            this.visibility = 1;
        }

        ease(this, 'visibility', 'visibility_e', 0.06, 0.00001);
        let _found = false;
        for (var i = 0; i < this.children.length; i++) {
            if (global.hoveringElement == this.children[i].hitBox.get(0)) {
                _found = true;
                if (this.selection !== i) {
                    this.selection = i;
                }
            }
        }
        // if (!_found) this.selection = -1;
        if (_found) {
            //force to deselect peers ops
            for (var i = 0; i < managedSticks.length; i++) {
                if (managedSticks[i] != this) {
                    managedSticks[i].selection = -1;
                    managedSticks[i].visibility = 0;
                }
            }
        }

        let deg_span = 4;

        let deg = this.children.length / 2 * deg_span + this.baseAngle; //init position
        if (this.selection >= 0) {
            deg += deg_span; //fix :)
        }
        for (var i = 0; i < this.children.length; i++) {
            let stick = this.children[i];
            stick.visibility_e = this.visibility_e;
            stick.selected = this.selection == i ? 1 : 0;
            deg -= (stick.selected || ((i - 1) == this.selection && this.selection >= 0)) ? (deg_span * 2) : deg_span;
            stick.angle = deg;
            stick.scale = stick.selected ? 1 : 0.5;
            this.children[i].render();
        }
    }
}


