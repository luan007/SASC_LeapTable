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
        provinces: undefined,
        provinces_name: undefined,
        cities_data: undefined,
        counties_data: undefined,
        cities: undefined,
        counties: undefined
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

function normalize_val(val, max, min) {
    return (val - min) / (max - min);
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

    data.map.cities = {};
    data.map.counties = {};
    data.map.markers.cities.forEach((e) => {
        data.map.cities[e.name] = e;
    });
    data.map.markers.counties.forEach((e) => {
        data.map.counties[e.name] = e;
    });


    postfab_points("points_h");
    postfab_points("points_l");
    postfab_points("points_uh");

    console.log("p.uh\nlength=", data.map.points_uh.length, " [CAP] ");
    console.log("p.h\nlength=", data.map.points_h.length);
    console.log("p.l\nlength=", data.map.points_l.length);

    data.map.provinces = {};
    data.map.provinces_name = {};
    for (var i = 0; i < data.map.geojson.features.length; i++) {
        var prop = data.map.geojson.features[i].properties;
        prop.id = parseInt(prop.id);
        data.map.provinces[prop.id] = prop;
        data.map.provinces_name[prop.name] = prop;
    }


    for (var i in data.map.markers.cities) {
        var cur = data.map.markers.cities[i];
        if (!data.map.provinces_name[cur.area].cities) {
            data.map.provinces_name[cur.area].cities = {};
        }
        data.map.provinces_name[cur.area].cities[cur.name] = cur;
    }

    for (var i in data.map.markers.counties) {
        var cur = data.map.markers.counties[i];
        if (!data.map.provinces_name[cur.area].counties) {
            data.map.provinces_name[cur.area].counties = {};
        }
        data.map.provinces_name[cur.area].counties[cur.name] = cur;
    }

    global.data = data;
    //calculate provinces


    processExcel(raw_cities, raw_city_labels, 'cities');

    data.ready = true;
    event.emit("ready");
});

function getProv(d) {
    //cities
    //counties

    for (var i in data.map.markers.cities) {
        if (d == data.map.markers.cities[i].name) {
            return data.map.markers.cities[i].area;
        }
    }
    for (var i in data.map.markers.counties) {
        if (d == data.map.markers.counties[i].name) {
            return data.map.markers.counties[i].area;
        }
    }
    return undefined;
}


