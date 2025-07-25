document.addEventListener('DOMContentLoaded', function() {
    // قاموس الكلمات الصعبة وتفسيرها
    const DIFFICULT_WORDS_DICTIONARY = {
        "النيات": "النيّات: جمع نية، وهي القصد والإرادة التي يقترن بها العمل",
        "هجرته": "الهجرة: الانتقال من بلد إلى بلد، أو ترك المعصية إلى الطاعة",
        "ينكحها": "ينكحها: يتزوجها ويجامعها",
        "إسلام": "الإسلام: الاستسلام لله بالتوحيد والانقياد له بالطاعة والبراءة من الشرك وأهله",
        "المرء": "المرء: الإنسان سواء كان رجلاً أو امرأة",
        "يؤمن": "يؤمن: يكمل إيمانه ويصل إلى حقيقته",
        "الكلمة": "الكلمة: اللفظ المفيد الذي له معنى",
        "صدقة": "الصدقة: ما يُعطى للفقراء والمحتاجين طلبًا للأجر والثواب",
        "المسلم": "المسلم: من أسلم وجهه لله وخضع له وانقاد لأمره",
        "تبسمك": "التبسم: ابتسامة خفيفة دون صوت",
        "أخيك": "الأخ: يشمل الأخ في النسب والأخ في الدين",
        "يده": "اليد: تشمل الفعل والقوة والقدرة",
        "لسانه": "اللسان: يشمل الكلام والقول",
        "حسن": "الحسن: الجيد الكامل",
        "ما لا يعنيه": "ما لا يعنيه: ما لا تعلق له به ولا فائدة منه",
        "الكلمة الطيبة": "الكلمة الطيبة: الكلام الحسن الذي يسعد السامع ولا يؤذيه",
        "سلم المسلمون": "سلم المسلمون: لم يتأذوا منه بقول أو فعل",
        "إنما الأعمال": "الأعمال: تشمل العبادات والمعاملات والأقوال والأفعال",
        "لكل امرئ": "المرء: الإنسان المكلف",
        "فمن كانت هجرته": "أي فمن كان مقصوده ونيته بالهجرة",
        "لدنيا يصيبها": "لأجل مال أو جاه أو منفعة دنيوية",
        "ما نوى": "ما قصده وأراده من عمله",
        "لا يؤمن": "لا يكمل إيمانه",
        "حتى يحب": "إلى أن يحب ويتمنى",
        "ما يحب لنفسه": "من الخير والنفع والبركة",
        "من حسن إسلام": "من كمال استسلامه لله وانقياده",
        "تركه": "تجنبه وعدم اشتغاله به",
        "الكلمة الطيبة": "الكلام الحسن الذي يسر السامع"
    };

    // عناصر DOM
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const sourceFilter = document.getElementById('sourceFilter');
    const searchResults = document.getElementById('searchResults');
    const hadithContent = document.getElementById('hadithContent');
    
    // متغيرات التطبيق
    let hadithDatabase = [];
    let books = [];
    const API_BASE_URL = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1';
    const API_TIMEOUT = 5000; // 5 ثواني

    // بدء تحميل البيانات
    loadData();

    // دالة رئيسية لتحميل البيانات
    async function loadData() {
        showLoader();
        
        try {
            // جلب البيانات من API
            await fetchBooks();
            await fetchSampleHadiths();
            showToast('تم تحميل الأحاديث بنجاح');
        } catch (error) {
            console.error('حدث خطأ في تحميل البيانات:', error);
            loadLocalHadiths();
            showToast('تم تحميل الأحاديث من البيانات المحلية');
        }
        
        updateSourceFilter();
        displayHadiths();
    }

    // جلب قائمة الكتب من API
    async function fetchBooks() {
        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/books.min.json`, API_TIMEOUT);
            const data = await response.json();
            
            // تحويل البيانات إلى التنسيق المتوقع
            books = Object.entries(data).map(([id, book]) => ({
                id: id.toLowerCase(),
                name: book.name || `كتاب ${id}`
            }));
            
            return books;
        } catch (error) {
            console.error('خطأ في جلب قائمة الكتب:', error);
            // استخدام بيانات كتب افتراضية إذا فشل الاتصال
            books = [
                { id: 'bukhari', name: 'صحيح البخاري' },
                { id: 'muslim', name: 'صحيح مسلم' },
                { id: 'tirmidzi', name: 'سنن الترمذي' },
                { id: 'nasai', name: 'سنن النسائي' },
                { id: 'abudawud', name: 'سنن أبي داود' },
                { id: 'ibnmajah', name: 'سنن ابن ماجه' }
            ];
            return books;
        }
    }

    // جلب عينة من الأحاديث من API
    async function fetchSampleHadiths() {
        try {
            const hadithsPerBook = 5;
            hadithDatabase = [];
            
            // نستخدم فقط الكتب الرئيسية
            const mainBooks = ['bukhari', 'muslim', 'tirmidzi', 'nasai', 'abudawud', 'ibnmajah'];
            
            for (const bookId of mainBooks) {
                try {
                    const response = await fetchWithTimeout(
                        `${API_BASE_URL}/editions/${bookId}.min.json`,
                        API_TIMEOUT
                    );
                    
                    const data = await response.json();
                    
                    // أخذ عينة عشوائية من الأحاديث
                    const sampleHadiths = data.hadiths
                        .sort(() => 0.5 - Math.random())
                        .slice(0, hadithsPerBook);
                    
                    const bookHadiths = sampleHadiths.map(h => ({
                        id: `${bookId}-${h.hadithnumber}`,
                        text: h.text || 'نص الحديث غير متوفر',
                        source: data.metadata.name || `كتاب ${bookId}`,
                        sourceDetails: `حديث رقم ${h.hadithnumber}`,
                        bookId: bookId,
                        number: h.hadithnumber,
                        category: getRandomCategory(),
                        tags: generateTags(h.text || '')
                    }));
                    
                    hadithDatabase = hadithDatabase.concat(bookHadiths);
                } catch (error) {
                    console.error(`خطأ في جلب الأحاديث من ${bookId}:`, error);
                    continue;
                }
            }
            
            if (hadithDatabase.length === 0) {
                throw new Error('لم يتم جلب أي أحاديث من API');
            }
            
            return hadithDatabase;
        } catch (error) {
            console.error('خطأ في جلب الأحاديث:', error);
            throw error;
        }
    }

    // دالة fetch مع timeout
    async function fetchWithTimeout(url, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Fetch error:', error);
            throw error;
        }
    }

    // توليد تصنيف عشوائي للحديث
    function getRandomCategory() {
        const categories = ['daily', 'featured'];
        return categories[Math.floor(Math.random() * categories.length)];
    }

    // توليد وسوم تلقائية بناءً على نص الحديث
    function generateTags(hadithText) {
        const commonTags = [
            'إيمان', 'صلاة', 'زكاة', 'صوم', 'حج', 'أخلاق', 
            'معاملات', 'توبة', 'ذكر', 'دعاء', 'علم', 'أمانة',
            'نية', 'صدقة', 'تبسم', 'هجرة', 'إسلام'
        ];
        
        const words = hadithText.split(/\s+/);
        const tags = [];
        
        commonTags.forEach(tag => {
            if (hadithText.includes(tag)) {
                tags.push(tag);
            }
        });
        
        // إضافة بعض الكلمات المفتاحية من النص إذا كانت الوسوم قليلة
        if (tags.length < 3 && hadithText) {
            words.forEach(word => {
                if (word.length > 5 && !tags.includes(word) && tags.length < 5) {
                    tags.push(word);
                }
            });
        }
        
        return tags.slice(0, 5); // الحد الأقصى 5 وسوم
    }

    // تحميل أحاديث محلية إذا فشل الاتصال بالAPI
    function loadLocalHadiths() {
        hadithDatabase = [
            {
                id: 'bukhari-1',
                text: "إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى، فمن كانت هجرته إلى الله ورسوله، فهجرته إلى الله ورسوله، ومن كانت هجرته لدنيا يصيبها أو امرأة ينكحها، فهجرته إلى ما هاجر إليه",
                source: "صحيح البخاري",
                sourceDetails: "كتاب بدء الوحي، حديث 1",
                tags: ["نية", "أعمال", "هجرة"],
                category: "daily",
                bookId: "bukhari"
            },
            {
                id: 'tirmidzi-2317',
                text: "من حسن إسلام المرء تركه ما لا يعنيه",
                source: "سنن الترمذي",
                sourceDetails: "كتاب الزهد، حديث 2317",
                tags: ["إسلام", "أخلاق"],
                category: "featured",
                bookId: "tirmidzi"
            },
            {
                id: 'bukhari-13',
                text: "لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه",
                source: "صحيح البخاري",
                sourceDetails: "كتاب الإيمان، حديث 13",
                tags: ["إيمان", "أخلاق"],
                category: "featured",
                bookId: "bukhari"
            },
            {
                id: 'muslim-1009',
                text: "الكلمة الطيبة صدقة",
                source: "صحيح مسلم",
                sourceDetails: "كتاب الزكاة، حديث 1009",
                tags: ["كلام", "صدقة"],
                category: "daily",
                bookId: "muslim"
            },
            {
                id: 'bukhari-10',
                text: "المسلم من سلم المسلمون من لسانه ويده",
                source: "صحيح البخاري",
                sourceDetails: "كتاب الإيمان، حديث 10",
                tags: ["إسلام", "أخلاق"],
                category: "daily",
                bookId: "bukhari"
            },
            {
                id: 'tirmidzi-1956',
                text: "تبسمك في وجه أخيك صدقة",
                source: "سنن الترمذي",
                sourceDetails: "كتاب البر والصلة، حديث 1956",
                tags: ["تبسم", "صدقة"],
                category: "featured",
                bookId: "tirmidzi"
            }
        ];

        books = [
            { id: 'bukhari', name: 'صحيح البخاري' },
            { id: 'muslim', name: 'صحيح مسلم' },
            { id: 'tirmidzi', name: 'سنن الترمذي' },
            { id: 'nasai', name: 'سنن النسائي' },
            { id: 'abudawud', name: 'سنن أبي داود' },
            { id: 'ibnmajah', name: 'سنن ابن ماجه' }
        ];
    }

    // تحديث قائمة المصادر في select
    function updateSourceFilter() {
        sourceFilter.innerHTML = '';
        
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'جميع المصادر';
        sourceFilter.appendChild(allOption);
        
        books.forEach(book => {
            const option = document.createElement('option');
            option.value = book.id;
            option.textContent = book.name;
            sourceFilter.appendChild(option);
        });
    }

    // إضافة تفسير الكلمات الصعبة للنص
    function addWordMeanings(text) {
        if (!text) return '';
        
        // نجد الكلمات الصعبة الموجودة في النص
        const difficultWords = Object.keys(DIFFICULT_WORDS_DICTIONARY).filter(
            word => text.includes(word)
        );
        
        // نرتب الكلمات من الأطول إلى الأقصر لتجنب التداخل
        difficultWords.sort((a, b) => b.length - a.length);
        
        let processedText = text;
        
        // نضيف تفسير كل كلمة
        difficultWords.forEach(word => {
            const meaning = DIFFICULT_WORDS_DICTIONARY[word];
            const regex = new RegExp(word, 'g');
            processedText = processedText.replace(
                regex,
                `<span class="difficult-word">${word}<span class="word-meaning">${meaning}</span></span>`
            );
        });
        
        return processedText;
    }

    // عرض الأحاديث حسب التصنيف
    function displayHadiths() {
        hadithContent.innerHTML = '';
        
        const favorites = getFavoriteHadiths();
        const favoriteHadiths = hadithDatabase.filter(h => favorites.includes(h.id));
        
        // إضافة قسم للأحاديث المفضلة إذا كانت موجودة
        if (favoriteHadiths.length > 0) {
            const favoriteSection = document.createElement('div');
            favoriteSection.className = 'hadith-category';
            favoriteSection.innerHTML = `
                <h2><i class="fas fa-heart"></i> أحاديثي المفضلة</h2>
                <div class="hadith-list" id="favoriteHadithsList"></div>
            `;
            
            hadithContent.appendChild(favoriteSection);
            
            const favoriteList = document.getElementById('favoriteHadithsList');
            favoriteHadiths.forEach(hadith => {
                favoriteList.appendChild(createHadithElement(hadith));
            });
        }
        
        // عرض الأحاديث اليومية
        const dailySection = document.createElement('div');
        dailySection.className = 'hadith-category';
        dailySection.innerHTML = `
            <h2><i class="fas fa-calendar-day"></i> الأحاديث اليومية</h2>
            <div class="hadith-list" id="dailyHadiths"></div>
        `;
        hadithContent.appendChild(dailySection);
        
        const dailyList = document.getElementById('dailyHadiths');
        hadithDatabase.forEach(hadith => {
            if (hadith.category === 'daily') {
                dailyList.appendChild(createHadithElement(hadith));
            }
        });
        
        // عرض الأحاديث المميزة
        const featuredSection = document.createElement('div');
        featuredSection.className = 'hadith-category';
        featuredSection.innerHTML = `
            <h2><i class="fas fa-star"></i> أحاديث مختارة</h2>
            <div class="hadith-list" id="featuredHadiths"></div>
        `;
        hadithContent.appendChild(featuredSection);
        
        const featuredList = document.getElementById('featuredHadiths');
        hadithDatabase.forEach(hadith => {
            if (hadith.category === 'featured') {
                featuredList.appendChild(createHadithElement(hadith));
            }
        });
    }

    // إنشاء عنصر الحديث
    function createHadithElement(hadith) {
        const hadithItem = document.createElement('div');
        hadithItem.className = 'hadith-item';
        
        const hadithHeader = document.createElement('div');
        hadithHeader.className = 'hadith-header';
        
        const favoriteBtn = document.createElement('button');
        favoriteBtn.className = 'favorite-btn';
        favoriteBtn.innerHTML = isHadithFavorite(hadith.id) ? 
            '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
        favoriteBtn.onclick = (e) => {
            e.stopPropagation();
            toggleFavorite(hadith.id);
        };
        
        hadithHeader.appendChild(favoriteBtn);
        
        const hadithText = document.createElement('div');
        hadithText.className = 'hadith-text';
        hadithText.innerHTML = addWordMeanings(hadith.text);
        
        const hadithSource = document.createElement('div');
        hadithSource.className = 'hadith-source';
        hadithSource.textContent = `${hadith.source} - ${hadith.sourceDetails}`;
        
        const hadithTags = document.createElement('div');
        hadithTags.className = 'hadith-tags';
        
        hadith.tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'hadith-tag';
            tagElement.textContent = tag;
            hadithTags.appendChild(tagElement);
        });
        
        const shareBtn = document.createElement('button');
        shareBtn.className = 'share-btn';
        shareBtn.innerHTML = '<i class="fas fa-share-alt"></i> مشاركة';
        shareBtn.onclick = (e) => {
            e.stopPropagation();
            shareHadith(hadith);
        };
        
        hadithItem.appendChild(hadithHeader);
        hadithItem.appendChild(hadithText);
        hadithItem.appendChild(hadithSource);
        hadithItem.appendChild(hadithTags);
        hadithItem.appendChild(shareBtn);
        
        // تمييز الأحاديث المفضلة
        if (isHadithFavorite(hadith.id)) {
            hadithItem.classList.add('favorite');
        }
        
        return hadithItem;
    }

    // وظيفة البحث عن الأحاديث
    function searchHadiths() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedSource = sourceFilter.value;
        
        if (searchTerm === '') {
            searchResults.style.display = 'none';
            hadithContent.style.display = 'block';
            return;
        }
        
        const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
        
        const results = hadithDatabase.filter(hadith => {
            // تحقق من المصدر المحدد
            const matchesSource = selectedSource === 'all' || 
                                hadith.bookId === selectedSource;
            
            if (!matchesSource) return false;
            
            const text = hadith.text.toLowerCase();
            const tags = hadith.tags.join(' ').toLowerCase();
            const source = hadith.source.toLowerCase();
            
            // 1. البحث في نص الحديث
            if (text.includes(searchTerm)) return true;
            
            // 2. البحث في الوسوم (مطابقة كاملة أو جزئية)
            const tagMatch = hadith.tags.some(tag => 
                tag.toLowerCase().includes(searchTerm)
            );
            if (tagMatch) return true;
            
            // 3. البحث في المصدر
            if (source.includes(searchTerm)) return true;
            
            // 4. البحث بكلمات متفرقة
            const allWordsMatch = searchWords.every(word => 
                text.includes(word) || tags.includes(word)
            );
            if (allWordsMatch) return true;
            
            // 5. البحث بأجزاء من الكلمات
            const partialMatch = searchWords.some(word => {
                const minLength = Math.max(3, Math.floor(word.length * 0.66));
                const regex = new RegExp(word.substring(0, minLength), 'i');
                return regex.test(text) || regex.test(tags);
            });
            
            return partialMatch;
        });
        
        // ترتيب النتائج حسب مدى التطابق
        results.sort((a, b) => {
            const aText = a.text.toLowerCase();
            const bText = b.text.toLowerCase();
            
            // الأولوية للأحاديث التي تبدأ ببحث المستخدم
            if (aText.startsWith(searchTerm) && !bText.startsWith(searchTerm)) return -1;
            if (!aText.startsWith(searchTerm) && bText.startsWith(searchTerm)) return 1;
            
            // ثم الأحاديث التي تحتوي على جميع كلمات البحث
            const aAllWords = searchWords.every(word => aText.includes(word));
            const bAllWords = searchWords.every(word => bText.includes(word));
            
            if (aAllWords && !bAllWords) return -1;
            if (!aAllWords && bAllWords) return 1;
            
            // ثم عدد كلمات البحث المطابقة
            const aMatches = searchWords.filter(word => aText.includes(word)).length;
            const bMatches = searchWords.filter(word => bText.includes(word)).length;
            
            return bMatches - aMatches;
        });
        
        displaySearchResults(results);
    }
    
    // عرض نتائج البحث
    function displaySearchResults(results) {
        searchResults.innerHTML = '';
        const searchTerm = searchInput.value.trim().toLowerCase();
        
        if (results.length === 0) {
            searchResults.innerHTML = '<p class="no-results">لا توجد نتائج مطابقة للبحث. حاول استخدام كلمات أخرى أو جزء من الحديث.</p>';
        } else {
            results.forEach(hadith => {
                const hadithElement = createHadithElement(hadith);
                
                // تظليل كلمات البحث في النص والمصدر
                const textElement = hadithElement.querySelector('.hadith-text');
                const sourceElement = hadithElement.querySelector('.hadith-source');
                
                highlightSearchTerm(textElement, searchTerm);
                highlightSearchTerm(sourceElement, searchTerm);
                
                searchResults.appendChild(hadithElement);
            });
        }
        
        searchResults.style.display = 'block';
        hadithContent.style.display = 'none';
    }

    // تظليل نتائج البحث
    function highlightSearchTerm(element, term) {
        const text = element.textContent;
        const words = term.split(/\s+/).filter(w => w.length > 0);
        
        let highlightedText = text;
        
        words.forEach(word => {
            const minLength = Math.max(3, Math.floor(word.length * 0.66));
            const regex = new RegExp(`(${word.substring(0, minLength)}[\\w\\d]*)`, 'gi');
            highlightedText = highlightedText.replace(regex, '<span class="highlight">$1</span>');
        });
        
        element.innerHTML = highlightedText;
    }

    // إدارة الأحاديث المفضلة
    function getFavoriteHadiths() {
        return JSON.parse(localStorage.getItem('favoriteHadiths')) || [];
    }
    
    function isHadithFavorite(hadithId) {
        const favorites = getFavoriteHadiths();
        return favorites.includes(hadithId);
    }
    
    function toggleFavorite(hadithId) {
        let favorites = getFavoriteHadiths();
        const index = favorites.indexOf(hadithId);
        
        if (index === -1) {
            favorites.push(hadithId);
            showToast('تم إضافة الحديث إلى المفضلة');
        } else {
            favorites.splice(index, 1);
            showToast('تم إزالة الحديث من المفضلة');
        }
        
        localStorage.setItem('favoriteHadiths', JSON.stringify(favorites));
        
        // تحديث العرض
        if (searchResults.style.display === 'block') {
            const searchTerm = searchInput.value.trim();
            searchHadiths();
        } else {
            displayHadiths();
        }
    }

    // مشاركة الحديث
    async function shareHadith(hadith) {
        const shareData = {
            title: `حديث من ${hadith.source}`,
            text: `${hadith.text}\n\n${hadith.source} - ${hadith.sourceDetails}`,
            url: window.location.href
        };
        
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // نسخ إلى الحافظة إذا لم يكن Web Share API متاحًا
                await navigator.clipboard.writeText(
                    `${shareData.text}\n\nمشاركة من تطبيق توبة`
                );
                
                showToast('تم نسخ الحديث إلى الحافظة!');
            }
        } catch (err) {
            console.error('خطأ في المشاركة:', err);
            showToast('حدث خطأ أثناء المشاركة');
        }
    }

    // عرض مؤشر التحميل
    function showLoader() {
        hadithContent.innerHTML = `
            <div class="loader">
                <i class="fas fa-spinner fa-spin"></i> جاري تحميل الأحاديث...
            </div>
        `;
    }

    // عرض رسالة toast
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // أحداث DOM
    searchBtn.addEventListener('click', searchHadiths);
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            searchHadiths();
        }
    });
    
    sourceFilter.addEventListener('change', function() {
        if (searchInput.value.trim() === '') {
            displayHadiths();
        } else {
            searchHadiths();
        }
    });
});