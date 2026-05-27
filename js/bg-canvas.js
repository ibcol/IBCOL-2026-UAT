/* ── IBCOL 2026 — Background Canvas Animation ── */
(function () {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    let cubes = [];
    let scrollY = 0;
    let prevTime = 0;
    const TARGET_FPS = 45;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;

    class Cube {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * (canvas.height * 2.5);
            this.size = Math.random() * 24 + 8;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
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
            ctx.shadowBlur = 12;
            ctx.shadowColor = "rgba(92, 201, 231, 0.65)";
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

    function initCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const desiredCount = Math.min(Math.floor(canvas.width / 48) + 5, 36);
        cubes = Array.from({ length: desiredCount }, () => new Cube());
    }

    function draw(timestamp) {
        if (!prevTime) prevTime = timestamp;
        const elapsed = timestamp - prevTime;
        if (elapsed < FRAME_INTERVAL) { requestAnimationFrame(draw); return; }
        prevTime = timestamp - (elapsed % FRAME_INTERVAL);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const active = [];
        for (const c of cubes) {
            const sy = c.getScreenY(scrollY);
            if (sy > -160 && sy < canvas.height + 160) active.push({ obj: c, x: c.x, y: sy });
            c.update();
        }
        for (const item of active) item.obj.draw(item.y);
        if (active.length < 90 && active.length > 4) {
            const maxDistSq = 280 * 280;
            for (let i = 0; i < active.length; i++) {
                const c1 = active[i];
                for (let j = i + 1; j < active.length; j += 2) {
                    const c2 = active[j];
                    const dx = c1.x - c2.x, dy = c1.y - c2.y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < maxDistSq) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(92, 201, 231, ${0.7 * (1 - Math.sqrt(distSq) / 280)})`;
                        ctx.lineWidth = 1.4;
                        ctx.moveTo(c1.x, c1.y);
                        ctx.lineTo(c2.x, c2.y);
                        ctx.stroke();
                    }
                }
            }
        }
        if (cubes.length > 0 && !canvas.classList.contains('active')) canvas.classList.add('active');
        requestAnimationFrame(draw);
    }

    initCanvas();
    requestAnimationFrame(draw);
    window.addEventListener('resize', initCanvas, { passive: true });
})();
