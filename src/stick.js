import $ from 'webpack-zepto'
import "./styles/stick.less"
import { ctx2d, mouse } from "./global.js"
import * as input from "./input.js"
import * as map from "./map-refac.js"
const lineDashSegs = [3, 3];

export var StickState = {
    Selection: -1,
    SelectionType: undefined,
    Overview: false
};

global.StickState = StickState;

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
        this.data = 0;
        this.data_e = 0;
        this.enabled = true;
        this.visibility_e = 0;
        this.enabled_e = 0;
        this.normal = 1;
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

        this.titleBox = $(`
            <div class="titleViz">
                <div class="title">${title}<b class="number-text"></b><b>${unit}</b></div>
            </div>
        `);

        this.parent = stickParent;
        this.hitBox.appendTo(stickParent.container);
        this.dataBox.appendTo(stickParent.container);
        this.titleBox.appendTo(stickParent.container);
        this.titleNumber = this.titleBox.find(".number-text");
    }

    setData(d, norm) {
        if (d != undefined) {
            this.data = d;
            this.normal = 1;
        }
        if (norm == undefined) {
            this.normal = 1;
        } else {
            this.normal = norm;
        }
        this.enabled = d != undefined;
        this.titleNumber.text(Math.round(this.data * this.roundTo) / this.roundTo);
    }

    render() {
        var mirror = this.baseAngle >= 180;
        ease(this, 'enabled', 'enabled_e');
        ease(this, 'angle', 'angle_e');
        ease(this, 'scale', 'scale_e');
        if (!this.selected) {
            this.data_e = 0;
        } else {
            ease(this, 'data', 'data_e', 0.4);
        }
        ease(this, 'selected', 'selected_e', 0.14);
        this.hitBox.get(0).style.transform = `rotate(${this.angle_e}deg) translate3d(-${Math.round(500 - this.visibility_e * 100)}px, 0px, 0px) scale(1, ${this.scale_e})`;
        //do canvas stuff
        ctx2d.lineCap = "round";
        ctx2d.lineJoin = "round";
        var deg = this.angle_e / 180 * Math.PI;
        var visibility = this.enabled_e * this.visibility_e;
        var highlight = (this.enabled && this.parent.visibility) ? this.selected_e : (visibility * this.selected_e);
        pushMatrix(ctx2d, () => {
            ctx2d.lineWidth = 3;
            ctx2d.rotate(deg);
            ctx2d.beginPath();
            ctx2d.strokeStyle = hsl(this.hue, 1, highlight + 0.1);
            var arclen = 4 / 180 * Math.PI * this.scale_e;
            ctx2d.arc(0, 0, 600 - visibility * 100, -Math.PI - arclen, -Math.PI + arclen);
            ctx2d.stroke();
            ctx2d.beginPath();
            ctx2d.strokeStyle = hsl(this.hue, 0.8 * (visibility + 0.2), highlight + 0.4);
            ctx2d.translate(-500 + visibility * 100, 0);
            ctx2d.moveTo(-10, 0);
            ctx2d.lineTo(-50 * (0.1 + 0.9 * visibility) - this.selected_e * 40, 0);
            // ctx2d.translate(-500 + visibility * 100, 0);
            // ctx2d.moveTo(-470, 0);
            // ctx2d.lineTo(-470 + (320 * (highlight * 0.8 + 0.2)), 0);
            ctx2d.stroke();
        });
        if (!this.dataTitle.measured) {
            this.dataTitle.measured = this.dataTitle.width();
        }
        if (this.selected && this.parent.focused && (!input.mouse.flying || input.mouse.highlock)) {
            pushMatrix(ctx2d, () => {
                ctx2d.lineWidth = 2;
                ctx2d.beginPath();
                ctx2d.setLineDash(lineDashSegs);
                ctx2d.globalAlpha = this.selected_e;
                ctx2d.strokeStyle = hsl(this.hue, 0.8, this.selected_e + 0.4);
                var baseX, baseY;
                baseX = -Math.cos(deg) * 400;
                baseY = -Math.sin(deg) * 400;
                ctx2d.translate(baseX, baseY);
                ctx2d.moveTo(mirror ? -5 : 5, 0);
                ctx2d.lineTo((mirror ? -50 : 50) * this.scale_e * this.scale_e, 0);
                ctx2d.stroke();
                this.dataBox.get(0).style.display = "block";
                if (!mirror) {
                    this.dataBox.get(0).style.transform = `translate3d(${baseX - 50 + 50 * this.scale_e + 50}px, ${baseY - 60}px, 0px)`;
                } else {
                    this.dataBox.get(0).style.transform = `translate3d(${- this.dataTitle.measured + baseX - 50 * this.scale_e}px, ${baseY - 60}px, 0px)`;
                }
                if (hoveringElement && (hoveringElement.parentElement == this.dataBox.get(0)
                    || (hoveringElement.parentElement && hoveringElement.parentElement.parentElement == this.dataBox.get(0)))) {
                    this.dataBox.get(0).style.opacity = 0.2;
                } else {
                    this.dataBox.get(0).style.opacity = 1;
                }
                this.dataNumber.text(Math.round(this.data_e * this.roundTo) / this.roundTo);
            });
        } else {
            this.dataBox.get(0).style.display = "none";
        }

        if (this.enabled && this.parent.focused && this.parent.visibility && !this.selected) {
            this.titleBox.get(0).style.display = "block";
            var baseX, baseY;
            baseX = -Math.cos(deg) * 400;
            baseY = -Math.sin(deg) * 400;
            if (!mirror) {
                this.titleBox.get(0).style.transform = `translate3d(${baseX - 50 + 50 * this.scale_e + 20}px, ${baseY - 20}px, 0px)`;
            } else {
                this.titleBox.get(0).style.transform = `translate3d(${- this.dataTitle.measured + baseX}px, ${baseY - 20}px, 0px)`;
            }
        } else {
            this.titleBox.get(0).style.display = "none";
        }
    }
}

