/* ── IBCOL 2026 — Navigation ── */
(function () {
    // Determine current page
    const path = window.location.pathname.split('/').pop() || 'index.html';

    // Build nav HTML
    const navHTML = `
    <nav id="main-nav">
        <a href="index.html" class="nav-logo">
            <img src="https://cdn.kb.institute/eto-2026/IBCOL/Logo/Square_Dark_Background_2026_500.png" alt="IBCOL Logo">
            <span class="nav-logo-text">IBCOL 2026</span>
        </a>
        <ul class="nav-links">
            <li>
                <a href="index.html" class="${path === 'index.html' ? 'active' : ''}">Home</a>
            </li>
            <li>
                <a href="about.html" class="${path === 'about.html' ? 'active' : ''}">About Us</a>
            </li>
            <li class="${['competition.html','eligibility.html','timeline.html','submission.html','accolades.html'].includes(path) ? 'open' : ''}">
                <button class="nav-parent" aria-haspopup="true">
                    Competition
                    <svg class="nav-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="4 6 8 10 12 6"></polyline>
                    </svg>
                </button>
                <ul class="nav-dropdown">
                    <li><a href="competition.html" class="${path === 'competition.html' ? 'active' : ''}">Overview</a></li>
                    <li><a href="eligibility.html" class="${path === 'eligibility.html' ? 'active' : ''}">Eligibility</a></li>
                    <li><a href="timeline.html" class="${path === 'timeline.html' ? 'active' : ''}">Timeline</a></li>
                    <li><a href="submission.html" class="${path === 'submission.html' ? 'active' : ''}">Submission</a></li>
                    <li><a href="accolades.html" class="${path === 'accolades.html' ? 'active' : ''}">Accolades</a></li>
                </ul>
            </li>
            <li>
                <a href="faq.html" class="${path === 'faq.html' ? 'active' : ''}">FAQ</a>
            </li>
            <li>
                <a href="contact.html" class="${path === 'contact.html' ? 'active' : ''}">Contact</a>
            </li>
        </ul>
        <div class="nav-register">
            <a href="registration.html">Register Now</a>
        </div>
        <button class="nav-hamburger" id="hamburger" aria-label="Open menu">
            <span></span><span></span><span></span>
        </button>
    </nav>

    <!-- Mobile Drawer -->
    <div class="nav-mobile-drawer" id="mobile-drawer">
        <ul>
            <li><a href="index.html">Home</a></li>
            <li><a href="about.html">About Us</a></li>
            <li>
                <button class="nav-mobile-parent" id="mob-comp-toggle">
                    Competition
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="4 6 8 10 12 6"></polyline>
                    </svg>
                </button>
                <div class="nav-mobile-sub" id="mob-comp-sub">
                    <a href="competition.html">Overview</a>
                    <a href="eligibility.html">Eligibility</a>
                    <a href="timeline.html">Timeline</a>
                    <a href="submission.html">Submission</a>
                    <a href="accolades.html">Accolades</a>
                </div>
            </li>
            <li><a href="faq.html">FAQ</a></li>
            <li><a href="contact.html">Contact</a></li>
        </ul>
        <div class="nav-mobile-register">
            <a href="registration.html">Register Now</a>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('afterbegin', navHTML);

    // Desktop dropdown toggle
    document.querySelectorAll('.nav-parent').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const li = this.closest('li');
            li.classList.toggle('open');
        });
    });

    // Close dropdown on outside click
    document.addEventListener('click', function () {
        document.querySelectorAll('.nav-links > li.open').forEach(li => li.classList.remove('open'));
    });

    // Mobile hamburger
    const hamburger = document.getElementById('hamburger');
    const drawer = document.getElementById('mobile-drawer');
    hamburger.addEventListener('click', function () {
        hamburger.classList.toggle('open');
        drawer.classList.toggle('open');
    });

    // Mobile competition submenu
    const compToggle = document.getElementById('mob-comp-toggle');
    const compSub = document.getElementById('mob-comp-sub');
    compToggle.addEventListener('click', function () {
        compSub.classList.toggle('open');
    });

    // Scroll reveal observer
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('revealed');
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
})();
