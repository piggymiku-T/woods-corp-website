// 等待DOM加载完毕（修复：原代码直接运行，找不到元素）
document.addEventListener('DOMContentLoaded', function () {
  // 鼠标效果（改为原生JS，修复$未定义问题）
  const cursor = document.createElement('div');
  cursor.classList.add('cursor');
  document.body.appendChild(cursor);

  document.addEventListener('mousemove', function (e) {
    cursor.style.left = e.pageX + 'px';
    cursor.style.top = e.pageY + 'px';
  });

  // banner轮播
  let currentIndex = 0;
  const bannerItem = document.querySelectorAll('.banner-item');
  const totalBanner = bannerItem.length;

  function showBanner(index) {
    bannerItem.forEach(item => item.classList.remove('active'));
    if (bannerItem[index]) {
      bannerItem[index].classList.add('active');
    }
  }

  // 修复：原代码只定义了函数，没启动轮播
  if (totalBanner > 0) {
    showBanner(currentIndex);

    setInterval(function () {
      currentIndex = (currentIndex + 1) % totalBanner;
      showBanner(currentIndex);
    }, 3000);
  }

  // 导航栏滚动效果
  window.addEventListener('scroll', function () {
    const header = document.querySelector('header');
    if (header) {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  });
});
