/**
 * Translator - Free translation API integration with caching
 * Provides translate() and batchTranslate() functions using free APIs
 */

class Translator {
    constructor() {
        this.cache = this.loadCache();
        this.apiEndpoints = {
            // Use JSONP-compatible APIs and proxies to avoid CORS
            mymemory: 'https://api.mymemory.translated.net/get',
            googleTranslate: 'https://translate.googleapis.com/translate_a/single', // Free tier
            lingva: 'https://lingva.ml/api/v1' // Open source, CORS-friendly
        };
        this.requestQueue = [];
        this.isProcessing = false;
        this.rateLimitDelay = 800; // Reduced delay
        
        // Enhanced manual dictionary for common terms
        this.manualDictionary = this.initManualDictionary();
        
        console.log('🔄 Translator initialized with cache:', Object.keys(this.cache).length, 'entries');
    }

    // Load translation cache from localStorage
    loadCache() {
        try {
            const cached = localStorage.getItem('translation-cache');
            return cached ? JSON.parse(cached) : {};
        } catch (error) {
            console.warn('⚠️ Failed to load translation cache:', error);
            return {};
        }
    }

    // Save translation cache to localStorage
    saveCache() {
        try {
            // Keep cache size reasonable (max 1000 entries)
            const entries = Object.entries(this.cache);
            if (entries.length > 1000) {
                // Keep most recent 800 entries
                const sortedEntries = entries.sort((a, b) => 
                    (b[1].timestamp || 0) - (a[1].timestamp || 0)
                );
                this.cache = Object.fromEntries(sortedEntries.slice(0, 800));
            }
            
            localStorage.setItem('translation-cache', JSON.stringify(this.cache));
        } catch (error) {
            console.warn('⚠️ Failed to save translation cache:', error);
        }
    }

