/* =============================================
   SƠN LINH TỬU — Premium JS v3.0
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

    // ─── Scroll Progress Bar ───────────────────
    const progressBar = document.getElementById('scrollProgress');
    function updateProgress() {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (window.scrollY / total) * 100;
        if (progressBar) progressBar.style.width = progress + '%';
    }

    // ─── Navbar scroll state ──────────────────
    const navbar = document.getElementById('navbar');
    function updateNavbar() {
        if (window.scrollY > 60) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', () => {
        updateProgress();
        updateNavbar();
    }, { passive: true });

    // ─── Mobile menu toggle ───────────────────
    const navToggle = document.getElementById('navToggle');
    const navLinks  = document.getElementById('navLinks');

    function closeMenu() {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        navToggle.querySelectorAll('span').forEach(s => {
            s.style.transform = ''; s.style.opacity = '';
        });
    }

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = navLinks.classList.toggle('open');
            navToggle.setAttribute('aria-expanded', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
            // Animate hamburger to X
            const spans = navToggle.querySelectorAll('span');
            if (isOpen) {
                spans[0].style.transform = 'translateY(7px) rotate(45deg)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
            } else {
                spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
            }
        });

        // Close on nav link click
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        // ✅ Stop propagation on li items so clicks don't reach overlay
        navLinks.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', (e) => e.stopPropagation());
        });

        // ✅ Close menu when clicking on the dark overlay (outside the li items)
        navLinks.addEventListener('click', () => {
            closeMenu();
        });

        // ✅ Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('open')) {
                closeMenu();
            }
        });
    }

    // ─── Smooth scroll for anchor links ──────
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            const href = anchor.getAttribute('href');
            if (href === '#') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                // Use scroll-margin-top via native scrollIntoView for reliability
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ─── Intersection Observer: reveal elements ─
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                // Don't unobserve — let it stay visible
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -60px 0px'
    });

    document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
        revealObserver.observe(el);
    });

    // ─── Video: play on viewport, pause off ──
    // ✅ FIX: Removed mass-play unblockAll on first touch — caused all videos to
    // trigger simultaneously on mobile, creating an unwanted "popup" effect.
    // Videos are now controlled exclusively by IntersectionObserver below.
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                video.play().catch(() => {});
            } else {
                video.pause();
            }
        });
    }, { threshold: 0.3 });

    document.querySelectorAll('video').forEach(v => videoObserver.observe(v));

    // ─── Parallax hero video on scroll ───────
    const heroVideo = document.querySelector('.hero-video');
    function heroParallax() {
        if (!heroVideo) return;
        const scrollY = window.scrollY;
        if (scrollY < window.innerHeight) {
            heroVideo.style.transform = `scale(1.05) translateY(${scrollY * 0.25}px)`;
        }
    }
    window.addEventListener('scroll', heroParallax, { passive: true });

    // ─── Active nav link highlight on scroll ─
    const sections = document.querySelectorAll('section[id], header[id]');
    const navLinkItems = document.querySelectorAll('.nav-link');

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navLinkItems.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, { threshold: 0.4 });

    sections.forEach(s => sectionObserver.observe(s));

    // ─── Stagger child animations ────────────
    document.querySelectorAll('.reveal-up[style*="animation-delay"]').forEach(el => {
        const delay = el.style.animationDelay || '0s';
        el.style.transitionDelay = delay;
    });

    // ─── Dev console ─────────────────────────
    console.log(
        '%c 🍶 Sơn Linh Tửu — Premium v3.0 ',
        'background: #3D0808; color: #C9A227; font-size: 14px; font-weight: bold; padding: 8px 16px; border-radius: 4px;'
    );
});
