const readers = [
    {id: "maher", name: "ماهر المعيقلي"},
    {id: "hudhaify", name: "علي الحذيفي"},
    {id: "minshawi", name: "محمد صديق المنشاوي"}
];

// متغيرات المشغل الصوتي
let audio = null;
let currentSurah = 1;
let currentReader = readers[0];
let surahsList = [];

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async function() {
    await loadSurahsList();
    setupEventListeners();
    loadSurah(currentSurah);
    
    // تهيئة زر العودة للأعلى
    initScrollTopButton();
    
    // تهيئة قائمة الهبوط
    initHamburgerMenu();
});

async function loadSurahsList() {
    try {
        const response = await axios.get('https://api.alquran.cloud/v1/surah');
        surahsList = response.data.data;
        
        const surahSelect = document.querySelector('.surah-select');
        surahSelect.innerHTML = '';
        
        surahsList.forEach(surah => {
            const option = document.createElement('option');
            option.value = surah.number;
            option.textContent = `${surah.englishName} - ${surah.name}`;
            surahSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading surahs list:', error);
        showNotification('حدث خطأ في تحميل قائمة السور. يرجى تحديث الصفحة.', 'error');
        document.getElementById('quran-text').innerHTML = 
            '<div class="error-message">حدث خطأ في تحميل قائمة السور. يرجى تحديث الصفحة.</div>';
    }
}

// تحميل آيات السورة
async function loadSurah(surahNumber) {
    const quranText = document.getElementById('quran-text');
    quranText.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>جاري تحميل السورة...</p>
        </div>
    `;
    
    try {
        // الحصول على معلومات السورة
        const surahInfo = surahsList.find(s => s.number == surahNumber);
        document.querySelector('.surah-name').textContent = surahInfo.name;
        
        // الحصول على آيات السورة
        const ayahsResponse = await axios.get(
            `https://api.alquran.cloud/v1/surah/${surahNumber}/ar.alquran-simple`
        );
        const ayahs = ayahsResponse.data.data.ayahs;
        
        let html = '<div class="ayahs-container">';
        
        // إضافة البسملة للسور ما عدا سورة التوبة
        if (surahNumber !== 9) {
            html += '<div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>';
        }
        
        ayahs.forEach(ayah => {
            let ayahText = ayah.text;
            
            // إزالة البسملة من الآية الأولى إذا كانت موجودة
            if (ayah.numberInSurah === 1 && surahNumber !== 1 && surahNumber !== 9) {
                ayahText = ayahText.replace('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', '').trim();
            }
            
            html += `
                <span class="ayah" data-ayah="${ayah.numberInSurah}" data-surah="${surahNumber}">
                    ${ayahText}
                    <span class="ayah-number">${ayah.numberInSurah}</span>
                    <div class="tafsir-popup">
                        <div class="tafsir-title">
                            <i class="fas fa-book"></i> تفسير الطبري (${surahInfo.name}:${ayah.numberInSurah})
                        </div>
                        <div class="tafsir-text" id="tafsir-${surahNumber}-${ayah.numberInSurah}">
                            <div class="spinner" style="width:20px;height:20px;border-width:2px;"></div>
                            جاري تحميل التفسير...
                        </div>
                    </div>
                </span>
            `;
        });
        
        html += '</div>';
        quranText.innerHTML = html;
        
        // إضافة مستمعين للأيات لتحميل التفسير عند التمرير
        document.querySelectorAll('.ayah').forEach(ayahEl => {
            ayahEl.addEventListener('mouseenter', function() {
                const popup = this.querySelector('.tafsir-popup');
                popup.style.display = 'block';
                
                const ayahNum = this.getAttribute('data-ayah');
                const surahNum = this.getAttribute('data-surah');
                loadTafsir(surahNum, ayahNum);
            });
            
            ayahEl.addEventListener('mouseleave', function() {
                const popup = this.querySelector('.tafsir-popup');
                popup.style.display = 'none';
            });
        });
        
    } catch (error) {
        showNotification('حدث خطأ أثناء تحميل السورة. يرجى المحاولة لاحقًا.', 'error');
        quranText.innerHTML = '<div class="error-message">حدث خطأ أثناء تحميل السورة. يرجى المحاولة لاحقًا.</div>';
        console.error('Error loading surah:', error);
    }
}

// تحميل تفسير الآية من تفسير الطبري
async function loadTafsir(surahNumber, ayahNumber) {
    const tafsirEl = document.getElementById(`tafsir-${surahNumber}-${ayahNumber}`);
    if (!tafsirEl.innerHTML.includes('جاري تحميل التفسير...')) return;
    
    try {
        const response = await axios.get(
            `https://quranenc.com/api/v1/translation/aya/arabic_moyassar/${surahNumber}/${ayahNumber}`
        );
        
        if (response.data.result && response.data.result.translation) {
            tafsirEl.innerHTML = response.data.result.translation;
        } else {
            tafsirEl.innerHTML = 'لا يوجد تفسير متاح لهذه الآية.';
        }
    } catch (error) {
        console.error('Error loading tafsir:', error);
        // جلب تفسير بديل إذا فشل المصدر الأول
        try {
            const backupResponse = await axios.get(
                `https://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}/ar.maududi`
            );
            tafsirEl.innerHTML = backupResponse.data.data.text || 'لا يوجد تفسير متاح.';
        } catch (backupError) {
            tafsirEl.innerHTML = 'تعذر تحميل التفسير. يرجى المحاولة لاحقًا.';
        }
    }
}

