import { ctx2d, mouse } from "./global.js"
import { stick, stickHolder, StickState } from "./stick.js"
import $ from 'webpack-zepto'

var img = document.createElement("img");
img.src = '/images/map 2.png';

export function render() {
    pushMatrix(ctx2d, () => {
        ctx2d.strokeStyle = "#000";
        ctx2d.translate(1080 / 2, 1080 / 2);
        ctx2d.beginPath();
        ctx2d.arc(0, 0, 1080 / 2, 0, Math.PI * 2);
        ctx2d.stroke();

        pushMatrix(ctx2d, () => {
            ctx2d.translate(-1080 / 2 + 50, -1080 / 2 + 150);
            ctx2d.scale(0.9, 0.9);
            // ctx2d.drawImage(img, 55, 55);
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
        holder_time_l.render();
        holder_left.render();
        holder_right.render();
    })

    
}

// var holder_left = new stickHolder(raw_city_labels, 0, 0.56, "cities");
var holder_left = new stickHolder(raw_city_labels, 0, 0.56, "cities");



var holder_right = new stickHolder([
    "农产品质量安全监管工作在县级人民政府绩效考核体系中的比重|%",
    "关于农产品质量安全纳入财政预算的资金规摸|万元",
    "县级监管/协管人员|名",
    "乡镇级监管/协管人员|名",
    "村级监管/协管人员|名",
    "群众满意度|%",
    "质量安全水平|%",
    "全县设有监管机构的乡镇数|个",
    "定性检测检测产品数量|个",
    "定量检测检测产品数量|个",
    "检测产品数量|个",
    "“三品一标”产品数量|个",
    "“三品一标”产地面积占耕地面积比|%",
    "“三园两场”数量|个",
    "标准化生产基地面积 总面积占比|%",
    "标准化生产园（场）占比|%",
    "纳入追溯平台管理的农产品生产经营主体|个",
    "纳入监管信息平台管理的农业投入品生产经营主体|个",
    "组织开展农产品质量安全培训|人次",
    "开展农产品质量安全执法|次",
    "开展农产品质量安全宣传|次"
], 180, 0.3, 'counties');

var holder_time_l = new stickHolder([
    "全览| ",
    "创县|区县",
    "创城 - 第三批|城",
    "创城 - 第二批|城",
    "创城 - 第一批|城",
], 60, 0, undefined);

holder_time_l.setup();
holder_right.setup();
holder_left.setup();


holder_time_l.children[0].setData(107 + 67);
holder_time_l.children[1].setData(107);
holder_time_l.children[2].setData(37);
holder_time_l.children[3].setData(15);
holder_time_l.children[4].setData(15);