    // Enhanced manual dictionary for better translations
    initManualDictionary() {
        return {
            'en->tr': {
                // Common UI terms
                'Population': 'Nüfus',
                'Cities': 'Şehirler', 
                'Capital': 'Başkent',
                'Loading': 'Yükleniyor',
                'Search': 'Arama',
                'Results': 'Sonuçlar',
                'Country': 'Ülke',
                'City': 'Şehir',
                'Location': 'Konum',
                'Zoom': 'Yakınlaştır',
                'Reset': 'Sıfırla',
                'Close': 'Kapat',
                'Open': 'Aç',
                'North': 'Kuzey',
                'South': 'Güney', 
                'East': 'Doğu',
                'West': 'Batı',
                'Center': 'Merkez',
                'Unknown': 'Bilinmeyen',
                'My Location': 'Konumum',
                'Reset View': 'Görünümü Sıfırla',
                'Global City Explorer': 'Küresel Şehir Gezgini',
                'Loading 3D World...': '3D Dünya Yükleniyor...',
                'Search cities...': 'Şehir ara...',
                'No cities found': 'Şehir bulunamadı',
                'Country Information': 'Ülke Bilgileri',
                'Show city points': 'Şehir noktalarını göster',
                'Language': 'Dil',
                'English': 'İngilizce',
                'Clear': 'Temizle',
                
                // Country names (most common)
                'Turkey': 'Türkiye',
                'United States': 'Amerika Birleşik Devletleri',
                'United Kingdom': 'Birleşik Krallık',
                'Germany': 'Almanya',
                'France': 'Fransa',
                'Italy': 'İtalya',
                'Spain': 'İspanya',
                'Russia': 'Rusya',
                'China': 'Çin',
                'Japan': 'Japonya',
                'India': 'Hindistan',
                'Brazil': 'Brezilya',
                'Canada': 'Kanada',
                'Australia': 'Avustralya',
                'Mexico': 'Meksika',
                'Netherlands': 'Hollanda',
                'Greece': 'Yunanistan',
                'Poland': 'Polonya',
                'Sweden': 'İsveç',
                'Norway': 'Norveç',
                'Denmark': 'Danimarka',
                'Finland': 'Finlandiya',
                'Belgium': 'Belçika',
                'Switzerland': 'İsviçre',
                'Austria': 'Avusturya',
                'Portugal': 'Portekiz',
                'Czech Republic': 'Çek Cumhuriyeti',
                'Hungary': 'Macaristan',
                'Romania': 'Romanya',
                'Bulgaria': 'Bulgaristan',
                'Croatia': 'Hırvatistan',
                'Serbia': 'Sırbistan',
                'Ukraine': 'Ukrayna',
                'South Korea': 'Güney Kore',
                'North Korea': 'Kuzey Kore',
                'Thailand': 'Tayland',
                'Vietnam': 'Vietnam',
                'Indonesia': 'Endonezya',
                'Malaysia': 'Malezya',
                'Singapore': 'Singapur',
                'Philippines': 'Filipinler',
                'Argentina': 'Arjantin',
                'Chile': 'Şili',
                'Peru': 'Peru',
                'Colombia': 'Kolombiya',
                'Venezuela': 'Venezuela',
                'Egypt': 'Mısır',
                'South Africa': 'Güney Afrika',
                'Morocco': 'Fas',
                'Algeria': 'Cezayir',
                'Tunisia': 'Tunus',
                'Libya': 'Libya',
                'Ethiopia': 'Etiyopya',
                'Kenya': 'Kenya',
                'Nigeria': 'Nijerya',
                'Ghana': 'Gana',
                'Iran': 'İran',
                'Iraq': 'Irak',
                'Saudi Arabia': 'Suudi Arabistan',
                'Israel': 'İsrail',
                'Jordan': 'Ürdün',
                'Lebanon': 'Lübnan',
                'Syria': 'Suriye',
                'Pakistan': 'Pakistan',
                'Bangladesh': 'Bangladeş',
                'Sri Lanka': 'Sri Lanka',
                'Afghanistan': 'Afganistan',
                'Kazakhstan': 'Kazakistan',
                'Uzbekistan': 'Özbekistan',
                'Armenia': 'Ermenistan',
                'Georgia': 'Gürcistan',
                'Azerbaijan': 'Azerbaycan',
                'New Zealand': 'Yeni Zelanda',
                'Iceland': 'İzlanda',
                'Ireland': 'İrlanda',
                'Cyprus': 'Kıbrıs',
                
                // Air Quality terms
                'Air Quality Index': 'Hava Kalitesi İndeksi',
                'AQI': 'HKİ',
                'Good': 'İyi',
                'Moderate': 'Orta',
                'Good-Moderate': 'İyi-Orta',
                'Unhealthy': 'Sağlıksız',
                'Hazardous': 'Tehlikeli',
                'Air Quality': 'Hava Kalitesi',
                'Pollution Level': 'Kirlilik Seviyesi',
                
                // Turkish Cities (mostly same in Turkish, but included for completeness)
                'Istanbul': 'İstanbul',
                'Ankara': 'Ankara',
                'Izmir': 'İzmir',
                'Bursa': 'Bursa',
                'Antalya': 'Antalya',
                'Adana': 'Adana',
                'Konya': 'Konya',
                'Gaziantep': 'Gaziantep',
                'Kayseri': 'Kayseri',
                'Eskisehir': 'Eskişehir',
                'Diyarbakir': 'Diyarbakır',
                'Samsun': 'Samsun',
                'Denizli': 'Denizli',
                'Sanliurfa': 'Şanlıurfa',
                'Trabzon': 'Trabzon',
                'Malatya': 'Malatya',
                'Erzurum': 'Erzurum',
                'Van': 'Van',
                'Hatay': 'Hatay',
                'Manisa': 'Manisa'
            },
            'tr->en': {
                // Reverse mappings
                'Nüfus': 'Population',
                'Şehirler': 'Cities',
                'Başkent': 'Capital',
                'Yükleniyor': 'Loading',
                'Arama': 'Search',
                'Sonuçlar': 'Results',
                'Ülke': 'Country',
                'Şehir': 'City',
                'Konum': 'Location',
                'Yakınlaştır': 'Zoom',
                'Sıfırla': 'Reset',
                'Kapat': 'Close',
                'Aç': 'Open',
                'Kuzey': 'North',
                'Güney': 'South',
                'Doğu': 'East',
                'Batı': 'West',
                'Merkez': 'Center',
                'Bilinmeyen': 'Unknown',
                'Konumum': 'My Location',
                'Görünümü Sıfırla': 'Reset View',
                'Küresel Şehir Gezgini': 'Global City Explorer',
                '3D Dünya Yükleniyor...': 'Loading 3D World...',
                'Şehir ara...': 'Search cities...',
                'Şehir bulunamadı': 'No cities found',
                'Ülke Bilgileri': 'Country Information',
                'Şehir noktalarını göster': 'Show city points',
                'Dil': 'Language',
                'İngilizce': 'English',
                'Temizle': 'Clear',
                
                // Air Quality terms (TR->EN)
                'Hava Kalitesi İndeksi': 'Air Quality Index',
                'HKİ': 'AQI',
                'İyi': 'Good',
                'Orta': 'Moderate',
                'İyi-Orta': 'Good-Moderate', 
                'Sağlıksız': 'Unhealthy',
                'Tehlikeli': 'Hazardous',
                'Hava Kalitesi': 'Air Quality',
                'Kirlilik Seviyesi': 'Pollution Level'
            }
        };
    }

