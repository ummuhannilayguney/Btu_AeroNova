/**
 * i18n Core - Language management and UI translation system
 * Handles language state, base dictionary translations, and DOM updates
 */

class I18nCore {
    constructor() {
        this.currentLanguage = this.getLang();
        this.baseDictionary = this.initBaseDictionary();
        this.mutationObserver = null;
        this.translationQueue = new Set();
        this.processingQueue = false;
        
        console.log(`🌐 i18n initialized with language: ${this.currentLanguage}`);
    }

    // Language state management
    getLang() {
        return localStorage.getItem('preferredLanguage') || 'en'; // İngilizce varsayılan
    }

    setLang(language) {
        if (language !== this.currentLanguage) {
            this.currentLanguage = language;
            localStorage.setItem('preferredLanguage', language);
            console.log(`🌐 Language changed to: ${language}`);
        }
    }

    // Base dictionary for fixed UI strings
    initBaseDictionary() {
        return {
            en: {
                // App title and headers
                "app.title": "Global City Explorer",
                "app.subtitle": "Explore cities around the world in 3D",
                
                // Navigation and controls
                "btn.zoom": "Zoom",
                "btn.open": "Open",
                "btn.reset": "Reset View",
                "btn.location": "Go to my Location",
                "btn.close": "Close",
                "btn.clear": "Clear",
                
                // Search
                "search.placeholder": "Search cities...",
                "search.no-results": "No cities found",
                "search.results": "Search Results",
                
                // Loading and status
                "loading.text": "Loading 3D World...",
                "loading.cities": "Loading city data...",
                "loading.countries": "Loading country boundaries...",
                "status.ready": "3D World ready! Use mouse to rotate, wheel to zoom",
                
                // Country panel
                "country.panel.title": "Country Information",
                "country.meta.population": "Population",
                "country.meta.cities": "Cities",
                "country.toggle.points": "Show city points",
                
                // City types
                "city.type.capital": "National Capital",
                "city.type.admin": "Administrative Center", 
                "city.type.major": "Major City",
                "city.type.city": "City",
                
                // Messages
                "msg.location.granted": "Location access granted",
                "msg.location.denied": "Location access denied",
                "msg.location.error": "Could not get your location",
                "msg.globe.ready": "Globe ready for interaction",
                
                // Language selector
                "lang.select": "Language",
                "lang.en": "English",
                "lang.tr": "Türkçe",
                
                // Authentication
                "auth.login": "Log In",
                "auth.signup": "Sign Up",
                "auth.login.title": " Log In",
                "auth.signup.title": " Sign Up",
                "auth.email": "Email:",
                "auth.password": "Password:",
                "auth.fullname": "Full Name:",
                "auth.confirm.password": "Confirm Password:",
                "auth.verification.code": "Email Verification Code:",
                "auth.enter.email": "Enter your email",
                "auth.enter.password": "Enter your password",
                "auth.enter.fullname": "Enter your full name",
                "auth.create.password": "Create a password",
                "auth.confirm.password.placeholder": "Confirm your password",
                "auth.verification.placeholder": "Enter 6-digit code",
                "auth.send.code": "Send Code",
                "auth.verification.info": "We'll send a verification code to your email",
                "auth.send.verification": "Send Verification Code",
                "auth.complete.signup": "Complete Sign Up",
                "auth.submit.login": "Log In",
                "auth.submit.signup": "Sign Up",
                "auth.passwords.not.match": "Passwords do not match!",
                "auth.fill.all.fields": "Please fill in all fields!",
                "auth.verification.sent": "Verification code sent to",
                "auth.verification.production.note": "(In production, this would be sent via email)",
                "auth.account.created": "Account created successfully!",
                "auth.welcome": "Welcome to Global City Explorer!",
                "auth.invalid.verification": "Invalid verification code!",
                "auth.code.sent": "Code sent to",
                "auth.enter.email.first": "Please enter your email first!",
                "auth.login.attempt": "Login attempt:",
                "auth.login.functionality": "Login functionality will be implemented here!",
                
                // Air Pollution
                "air.pollution": "Air Pollution",
                "air.quality.scale.title": "Air Quality Scale",
                "air.quality.good": "Good",
                "air.quality.moderate": "Good-Moderate",
                "air.quality.unhealthy.sensitive": "Moderate",
                "air.quality.unhealthy": "Moderate-Unhealthy",
                "air.quality.very.unhealthy": "Unhealthy",
                "air.quality.hazardous": "Very Unhealthy",
                "air.mode.enabled": "Air pollution mode ON",
                "air.mode.disabled": "Air pollution mode OFF",
                
                // Turkey Provinces
                "turkey.provinces.enabled": "Turkey provinces enabled",
                "turkey.provinces.disabled": "Turkey provinces disabled",
                "turkey.provinces.loading": "Loading Turkey provinces data...",
                "turkey.provinces.system.ready": "Turkey provinces system ready",
                "turkey.provinces.system.unavailable": "Turkey provinces system not available",
                "turkey.provinces.error.enable": "Error enabling provinces boundaries:",
                "turkey.provinces.error.disable": "Error disabling provinces boundaries:",
                "turkey.provinces.count": "provinces",
                "turkey.provinces.filled.polygons": "filled polygons",
                
                // City Boundaries
                "city.boundaries.enabled": "City boundaries layer enabled",
                "city.boundaries.disabled": "City boundaries layer disabled",
                "city.boundaries.disposed": "City boundaries layer disposed",
                "city.boundaries.system.ready": "City boundaries system ready",
                "city.boundaries.fetching": "Fetching city boundaries for current view...",
                "city.boundaries.loading": "Loading world cities data...",
                "city.boundaries.data.loaded": "cities boundaries data loaded",
                "city.boundaries.loaded": "city boundary loaded",
                "city.boundaries.loaded.success": "city boundaries loaded",
                "city.boundaries.no.data": "No city boundaries found in current view",
                "city.boundaries.error.fetch": "Failed to load city boundaries",
                "city.boundaries.error.load": "Failed to load cities data",
                "city.boundaries.error.enable": "Error enabling city boundaries:",
                "city.boundaries.error.disable": "Error disabling city boundaries:",
                "city.boundaries.init.failed": "City boundaries layer initialization failed",
                "city.boundaries.controller.unavailable": "City boundaries controller not available",
                "city.boundaries.system.unavailable": "City boundaries system not available",
                "city.boundaries.throttled": "Request throttled for bounds:",
                
                // Coordinates
                "coords.lat": "Latitude",
                "coords.lng": "Longitude",
                "coords.alt": "Altitude",
                
                // Country page dynamic content
                "country.info.description": "Administrative divisions and major cities",
                "country.stat.cities": "Cities",
                "country.stat.admin": "Admin Centers",
                "country.stat.population": "Population",
                "population.unknown": "Population unknown",
                "btn.back": "Back to Globe",
                
                // Country page specific
                "country.page.back": "← Back to Map",
                "country.page.loading": "Loading page...",
                "country.page.search": "Search cities...",
                "country.page.major.cities": "Major Cities",
                "country.page.cities": "Cities",
                "country.page.capital": "Capital",
                "country.page.no.data": "No city data found for this country.",
                
                // State page specific
                "state.page.title": "State Cities",
                "state.page.back": "← Back to US States",
                "state.page.search": "Search city...",
                "state.page.cities.info": "Cities and Weather Information",
                "state.page.cities.found": "cities found",
                "state.page.cities.showing": "cities showing",
                "state.page.cities.total": "total",
                "state.page.population": "Population",
                "state.page.air.quality": "Air Quality",
                "state.page.no.cities": "No cities found",
                "state.page.try.different": "Try a different search term",
                "state.page.loading": "Loading...",
                "state.page.error.title": "Error loading data",
                "state.page.error.retry": "Try refreshing the page",
                "state.page.error.message": "Data could not be loaded",
                
                // Status messages and logs
                "msg.flying.to": "Flying to",
                "msg.arrived.at": "Arrived at",
                "msg.location.going": "Going to your location...",
                "msg.arrived.location": "Arrived at your location",
                "msg.resetting.view": "Resetting view...",
                "msg.globe.wait": "Globe is still loading, please wait...",
                "msg.world.wait": "3D World is still loading, please wait...",
                "msg.invalid.coordinates": "Invalid coordinates",
                "msg.location.error.move": "Error while moving location",
                "msg.globe.ready": "Globe ready - loading hidden!",
                "msg.your.location": "Your Location",
                "msg.world.ready": "3D World ready! Use mouse to rotate, wheel to zoom",
                "msg.cities.loading": "Loading city data...",
                "msg.cities.loaded": "cities loaded from CSV",
                "msg.csv.failed": "CSV could not be loaded, trying JSON",
                "msg.startup.error": "Startup error",
                "msg.data.load.error": "Data loading error",
                "msg.location.no.support": "Browser does not support location",
                "msg.location.error": "Could not get location",
                "msg.page.created": "Universal page created for",
                "msg.with.places": "with",
                "msg.places": "places",
                "msg.no.cities": "No cities found for this country.",
                "msg.iso.code": "ISO Code",
                "msg.borders.drawn": "All world country borders drawn (NASA style)",
                "msg.creating.page": "Creating dynamic page for"
            },
            tr: {
                // Uygulama başlığı ve başlıklar
                "app.title": "Küresel Şehir Gezgini",
                "app.subtitle": "Dünya şehirlerini 3D olarak keşfedin",
                
                // Navigasyon ve kontroller
                "btn.zoom": "Yakınlaştır",
                "btn.open": "Aç",
                "btn.reset": "Görünümü Sıfırla",
                "btn.location": "Konumuma git",
                "btn.close": "Kapat",
                "btn.clear": "Temizle",
                
                // Arama
                "search.placeholder": "Şehir ara...",
                "search.no-results": "Şehir bulunamadı",
                "search.results": "Arama Sonuçları",
                
                // Yükleme ve durum
                "loading.text": "3D Dünya Yükleniyor...",
                "loading.cities": "Şehir verileri yükleniyor...",
                "loading.countries": "Ülke sınırları yükleniyor...",
                "status.ready": "3D Dünya hazır! Mouse ile döndürün, tekerlek ile yakınlaştırın",
                
                // Ülke paneli
                "country.panel.title": "Ülke Bilgileri",
                "country.meta.population": "Nüfus",
                "country.meta.cities": "Şehirler",
                "country.toggle.points": "Şehir noktalarını göster",
                
                // Şehir türleri
                "city.type.capital": "Başkent",
                "city.type.admin": "İdari Merkez",
                "city.type.major": "Büyük Şehir", 
                "city.type.city": "Şehir",
                
                // Mesajlar
                "msg.location.granted": "Konum erişimi izni verildi",
                "msg.location.denied": "Konum erişimi reddedildi",
                "msg.location.error": "Konumunuz alınamadı",
                "msg.globe.ready": "Küre etkileşim için hazır",
                "msg.your.location": "Konumunuz",
                
                // Dil seçici
                "lang.select": "Dil",
                "lang.en": "English",
                "lang.tr": "Türkçe",
                
                // Kimlik Doğrulama
                "auth.login": "Giriş Yap",
                "auth.signup": "Kayıt Ol",
                "auth.login.title": " Giriş Yap",
                "auth.signup.title": " Kayıt Ol",
                "auth.email": "E-posta:",
                "auth.password": "Şifre:",
                "auth.fullname": "Ad Soyad:",
                "auth.confirm.password": "Şifre Tekrar:",
                "auth.verification.code": "E-posta Doğrulama Kodu:",
                "auth.enter.email": "E-posta adresinizi girin",
                "auth.enter.password": "Şifrenizi girin",
                "auth.enter.fullname": "Ad ve soyadınızı girin",
                "auth.create.password": "Bir şifre oluşturun",
                "auth.confirm.password.placeholder": "Şifrenizi tekrar girin",
                "auth.verification.placeholder": "6 haneli kodu girin",
                "auth.send.code": "Kod Gönder",
                "auth.verification.info": "E-posta adresinize doğrulama kodu göndereceğiz",
                "auth.send.verification": "Doğrulama Kodu Gönder",
                "auth.complete.signup": "Kayıt Ol",
                "auth.submit.login": "Giriş Yap",
                "auth.submit.signup": "Kayıt Ol",
                "auth.passwords.not.match": "Şifreler eşleşmiyor!",
                "auth.fill.all.fields": "Lütfen tüm alanları doldurun!",
                "auth.verification.sent": "Doğrulama kodu gönderildi:",
                "auth.verification.production.note": "(Gerçek uygulamada bu e-posta ile gönderilecek)",
                "auth.account.created": "Hesap başarıyla oluşturuldu!",
                "auth.welcome": "Küresel Şehir Gezgini'ne hoş geldiniz!",
                "auth.invalid.verification": "Geçersiz doğrulama kodu!",
                "auth.code.sent": "Kod gönderildi:",
                "auth.enter.email.first": "Lütfen önce e-posta adresinizi girin!",
                "auth.login.attempt": "Giriş denemesi:",
                "auth.login.functionality": "Giriş fonksiyonu burada uygulanacak!",
                
                // Hava Kirliliği
                "air.pollution": "Hava Kirliliği",
                "air.quality.scale.title": "Hava Kalitesi Ölçeği",
                "air.quality.good": "İyi",
                "air.quality.moderate": "İyi-Orta",
                "air.quality.unhealthy.sensitive": "Orta",
                "air.quality.unhealthy": "Orta-Kötü",
                "air.quality.very.unhealthy": "Kötü",
                "air.quality.hazardous": "Çok Kötü",
                "air.mode.enabled": "Hava kirliliği modu AÇIK",
                "air.mode.disabled": "Hava kirliliği modu KAPALI",
                
                // Türkiye İlleri
                "turkey.provinces.enabled": "Türkiye illeri etkinleştirildi",
                "turkey.provinces.disabled": "Türkiye illeri kapatıldı", 
                "turkey.provinces.loading": "Türkiye illeri verileri yükleniyor...",
                "turkey.provinces.system.ready": "Türkiye illeri sistemi hazır",
                "turkey.provinces.system.unavailable": "Türkiye illeri sistemi mevcut değil",
                "turkey.provinces.error.enable": "İl sınırlarını etkinleştirme hatası:",
                "turkey.provinces.error.disable": "İl sınırlarını kapatma hatası:",
                "turkey.provinces.count": "il",
                "turkey.provinces.filled.polygons": "dolu poligonlar",
                
                // Şehir Sınırları - City Boundaries
                "city.boundaries.enabled": "Şehir sınırları katmanı etkinleştirildi",
                "city.boundaries.disabled": "Şehir sınırları katmanı devre dışı bırakıldı",
                "city.boundaries.disposed": "Şehir sınırları katmanı temizlendi",
                "city.boundaries.system.ready": "Şehir sınırları sistemi hazır",
                "city.boundaries.fetching": "Mevcut görünüm için şehir sınırları getiriliyor...",
                "city.boundaries.loading": "Dünya şehirleri verisi yükleniyor...",
                "city.boundaries.data.loaded": "şehir sınırları verisi yüklendi",
                "city.boundaries.loaded": "şehir sınırı yüklendi",
                "city.boundaries.loaded.success": "şehir sınırları yüklendi",
                "city.boundaries.no.data": "Mevcut görünümde şehir sınırı bulunamadı",
                "city.boundaries.error.fetch": "Şehir sınırları yüklenemedi",
                "city.boundaries.error.load": "Şehir verileri yüklenemedi",
                "city.boundaries.error.enable": "Şehir sınırları etkinleştirilemedi:",
                "city.boundaries.error.disable": "Şehir sınırları devre dışı bırakılamadı:",
                "city.boundaries.init.failed": "Şehir sınırları katmanı başlatılamadı",
                "city.boundaries.controller.unavailable": "Şehir sınırları kontrolörü mevcut değil",
                "city.boundaries.system.unavailable": "Şehir sınırları sistemi mevcut değil",
                "city.boundaries.throttled": "İstek kısıtlandı:",
                
                // Koordinatlar
                "coords.lat": "Enlem",
                "coords.lng": "Boylam", 
                "coords.alt": "Yükseklik",
                
                // Ülke sayfası dinamik içerik
                "country.info.description": "İdari bölümler ve büyük şehirler",
                "country.stat.cities": "Şehirler",
                "country.stat.admin": "İdari Merkezler",
                "country.stat.population": "Nüfus",
                "population.unknown": "Nüfus bilinmiyor",
                "btn.back": "Küreye Dön",
                
                // Ülke sayfası özel
                "country.page.back": "← Haritaya Dön",
                "country.page.loading": "Sayfa yükleniyor...",
                "country.page.search": "Şehir ara...",
                "country.page.major.cities": "Büyük Şehirler",
                "country.page.cities": "Şehirleri",
                "country.page.capital": "Başkent",
                "country.page.no.data": "Bu ülke için şehir verisi bulunamadı.",
                
                // Eyalet sayfası özel
                "state.page.title": "Eyalet Şehirleri",
                "state.page.back": "← Amerika Birleşik Devletleri'ne Dön",
                "state.page.search": "Şehir ara...",
                "state.page.cities.info": "Şehirler ve Hava Kalitesi Bilgileri",
                "state.page.cities.found": "şehir bulundu",
                "state.page.cities.showing": "şehir gösteriliyor",
                "state.page.cities.total": "toplam",
                "state.page.population": "Nüfus",
                "state.page.air.quality": "Hava Kalitesi",
                "state.page.no.cities": "Şehir bulunamadı",
                "state.page.try.different": "Farklı bir arama terimi deneyin",
                "state.page.loading": "Yükleniyor...",
                "state.page.error.title": "Veri yüklenirken hata oluştu",
                "state.page.error.retry": "Sayfayı yenilemeyi deneyin",
                "state.page.error.message": "Veri yüklenemedi",
                
                // Durum mesajları ve log'lar
                "msg.flying.to": "konumuna gidiliyor",
                "msg.arrived.at": "konumuna ulaşıldı",
                "msg.location.going": "Konumunuza gidiliyor...",
                "msg.arrived.location": "Konumunuza ulaşıldı",
                "msg.resetting.view": "Görünüm sıfırlanıyor...",
                "msg.globe.wait": "Küre henüz hazır değil, lütfen bekleyin...",
                "msg.world.wait": "3D Dünya henüz yükleniyor, lütfen bekleyin...",
                "msg.invalid.coordinates": "Geçersiz koordinatlar",
                "msg.location.error.move": "Konum değişimi sırasında hata",
                "msg.globe.ready": "Küre hazır - yükleme gizlendi!",
                "msg.world.ready": "3D Dünya hazır! Mouse ile döndürün, tekerlek ile yakınlaştırın",
                "msg.cities.loading": "Şehir verileri yükleniyor...",
                "msg.cities.loaded": "şehir yüklendi",
                "msg.csv.failed": "CSV yüklenemedi, JSON deneniyor",
                "msg.startup.error": "Başlatma hatası",
                "msg.data.load.error": "Veri yükleme hatası",
                "msg.location.no.support": "Tarayıcı konum desteği yok",
                "msg.location.error": "Konum alınamadı",
                "msg.page.created": "için sayfa oluşturuldu",
                "msg.with.places": "",
                "msg.places": "yer ile",
                "msg.no.cities": "Bu ülke için şehir bulunamadı.",
                "msg.iso.code": "ISO Kodu",
                "msg.borders.drawn": "Tüm dünya ülke sınırları çizildi (NASA stili)",
                "msg.creating.page": "için dinamik sayfa oluşturuluyor"
            }
        };
    }