global.managedSticks = [];
export class stickHolder {

    constructor(dataSet, baseAngle = 0, hue = 0.56, type = "") {
        managedSticks.push(this);
        this.dataSet = dataSet;
        this.type = type;
        this.children = [];
        this.selection = -1;
        this.visibility = 1;
        this.focused = false;
        this.baseAngle = baseAngle;
        this.visibility_e = 0;
        this.hue = hue;
        this.container = $(`
        <div 
            id='stickHolder' 
            style='top:0; left:0; z-index:9999999; position: absolute; display: block; transform: translate(540px, 540px)'></div>`);
    }

    setup() {
        this.container.appendTo(document.querySelector("body"));
        this.dataSet.forEach((dt) => {
            var s = new stick(this,
                dt.split("|")[0],
                dt.split("|")[1],
                unitRound(dt.split("|")[1]),
                this.baseAngle,
                this.hue);
            this.children.push(s);
        });
    }

    render() {
        global.map = map;
        var related = false;
        if (this.type) {
            //well..
            if (map.Map_State.SelectedEntity) {
                if (map.Map_State.SelectedEntity[this.type + "_data"]) {
                    related = true;
                }
                else if (this.type == map.Map_State.SelectedEntity.type) {
                    related = true;
                } else {
                    related = false;
                }
            }
        } else {
            related = true;
        }

        if (!this.focused || !input.mouse.dataRingVisible || !related) {
            this.visibility = 0;
        } else {
            this.visibility = 1;
        }

        if (!related) {
            this.focused = false;
        }

        ease(this, 'visibility', 'visibility_e', 0.06, 0.00001);
        if (input.mouse.dataRingVisible && related) {
            var _found = false;
            for (var i = 0; i < this.children.length; i++) {
                if (this.children[i].enabled && global.hoveringElement == this.children[i].hitBox.get(0)) {
                    _found = true;
                    if (this.selection !== i) {
                        this.selection = i;
                    }
                }
            }
            // if (!_found) this.selection = -1;
            if (_found) {
                this.focused = true;
                //force to deselect peers ops
                StickState.Selection = this.selection;
                StickState.SelectionType = this.type;
                // console.log(StickState);
                StickState.Overview = (StickState.Selection >= 0 && !StickState.SelectionType);
                for (var i = 0; i < managedSticks.length; i++) {
                    if (managedSticks[i] != this) {
                        managedSticks[i].focused = false;
                    }
                }
            }
        }
        else {
            if (
                StickState.Selection == this.selection &&
                StickState.SelectionType == this.type
            ) {
                StickState.Selection = -1;
                StickState.SelectionType = undefined;
            }
        }

        var deg_span = 4;
        var deg = this.children.length / 2 * deg_span + this.baseAngle; //init position
        if (this.selection >= 0) {
            deg += deg_span; //fix :)
        }
        for (var i = 0; i < this.children.length; i++) {
            var stick = this.children[i];
            stick.visibility_e = this.visibility_e;
            stick.selected = this.selection == i ? 1 : 0;
            deg -= (this.focused && this.visibility && (stick.selected || ((i - 1) == this.selection && this.selection >= 0))) ? (deg_span * 3.3) : deg_span;
            stick.angle = deg;
            stick.scale = stick.selected ? 1 : 0.5;

            if (this.type) {
                //well..
                if (map.Map_State.SelectedEntity && this.type == map.Map_State.SelectedEntity.type) {
                    try {
                        this.children[i].setData(map.Map_State.SelectedEntity["data"][i], map.Map_State.SelectedEntity["data_normal"][i])
                    } catch (e) {
                        this.children[i].setData()
                    }
                } else if (map.Map_State.SelectedEntity
                    && map.Map_State.SelectedEntity[this.type + "_data"]) {
                    this.children[i].setData(map.Map_State.SelectedEntity[this.type + "_data"][i])
                }
            }
            this.children[i].render();
        }
    }
}
