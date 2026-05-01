document.addEventListener('DOMContentLoaded', function() {
    // ハンバーガー
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    if(hamburger) {
        hamburger.addEventListener('click', () => navMenu.classList.toggle('active'));
        document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', () => navMenu.classList.remove('active')));
    }

    // ナビスクロール
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 50));

    // 戻るボタン
    const backBtn = document.getElementById('backToTop');
    window.addEventListener('scroll', () => backBtn.classList.toggle('show', window.scrollY > 300));
    backBtn?.addEventListener('click', e => { e.preventDefault(); window.scrollTo({top:0, behavior:'smooth'}); });

    // カスタムカーソル（軽量）
    const cursor = document.getElementById('customCursor');
    if(cursor && window.matchMedia('(pointer: fine)').matches) {
        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;
        document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
        function animateCursor() {
            cursorX += (mouseX - cursorX) * 0.2;
            cursorY += (mouseY - cursorY) * 0.2;
            cursor.style.left = cursorX + 'px';
            cursor.style.top = cursorY + 'px';
            requestAnimationFrame(animateCursor);
        }
        animateCursor();
    }

    // カウンター（ダッシュボード）
    const counters = document.querySelectorAll('.counter');
    let started = false;
    function startCounters() {
        if(started) return;
        started = true;
        counters.forEach(counter => {
            const card = counter.closest('.dashboard-card');
            const target = parseInt(card?.dataset.count || '0');
            let current = 0;
            const step = Math.max(1, Math.ceil(target / 50));
            const timer = setInterval(() => {
                current += step;
                if(current >= target) { counter.innerText = target; clearInterval(timer); }
                else counter.innerText = current;
            }, 25);
        });
    }
    const dashboard = document.getElementById('dashboard');
    window.addEventListener('scroll', () => {
        if(dashboard && window.scrollY + window.innerHeight > dashboard.offsetTop + 150) startCounters();
    });
    startCounters();

    // スクロール可視カード
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if(entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.dashboard-card, .service-card, .timeline-item, .strengths-alt-text, .radar-placeholder').forEach(el => observer.observe(el));

    // スムーススクロール
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if(target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        });
    });
});