    // Check manual dictionary first
    getManualTranslation(text, srcLang, dstLang) {
        const key = `${srcLang}->${dstLang}`;
        return this.manualDictionary[key]?.[text] || null;
    }
    getCacheKey(text, srcLang, dstLang) {
        return `${srcLang}|${dstLang}|${text}`;
    }

    // Check if translation is cached
    getCachedTranslation(text, srcLang, dstLang) {
        const key = this.getCacheKey(text, srcLang, dstLang);
        const cached = this.cache[key];
        
        if (cached) {
            // Check if cache entry is not too old (30 days)
            const age = Date.now() - (cached.timestamp || 0);
            const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
            
            if (age < maxAge) {
                return cached.translation;
            } else {
                // Remove old cache entry
                delete this.cache[key];
            }
        }
        
        return null;
    }

    // Cache translation
    cacheTranslation(text, srcLang, dstLang, translation) {
        const key = this.getCacheKey(text, srcLang, dstLang);
        this.cache[key] = {
            translation: translation,
            timestamp: Date.now()
        };
        
        // Save cache every 10 new entries
        if (Object.keys(this.cache).length % 10 === 0) {
            this.saveCache();
        }
    }

    // Translate single text using Lingva (CORS-friendly)
    async translateWithLingva(text, srcLang, dstLang) {
        try {
            const url = `${this.apiEndpoints.lingva}/${srcLang}/${dstLang}/${encodeURIComponent(text)}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Lingva API error: ${response.status}`);
            }

