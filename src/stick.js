import $ from 'webpack-zepto'
import { ctx2d, mouse } from "./global.js"
const lineDashSegs = [3, 3];

//shit code
export class stick {
    //a stick
    constructor(stickParent, data) {
        this.selected = 0;
        this.selected_e = 0;
        this.angle_e = 0;
        this.angle = 0;
        this.scale = 1;
        this.data = data;
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
        this.dataBox = $(`<div>${data}</div>`);
        this.dataBox.css({
            opacity: 1,
            "white-space": "nowrap",
            background: "#2fafff",
            color: "white",
            padding: "8px 15px",
            position: "absolute",
            "transform-origin": "50% 50%",
            "font-size": "20px",
            "pointer-events": "none"
        });
        this.parent = stickParent;
        this.hitBox.appendTo(stickParent.container);
        this.dataBox.appendTo(stickParent.container);
    }

    render() {
        ease(this, 'angle', 'angle_e');
        ease(this, 'scale', 'scale_e');
        ease(this, 'selected', 'selected_e', 0.4);
        this.hitBox.css({
            transform: `rotate(${this.angle_e}deg) translate(-400px, 0px) scale(1, ${this.scale_e})`,
        });

        //do canvas stuff
        ctx2d.lineCap = "round";
        ctx2d.lineJoin = "round";
        let deg = this.angle_e / 180 * Math.PI;

        pushMatrix(ctx2d, () => {
            ctx2d.lineWidth = 3;
            ctx2d.rotate(deg);

            ctx2d.beginPath();
            ctx2d.strokeStyle = hsl(0.56, 1, this.selected_e + 0.1);
            let arclen = 3 / 180 * Math.PI * this.scale_e;
            ctx2d.arc(0, 0, 500, -Math.PI - arclen, -Math.PI + arclen);
            ctx2d.stroke();

            ctx2d.beginPath();
            ctx2d.strokeStyle = hsl(0.56, 0.8, this.selected_e + 0.4);
            ctx2d.translate(-400, 0);
            ctx2d.moveTo(0, 0);
            ctx2d.lineTo(-50 - this.selected_e * 40, 0);
            ctx2d.stroke();

        });

        pushMatrix(ctx2d, () => {
            ctx2d.lineWidth = 2;
            ctx2d.beginPath();
            ctx2d.setLineDash(lineDashSegs);
            ctx2d.globalAlpha = this.selected_e;
            ctx2d.strokeStyle = hsl(0.56, 0.8, this.selected_e + 0.4);
            let baseX, baseY;
            baseX = -Math.cos(deg) * 400;
            baseY = -Math.sin(deg) * 400;
            ctx2d.translate(baseX, baseY);
            ctx2d.moveTo(5, 0);
            ctx2d.lineTo(50 * this.scale_e * this.scale_e, 0);
            ctx2d.stroke();

            this.dataBox.css({
                'display': this.selected ? "block" : "none",
                transform: `translate(${baseX - 50 + 50 * this.scale_e + 50}px, ${baseY - 20}px)`,
            });

        });
    }
}

export class stickHolder {
    constructor(dataSet) {
        this.dataSet = dataSet;
        this.children = [];
        this.selection = -1;
        this.container = $(`
        <div 
            id='stickHolder' 
            style='position: absolute; display: block; transform: translate(540px, 540px)'></div>`);
    }
    setup() {
        this.container.appendTo(document.querySelector("body"));
        this.dataSet.forEach((dt) => {
            let s = new stick(this, dt);
            this.children.push(s);
        });
    }
    render() {
        let _found = false;
        for (var i = 0; i < this.children.length; i++) {
            if (global.hoveringElement == this.children[i].hitBox.get(0)) {
                _found = true;
                if (this.selection !== i) {
                    this.selection = i;
                }
            }
        }
        if (!_found) this.selection = -1;

        let deg = this.children.length / 2 * 3; //init position
        if (this.selection >= 0) {
            deg += 3; //fix :)
        }
        for (var i = 0; i < this.children.length; i++) {
            let stick = this.children[i];
            stick.selected = this.selection == i ? 1 : 0;
            deg -= (stick.selected || ((i - 1) == this.selection && this.selection >= 0)) ? 6 : 3;
            stick.angle = deg;
            stick.scale = stick.selected ? 1 : 0.5;
            this.children[i].render();
        }
    }
}
