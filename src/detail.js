import * as d3 from "d3"
import * as THREE from "three"
import * as $ from "webpack-zepto"
import * as input from "./input.js"
import * as stick from "./stick.js"
import { data, event as data_event } from "./data.js"
import "./global.js"
import "./styles/detail.less"


var detailArea = $(`
    <div class='detailContainer'>
        <div class='textArea'>测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容</div>
        
    </div>
`);


export function initDetail() {
    detailArea.appendTo(document.body);
}