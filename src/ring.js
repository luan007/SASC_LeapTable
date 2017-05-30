import { ctx2d, mouse } from "./global.js"
import $ from 'webpack-zepto'


var img = document.createElement("img");
img.src = '/images/map 2.png';

export function render() {
    pushMatrix(ctx2d, () => {
        ctx2d.fillStyle = "#000";
        ctx2d.translate(1080 / 2, 1080 / 2);
        ctx2d.beginPath();
        ctx2d.arc(0, 0, 1080 / 2, 0, Math.PI * 2);
        ctx2d.fill();

        pushMatrix(ctx2d, () => {
            ctx2d.translate(-1080 / 2 + 50, -1080 / 2 + 150);
            ctx2d.scale(0.9, 0.9);
            ctx2d.drawImage(img, 55, 55);
        })

        // ctx2d.rotate(t * 2);

        // for (var i = 0; i < 360; i += 1) {
        //     var deg = i / 360 * Math.PI * 2;
        //     ctx2d.strokeStyle = "#02c2f2";
        //     pushMatrix(ctx2d, () => {
        //         ctx2d.beginPath();
        //         ctx2d.rotate(deg);
        //         let j = Math.sin(t * 40 + deg * 10) * Math.cos(t * 30 - deg * 3) * 10;
        //         ctx2d.moveTo(1080 / 2 - j - 55, 0);
        //         ctx2d.lineTo(1080 / 2 + j - 55, 0);
        //         ctx2d.stroke();
        //     });
        // }

        var targetDeg = Math.atan2(mouse.ey - 1080 / 2, mouse.ex - 1080 / 2);
        var radius = 1 - (distsq(mouse.ey, mouse.ex, 1080 / 2, 1080 / 2) / 291600);
        var offset = (t % Math.PI);
        for (var i = 0; i < 360; i += 1) {
            var deg = i / 360 * Math.PI * 2 + offset;
            ctx2d.strokeStyle = "#02c2f2";
            pushMatrix(ctx2d, () => {
                let j = Math.pow(Math.cos((deg - targetDeg) / 2), 500);
                // j *= Math.cos(t * 30);
                // ctx2d.strokeStyle = hsl(0.55, j / 3 + 0.4, 1);
                ctx2d.lineWidth = j + 1;
                ctx2d.beginPath();
                ctx2d.rotate(deg);
                ctx2d.moveTo(1080 / 2, 0);
                ctx2d.lineTo(1080 / 2 - 5 - j * radius * radius * 50, 0);
                ctx2d.stroke();
            });
        }
        holder_left.render();
    })
}


//shit code
class stick {
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
        });
        this.parent = stickParent;
        this.hitBox.appendTo(stickParent.container);
    }

    render() {
        ease(this, 'angle', 'angle_e');
        ease(this, 'scale', 'scale_e');
        ease(this, 'selected', 'selected_e', 0.4);
        this.hitBox.css({
            // "opacity": this.selected_e + 0.5,
            "transform-origin": "50% 50%",
            transform: `rotate(${this.angle_e}deg) translate(-400px, 0px) scale(1, ${this.scale_e})`,
        });

        //do canvas stuff
        ctx2d.lineCap = "round";
        ctx2d.lineJoin = "round";
        pushMatrix(ctx2d, () => {
            ctx2d.lineWidth = 3;
            ctx2d.rotate(this.angle_e / 180 * Math.PI);

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

    }

}

class stickHolder {
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


var holder_left = new stickHolder(
    [
        "城市常住人口（万人）",
        "公共财政预算收入（亿元）",
        "食品工业产值（亿元）",
        "食品生产经营单位数（家）",
        "食品工业产值年增幅（%）",
        "食品工业产值占地区生产总值比重（%）",
        "食品安全经费决算金额（万元）",
        "食品执法车辆总数（辆）",
        "执法装备价值（万元）",
        "食品安全工作考核占比（%）",
        "检查食品生产经营主体次数（家次）",
        "抽检数量（批次）",
        "办案数量（件）",
        "涉案货值（万元）",
        "罚没款金额（万元）",
        "刑事立案数量（件）",
        "追究刑责人数（人）",
        "抽检合格率（%）",
        "创建工作知晓度（%）",
        "当地食品安全总体满意度（%）",
        "受理投诉举报数量（件）",
        "办结投诉举报数量（件）"
    ]);


holder_left.setup();