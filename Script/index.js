document.addEventListener('DOMContentLoaded', function() {
    // عناصر DOM
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    const scrollTopBtn = document.getElementById('scrollTop');
    const downloadBtns = document.querySelectorAll('.download-btn');
    const notification = document.getElementById('notification');

    // تهيئة الصفحة
    initPage();

    function initPage() {
        // أحداث القائمة المنسدلة
        hamburger.addEventListener('click', toggleMenu);
        
        // أحداث أزرار التنزيل
        downloadBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const os = this.closest('.download-card').dataset.os;
                simulateDownload(os);
            });
        });
        
        // حدث زر العودة للأعلى
        scrollTopBtn.addEventListener('click', scrollToTop);
        window.addEventListener('scroll', toggleScrollTopButton);
    }

    function toggleMenu() {
        navLinks.classList.toggle('active');
        const isExpanded = navLinks.classList.contains('active');
        hamburger.setAttribute('aria-expanded', isExpanded);
    }

    function simulateDownload(os) {
        let message = '';
        if (os === 'windows') {
            message = 'جاري تحميل تطبيق توبة لنظام Windows...';
        } else if (os === 'android') {
            message = 'جاري تحميل تطبيق توبة لنظام Android...';
        }
        
        showNotification(message, 'success');
        
        // في تطبيق حقيقي، يمكنك توجيه المستخدم لرابط التنزيل الفعلي
        setTimeout(() => {
            showNotification('عذرًا، هذه مجرد نسخة توضيحية', 'error');
        }, 2000);
    }

    function showNotification(message, type) {
        notification.textContent = message;
        notification.className = 'notification ' + type;
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.className = 'notification';
            }, 500);
        }, 3000);
    }

    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    function toggleScrollTopButton() {
        if (window.pageYOffset > 300) {
            scrollTopBtn.classList.add('active');
        } else {
            scrollTopBtn.classList.remove('active');
        }
    }
});