(function () {
    // ==========================================
    // 1. DATA CONFIGURATION
    // ==========================================
    const CONFIG = {
        DEADLINES: {
            earlyBird: '2026-07-21',
            regular: '2026-08-08',
            lateBird: '2026-09-09',
            resubmission: '2026-11-30'
        },
        PRICING: {
            EUR: { base: 123, tier2to4: 67, tier5plus: 55, latePerDay: 2.71828, symbol: '€', decimals: 2 },
            HKD: { base: 1000, tier2to4: 500, tier5plus: 375, latePerDay: 27.1828, symbol: 'HK$', decimals: 0 }
        },
        CATEGORY_MULT: { A: 1.2, B: 1, C: 0.8 }
    };

    // ==========================================
    // 2. MATH & CALCULATIONS (PURE LOGIC)
    // ==========================================
    const parseDate = (str) => {
        if (!str) return null;
        const [y, m, d] = str.split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    const daysBetween = (start, end) => {
        return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000));
    };

    const formatMoney = (amount, currency) => {
        const p = CONFIG.PRICING[currency];
        const rounded = p.decimals === 0 ? Math.round(amount) : Math.round(amount * 100) / 100;
        return p.symbol + (p.decimals === 0 ? rounded.toLocaleString('en-US') : rounded.toFixed(2));
    };

    function computeRegistration(teamSize, currency, payDateStr, category) {
        const rates = CONFIG.PRICING[currency];
        const extra = Math.max(0, teamSize - 1);
        const count2to4 = Math.min(extra, 3);
        const count5plus = Math.max(0, teamSize - 4);

        const base = rates.base;
        const mid = count2to4 * rates.tier2to4;
        const low = count5plus * rates.tier5plus;
        const subtotal = base + mid + low;

        const mult = CONFIG.CATEGORY_MULT[category];
        const afterCategory = subtotal * mult;

        const d = parseDate(payDateStr);
        if (!payDateStr || !d) {
            return { subtotal, base, count2to4, mid, count5plus, low, mult, afterCategory, status: 'missing' };
        }

        const early = parseDate(CONFIG.DEADLINES.earlyBird);
        const regular = parseDate(CONFIG.DEADLINES.regular);
        const late = parseDate(CONFIG.DEADLINES.lateBird);

        if (d <= early) return { subtotal, base, count2to4, mid, count5plus, low, mult, afterCategory, status: 'early', multiplier: 0.6, total: afterCategory * 0.6 };
        if (d <= regular) return { subtotal, base, count2to4, mid, count5plus, low, mult, afterCategory, status: 'regular', multiplier: 1, total: afterCategory * 1 };
        if (d <= late) return { subtotal, base, count2to4, mid, count5plus, low, mult, afterCategory, status: 'late', multiplier: 1.1, total: afterCategory * 1.1 };
        
        return { subtotal, base, count2to4, mid, count5plus, low, mult, afterCategory, status: 'closed' };
    }

    // ==========================================
    // 3. CENTRALIZED UI CONTROLLER
    // ==========================================
    function renderUI() {
        const form = document.getElementById('fee-calculator');
        if (!form) return;

        // Gather structural DOM elements
        const mode = document.querySelector('input[name="calc-mode"]:checked').value;
        const currency = document.getElementById('calc-currency').value;
        const regFields = document.getElementById('calc-reg-fields');
        const resubFields = document.getElementById('calc-resub-fields');
        const catWrap = document.getElementById('calc-category-wrap');
        const breakdownEl = document.getElementById('calc-breakdown');
        const resultEl = document.getElementById('calc-result');

        let lines = [];

        // ------------------------------------------
        // MODE: REGISTRATION FEE
        // ------------------------------------------
        if (mode === 'registration') {
            // FORCE VISIBILITY: Show registration wrappers explicitly, hide resubmission
            if (regFields) regFields.hidden = false;
            if (catWrap) catWrap.hidden = false; 
            if (resubFields) resubFields.hidden = true;

            const teamSizeInput = document.getElementById('calc-team-size');
            const categoryInput = document.getElementById('calc-category');
            const payDateInput = document.getElementById('calc-pay-date');

            const teamSize = Math.max(1, parseInt(teamSizeInput.value, 10) || 1);
            const category = categoryInput ? categoryInput.value : 'B';
            const catClass = category === 'A' ? 'price-high' : category === 'C' ? 'price-low' : '';

            const data = computeRegistration(teamSize, currency, payDateInput.value, category);

            // Build dynamic display list
            lines.push(`<div class="calc-line"><strong>Base team (1 member):</strong> ${formatMoney(data.base, currency)}</div>`);
            if (data.count2to4 > 0) {
                lines.push(`<div class="calc-line"><strong>Members 2–4 (${data.count2to4}):</strong> ${formatMoney(data.mid, currency)}</div>`);
            }
            if (data.count5plus > 0) {
                lines.push(`<div class="calc-line"><strong>Members 5+ (${data.count5plus}):</strong> ${formatMoney(data.low, currency)}</div>`);
            }
            lines.push(`<div class="calc-line"><strong>Subtotal:</strong> ${formatMoney(data.subtotal, currency)}</div>`);
            lines.push('<div class="calc-spacer" aria-hidden="true">&nbsp;</div><hr class="calc-divider">');
            lines.push(`<div class="calc-line ${catClass}"><strong>Country category ${category} (×${data.mult}):</strong> ${formatMoney(data.afterCategory, currency)}</div>`);

            if (data.status === 'missing') {
                breakdownEl.innerHTML = lines.join('');
                resultEl.textContent = 'Select a payment date to see your total.';
                resultEl.className = 'calc-total calc-total--hint';
                return;
            }
            if (data.status === 'closed') {
                breakdownEl.innerHTML = lines.join('');
                resultEl.innerHTML = '<span class="calc-warning">Registration closed (after 9 Sep 2026)</span>';
                resultEl.className = 'calc-total calc-total--hint';
                return;
            }

            if (data.status === 'early') {
                lines.push(`<div class="calc-line price-low"><strong>Early bird (40% off):</strong> −${formatMoney(data.afterCategory - data.total, currency)}</div>`);
            } else if (data.status === 'late') {
                lines.push(`<div class="calc-line price-high"><strong>Late bird (+10%):</strong> +${formatMoney(data.total - data.afterCategory, currency)}</div>`);
            } else {
                lines.push('<div class="calc-line"><strong>Regular rate:</strong> No adjustment</div>');
            }

            breakdownEl.innerHTML = lines.join('');
            resultEl.textContent = formatMoney(data.total, currency);
            resultEl.className = 'calc-total';

        // ------------------------------------------
        // MODE: RESUBMISSION FEE
        // ------------------------------------------
        } else {
            // FORCE VISIBILITY: Hide registration elements, show resubmission wrapper
            if (regFields) regFields.hidden = true;
            if (catWrap) catWrap.hidden = true; 
            if (resubFields) resubFields.hidden = false;

            const submitDateInput = document.getElementById('calc-submit-date');
            const deadline = parseDate(CONFIG.DEADLINES.resubmission);
            
            if (!submitDateInput.value) {
                breakdownEl.innerHTML = `<div class="calc-line"><strong>Whitepaper resubmission deadline:</strong> 30 Nov 2026</div>`;
                resultEl.textContent = 'Select a submission date.';
                resultEl.className = 'calc-total calc-total--hint';
                return;
            }

            const submitted = parseDate(submitDateInput.value);
            const daysLate = daysBetween(deadline, submitted);
            const rates = CONFIG.PRICING[currency];
            const fee = daysLate * rates.latePerDay;

            lines.push(`<div class="calc-line"><strong>Deadline:</strong> 30 Nov 2026</div>`);
            lines.push(`<div class="calc-line"><strong>Days past deadline:</strong> ${daysLate}</div>`);
            lines.push(`<div class="calc-line ${daysLate > 0 ? 'price-high' : ''}"><strong>Rate:</strong> ${formatMoney(rates.latePerDay, currency)} per day</div>`);

            if (daysLate === 0) {
                lines.push(`<div class="calc-line price-low"><strong>Late fee:</strong> ${formatMoney(0, currency)}</div>`);
                lines.push('<div class="calc-line price-low">On time — no late fee.</div>');
            } else {
                lines.push('<hr class="calc-divider">');
                lines.push(`<div class="calc-line price-high"><strong>Late fee:</strong> ${formatMoney(fee, currency)}</div>`);
            }

            breakdownEl.innerHTML = lines.join('');
            resultEl.textContent = formatMoney(fee, currency);
            resultEl.className = 'calc-total';
        }
    }

    // ==========================================
    // 4. EVENT LISTENERS & INITIALIZATION
    // ==========================================
    function init() {
        const form = document.getElementById('fee-calculator');
        if (!form) return;

        // Group fields into a unified calculation trigger grid
        const inputs = [
            'calc-currency', 'calc-team-size', 'calc-pay-date', 
            'calc-category', 'calc-submit-date'
        ];
        
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', renderUI);
                el.addEventListener('change', renderUI);
            }
        });

        form.querySelectorAll('input[name="calc-mode"]').forEach(radio => {
            radio.addEventListener('change', renderUI);
        });

        document.getElementById('calc-run').addEventListener('click', (e) => {
            e.preventDefault();
            renderUI();
        });

        // Collapsible accordion layout panel handler
        document.querySelectorAll('.collapsible-trigger').forEach(trigger => {
            trigger.addEventListener('click', () => {
                const item = trigger.parentElement;
                const isOpen = item.classList.contains('active');
                item.classList.toggle('active');
                const icon = trigger.querySelector('[data-lucide]');
                if (icon) {
                    icon.setAttribute('data-lucide', isOpen ? 'chevron-down' : 'chevron-up');
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
            });
        });

        renderUI(); // Initial run on load
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();