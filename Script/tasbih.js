        document.addEventListener('DOMContentLoaded', function() {
            const hamburger = document.getElementById('hamburger');
            const navLinks = document.getElementById('navLinks');
            
            hamburger.addEventListener('click', function() {
                // تبديل حالة القائمة
                navLinks.classList.toggle('active');
                
                // تحديث حالة ARIA
                const isExpanded = navLinks.classList.contains('active');
                this.setAttribute('aria-expanded', isExpanded);
                
                // تبديل الأيقونة بين القائمة والإغلاق
                const icon = this.querySelector('i');
                if (isExpanded) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
            
            // إغلاق القائمة عند النقر على رابط
            document.querySelectorAll('.nav-links a').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                    hamburger.querySelector('i').classList.remove('fa-times');
                    hamburger.querySelector('i').classList.add('fa-bars');
                    hamburger.setAttribute('aria-expanded', 'false');
                });
            });
            
            // تحديث سنة حقوق النشر
            document.getElementById('current-year').textContent = new Date().getFullYear();

            const dropdownBtns = document.querySelectorAll('.dropdown-btn');
            
            dropdownBtns.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const dropdown = this.closest('.dropdown');
                    dropdown.classList.toggle('active');
                });
            });

            // إغلاق القوائم المنسدلة عند النقر خارجها
            document.addEventListener('click', function() {
                document.querySelectorAll('.dropdown').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            });

            // الكود الخاص بالعداد
            const counter = document.getElementById('counter');
            const resetBtn = document.getElementById('reset-btn');
            const decrementBtn = document.getElementById('decrement-btn');
            const clickArea = document.querySelector('body');
            const scrollTopBtn = document.getElementById('scrollTop');
            const notification = document.getElementById('notification');
            const dhikrCards = document.querySelectorAll('.dhikr-card');
            const sliderArrows = document.querySelectorAll('.slider-arrow');
            
            let currentCount = 0;
            let canClick = true;
            const clickDelay = 200;

            // وظيفة زيادة العداد
            function incrementCounter() {
                currentCount++;
                counter.textContent = currentCount;
                
                // تغيير اللون مؤقتاً للإشارة إلى العد
                counter.style.color = '#0e4a30';
                setTimeout(() => {
                    counter.style.color = '#1f7d53';
                }, 200);
                
                // التحقق من الوصول إلى معالم معينة
                checkMilestones(currentCount);
            }

            // وظيفة إنقاص العداد
            function decrementCounter() {
                if (currentCount > 0) {
                    currentCount--;
                    counter.textContent = currentCount;
                    
                    // تغيير اللون مؤقتاً للإشارة إلى العد
                    counter.style.color = '#c62828';
                    setTimeout(() => {
                        counter.style.color = '#1f7d53';
                    }, 200);
                } else {
                    showNotification('العداد بالفعل عند الصفر');
                }
            }

            // التحقق من المعالم (33، 100، إلخ)
            function checkMilestones(count) {
                const milestones = [33, 66, 100, 200, 300];
                if (milestones.includes(count)) {
                    showNotification(`تهانينا! لقد وصلت إلى ${count} تسبيحة`);
                }
            }

            // عرض الإشعارات
            function showNotification(message) {
                notification.textContent = message;
                notification.style.display = 'block';
                
                setTimeout(() => {
                    notification.style.display = 'none';
                }, 3000);
            }

            // النقر على الصفحة لزيادة العداد
            clickArea.addEventListener('click', function(e) {
                // تجاهل النقر على أزرار التحكم أو الروابط أو السلايدر
                if (e.target.closest('button') || 
                    e.target.closest('.menu__link') || 
                    e.target.closest('.scroll-top') ||
                    e.target.closest('.dhikr-card') ||
                    e.target.closest('.slider-arrow') ||
                    e.target.closest('.dot')) {
                    return;
                }
                
                if (canClick) {
                    incrementCounter();
                    canClick = false;
                    
                    // تأثير النقر
                    counter.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        counter.style.transform = 'scale(1)';
                    }, 100);
                    
                    // تأخير بين النقرات
                    setTimeout(() => {
                        canClick = true;
                    }, clickDelay);
                }
            });
            
            // زر إنقاص العداد
            decrementBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                decrementCounter();
                
                // تأثير النقر
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 100);
            });
            
            // إعادة تعيين العداد
            resetBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                
                // تأثير الإعادة
                counter.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    counter.style.transform = 'scale(1)';
                }, 200);
                
                currentCount = 0;
                counter.textContent = currentCount;
                
                showNotification('تم إعادة العداد إلى الصفر');
            });
            
            // زر العودة للأعلى
            window.addEventListener('scroll', function() {
                if (window.pageYOffset > 300) {
                    scrollTopBtn.classList.add('show');
                } else {
                    scrollTopBtn.classList.remove('show');
                }
            });
            
            scrollTopBtn.addEventListener('click', function() {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });

            // منع زيادة العداد عند النقر على الأذكار
            dhikrCards.forEach(card => {
                card.addEventListener('click', function(e) {
                    e.stopPropagation();
                    // تم إزالة كود ضبط العداد حسب الطلب
                });
            });

            // منع زيادة العداد عند النقر على أسهم السلايدر
            sliderArrows.forEach(arrow => {
                arrow.addEventListener('click', function(e) {
                    e.stopPropagation();
                });
            });

            // كود السلايدر الجديد
            const slider = document.getElementById('dhikrSlider');
            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');
            const dots = document.querySelectorAll('.dot');
            let currentSlide = 0;
            const totalSlides = document.querySelectorAll('.slider-group').length;

            function showSlide(index) {
                const groups = document.querySelectorAll('.slider-group');
                groups.forEach((group, i) => {
                    group.classList.toggle('active', i === index);
                });
                
                // تحديث النقاط
                dots.forEach((dot, i) => {
                    dot.classList.toggle('active', i === index);
                });
                
                currentSlide = index;
            }

            prevBtn.addEventListener('click', function() {
                let newIndex = currentSlide - 1;
                if (newIndex < 0) newIndex = totalSlides - 1;
                showSlide(newIndex);
            });

            nextBtn.addEventListener('click', function() {
                let newIndex = currentSlide + 1;
                if (newIndex >= totalSlides) newIndex = 0;
                showSlide(newIndex);
            });

            // النقر على النقاط للانتقال للسلايد المحدد
            dots.forEach(dot => {
                dot.addEventListener('click', function() {
                    const slideIndex = parseInt(this.getAttribute('data-slide'));
                    showSlide(slideIndex);
                });
            });

            // التمرير التلقائي كل 10 ثواني (اختياري)
            setInterval(() => {
                let newIndex = currentSlide + 1;
                if (newIndex >= totalSlides) newIndex = 0;
                showSlide(newIndex);
            }, 10000);
        });