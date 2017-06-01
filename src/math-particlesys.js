
/**generic particle system */
export class ParticleSys {
    constructor(len, modifiers = []) {
        this.Points = [];
        this.Modifers = modifiers;
        for (var i = 0; i < len; i++) {
            this.Points.push({
                x: 0,
                y: 0,
                z: 0,
                vx: 0,
                vy: 0,
                vz: 0,
                ax: 0,
                ay: 0,
                az: 0,
                r: 1,
                g: 1,
                b: 1,
                tr: 1,
                tg: 1,
                tb: 1,
                shuffle: Math.random() * 0.8 + 0.1,
                shuffleSq: (Math.random() * 0.8 + 0.1) * (Math.random() * 0.8 + 0.1),
                life: 1,
                lifeV: 0,
                bag: {}
            });
        }
    }

    update() {

        for (var j = 0; j < this.Modifers.length; j++) {
            if (!this.Modifers[j].disabled) {
                this.Modifers[j][0](
                    this
                );
            }
            //mod(particle, index, particleArr, particleSys)
        }

        for (var i = 0; i < this.Points.length; i++) {
            var cur = this.Points[i];
            if (cur.life <= 0) {
                continue;
            }
            cur.ax = 0;
            cur.ay = 0;
            cur.az = 0;

            for (var j = 0; j < this.Modifers.length; j++) {
                if (!this.Modifers[j].disabled) {
                    this.Modifers[j][1](
                        cur, i, this.Points, this
                    );
                }
                //mod(particle, index, particleArr, particleSys)
            }

            //built in
            ease(cur, 'tr', 'r');
            ease(cur, 'tg', 'g');
            ease(cur, 'tb', 'b');

            cur.life -= cur.lifeV;
            cur.vx += cur.ax;
            cur.vy += cur.ay;
            cur.vz += cur.az;
            cur.x += cur.vx;
            cur.y += cur.vy;
            cur.z += cur.vz;

        }
    }
}


export var Behaviors = {
    Targeting: {
        modifier: () => [null, function (p, index, particleArr, particleSys) {
            p.life = 1; //always alive
            //calculate acc
            p.ax = (p.bag.tx - p.x) * 0.01;
            p.ay = (p.bag.ty - p.y) * 0.01;
            p.az = (p.bag.tz - p.z) * .1 * p.shuffleSq;
            p.vx *= 0.85;
            p.vy *= 0.85;
            p.vz *= 0.45;
        }],
        set: function (psys, arr) {
            for (var i = 0; i < arr.length; i++) {
                psys.Points[i].bag.tx = arr[i].x;
                psys.Points[i].bag.ty = arr[i].y;
                psys.Points[i].bag.tz = arr[i].z;
            }
        }
    },
    Shuffle: {
        set: function (psys, t) {
            psys.shuffleCounter = t;
        },
        modifier: () => [
            function (psys) {
                if (psys.shuffleCounter > 0) {
                    psys.shuffleCounter--;
                }
            },
            , function (p, index, particleArr, particleSys) {
                if (particleSys.shuffleCounter < 0) return;
                p.ax += (Math.random() - 0.5) * .52;
                p.ay += (Math.random() - 0.5) * .52;
                p.az += (Math.random() - 0.5) * .52;
            }
        ]
    }
};