var raw_city_labels = [
    "城市常住人口|万人",
    "公共财政预算收入|亿元",
    "食品工业产值|亿元",
    "食品生产经营单位数|家",
    "食品工业产值年增幅|%",
    "食品工业产值占地区生产总值比重|%",
    "食品安全经费决算金额|万元",
    "食品执法车辆总数|辆",
    "执法装备价值|万元",
    "食品安全工作考核占比|%",
    "检查食品生产经营主体次数|家次",
    "抽检数量|批次",
    "办案数量|件",
    "涉案货值|万元",
    "罚没款金额|万元",
    "刑事立案数量|件",
    "追究刑责人数|人",
    "抽检合格率|%",
    "创建工作知晓度|%",
    "当地食品安全总体满意度|%",
    "受理投诉举报数量|件",
    "办结投诉举报数量|件"
];
var raw_cities = `昆明	曲靖	乌兰察布	呼和浩特	上海	北京	延边州	长春	成都	泸州	天津	银川	石嘴山	合肥	马鞍山	威海	济南	潍坊	烟台	青岛	太原	运城	广州	深圳	佛山	南宁	钦州	乌鲁木齐	哈密	南京	南通	南昌	新余	石家庄	唐山	张家口	许昌	郑州	宁波	杭州	绍兴	海口	宜昌	武汉	襄阳	张家界	长沙	兰州	嘉峪关	福州	厦门	莆田	六盘水	贵阳	大连	沈阳	盘锦	重庆	宝鸡	杨凌	西安	韩城	佳木斯	哈尔滨	西宁	林芝	拉萨
672.8	608.4	206.48	308	2415.27	2170.5	151.02	764.5	1600	430.64	237.5	216.41	74.6496	779	226.2	281.93	723.31	935.7	701.41	920.4	431.87	527.5	1404.35	1190.84	743.06	706.22	324.3	360	62.16	827	730	537.14	117.36	1007.11	784.36	442.51	434.15	956.9	787.5	918.8	498.8	224.36	411.5	1060.77	562.7	153.00	743.18	370.55	24.39	713	392	289	289.83	469.68 	698.7	829.1	130.0923	3048.43	377.2	14.4282	883.21	39.98	237.5	961.4	233.37	23.1	95
530.00 	126.31	56.70 	269.70 	68010	4723.9	92	1150.5	1175	138.7	347.99 	188	24.74	1114.1	140.32	260.51	641.2	521.5	594.2	1100	282.69	59.1	1393.85	7901	604.29	312.76	49.5	3871	56.71	1142.6	580	402.2	137.2	405	355.07	141.7	131.9	1011.2	1114.5	1402.38	390.3	330.94	300	2231.67	320.7	32.21	743.69	215.5	15.13	934.06	1083.31	180.09	286.5	366.32 	611.89	938.6215	100.4831	2227.9	202.3	6.01	3.21	216239	36	376.2	76.2	10.6	107.53
302.32	107.92	89.93	490.8	1007.9	814.9	363	1186.1	1297.6	793.3	-	124	3.24	754.09	52.42	1644.32	310.2	1787.6	2119	2000.12	108.97	130.3	995.85	392.41	963.01	851.87	18.56	15.1943	4.26	187.95	56	1241.2	96.8	977.9	71.3	194.05	588.54	885.42	255.5	539.91	275.29	115.15	1720.07	865	753.1	75.67	817	2.69	2.48	159.71	272.66	329.7	5.24	245.20 	776.7	221.2	127.4499	1730.4	469.7	58.6	344.75	69.7	33.7	1550.2	163.17	-	-
90239	51940	16642	38493	251055	233482	25012	49195	109052	43376	10077	33715	10297	64788	21395	30286	88358	64413	63632	96879	55097	32557	171608	178680	78271	76113	19774	583	13002	801	68179	49869	12545	55511	38486	26606	30422	58317	135604	133378	60393	40166	58384	162571	46071	10531	110222	35534	4585	66384	64390	28505	25114	51077 	92230	1445	6568	321068	38553	1878	24789	1280	11465	75098	29040	5415	12986
28.37	51.20	14.24	9.40	-2.8	-4.51	10.8	8.2	15.2	11.1	15.36	8.68	45.7	3.8	6.46	9.34	-7.09	4.2	7.6	8.3	-3.4	0.42	-0.6	0.6	8.31	6.61	42.5	4.50	142	-0.8	2	9.9	9.80	1.7	14.8	4.8	8.3	5.5 	-1.54	-3.6	8.9	3.2	16.1	12.56	16.7	12.33	6	7.1	1.82	8.3	4.8	4.9	58.2	22.40 	-6.1	-	12.07	12	15.6	34.22	-10.6	14	20	0.03	28	-	-
1.38	6.00	7.42	28.20	3.30	3.5408	39.6667	20.0067	10.8133	53.5323	-	6.20		3	3.509	51.190	4.746	32.368	13.000		3.687	10.660	5.078	2	11.159	23.000	1.684	0.525	1.30	1.80	0.836	22.4	9.68	17.990	1.13	13.30	25.011	2.34	3	4.89	5.845	1.50	27.65	12.46	21	15	7.10	0.12	0.58	2.58	7.21	18.10	1.01	13.50	111.16	3.30	11.59	7.20	16.61	14.60	5.51	2.20	4	25.40	13.20	-	-
11099.19	3568	4127.52	4819.78	17921	136424.6431	739	19889.01	9375.13	9974.536	-	989	495.45	2386	1045.1	18661	8794.09	6488.9428	46481.51	31983.9	17289.7	15160.09	40986.2	25951.54	7056.28	16208.3	3526.31	561.4	220	3860.55	2258	3069	280	14371.6	 	4710.75	2927.94	3100	8819.2	13580.21	487.5	2335.93	2553.14	11270.95	5221	453.2	13952.89	-	358.48	12480.3	4511.08	710	1071.53	2020.11 	8771.925	5742.02	1918.26	82997	2693.65	1372.61	5359.64	1929.7	52	2240	1359.04	661	401
443	96	162	43	712	-	123	131	441	17	94	48	20	233	75	155	219	549	396	651	113	65	374	393	95	980	82	100	11	140	129	128	38	435	212	162	134	177	160	96	73	27	155	282	84	22	121	-	17	144	114	22	68	103 	233	209	70	410	188	9	253	22	38	142	58	5	10
5344.24	3078	1327.3	5285.07	15487.7	-	197.6139	3260.02	4805.09	1927.36	869.1	500	37.46	2280	2311.11	4925	7121.74	6617.56	14783.08	12032.07	1230.2	1194.88	13296.7204	-	1060.4	842.8	1353.96	1000	326.9	3376	835	1250	320	12615.5611	4099.92	5149.12	2923.53	4171	3530.7	4300.02	-	572.22	5059.19	8767.66	916.84	478.19	2229.76	-	135.66	4033.58	2267.42	2084	2362	1767.41 	7067.7	2620.78018	1255.93	12964	486	282.02	2148.92	306.85	200	1600	1566.6	45	300
2	3	5	5	3	3	3	3	3.2	3	5.15	5	2	2	4.6	3	3	6	3.2	3.5	2	3	4.8	3	3	3	6	3	3	3	3	2.7	2.75	3	3	3	3	3	3	5	3	3	3	3	3	3	3	2	3	3	4	3	3	3.00 	3.15	20	5.90	5	7.5	3	3	6	5	5	3	2	-
91075	66404	82979	56932	459000	22000	42419	176685	266551	145461	58366	36740	26251	76538	37394	81259	138551	213389	21172	284555	103752	72409	381780	76861	58344	228479	153059	2040	15233	155476	69836	60862	17560	174509	76882	87304	64766	156493	203991	200263	42850	27039	104364	708935	52060	20062	129766	284272	19311	103357	147099	21968	46187	180002 	147000	146232	30078	676396	58100	23745	48264	9288	22100	75098	49368	5415	17077
7616	4063	7303	9165	198630	148300	2953	6608	24725	9992	27827	9893	2032	7777	3344	21169	42344	52816	42000	100974	7151	6750	60905	108408	31417	12729	3506	10800	908	38600	41236	24261	1677	36364	37230	19898	8038	26739	53366	60684	22400	3522	223202	406572	34626	1395	40213	12711	2224	43866	16299	10935	5786	8628 	26293	8397	4386	34117	5280	1196	44417	2093	6750	16098	5600	258	379
559	661	1084	2056	7240	6584	253	1753	3616	689	179	56	202	450	221	1115	864	5652	1336	5184	1350	386	3295	7179	2627	1569	394	25	46	94	1742	237	176	1286	1756	582	276	721	1904	1880	1029	332	3736	1405	2151	207	1908	1255	50	991	278	425	295	697 	1656	285	109	4682	382	43	1644	189	18	15	72	7	24
256.8	176.29	280.25	-	1418.1	2500	165.2494	-	275.5	64.99	-	175	98	6.77	76.14	131.12	166.36	482.911	55927.08	-	75.31	5.88	1122.8	858.6	2493.91	1214.95	704.17	12.6	26	1735.95	1200	109.8	25.8	451.3272	221.009692	136	30	41.4756	715.58	2427.88	609.68	276	828.301	547.42	1800	93.47	430.15	32.5187	39	372.89	788.31	365.42	89.1	107.92 	2294.407	91.1236	152.52642	691.26	31.5	3.7	87.63	24.78	50	74	12.37	5.6	-
1284	596.07	278.95	852.3	16300.1	10000	291.0495	1438.93	4297.62	570.24	272.02	68	117.56	536.61	157.4	833.6	1665.35	2434.707	306.68	3255	548.64	220.3	5344.27	8444.59	2216.78	761.5	1115	33.86	51.9	648.21	1762.66	450	62.98	1542.20419	1115.232477	218	221.4	641.1038	3363.8	6480.8461	2610.24	428.2	834.206	871	1200	215.84	2077.84	1694.12	69.85	1089.27	3185.91	571.06	346.09	556.25 	906.5974	500.957	219.29	4038.51	198.2	18.5	1274.74	105.16	41	227	36.63	0.5	24.2
15	29	0	7	159	241	4	157	63	13	18	2	2	21	2	79	113	215	139	69	71	207	519	456	124	32	0	-	0	94	102	46	6	47	69	50	14	18	44	18	106	4	49	15	32	2	115	53	0	511	82	74	3	23 	140	257	-	14	10	1	260	3	1	3	4	1	4
13	30	0	8	320	296	10	350	34	10	26	2	5	96	2	27	87	273	173	198	35	161	1036	229	333	9	0	-	0	135	224	34	7	25	82	56	16	20	162	98	187	4	15	18	39	4	148	28	0	41	5	30	5	25 	72	82	-	30	3	0	257	3	2	3	4	无	0
97.60	97.00	98.00	98.40	98.50	97.92	99.6	93.81	92.93	96.3	99.22	97.8	97.12	98.12	97.82	97.50	96.81	98.87	98.2	98.75	96.7	98.15	98.5	98.20	97.14	96.2	99.88	79	99.60	98.7	98.2	98.6	95.88	95	97.96	98.79	97.12	97.8	97.22	97.11	97.13	96.80	99.7	97.75	95.7	92.05	95.97	98	70.2	98.52	96.81	98.81	99.07	98.33 	97.02	96.965	98.8	96.45	97.2	97.80	98.98	95.9	99.5	99.87	97.8	93.48	90.66
-	-	91.30	95	80.2	-	72.3	77	78.27	-	82.5	-	-	-	-	92.50	92	96.9	92	100	87	80.04	80.23	48.9	-	30.94	52.61	50	42	55.3	70.5	53	45	75.52	71.46	98	-	-	88.5	85.5	-	51.82	-	99.5	92	-	53.28	-	54.6	97.6	61.18	54.22	-	-	64.17	-	60	63.8	80.03	72	-	82.3	77	-	80.7	-	-
-	-	74.70	71.7	72.3	87	75.2	56.5	72.06	-	76	-	-	65.82	69.6	86.20	80	95.6	81	77.58	85	86.46	72.33	57.5	80.99	65.8	93	50	67.80	71.5	77.8	48.9	61	80.1	76.19	79	-	-	86.1	75	70.83	62.30	-	84.3	83.8	72	69.84	-	48.2	73.87	72.2	72.77	-	-	40.67	-	51	52.5	80.2	85.20	71.86	74.62	75.1	-	43.6	-	-
1435	210	339	1065	106942	69548	258	3608	15483	410	2838	1235	1766	4669	689	2839	17116	3039	3298	13329	2973	225	25809	20038	5320	2669	350	164	36	4635	1460	687	101	3731	2874	474	414	5607	5736	22323	1835	2806	5157	15424	1630	46	6269	2923	199	1500	3593	735	258	1126 	5223	9254	371	9145	523	109	3695	51	55	399	816	40	86
1435	202	339	1065	102771	69548	258	3608	15483	410	2795	1235	1766	4669	689	2839	17116	3039	3298	13329	2973	225	25809	19873	4985	2669	350	160	36	4434	1374	687	101	3695	2860	474	414	5297	5736	22323	1835	2749	5157	15424	1630	46	5967	2923	199	1488	3534	735	258	1126 	5192	8513	371	9145	523	109	3475	51	55	399	816	40	86`