// دالة لتشغيل التلاوة من الملفات المحلية
async function playSurah() {
    // إذا كان هناك صوت مشغل بالفعل، استئناف التشغيل من حيث توقف
    if (audio && audio.currentTime > 0) {
        audio.play().catch(e => {
            console.error('Error playing audio:', e);
            showAudioError();
        });
        document.querySelector('.play-btn').style.display = 'none';
        document.querySelector('.pause-btn').style.display = 'flex';
        return;
    }
    
    if (audio) {
        audio.pause();
        audio = null;
    }
    
    currentReader = readers[document.querySelector('.reader-select').selectedIndex];
    currentSurah = document.querySelector('.surah-select').value;
    
    document.querySelector('.play-btn').style.display = 'none';
    document.querySelector('.pause-btn').style.display = 'flex';
    document.querySelector('.progress-bar').style.width = '0%';
    
    // مسار ملف الصوت المحلي
    const audioPath = `audio/${currentReader.id}/${currentSurah.toString().padStart(3, '0')}.mp3`;
    
    audio = new Audio(audioPath);
    
    // معالجة الأحداث
    audio.addEventListener('canplaythrough', function() {
        updateTimeDisplay();
        document.querySelector('.pause-btn').innerHTML = `<i class="fas fa-pause"></i> إيقاف`;
        audio.play().catch(e => {
            console.error('Error playing audio:', e);
            showAudioError();
        });
    });
    
    audio.addEventListener('error', function() {
        console.error('Error loading audio file');
        showAudioError();
    });
    
    audio.addEventListener('timeupdate', function() {
        const progress = (audio.currentTime / audio.duration) * 100;
        document.querySelector('.progress-bar').style.width = `${progress}%`;
        updateTimeDisplay();
    });
    
    audio.addEventListener('ended', function() {
        document.querySelector('.play-btn').style.display = 'flex';
        document.querySelector('.pause-btn').style.display = 'none';
    });
}

// دالة للتحكم في التقدم/الترجيع
function seekAudio(seconds) {
    if (!audio) return;
    
    const newTime = audio.currentTime + seconds;
    
    // التأكد من عدم تجاوز الحدود
    if (newTime < 0) {
        audio.currentTime = 0;
    } else if (newTime > audio.duration) {
        audio.currentTime = audio.duration;
    } else {
        audio.currentTime = newTime;
    }
    
    updateTimeDisplay();
}

// دالة للانتقال إلى نقطة محددة في الصوت
function setAudioPosition(e) {
    if (!audio) return;
    
    const progressContainer = document.getElementById('progress-container');
    const rect = progressContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pos * audio.duration;
}

// إيقاف التلاوة
function pauseSurah() {
    if (audio) {
        audio.pause();
        document.querySelector('.play-btn').style.display = 'flex';
        document.querySelector('.pause-btn').style.display = 'none';
    }
}

function updateTimeDisplay() {
    if (!audio) return;
    
    const currentTime = formatTime(audio.currentTime);
    const duration = formatTime(audio.duration);
    
    document.querySelector('.current-time').textContent = currentTime;
    document.querySelector('.duration').textContent = duration;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function showAudioError() {
    document.querySelector('.play-btn').style.display = 'flex';
    document.querySelector('.pause-btn').style.display = 'none';
    document.querySelector('.pause-btn').innerHTML = `<i class="fas fa-pause"></i> إيقاف`;
    
    showNotification('تعذر تحميل التلاوة! يرجى التأكد من وجود ملفات الصوت.', 'error');
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    document.querySelector('.play-btn').addEventListener('click', playSurah);
    document.querySelector('.pause-btn').addEventListener('click', pauseSurah);
    
    // أحداث التقدم/الترجيع
    document.querySelectorAll('.seek-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const seconds = parseInt(this.getAttribute('data-seek'));
            seekAudio(seconds);
        });
    });
    
    // حدث النقر على شريط التقدم
    document.getElementById('progress-container').addEventListener('click', setAudioPosition);
    
    document.querySelector('.surah-select').addEventListener('change', function() {
        currentSurah = this.value;
        loadSurah(currentSurah);
        if (audio) pauseSurah();
    });
    
    document.querySelector('.reader-select').addEventListener('change', function() {
        currentReader = readers[this.selectedIndex];
        if (audio) pauseSurah();
    });
}

// عرض الإشعارات
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    setTimeout(() => {
        notification.className = 'notification';
    }, 5000);
}

// تهيئة زر العودة للأعلى
function initScrollTopButton() {
    const scrollTopBtn = document.getElementById('scrollTop');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollTopBtn.classList.add('active');
        } else {
            scrollTopBtn.classList.remove('active');
        }
    });
    
    scrollTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// تهيئة قائمة الهبوط
function initHamburgerMenu() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    
    hamburger.addEventListener('click', function() {
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', !isExpanded);
        navLinks.classList.toggle('active');
    });
}

// تحديث سنة حقوق النشر
document.getElementById('current-year').textContent = new Date().getFullYear();
