document.addEventListener('DOMContentLoaded', function() {
    // ハンバーガーメニュー
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => navMenu.classList.remove('active'));
        });
    }

    // ナビゲーションスクロールで縮む
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });

    // 戻るボタン
    const backBtn = document.getElementById('backToTop');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) backBtn.classList.add('show');
        else backBtn.classList.remove('show');
    });
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // カスタムカーソル（軽量ドット）
    const cursor = document.getElementById('customCursor');
    if (cursor && window.matchMedia('(pointer: fine)').matches) {
        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        function animateCursor() {
            cursorX += (mouseX - cursorX) * 0.2;
            cursorY += (mouseY - cursorY) * 0.2;
            cursor.style.left = cursorX + 'px';
            cursor.style.top = cursorY + 'px';
            requestAnimationFrame(animateCursor);
        }
        animateCursor();
    }

    // カウンター（スクロールで発動）
    const counters = document.querySelectorAll('.counter');
    let started = false;
    function startCounters() {
        if (started) return;
        started = true;
        counters.forEach(counter => {
            const card = counter.closest('.dashboard-card');
            const target = parseInt(card?.dataset.count || '0');
            let current = 0;
            const step = Math.max(1, Math.ceil(target / 50));
            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    counter.innerText = target;
                    clearInterval(timer);
                } else {
                    counter.innerText = current;
                }
            }, 25);
        });
    }
    const dashboardSection = document.getElementById('dashboard');
    if (dashboardSection) {
        window.addEventListener('scroll', () => {
            if (window.scrollY + window.innerHeight > dashboardSection.offsetTop + 150) {
                startCounters();
            }
        });
        startCounters(); // 既に見えている場合
    }

    // スクロールで要素をフェードイン
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.dashboard-card, .service-card, .timeline-item, .whyus-card, .industry-tag').forEach(el => {
        observer.observe(el);
    });

    // スムーススクロール
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // フォーム送信（ダミー）
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('お問い合わせありがとうございます。担当者よりご連絡いたします。\n感谢您的咨询，我们会尽快与您联系。');
            contactForm.reset();
        });
    }
});
