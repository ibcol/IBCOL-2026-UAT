/* ── IBCOL 2026 — Home page background canvas (pulse network) ── */
(function () {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

    let cubes = [];
    let scrollY = 0;
    let pulses = [];
    let lastSpawnAttempt = 0;

    const NEAREST_COUNT = 5;
    const MAX_CONN_DIST = 280;

    class Cube {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * (canvas.height * 2.5);
            this.size = Math.random() * 28 + 10;
            this.vx = (Math.random() - 0.5) * 0.8;
            this.vy = (Math.random() - 0.5) * 0.8;
            this.z = Math.random() * 0.7 + 0.15;
            this.opacity = Math.random() * 0.5 + 0.35;
            this.angle = Math.random() * Math.PI;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.angle += 0.003;
            if (this.x < -150) this.x = canvas.width + 150;
            if (this.x > canvas.width + 150) this.x = -150;
            if (this.y < -150) this.y = (canvas.height * 2.5) + 150;
            if (this.y > (canvas.height * 2.5) + 150) this.y = -150;
        }
        getScreenY(offset) {
            return (this.y - (offset * this.z)) % (canvas.height * 1.5);
        }
        draw(screenY) {
            if (screenY < -160 || screenY > canvas.height + 160) return;

            ctx.save();
            ctx.translate(this.x, screenY);
            ctx.rotate(this.angle);

            const s = this.size;
            const op = this.opacity;

            ctx.strokeStyle = `rgba(140, 220, 255, ${op})`;
            ctx.lineWidth = 1.6;
            ctx.strokeRect(-s / 2, -s / 2, s, s);

            ctx.globalAlpha = 0.55;
            ctx.strokeRect(-s / 4, -s / 1.5, s, s);
            ctx.globalAlpha = 1.0;

            ctx.beginPath();
            ctx.moveTo(-s / 2, -s / 2); ctx.lineTo(-s / 4, -s / 1.5);
            ctx.moveTo(s / 2, -s / 2); ctx.lineTo(s * 0.75, -s / 1.5);
            ctx.moveTo(s / 2, s / 2); ctx.lineTo(s * 0.75, s / 3);
            ctx.moveTo(-s / 2, s / 2); ctx.lineTo(-s / 4, s / 3);
            ctx.stroke();

            ctx.restore();
        }
    }

    class Pulse {
        constructor(c1, c2) {
            this.c1 = c1;
            this.c2 = c2;
            this.progress = 0;
            this.speed = 0.004 + Math.random() * 0.009;
            this.life = 1.4;
            this.reverse = Math.random() < 0.35;
        }
        update() {
            this.progress += this.speed;
            this.life -= 0.0045;
            return this.progress < 1.2 && this.life > 0;
        }
        draw() {
            const t = Math.min(1, this.progress);
            const start = this.reverse ? this.c2 : this.c1;
            const end = this.reverse ? this.c1 : this.c2;

            const sy1 = start.getScreenY(scrollY);
            const sy2 = end.getScreenY(scrollY);
            const x = start.x + (end.x - start.x) * t;
            const y = sy1 + (sy2 - sy1) * t;

            const alpha = this.life * (1 - t ** 1.5) * 0.92;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.shadowBlur = 22;
            ctx.shadowColor = '#80e0ff';
            ctx.strokeStyle = '#c0f0ff';
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.arc(x, y, 3 + t * 10, 0, Math.PI * 2);
            ctx.stroke();

            ctx.shadowBlur = 10;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(start.x, sy1);
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.restore();
        }
    }

    function initCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const desiredCount = Math.min(Math.floor(canvas.width / 55) + 5, 38);
        cubes = Array.from({ length: desiredCount }, () => new Cube());
    }

    function getVisibleConnections(activeCubes) {
        const cons = [];
        const seen = new Set();

        activeCubes.forEach((itemA, i) => {
            const a = itemA.obj;
            const distances = [];

            activeCubes.forEach((itemB, j) => {
                if (i === j) return;
                const b = itemB.obj;
                distances.push({ dist: Math.hypot(a.x - b.x, a.y - b.y), obj: b });
            });

            distances.sort((x, y) => x.dist - y.dist);
            const nearest = distances.slice(0, NEAREST_COUNT);

            nearest.forEach((n) => {
                if (n.dist >= MAX_CONN_DIST) return;
                const key = [a.x, a.y, n.obj.x, n.obj.y].sort((p, q) => p - q).join('|');
                if (seen.has(key)) return;
                seen.add(key);
                cons.push({ c1: a, c2: n.obj, dist: n.dist });
            });
        });

        return cons;
    }

    function trySpawnPulses(visibleCons) {
        const now = performance.now();
        if (now - lastSpawnAttempt < 400) return;
        lastSpawnAttempt = now;
        if (visibleCons.length === 0 || Math.random() > 0.88) return;
        const idx = Math.floor(Math.random() * visibleCons.length);
        const { c1, c2 } = visibleCons[idx];
        pulses.push(new Pulse(c1, c2));
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        scrollY = window.pageYOffset || document.documentElement.scrollTop;

        const activeCubes = [];
        for (const c of cubes) {
            const sy = c.getScreenY(scrollY);
            if (sy > -160 && sy < canvas.height + 160) {
                activeCubes.push({ obj: c, x: c.x, y: sy });
            }
            c.update();
        }

        const visibleCons = getVisibleConnections(activeCubes);

        for (const { c1, c2, dist } of visibleCons) {
            const sy1 = c1.getScreenY(scrollY);
            const sy2 = c2.getScreenY(scrollY);
            ctx.beginPath();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = `rgba(92,201,231,${0.7 * (1 - dist / MAX_CONN_DIST)})`;
            ctx.lineWidth = 1.4;
            ctx.moveTo(c1.x, sy1);
            ctx.lineTo(c2.x, sy2);
            ctx.stroke();
        }

        trySpawnPulses(visibleCons);

        pulses = pulses.filter((p) => {
            if (p.update()) {
                p.draw();
                return true;
            }
            return false;
        });

        for (const item of activeCubes) {
            item.obj.draw(item.y);
        }

        if (cubes.length > 0 && !canvas.classList.contains('active')) {
            canvas.classList.add('active');
        }

        requestAnimationFrame(draw);
    }

    initCanvas();
    requestAnimationFrame(draw);
    window.addEventListener('resize', initCanvas, { passive: true });
})();