    // Get translation from base dictionary
    t(key, fallback = null) {
        const translation = this.baseDictionary[this.currentLanguage]?.[key] 
                         || this.baseDictionary['en']?.[key] 
                         || fallback 
                         || key;
        
        return translation;
    }

    // Apply translations to DOM elements with data-i18n attributes
    applyTranslations() {
        console.log(`🔄 Applying translations for language: ${this.currentLanguage}`);
        console.log('📝 Available translations:', Object.keys(this.baseDictionary[this.currentLanguage] || {}));
        
        // Update elements with data-i18n attribute
        const elementsWithI18n = document.querySelectorAll('[data-i18n]');
        console.log(`🎯 Found ${elementsWithI18n.length} elements with data-i18n`);
        
        elementsWithI18n.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            console.log(`🔄 Translating "${key}" to "${translation}" for element:`, element.tagName);
            
            if (translation && translation !== key) {
                if (element.tagName.toLowerCase() === 'title') {
                    element.textContent = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });
        
        // Update elements with data-i18n-placeholder attribute
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = this.t(key);
            
            if (translation && translation !== key) {
                element.placeholder = translation;
            }
        });
        
        // Update language selector value
        const langSelect = document.getElementById('langSelect');
        if (langSelect) {
            langSelect.value = this.currentLanguage;
        }
        
        console.log('✅ Base translations applied to DOM');
    }

    // Automatic translation of visible text nodes - DEVRE DIŞI
    async autoTranslateVisibleText() {
        // Auto-translation devre dışı - sadece base dictionary kullanıyoruz
        console.log('🌐 Auto-translation disabled - using base dictionary only');
        return;
    }

    // Get all visible text nodes
    getVisibleTextNodes() {
        const textNodes = [];
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Skip if parent has data-i18n-skip attribute
                    if (node.parentElement?.hasAttribute('data-i18n-skip')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    // Skip if parent is script, style, or other non-visible elements
                    const parent = node.parentElement;
                    if (!parent || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    // Skip if text is whitespace only
                    if (!node.textContent.trim()) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    // Check if element is visible
                    const style = window.getComputedStyle(parent);
                    if (style.display === 'none' || style.visibility === 'hidden') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        
        return textNodes;
    }

    // Check if text should be translated
    shouldTranslateText(text) {
        // Skip very short texts
        if (text.length < 3) return false;
        
        // Skip numbers, coordinates, URLs, emails
        if (/^[\d\s.,°-]+$/.test(text)) return false;
        if (/^https?:\/\//.test(text)) return false;
        if (/\S+@\S+\.\S+/.test(text)) return false;
        
        // Skip texts that look like coordinates
        if (/^\d+\.?\d*[°]?\s*[NSEW]?\s*,?\s*\d+\.?\d*[°]?\s*[NSEW]?$/.test(text)) return false;
        
        // Skip single words that are likely proper nouns (start with capital)
        if (text.split(' ').length === 1 && /^[A-Z]/.test(text)) return false;
        
        // Skip if text is already in Turkish (contains Turkish-specific characters)
        if (this.currentLanguage === 'tr' && /[çğıöşüÇĞIÖŞÜ]/.test(text)) return false;
        
        // Skip if text looks like it's already Turkish (common Turkish words)
        const turkishWords = ['şehir', 'ülke', 'nüfus', 'konum', 'yakınlaştır', 'sıfırla', 'arama', 'sonuç', 'yükleniyor', 'dünya', 'bilgi', 'göster', 'kapat', 'temizle'];
        const lowerText = text.toLowerCase();
        if (turkishWords.some(word => lowerText.includes(word))) return false;
        
        // Skip if it's clearly English UI that's already handled by base dictionary
        const englishUIWords = ['reset', 'view', 'zoom', 'search', 'loading', 'city', 'country', 'population', 'close'];
        if (englishUIWords.some(word => lowerText.includes(word))) return false;
        
        return true;
    }

    // Setup mutation observer for dynamic content
    setupMutationObserver() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }
        
        this.mutationObserver = new MutationObserver((mutations) => {
            let hasNewText = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
                            hasNewText = true;
                        }
                    });
                }
            });
            
            if (hasNewText && this.currentLanguage !== 'en') {
                // Debounce auto-translation for dynamic content
                this.queueAutoTranslation();
            }
        });
        
        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('👀 Mutation observer setup for dynamic content translation');
    }

    // Queue auto-translation to avoid excessive API calls
    queueAutoTranslation() {
        if (this.processingQueue) return;
        
        setTimeout(async () => {
            if (this.processingQueue) return;
            this.processingQueue = true;
            
            try {
                await this.autoTranslateVisibleText();
            } catch (error) {
                console.warn('⚠️ Queued auto-translation failed:', error);
            } finally {
                this.processingQueue = false;
            }
        }, 500); // 500ms debounce
    }

    // Initialize i18n system
    async initialize() {
        console.log('🚀 Initializing i18n system...');
        console.log(`🌐 Current language: ${this.currentLanguage}`);
        console.log(`📚 Available languages:`, Object.keys(this.baseDictionary));
        
        // Apply base translations
        this.applyTranslations();
        
        // Setup language selector
        this.setupLanguageSelector();
        
        console.log('✅ i18n system initialized - base translations only');
        console.log(`📍 Final language setting: ${this.currentLanguage}`);
    }

    // Setup language selector
    setupLanguageSelector() {
        const langSelect = document.getElementById('langSelect');
        if (!langSelect) {
            console.warn('⚠️ Language selector not found');
            return;
        }
        
        // Başlangıç dilini ayarla
        langSelect.value = this.currentLanguage;
        console.log(`🌐 Language selector set to: ${this.currentLanguage}`);
        
        langSelect.addEventListener('change', async (e) => {
            const newLanguage = e.target.value;
            console.log(`🌐 Language selector changed to: ${newLanguage}`);
            console.log(`🔄 Old language was: ${this.currentLanguage}`);
            
            const oldLanguage = this.currentLanguage;
            this.setLang(newLanguage);
            
            console.log(`✅ Language updated to: ${this.currentLanguage}`);
            
            // Apply base translations
            console.log('🔄 Applying base translations...');
            this.applyTranslations();
            
            // Globe'da dil değişikliğini bildir
            if (window.globeExplorer && typeof window.globeExplorer.changeLanguage === 'function') {
                console.log('🌍 Notifying globe about language change');
                window.globeExplorer.changeLanguage(newLanguage);
            }
            
            console.log('✅ Language change completed');
        });
        
        console.log('✅ Language selector setup completed');
    }

    // Cleanup
    destroy() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }
    }
}

// Global instance
window.i18n = new I18nCore();

// Helper function for easy access
window.t = (key, fallback) => window.i18n.t(key, fallback);