            const data = await response.json();
            return data.translation;
            
        } catch (error) {
            console.warn('⚠️ Lingva failed:', error.message);
            throw error;
        }
    }

    // Improved MyMemory implementation with better error handling
    async translateWithMyMemory(text, srcLang, dstLang) {
        try {
            const langPair = `${srcLang}|${dstLang}`;
            const url = `${this.apiEndpoints.mymemory}?q=${encodeURIComponent(text)}&langpair=${langPair}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`MyMemory API error: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.responseStatus === 200) {
                const translation = data.responseData.translatedText;
                
                // Skip if translation is the same as original (common with proper nouns)
                if (translation.toLowerCase() === text.toLowerCase()) {
                    return text;
                }
                
                return translation;
            } else {
                throw new Error(`MyMemory translation error: ${data.responseDetails}`);
            }
            
        } catch (error) {
            console.warn('⚠️ MyMemory failed:', error.message);
            throw error;
        }
    }

    // Main translate function with enhanced fallback chain
    async translate(text, srcLang = 'en', dstLang = 'tr') {
        // Return original if same language
        if (srcLang === dstLang) {
            return text;
        }

        // Check cache first
        const cached = this.getCachedTranslation(text, srcLang, dstLang);
        if (cached) {
            return cached;
        }

        // Check manual dictionary first (highest priority)
        const manual = this.getManualTranslation(text, srcLang, dstLang);
        if (manual) {
            console.log(`✅ Manual Dictionary: "${text}" -> "${manual}"`);
            this.cacheTranslation(text, srcLang, dstLang, manual);
            return manual;
        }

        // Skip translation for very short, numeric, or coordinate texts
        if (text.length < 2 || /^[\d\s.,°-]+$/.test(text) || /^\d+°[NSEW]/.test(text)) {
            return text;
        }

        try {
            let translation = null;

            // Try Lingva first (CORS-friendly)
            try {
                translation = await this.translateWithLingva(text, srcLang, dstLang);
                if (translation && translation !== text) {
                    console.log(`✅ Lingva: "${text}" -> "${translation}"`);
                    this.cacheTranslation(text, srcLang, dstLang, translation);
                    return translation;
                }
            } catch (error) {
                // Continue to next fallback
            }

            // Fallback to MyMemory
            try {
                translation = await this.translateWithMyMemory(text, srcLang, dstLang);
                if (translation && translation !== text) {
                    console.log(`✅ MyMemory: "${text}" -> "${translation}"`);
                    this.cacheTranslation(text, srcLang, dstLang, translation);
                    return translation;
                }
            } catch (fallbackError) {
                console.warn('⚠️ All translation APIs failed for:', text);
            }

            // If all else fails, return original text
            return text;

        } catch (error) {
            console.warn(`⚠️ Translation failed for "${text}":`, error.message);
            return text;
        }
    }

    // Batch translate multiple texts
    async batchTranslate(texts, srcLang = 'en', dstLang = 'tr') {
        if (!Array.isArray(texts) || texts.length === 0) {
            return {};
        }

        console.log(`🔄 Batch translating ${texts.length} texts from ${srcLang} to ${dstLang}`);

        const results = {};
        const uncachedTexts = [];

        // Check cache for all texts first
        texts.forEach(text => {
            const cached = this.getCachedTranslation(text, srcLang, dstLang);
            if (cached) {
                results[text] = cached;
            } else {
                uncachedTexts.push(text);
            }
        });

        console.log(`📋 Cache hits: ${Object.keys(results).length}, API calls needed: ${uncachedTexts.length}`);

        // Translate uncached texts with rate limiting
        for (let i = 0; i < uncachedTexts.length; i++) {
            const text = uncachedTexts[i];
            
            try {
                const translation = await this.translate(text, srcLang, dstLang);
                results[text] = translation;

                // Rate limiting - wait between requests
                if (i < uncachedTexts.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
                }

            } catch (error) {
                console.warn(`⚠️ Failed to translate "${text}":`, error.message);
                results[text] = text; // Fallback to original
            }
        }

        // Save cache after batch operation
        this.saveCache();

        console.log(`✅ Batch translation completed: ${Object.keys(results).length} results`);
        return results;
    }

    // Get translation statistics
    getStats() {
        const totalEntries = Object.keys(this.cache).length;
        const languagePairs = {};
        
        Object.keys(this.cache).forEach(key => {
            const [src, dst] = key.split('|');
            const pair = `${src}-${dst}`;
            languagePairs[pair] = (languagePairs[pair] || 0) + 1;
        });

        return {
            totalCachedTranslations: totalEntries,
            languagePairs: languagePairs,
            cacheSize: JSON.stringify(this.cache).length
        };
    }

    // Clear cache
    clearCache() {
        this.cache = {};
        localStorage.removeItem('translation-cache');
        console.log('🗑️ Translation cache cleared');
    }

    // Preload common translations - now uses manual dictionary first
    async preloadCommonTranslations(srcLang = 'en', dstLang = 'tr') {
        const commonTexts = [
            'Population', 'Cities', 'Capital', 'Loading', 'Search', 'Results',
            'Country', 'City', 'Location', 'Zoom', 'Reset', 'Close', 'Open',
            'North', 'South', 'East', 'West', 'Center', 'Unknown',
            'My Location', 'Reset View', 'Global City Explorer',
            'Loading 3D World...', 'Search cities...', 'No cities found',
            'Country Information', 'Show city points', 'Language', 'Clear'
        ];

        console.log(`🔄 Preloading ${commonTexts.length} common translations...`);
        
        try {
            // Most will be handled by manual dictionary, but cache them anyway
            const results = {};
            for (const text of commonTexts) {
                const translation = await this.translate(text, srcLang, dstLang);
                results[text] = translation;
                
                // Small delay to be nice to APIs
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            console.log('✅ Common translations preloaded:', Object.keys(results).length);
        } catch (error) {
            console.warn('⚠️ Failed to preload common translations:', error);
        }
    }

    // Clean up old cache entries
    cleanupCache() {
        const now = Date.now();
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        let removedCount = 0;

        Object.keys(this.cache).forEach(key => {
            const entry = this.cache[key];
            if (!entry.timestamp || (now - entry.timestamp > maxAge)) {
                delete this.cache[key];
                removedCount++;
            }
        });

        if (removedCount > 0) {
            this.saveCache();
            console.log(`🗑️ Cleaned up ${removedCount} old cache entries`);
        }
    }
}

// Global instance
window.translator = new Translator();

// Convenience function
window.translate = (text, srcLang, dstLang) => window.translator.translate(text, srcLang, dstLang);