function processExcel(d, labels, type) {
    d = d.trim().split("\n");
    //name: data list
    var name = {};
    var headers = d[0].trim().split("\t");
    var names = [];
    headers.forEach((h) => {
        names.push(h);
        name[h] = [];
    });

    d.shift();
    for (var i = 0; i < d.length; i++) {
        var line = d[i].trim().split("\t");
        for (var j = 0; j < line.length; j++) {
            var dt = parseFloat(line[j]);
            if (Number.isNaN(dt)) {
                dt = undefined;
            }
            name[names[j]].push(dt);
            if (!data.map[type][names[j]].data) data.map[type][names[j]].data = [];
            data.map[type][names[j]].data.push(dt);
        }
    }

    //calculate province data
    for (var i in data.map.provinces_name) {
        var prov = data.map.provinces_name[i];
        if (!prov[type]) continue;
        prov[type + "_data"] = mergeKVCluster(prov[type], labels);
    }
    data.map[type + "_data"] = mergeKVCluster(data.map[type], labels);
    normalizeCluster(data.map[type], labels);
    // console.log(name);
    // console.log(province);
}


function mergeKVCluster(dataInKVShell, labels) {
    var out = [];
    for (var l = 0; l < labels.length; l++) {
        var sum = 0;
        var validData = 0;
        for (var i in dataInKVShell) {
            var cur = dataInKVShell[i].data;
            if (cur[l] != undefined) {
                validData++;
                sum += cur[l];
            }
        }
        var avg = sum / validData;
        if (!validData) {
            out.push(undefined);
        } else if (labels[l].indexOf("%") >= 0) {
            out.push(avg);
        } else {
            out.push(sum);
        }
    }
    return out;
}

function normalizeCluster(dataInKVShell, labels) {
    var out = [];
    for (var l = 0; l < labels.length; l++) {
        var max = 0;
        var min = 0;
        for (var i in dataInKVShell) {
            var cur = dataInKVShell[i].data;
            if (cur[l] != undefined) {
                if (cur[l] > max) {
                    max = cur[l];
                }
                if (cur[l] < min) {
                    min = cur[l];
                }
            }
        }
        for (var i in dataInKVShell) {
            if (!dataInKVShell[i].data_normal) {
                dataInKVShell[i].data_normal = [];
            }
            var cur = dataInKVShell[i].data;
            if (cur[l] != undefined) {
                dataInKVShell[i].data_normal[l] = normalize_val(cur[l], max, min);
            }
        }
    }
    return out;
}