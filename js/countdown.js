(function () {
    'use strict';

    const MONTHS = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };

    const DEADLINE_RE = /<li><strong>(\d{1,2})\s+(\w{3})<\/strong>\s*—\s*(Early bird|Regular|Late bird)\s+registration deadline<\/li>/gi;
    const YEAR_RE = /\b(20\d{2})\b/g;

    function inferYear(text) {
        const years = text.match(YEAR_RE) || [];
        if (!years.length) return new Date().getFullYear();
        const counts = years.reduce((acc, year) => {
            acc[year] = (acc[year] || 0) + 1;
            return acc;
        }, {});
        return Number(Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]);
    }

    function parseDeadlinesFromHtml(html) {
        const year = inferYear(html);
        const deadlines = [];
        let match;

        while ((match = DEADLINE_RE.exec(html)) !== null) {
            const day = Number(match[1]);
            const month = MONTHS[match[2].toLowerCase().slice(0, 3)];
            const label = match[3];
            if (month === undefined) continue;

            deadlines.push({
                iso: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
                title: label.replace(/\b\w/g, (char) => char.toUpperCase()) + ' Registration Deadline',
            });
        }

        return deadlines.sort((a, b) => a.iso.localeCompare(b.iso));
    }

    function toDate(iso) {
        const [year, month, day] = iso.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    function pickDeadline(deadlines) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < deadlines.length; i += 1) {
            const candidate = toDate(deadlines[i].iso);
            candidate.setHours(0, 0, 0, 0);
            if (candidate >= today) {
                return { date: candidate, title: deadlines[i].title };
            }
        }

        const last = deadlines[deadlines.length - 1];
        return { date: toDate(last.iso), title: last.title };
    }

    function pad(value) {
        return String(value).padStart(2, '0');
    }

    function startCountdown(deadline) {
        const target = deadline.date;
        const ids = ['days', 'hours', 'minutes', 'seconds'];

        function updateCountdown() {
            const diff = target - Date.now();
            const els = ids.map((id) => document.getElementById(id));

            if (els.some((el) => !el)) return;

            if (diff <= 0) {
                els.forEach((el) => { el.textContent = '00'; });
                return;
            }

            const days = Math.floor(diff / 86400000);
            const hours = Math.floor((diff % 86400000) / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            els[0].textContent = pad(days);
            els[1].textContent = pad(hours);
            els[2].textContent = pad(minutes);
            els[3].textContent = pad(seconds);
        }

        updateCountdown();
        setInterval(updateCountdown, 1000);
    }

    async function loadDeadlines() {
        if (Array.isArray(window.COUNTDOWN_DEADLINES) && window.COUNTDOWN_DEADLINES.length) {
            return window.COUNTDOWN_DEADLINES;
        }

        const response = await fetch('timeline.html', { cache: 'no-cache' });
        if (!response.ok) throw new Error('timeline fetch failed');
        return parseDeadlinesFromHtml(await response.text());
    }

    async function init() {
        const labelEl = document.querySelector('.countdown-subheader');
        if (!labelEl) return;

        try {
            const deadlines = await loadDeadlines();
            if (!deadlines.length) throw new Error('no registration deadlines found');

            const selected = pickDeadline(deadlines);
            labelEl.textContent = selected.title;
            startCountdown(selected);
        } catch (err) {
            console.warn('Countdown: could not load timeline deadlines', err);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
