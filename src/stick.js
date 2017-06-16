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
        if (d != undefined) {
            this.data = d;
        }
        this.enabled = d != undefined;
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
        ease(this, 'selected', 'selected_e', 0.4);
        this.hitBox.get(0).style.transform = `rotate(${this.angle_e}deg) translate3d(-${Math.round(500 - this.visibility_e * 100)}px, 0px, 0px) scale(1, ${this.scale_e})`;
        //do canvas stuff
        ctx2d.lineCap = "round";
        ctx2d.lineJoin = "round";
        var deg = this.angle_e / 180 * Math.PI;
        var visibility = this.enabled_e * this.visibility_e;
        pushMatrix(ctx2d, () => {
            ctx2d.lineWidth = 3;
            ctx2d.rotate(deg);
            ctx2d.beginPath();
            ctx2d.strokeStyle = hsl(this.hue, 1, this.selected_e + 0.1);
            var arclen = 4 / 180 * Math.PI * this.scale_e;
            ctx2d.arc(0, 0, 600 - visibility * 100, -Math.PI - arclen, -Math.PI + arclen);
            ctx2d.stroke();
            ctx2d.beginPath();
            ctx2d.strokeStyle = hsl(this.hue, 0.8 * (visibility + 0.2), this.selected_e + 0.4);
            ctx2d.translate(-500 + visibility * 100, 0);
            ctx2d.moveTo(0, 0);
            ctx2d.lineTo(-50 * (0.1 + 0.9 * visibility) - this.selected_e * 40, 0);
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
                    this.dataBox.get(0).style.transform = `translate3d(${baseX - 50 + 50 * this.scale_e + 50}px, ${baseY - 20}px, 0px)`;
                } else {
                    this.dataBox.get(0).style.transform = `translate3d(${- this.dataTitle.measured + baseX - 50 * this.scale_e}px, ${baseY - 20}px, 0px)`;
                }
                if (hoveringElement && (hoveringElement.parentElement == this.dataBox.get(0)
                    || (hoveringElement.parentElement && hoveringElement.parentElement.parentElement == this.dataBox.get(0)))) {
                    this.dataBox.get(0).style.opacity = 0.3;
                } else {
                    this.dataBox.get(0).style.opacity = 1;
                }
                this.dataNumber.text(Math.round(this.data_e * this.roundTo) / this.roundTo);
            });
        } else {
            this.dataBox.get(0).style.display = "none";
        }
    }
}

var managedSticks = [];
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
        var related = true;
        if (this.type) {
            //well..
            if (map.Map_State.SelectedEntity) {
                if (map.Map_State.SelectedEntity[this.type + "_data"]) {
                    related = true;
                }
                else if (this.type == 'cities' && map.Map_State.SelectedEntity.batch > 0) {
                    related = true;
                } else if (this.type == 'counties' && map.Map_State.SelectedEntity.pos) {
                    related = true;
                } else {
                    related = false;
                }
            }
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
            deg -= (stick.selected || ((i - 1) == this.selection && this.selection >= 0)) ? (deg_span * 2) : deg_span;
            stick.angle = deg;
            stick.scale = stick.selected ? 1 : 0.5;

            if (this.type) {
                //well..
                if (map.Map_State.SelectedEntity
                    && map.Map_State.SelectedEntity[this.type + "_data"]) {
                    this.children[i].setData(map.Map_State.SelectedEntity[this.type + "_data"][i])
                }
                else if (map.Map_State.SelectedEntity && this.type == 'cities' && map.Map_State.SelectedEntity.batch > 0) {
                    try {
                        this.children[i].setData(map.Map_State.SelectedEntity["data"][i])
                    } catch (e) {
                        this.children[i].setData()
                    }
                } else if (map.Map_State.SelectedEntity && this.type == 'counties' && map.Map_State.SelectedEntity.pos) {
                    try {
                        this.children[i].setData(map.Map_State.SelectedEntity["data"][i])
                    } catch (e) {
                        this.children[i].setData()
                    }
                }
            }
            this.children[i].render();
        }
    }
}
