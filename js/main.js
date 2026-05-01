document.addEventListener('DOMContentLoaded', function() {
    // ハンバーガー
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    if(hamburger) {
        hamburger.addEventListener('click', () => navMenu.classList.toggle('active'));
        document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', () => navMenu.classList.remove('active')));
    }

    // スクロールでナビ変化
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 50));

    // 戻るボタン
    const backBtn = document.getElementById('backToTop');
    window.addEventListener('scroll', () => backBtn.classList.toggle('show', window.scrollY > 300));
    backBtn?.addEventListener('click', e => { e.preventDefault(); window.scrollTo({top:0, behavior:'smooth'}); });

    // マウスフォロワー
    const follower = document.getElementById('mouseFollower');
    if(follower) {
        let mx=0, my=0, fx=0, fy=0;
        document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
        function animate() {
            fx += (mx - fx) * 0.2;
            fy += (my - fy) * 0.2;
            follower.style.left = fx + 'px';
            follower.style.top = fy + 'px';
            requestAnimationFrame(animate);
        }
        animate();
        document.addEventListener('mouseleave', () => follower.style.opacity = '0');
        document.addEventListener('mouseenter', () => follower.style.opacity = '0.9');
    }

    // カウンター（スクロールで発動）
    const counters = document.querySelectorAll('.counter');
    let started = false;
    function startCounters() {
        if(started) return;
        started = true;
        counters.forEach(counter => {
            const target = parseInt(counter.closest('.dashboard-card')?.dataset.count || '0');
            let current = 0;
            const step = Math.ceil(target / 50);
            const timer = setInterval(() => {
                current += step;
                if(current >= target) {
                    counter.innerText = target;
                    clearInterval(timer);
                } else counter.innerText = current;
            }, 30);
        });
    }
    const dashboardSection = document.getElementById('dashboard');
    window.addEventListener('scroll', () => {
        if(dashboardSection && window.scrollY + window.innerHeight > dashboardSection.offsetTop + 100) startCounters();
    });
    startCounters(); // すでに表示されている場合

    // スムーススクロール
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if(target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
});
