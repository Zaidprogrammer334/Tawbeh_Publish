document.addEventListener('DOMContentLoaded', function() {
    // عناصر DOM
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    const scrollTopBtn = document.getElementById('scrollTop');
    const notification = document.getElementById('notification');
    
    // عناصر مواقيت الصلاة
    const sunriseTime = document.getElementById('sunriseTime');
    const fajrTime = document.getElementById('fajrTime');
    const dhuhrTime = document.getElementById('dhuhrTime');
    const asrTime = document.getElementById('asrTime');
    const maghribTime = document.getElementById('maghribTime');
    const ishaTime = document.getElementById('ishaTime');
    
    // عناصر الوقت المتبقي
    const nextPrayerInfo = document.getElementById('nextPrayerInfo');
    const remainingTime = document.getElementById('remainingTime');
    
    // عناصر البوصلة
    const compassSection = document.getElementById('compass-section');
    const compassStatus = document.getElementById('compassStatus');
    const qiblaDegree = document.getElementById('qiblaDegree');
    const startCompass = document.getElementById('startCompass');
    const stopCompass = document.getElementById('stopCompass');
    const compassArrow = document.querySelector('.compass-arrow');
    
    // عناصر التنبيه
    const prayerAlert = document.getElementById('prayerAlert');
    const alertPrayerName = document.getElementById('alertPrayerName');
    const athanAudio = document.getElementById('athanAudio');
    const stopAthan = document.getElementById('stopAthan');
    const closeAlert = document.getElementById('closeAlert');
    const athanButtons = document.querySelectorAll('.athan-btn');
    
    // متغيرات التتبع
    let prayerTimesData = {};
    let nextPrayerTimer = null;
    let compassWatchId = null;
    let userLocation = {};
    let activeAlarms = {
        fajr: false,
        dhuhr: false,
        asr: false,
        maghrib: false,
        isha: false
    };

    // تهيئة الصفحة
    initPage();

    function initPage() {
        // أحداث القائمة المنسدلة
        hamburger.addEventListener('click', toggleMenu);
        
        // حدث زر العودة للأعلى
        scrollTopBtn.addEventListener('click', scrollToTop);
        window.addEventListener('scroll', toggleScrollTopButton);
        
        // أحداث البوصلة
        startCompass.addEventListener('click', startCompassFunction);
        stopCompass.addEventListener('click', stopCompassFunction);
        
        // أحداث التنبيه
        stopAthan.addEventListener('click', stopAthanFunction);
        closeAlert.addEventListener('click', closeAlertFunction);
        
        // أحداث أزرار التنبيه
        athanButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const prayer = this.getAttribute('data-prayer');
                toggleAthanAlarm(prayer);
            });
        });
        
        // جلب مواقيت الصلاة
        fetchPrayerTimes();
        
        // تحميل التنبيهات المحفوظة
        loadAlarms();
    }

    function toggleMenu() {
        navLinks.classList.toggle('active');
        const isExpanded = navLinks.classList.contains('active');
        hamburger.setAttribute('aria-expanded', isExpanded);
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

    function fetchPrayerTimes() {
        const loadingText = "جاري التحميل...";
        
        // تعبئة مواقيت الصلاة الافتراضية
        sunriseTime.textContent = loadingText;
        fajrTime.textContent = loadingText;
        dhuhrTime.textContent = loadingText;
        asrTime.textContent = loadingText;
        maghribTime.textContent = loadingText;
        ishaTime.textContent = loadingText;
        nextPrayerInfo.textContent = "جاري تحديد موعد الصلاة القادمة...";
        remainingTime.textContent = "--:--:--";

        // التحقق من دعم المتصفح لخدمة الموقع
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;
                    userLocation = { latitude, longitude };
                    fetchPrayerTimesData(latitude, longitude);
                },
                error => {
                    console.error('Error getting location:', error);
                    fetchLocationByIP();
                }
            );
        } else {
            fetchLocationByIP();
        }
    }

    function fetchLocationByIP() {
        fetch('https://ipapi.co/json/')
            .then(response => response.json())
            .then(data => {
                if (data && data.latitude && data.longitude) {
                    userLocation = { latitude: data.latitude, longitude: data.longitude };
                    fetchPrayerTimesData(data.latitude, data.longitude, data.city, data.country_name);
                } else {
                    useDefaultTimes();
                }
            })
            .catch(error => {
                console.error('Error fetching location by IP:', error);
                useDefaultTimes();
            });
    }

    function fetchPrayerTimesData(latitude, longitude, city = '', country = '') {
        const method = 1; // طريقة الحساب (1 = جامعة أم القرى)
        const apiUrl = `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=${method}`;

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data && data.data && data.data.timings) {
                    const timings = data.data.timings;
                    prayerTimesData = {
                        timings: timings,
                        date: data.data.date,
                        meta: data.data.meta
                    };
                    
                    displayPrayerTimes(timings);
                    calculateNextPrayer(timings);
                    
                    // بدء تحديث الوقت المتبقي
                    if (nextPrayerTimer) clearInterval(nextPrayerTimer);
                    nextPrayerTimer = setInterval(() => calculateNextPrayer(timings), 1000);
                    
                    // التحقق من التنبيهات
                    checkAlarms();
                } else {
                    throw new Error('Prayer times data not available');
                }
            })
            .catch(error => {
                console.error('Error fetching prayer times:', error);
                useDefaultTimes();
            });
    }

    function displayPrayerTimes(timings) {
        sunriseTime.textContent = convertTo12HourFormat(timings.Sunrise);
        fajrTime.textContent = convertTo12HourFormat(timings.Fajr);
        dajrTime.textContent = convertTo12HourFormat(timings.Dhuhr);
        asrTime.textContent = convertTo12HourFormat(timings.Asr);
        maghribTime.textContent = convertTo12HourFormat(timings.Maghrib);
        ishaTime.textContent = convertTo12HourFormat(timings.Isha);
    }

    function convertTo12HourFormat(time) {
        const [hours, minutes] = time.split(':');
        let period = 'ص';
        let adjustedHours = parseInt(hours);

        if (adjustedHours >= 12) {
            period = 'م';
            if (adjustedHours > 12) {
                adjustedHours -= 12;
            }
        }

        if (adjustedHours === 0) {
            adjustedHours = 12;
        }

        return `${adjustedHours}:${minutes} ${period}`;
    }

    function calculateNextPrayer(timings) {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        // تحويل أوقات الصلاة إلى دقائق من بداية اليوم
        const prayerTimes = {
            Fajr: convertTimeToMinutes(timings.Fajr),
            Dhuhr: convertTimeToMinutes(timings.Dhuhr),
            Asr: convertTimeToMinutes(timings.Asr),
            Maghrib: convertTimeToMinutes(timings.Maghrib),
            Isha: convertTimeToMinutes(timings.Isha),
            Sunrise: convertTimeToMinutes(timings.Sunrise)
        };
        
        // تحديد الصلاة القادمة
        let nextPrayer = null;
        let nextPrayerName = '';
        
        for (const [prayer, time] of Object.entries(prayerTimes)) {
            if (time > currentTime) {
                nextPrayer = time;
                nextPrayerName = getPrayerArabicName(prayer);
                break;
            }
        }
        
        // إذا كانت جميع الصلوات قد انتهت لهذا اليوم، ننتظر صلاة الفجر في اليوم التالي
        if (!nextPrayer) {
            nextPrayer = prayerTimes.Fajr + 24 * 60; // نضيف 24 ساعة
            nextPrayerName = getPrayerArabicName('Fajr');
        }
        
        // حساب الوقت المتبقي
        const timeRemaining = nextPrayer - currentTime;
        const hours = Math.floor(timeRemaining / 60);
        const minutes = timeRemaining % 60;
        const seconds = 60 - now.getSeconds();
        
        // عرض المعلومات
        nextPrayerInfo.textContent = `الوقت المتبقي لصلاة ${nextPrayerName}:`;
        remainingTime.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // التحقق مما إذا كانت الصلاة الحالية قد حان وقتها
        checkCurrentPrayer(prayerTimes, currentTime);
    }

    function convertTimeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    function getPrayerArabicName(prayer) {
        const prayerNames = {
            'Fajr': 'الفجر',
            'Dhuhr': 'الظهر',
            'Asr': 'العصر',
            'Maghrib': 'المغرب',
            'Isha': 'العشاء',
            'Sunrise': 'الشروق'
        };
        return prayerNames[prayer] || prayer;
    }

    function checkCurrentPrayer(prayerTimes, currentTime) {
        const prayerThreshold = 2; // دقيقتين قبل وبعد وقت الصلاة
        
        for (const [prayer, time] of Object.entries(prayerTimes)) {
            if (prayer === 'Sunrise') continue;
            
            if (Math.abs(currentTime - time) <= prayerThreshold) {
                if (activeAlarms[prayer.toLowerCase()]) {
                    showPrayerAlert(prayer);
                }
                break;
            }
        }
    }

    function useDefaultTimes() {
        // أوقات افتراضية في حالة فشل جلب البيانات
        const defaultTimes = {
            Fajr: '05:16',
            Dhuhr: '12:43',
            Asr: '16:10',
            Maghrib: '18:49',
            Isha: '20:11',
            Sunrise: '06:30'
        };
        
        prayerTimesData = {
            timings: defaultTimes,
            date: { hijri: { day: '--', month: { ar: '--' }, year: '----' } },
            meta: { method: { name: 'طريقة افتراضية' } }
        };
        
        displayPrayerTimes(defaultTimes);
        calculateNextPrayer(defaultTimes);
        
        if (nextPrayerTimer) clearInterval(nextPrayerTimer);
        nextPrayerTimer = setInterval(() => calculateNextPrayer(defaultTimes), 1000);
        
        showNotification("تعذر جلب بيانات الموقع، يتم عرض مواقيت افتراضية", "error");
    }

    // وظائف البوصلة
    function startCompassFunction() {
        if (!userLocation.latitude || !userLocation.longitude) {
            showNotification("يجب تحديد الموقع أولاً لاستخدام البوصلة", "error");
            return;
        }

        if (window.DeviceOrientationEvent) {
            compassStatus.textContent = "جاري تحديد اتجاه القبلة...";
            startCompass.disabled = true;
            stopCompass.disabled = false;

            // حساب اتجاه القبلة
            const qiblaDirection = Qibla(userLocation.latitude, userLocation.longitude);
            qiblaDegree.textContent = `الزاوية: ${Math.round(qiblaDirection)}°`;

            compassWatchId = window.addEventListener('deviceorientation', function(event) {
                const alpha = event.alpha; // درجة الدوران حول المحور Z (0 إلى 360)
                
                if (alpha !== null) {
                    // حساب الفرق بين اتجاه الشمال واتجاه القبلة
                    const compassHeading = 360 - alpha; // تحويل إلى درجات البوصلة
                    const angle = (compassHeading - qiblaDirection + 360) % 360;
                    
                    // تدوير السهم
                    compassArrow.style.transform = `translateX(-50%) rotate(${angle}deg)`;
                    
                    // تحديث حالة البوصلة
                    compassStatus.textContent = "البوصلة نشطة";
                }
            });
        } else {
            compassStatus.textContent = "المتصفح لا يدعم خاصية البوصلة";
        }
    }

    function stopCompassFunction() {
        if (compassWatchId) {
            window.removeEventListener('deviceorientation', compassWatchId);
            compassWatchId = null;
        }
        
        compassStatus.textContent = "البوصلة متوقفة";
        compassArrow.style.transform = "translateX(-50%) rotate(0deg)";
        startCompass.disabled = false;
        stopCompass.disabled = true;
    }

    // وظائف التنبيه
    function toggleAthanAlarm(prayer) {
        activeAlarms[prayer] = !activeAlarms[prayer];
        updateAthanButton(prayer);
        saveAlarms();
        
        const prayerName = getPrayerArabicName(prayer.charAt(0).toUpperCase() + prayer.slice(1));
        const message = activeAlarms[prayer] ? 
            `تم تفعيل التنبيه لصلاة ${prayerName}` : 
            `تم إلغاء التنبيه لصلاة ${prayerName}`;
        
        showNotification(message, "success");
    }

    function updateAthanButton(prayer) {
        const button = document.querySelector(`.athan-btn[data-prayer="${prayer}"]`);
        if (button) {
            if (activeAlarms[prayer]) {
                button.innerHTML = '<i class="fas fa-bell-slash"></i> إلغاء التنبيه';
                button.style.backgroundColor = "#f44336";
            } else {
                button.innerHTML = '<i class="fas fa-bell"></i> تنبيه';
                button.style.backgroundColor = "";
            }
        }
    }

    function showPrayerAlert(prayer) {
        const prayerName = getPrayerArabicName(prayer);
        alertPrayerName.textContent = `حان وقت صلاة ${prayerName}`;
        
        // تشغيل الأذان
        athanAudio.currentTime = 0;
        athanAudio.play().catch(e => console.error('Error playing athan:', e));
        
        // عرض نافذة التنبيه
        prayerAlert.style.display = 'flex';
        
        // إيقاف التنبيه بعد 5 دقائق تلقائياً
        setTimeout(() => {
            if (!prayerAlert.style.display || prayerAlert.style.display !== 'none') {
                stopAthanFunction();
            }
        }, 5 * 60 * 1000);
    }

    function stopAthanFunction() {
        athanAudio.pause();
        athanAudio.currentTime = 0;
        prayerAlert.style.display = 'none';
    }

    function closeAlertFunction() {
        stopAthanFunction();
        window.location.href = 'salah_page.html';
    }

    function checkAlarms() {
        if (!prayerTimesData.timings) return;
        
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const prayerTimes = {
            fajr: convertTimeToMinutes(prayerTimesData.timings.Fajr),
            dhuhr: convertTimeToMinutes(prayerTimesData.timings.Dhuhr),
            asr: convertTimeToMinutes(prayerTimesData.timings.Asr),
            maghrib: convertTimeToMinutes(prayerTimesData.timings.Maghrib),
            isha: convertTimeToMinutes(prayerTimesData.timings.Isha)
        };
        
        const prayerThreshold = 2; // دقيقتين قبل وبعد وقت الصلاة
        
        for (const [prayer, time] of Object.entries(prayerTimes)) {
            if (Math.abs(currentTime - time) <= prayerThreshold && activeAlarms[prayer]) {
                showPrayerAlert(prayer);
                break;
            }
        }
    }

    function saveAlarms() {
        localStorage.setItem('prayerAlarms', JSON.stringify(activeAlarms));
    }

    function loadAlarms() {
        const savedAlarms = localStorage.getItem('prayerAlarms');
        if (savedAlarms) {
            activeAlarms = JSON.parse(savedAlarms);
            
            // تحديث حالة الأزرار
            for (const prayer in activeAlarms) {
                if (activeAlarms[prayer]) {
                    updateAthanButton(prayer);
                }
            }
        }
    }
});