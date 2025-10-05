// === GLOBAL CITY EXPLORER - GLOBE.GL VERSION ===
// Three.js tabanlı gerçek 3D dünya uygulaması
// Optimized: Globe.gl internal Three.js kullanılıyor, ayrı Three.js yok

// Dinamik arka plan sistemi kaldırıldı - sadece yıldızlı uzay arka planı

// ISO kodu düzeltme haritası
const ISO_FIX = new Map([
    ['-99', ''],
    ['XK', 'XK'],
    ['PS', 'PS']
]);

function isoFromFeature(f) {
    const raw = (f.properties?.ISO_A2 || '').toUpperCase();
    return ISO_FIX.get(raw) ?? raw;
}



class GlobeExplorer {
    constructor() {
        // Globe.gl library kontrolü
        if (typeof Globe === 'undefined') {
            console.error('❌ Globe.gl library not loaded!');
            throw new Error('Globe.gl library required');
        }
        console.log('✅ Globe.gl library loaded successfully');
        
        this.globe = null;
        this.cities = [];
        this.countries = [];
        this.allCities = null; // Tüm cities verisi için
        this.worldCapitals = null; // Dünya başkentleri ve önemli şehirler
        this.turkishProvinces = null; // Türkiye il bilgileri için
        this.usaStates = null; // USA eyalet bilgileri için
        this.elements = {};
        this.currentLanguage = window.i18n ? window.i18n.getLang() : 'en';
        this.translations = this.initializeTranslations();
        this.globeReady = false; // Globe hazır mı flag'i
        this.pendingUserLocation = null; // Bekleyen kullanıcı konumu
        this.countryTranslationCache = new Map(); // Ülke adı çeviri cache
        
        // Mouse position tracking for hover cards
        this.mouseX = 0;
        this.mouseY = 0;
        
        // Air Pollution features
        this.airPollutionMode = false; // Hava kirliliği modu
        
        // City Boundaries System
        this.cityBoundariesData = null; // Şehir sınırları GeoJSON verisi
        this.cityBoundariesCache = new Map(); // API cache for city boundaries
        this.countriesData = null; // Ülke sınırları verisi (backup için)
        this.shouldUseProgressiveRendering = false; // Progressive rendering flag
        this.currentRenderingBatch = 0; // Current batch index for progressive rendering
        this.failedCountries = []; // Track failed countries for UI display
        
        // Dinamik arka plan sistemi
        this.currentBackgroundCountry = null; // Mevcut arka plan ülkesi
        this.backgroundElement = null; // Arka plan elementi
        
        // Globe instance'ını global olarak kaydet
        window.globeExplorer = this;
        
        this.init();
    }

    // Dil çevirileri sistemi
    initializeTranslations() {
        return {
            loading: {
                tr: '3D Dünya Yükleniyor...',
                en: 'Loading 3D World...'
            },
            countries: {
                // A
                'Afghanistan': { tr: 'Afganistan', en: 'Afghanistan' },
                'Albania': { tr: 'Arnavutluk', en: 'Albania' },
                'Algeria': { tr: 'Cezayir', en: 'Algeria' },
                'Andorra': { tr: 'Andorra', en: 'Andorra' },
                'Angola': { tr: 'Angola', en: 'Angola' },
                'Argentina': { tr: 'Arjantin', en: 'Argentina' },
                'Armenia': { tr: 'Ermenistan', en: 'Armenia' },
                'Australia': { tr: 'Avustralya', en: 'Australia' },
                'Austria': { tr: 'Avusturya', en: 'Austria' },
                'Azerbaijan': { tr: 'Azerbaycan', en: 'Azerbaijan' },
                
                // B
                'Bahamas': { tr: 'Bahamalar', en: 'Bahamas' },
                'Bahrain': { tr: 'Bahreyn', en: 'Bahrain' },
                'Bangladesh': { tr: 'Bangladeş', en: 'Bangladesh' },
                'Barbados': { tr: 'Barbados', en: 'Barbados' },
                'Belarus': { tr: 'Belarus', en: 'Belarus' },
                'Belgium': { tr: 'Belçika', en: 'Belgium' },
                'Belize': { tr: 'Belize', en: 'Belize' },
                'Benin': { tr: 'Benin', en: 'Benin' },
                'Bhutan': { tr: 'Butan', en: 'Bhutan' },
                'Bolivia': { tr: 'Bolivya', en: 'Bolivia' },
                'Bosnia and Herzegovina': { tr: 'Bosna-Hersek', en: 'Bosnia and Herzegovina' },
                'Botswana': { tr: 'Botsvana', en: 'Botswana' },
                'Brazil': { tr: 'Brezilya', en: 'Brazil' },
                'Brunei': { tr: 'Brunei', en: 'Brunei' },
                'Bulgaria': { tr: 'Bulgaristan', en: 'Bulgaria' },
                'Burkina Faso': { tr: 'Burkina Faso', en: 'Burkina Faso' },
                'Burundi': { tr: 'Burundi', en: 'Burundi' },
                
                // C
                'Cambodia': { tr: 'Kamboçya', en: 'Cambodia' },
                'Cameroon': { tr: 'Kamerun', en: 'Cameroon' },
                'Canada': { tr: 'Kanada', en: 'Canada' },
                'Cape Verde': { tr: 'Yeşil Burun Adaları', en: 'Cape Verde' },
                'Central African Republic': { tr: 'Orta Afrika Cumhuriyeti', en: 'Central African Republic' },
                'Chad': { tr: 'Çad', en: 'Chad' },
                'Chile': { tr: 'Şili', en: 'Chile' },
                'China': { tr: 'Çin', en: 'China' },
                'Colombia': { tr: 'Kolombiya', en: 'Colombia' },
                'Comoros': { tr: 'Komorlar', en: 'Comoros' },
                'Congo': { tr: 'Kongo', en: 'Congo' },
                'Costa Rica': { tr: 'Kosta Rika', en: 'Costa Rica' },
                'Croatia': { tr: 'Hırvatistan', en: 'Croatia' },
                'Cuba': { tr: 'Küba', en: 'Cuba' },
                'Cyprus': { tr: 'Kıbrıs', en: 'Cyprus' },
                'Czech Republic': { tr: 'Çek Cumhuriyeti', en: 'Czech Republic' },
                'Czechia': { tr: 'Çekya', en: 'Czechia' },
                
                // D
                'Denmark': { tr: 'Danimarka', en: 'Denmark' },
                'Djibouti': { tr: 'Cibuti', en: 'Djibouti' },
                'Dominica': { tr: 'Dominika', en: 'Dominica' },
                'Dominican Republic': { tr: 'Dominik Cumhuriyeti', en: 'Dominican Republic' },
                
                // E
                'East Timor': { tr: 'Doğu Timor', en: 'East Timor' },
                'Ecuador': { tr: 'Ekvador', en: 'Ecuador' },
                'Egypt': { tr: 'Mısır', en: 'Egypt' },
                'El Salvador': { tr: 'El Salvador', en: 'El Salvador' },
                'Equatorial Guinea': { tr: 'Ekvator Ginesi', en: 'Equatorial Guinea' },
                'Eritrea': { tr: 'Eritre', en: 'Eritrea' },
                'Estonia': { tr: 'Estonya', en: 'Estonia' },
                'Ethiopia': { tr: 'Etiyopya', en: 'Ethiopia' },
                
                // F
                'Fiji': { tr: 'Fiji', en: 'Fiji' },
                'Finland': { tr: 'Finlandiya', en: 'Finland' },
                'France': { tr: 'Fransa', en: 'France' },
                
                // G
                'Gabon': { tr: 'Gabon', en: 'Gabon' },
                'Gambia': { tr: 'Gambiya', en: 'Gambia' },
                'Georgia': { tr: 'Gürcistan', en: 'Georgia' },
                'Germany': { tr: 'Almanya', en: 'Germany' },
                'Ghana': { tr: 'Gana', en: 'Ghana' },
                'Greece': { tr: 'Yunanistan', en: 'Greece' },
                'Grenada': { tr: 'Grenada', en: 'Grenada' },
                'Guatemala': { tr: 'Guatemala', en: 'Guatemala' },
                'Guinea': { tr: 'Gine', en: 'Guinea' },
                'Guinea-Bissau': { tr: 'Gine-Bissau', en: 'Guinea-Bissau' },
                'Guyana': { tr: 'Guyana', en: 'Guyana' },
                'Greenland': { tr: 'Grönland', en: 'Greenland' },
                
                // H
                'Haiti': { tr: 'Haiti', en: 'Haiti' },
                'Honduras': { tr: 'Honduras', en: 'Honduras' },
                'Hungary': { tr: 'Macaristan', en: 'Hungary' },
                
                // I
                'Iceland': { tr: 'İzlanda', en: 'Iceland' },
                'India': { tr: 'Hindistan', en: 'India' },
                'Indonesia': { tr: 'Endonezya', en: 'Indonesia' },
                'Iran': { tr: 'İran', en: 'Iran' },
                'Iraq': { tr: 'Irak', en: 'Iraq' },
                'Ireland': { tr: 'İrlanda', en: 'Ireland' },
                'Israel': { tr: 'İsrail', en: 'Israel' },
                'Italy': { tr: 'İtalya', en: 'Italy' },
                'Ivory Coast': { tr: 'Fildişi Sahili', en: 'Ivory Coast' },
                
                // J
                'Jamaica': { tr: 'Jamaika', en: 'Jamaica' },
                'Japan': { tr: 'Japonya', en: 'Japan' },
                'Jordan': { tr: 'Ürdün', en: 'Jordan' },
                
                // K
                'Kazakhstan': { tr: 'Kazakistan', en: 'Kazakhstan' },
                'Kenya': { tr: 'Kenya', en: 'Kenya' },
                'Kiribati': { tr: 'Kiribati', en: 'Kiribati' },
                'Kuwait': { tr: 'Kuveyt', en: 'Kuwait' },
                'Kyrgyzstan': { tr: 'Kırgızistan', en: 'Kyrgyzstan' },
                
                // L
                'Laos': { tr: 'Laos', en: 'Laos' },
                'Latvia': { tr: 'Letonya', en: 'Latvia' },
                'Lebanon': { tr: 'Lübnan', en: 'Lebanon' },
                'Lesotho': { tr: 'Lesotho', en: 'Lesotho' },
                'Liberia': { tr: 'Liberya', en: 'Liberia' },
                'Libya': { tr: 'Libya', en: 'Libya' },
                'Liechtenstein': { tr: 'Lihtenştayn', en: 'Liechtenstein' },
                'Lithuania': { tr: 'Litvanya', en: 'Lithuania' },
                'Luxembourg': { tr: 'Lüksemburg', en: 'Luxembourg' },
                
                // M
                'Madagascar': { tr: 'Madagaskar', en: 'Madagascar' },
                'Malawi': { tr: 'Malavi', en: 'Malawi' },
                'Malaysia': { tr: 'Malezya', en: 'Malaysia' },
                'Maldives': { tr: 'Maldivler', en: 'Maldives' },
                'Mali': { tr: 'Mali', en: 'Mali' },
                'Malta': { tr: 'Malta', en: 'Malta' },
                'Marshall Islands': { tr: 'Marshall Adaları', en: 'Marshall Islands' },
                'Mauritania': { tr: 'Moritanya', en: 'Mauritania' },
                'Mauritius': { tr: 'Mauritius', en: 'Mauritius' },
                'Mexico': { tr: 'Meksika', en: 'Mexico' },
                'Micronesia': { tr: 'Mikronezya', en: 'Micronesia' },
                'Moldova': { tr: 'Moldova', en: 'Moldova' },
                'Monaco': { tr: 'Monako', en: 'Monaco' },
                'Mongolia': { tr: 'Moğolistan', en: 'Mongolia' },
                'Montenegro': { tr: 'Karadağ', en: 'Montenegro' },
                'Morocco': { tr: 'Fas', en: 'Morocco' },
                'Mozambique': { tr: 'Mozambik', en: 'Mozambique' },
                'Myanmar': { tr: 'Myanmar', en: 'Myanmar' },
                'North Macedonia': { tr: 'Kuzey Makedonya', en: 'North Macedonia' },
                'Macedonia': { tr: 'Makedonya', en: 'Macedonia' },
                'Republic of North Macedonia': { tr: 'Kuzey Makedonya Cumhuriyeti', en: 'Republic of North Macedonia' },
                'Former Yugoslav Republic of Macedonia': { tr: 'Eski Yugoslav Makedonya Cumhuriyeti', en: 'Former Yugoslav Republic of Macedonia' },
                'Macedonia': { tr: 'Makedonya', en: 'Macedonia' },
                // N
                'Namibia': { tr: 'Namibya', en: 'Namibia' },
                'Nauru': { tr: 'Nauru', en: 'Nauru' },
                'Nepal': { tr: 'Nepal', en: 'Nepal' },
                'Netherlands': { tr: 'Hollanda', en: 'Netherlands' },
                'New Zealand': { tr: 'Yeni Zelanda', en: 'New Zealand' },
                'Nicaragua': { tr: 'Nikaragua', en: 'Nicaragua' },
                'Niger': { tr: 'Nijer', en: 'Niger' },
                'Nigeria': { tr: 'Nijerya', en: 'Nigeria' },
                'North Korea': { tr: 'Kuzey Kore', en: 'North Korea' },
                'Norway': { tr: 'Norveç', en: 'Norway' },
                'Northern Cyprus': { tr: 'Kuzey Kıbrıs', en: 'Northern Cyprus' },
                
                // O
                'Oman': { tr: 'Umman', en: 'Oman' },
                
                // P
                'Pakistan': { tr: 'Pakistan', en: 'Pakistan' },
                'Palau': { tr: 'Palau', en: 'Palau' },
                'Panama': { tr: 'Panama', en: 'Panama' },
                'Papua New Guinea': { tr: 'Papua Yeni Gine', en: 'Papua New Guinea' },
                'Paraguay': { tr: 'Paraguay', en: 'Paraguay' },
                'Peru': { tr: 'Peru', en: 'Peru' },
                'Philippines': { tr: 'Filipinler', en: 'Philippines' },
                'Poland': { tr: 'Polonya', en: 'Poland' },
                'Portugal': { tr: 'Portekiz', en: 'Portugal' },
                
                // Q
                'Qatar': { tr: 'Katar', en: 'Qatar' },
                
                // R
                'Romania': { tr: 'Romanya', en: 'Romania' },
                'Russia': { tr: 'Rusya', en: 'Russia' },
                'Russian Federation': { tr: 'Rusya Federasyonu', en: 'Russian Federation' },
                'Rwanda': { tr: 'Ruanda', en: 'Rwanda' },
                'Republic of Serbia': { tr: 'Sırbistan Cumhuriyeti', en: 'Republic of Serbia' },
                
                // S
                'Saint Kitts and Nevis': { tr: 'Saint Kitts ve Nevis', en: 'Saint Kitts and Nevis' },
                'Saint Lucia': { tr: 'Saint Lucia', en: 'Saint Lucia' },
                'Saint Vincent and the Grenadines': { tr: 'Saint Vincent ve Grenadinler', en: 'Saint Vincent and the Grenadines' },
                'Samoa': { tr: 'Samoa', en: 'Samoa' },
                'San Marino': { tr: 'San Marino', en: 'San Marino' },
                'Sao Tome and Principe': { tr: 'Sao Tome ve Principe', en: 'Sao Tome and Principe' },
                'Saudi Arabia': { tr: 'Suudi Arabistan', en: 'Saudi Arabia' },
                'Senegal': { tr: 'Senegal', en: 'Senegal' },
                'Serbia': { tr: 'Sırbistan', en: 'Serbia' },
                'Seychelles': { tr: 'Seyşeller', en: 'Seychelles' },
                'Sierra Leone': { tr: 'Sierra Leone', en: 'Sierra Leone' },
                'Singapore': { tr: 'Singapur', en: 'Singapore' },
                'Slovakia': { tr: 'Slovakya', en: 'Slovakia' },
                'Slovenia': { tr: 'Slovenya', en: 'Slovenia' },
                'Solomon Islands': { tr: 'Solomon Adaları', en: 'Solomon Islands' },
                'Somalia': { tr: 'Somali', en: 'Somalia' },
                'South Africa': { tr: 'Güney Afrika', en: 'South Africa' },
                'South Korea': { tr: 'Güney Kore', en: 'South Korea' },
                'South Sudan': { tr: 'Güney Sudan', en: 'South Sudan' },
                'Spain': { tr: 'İspanya', en: 'Spain' },
                'Sri Lanka': { tr: 'Sri Lanka', en: 'Sri Lanka' },
                'Sudan': { tr: 'Sudan', en: 'Sudan' },
                'Suriname': { tr: 'Surinam', en: 'Suriname' },
                'Swaziland': { tr: 'Esvatini', en: 'Swaziland' },
                'Sweden': { tr: 'İsveç', en: 'Sweden' },
                'Switzerland': { tr: 'İsviçre', en: 'Switzerland' },
                'Syria': { tr: 'Suriye', en: 'Syria' },
                
                // T
                'Taiwan': { tr: 'Tayvan', en: 'Taiwan' },
                'Tajikistan': { tr: 'Tacikistan', en: 'Tajikistan' },
                'Tanzania': { tr: 'Tanzanya', en: 'Tanzania' },
                'United Republic of Tanzania': { tr: 'Tanzanya Birleşik Cumhuriyeti', en: 'United Republic of Tanzania' },
                'Thailand': { tr: 'Tayland', en: 'Thailand' },
                'Togo': { tr: 'Togo', en: 'Togo' },
                'Tonga': { tr: 'Tonga', en: 'Tonga' },
                'Trinidad and Tobago': { tr: 'Trinidad ve Tobago', en: 'Trinidad and Tobago' },
                'Tunisia': { tr: 'Tunus', en: 'Tunisia' },
                'Turkey': { tr: 'Türkiye', en: 'Turkey' },
                'Turkmenistan': { tr: 'Türkmenistan', en: 'Turkmenistan' },
                'Tuvalu': { tr: 'Tuvalu', en: 'Tuvalu' },
                
                // U
                'Uganda': { tr: 'Uganda', en: 'Uganda' },
                'Ukraine': { tr: 'Ukrayna', en: 'Ukraine' },
                'United Arab Emirates': { tr: 'Birleşik Arap Emirlikleri', en: 'United Arab Emirates' },
                'United Kingdom': { tr: 'Birleşik Krallık', en: 'United Kingdom' },
                'United States': { tr: 'Amerika Birleşik Devletleri', en: 'United States' },
                'United States of America': { tr: 'Amerika Birleşik Devletleri', en: 'United States of America' },
                'Uruguay': { tr: 'Uruguay', en: 'Uruguay' },
                'Uzbekistan': { tr: 'Özbekistan', en: 'Uzbekistan' },
                
                // V
                'Vanuatu': { tr: 'Vanuatu', en: 'Vanuatu' },
                'Vatican City': { tr: 'Vatikan', en: 'Vatican City' },
                'Venezuela': { tr: 'Venezuela', en: 'Venezuela' },
                'Vietnam': { tr: 'Vietnam', en: 'Vietnam' },
                
                // Y
                'Yemen': { tr: 'Yemen', en: 'Yemen' },
                
                // Z
                'Zambia': { tr: 'Zambiya', en: 'Zambia' },
                'Zimbabwe': { tr: 'Zimbabve', en: 'Zimbabwe' },
                
                // Alternatif adlar ve kısaltmalar
                'USA': { tr: 'Amerika Birleşik Devletleri', en: 'USA' },
                'UK': { tr: 'Birleşik Krallık', en: 'UK' },
                'UAE': { tr: 'Birleşik Arap Emirlikleri', en: 'UAE' },
                'Democratic Republic of the Congo': { tr: 'Demokratik Kongo Cumhuriyeti', en: 'Democratic Republic of the Congo' },
                'Republic of the Congo': { tr: 'Kongo Cumhuriyeti', en: 'Republic of the Congo' },
                'Republic of Turkey': { tr: 'Türkiye Cumhuriyeti', en: 'Republic of Turkey' },
                'Republic of France': { tr: 'Fransa Cumhuriyeti', en: 'Republic of France' },
                'Federal Republic of Germany': { tr: 'Almanya Federal Cumhuriyeti', en: 'Federal Republic of Germany' },
                'Italian Republic': { tr: 'İtalya Cumhuriyeti', en: 'Italian Republic' },
                'Republic of Greece': { tr: 'Yunanistan Cumhuriyeti', en: 'Republic of Greece' },
                'Republic of Croatia': { tr: 'Hırvatistan Cumhuriyeti', en: 'Republic of Croatia' },
                'Republic of Bulgaria': { tr: 'Bulgaristan Cumhuriyeti', en: 'Republic of Bulgaria' },
                'Republic of Poland': { tr: 'Polonya Cumhuriyeti', en: 'Republic of Poland' },
                'Kingdom of Spain': { tr: 'İspanya Krallığı', en: 'Kingdom of Spain' },
                'Portuguese Republic': { tr: 'Portekiz Cumhuriyeti', en: 'Portuguese Republic' },
                'Republic of Austria': { tr: 'Avusturya Cumhuriyeti', en: 'Republic of Austria' },
                'Swiss Confederation': { tr: 'İsviçre Konfederasyonu', en: 'Swiss Confederation' },
                'Kingdom of Norway': { tr: 'Norveç Krallığı', en: 'Kingdom of Norway' },
                'Kingdom of Sweden': { tr: 'İsveç Krallığı', en: 'Kingdom of Sweden' },
                'Republic of Finland': { tr: 'Finlandiya Cumhuriyeti', en: 'Republic of Finland' },
                'Kingdom of Denmark': { tr: 'Danimarka Krallığı', en: 'Kingdom of Denmark' }
            },
            cities: {
                // Major World Cities
                'Moscow': { tr: 'Moskova', en: 'Moscow' },
                'Saint Petersburg': { tr: 'Sankt-Peterburg', en: 'Saint Petersburg' },
                'Beijing': { tr: 'Pekin', en: 'Beijing' },
                'Shanghai': { tr: 'Şangay', en: 'Shanghai' },
                'Tokyo': { tr: 'Tokyo', en: 'Tokyo' },
                'Osaka': { tr: 'Osaka', en: 'Osaka' },
                'Kyoto': { tr: 'Kyoto', en: 'Kyoto' },
                'Yokohama': { tr: 'Yokohama', en: 'Yokohama' },
                'Seoul': { tr: 'Seul', en: 'Seoul' },
                'Busan': { tr: 'Busan', en: 'Busan' },
                'Mumbai': { tr: 'Bombay', en: 'Mumbai' },
                'Delhi': { tr: 'Delhi', en: 'Delhi' },
                'Kolkata': { tr: 'Kalküta', en: 'Kolkata' },
                'Chennai': { tr: 'Madras', en: 'Chennai' },
                'Bangalore': { tr: 'Bangalore', en: 'Bangalore' },
                'Hyderabad': { tr: 'Haydarabad', en: 'Hyderabad' },
                'Bangkok': { tr: 'Bangkok', en: 'Bangkok' },
                'Singapore': { tr: 'Singapur', en: 'Singapore' },
                'Kuala Lumpur': { tr: 'Kuala Lumpur', en: 'Kuala Lumpur' },
                'Jakarta': { tr: 'Cakarta', en: 'Jakarta' },
                'Manila': { tr: 'Manila', en: 'Manila' },
                'Ho Chi Minh City': { tr: 'Ho Chi Minh', en: 'Ho Chi Minh City' },
                'Hanoi': { tr: 'Hanoi', en: 'Hanoi' },
                'Sydney': { tr: 'Sidney', en: 'Sydney' },
                'Melbourne': { tr: 'Melbourne', en: 'Melbourne' },
                'Perth': { tr: 'Perth', en: 'Perth' },
                'Brisbane': { tr: 'Brisbane', en: 'Brisbane' },
                'Adelaide': { tr: 'Adelaide', en: 'Adelaide' },
                'London': { tr: 'Londra', en: 'London' },
                'Manchester': { tr: 'Manchester', en: 'Manchester' },
                'Birmingham': { tr: 'Birmingham', en: 'Birmingham' },
                'Liverpool': { tr: 'Liverpool', en: 'Liverpool' },
                'Edinburgh': { tr: 'Edinburgh', en: 'Edinburgh' },
                'Glasgow': { tr: 'Glasgow', en: 'Glasgow' },
                'Paris': { tr: 'Paris', en: 'Paris' },
                'Marseille': { tr: 'Marsilya', en: 'Marseille' },
                'Lyon': { tr: 'Lyon', en: 'Lyon' },
                'Toulouse': { tr: 'Toulouse', en: 'Toulouse' },
                'Nice': { tr: 'Nice', en: 'Nice' },
                'Berlin': { tr: 'Berlin', en: 'Berlin' },
                'Hamburg': { tr: 'Hamburg', en: 'Hamburg' },
                'Munich': { tr: 'Münih', en: 'Munich' },
                'Cologne': { tr: 'Köln', en: 'Cologne' },
                'Frankfurt': { tr: 'Frankfurt', en: 'Frankfurt' },
                'Stuttgart': { tr: 'Stuttgart', en: 'Stuttgart' },
                'Düsseldorf': { tr: 'Düsseldorf', en: 'Düsseldorf' },
                'Rome': { tr: 'Roma', en: 'Rome' },
                'Milan': { tr: 'Milano', en: 'Milan' },
                'Naples': { tr: 'Napoli', en: 'Naples' },
                'Turin': { tr: 'Torino', en: 'Turin' },
                'Florence': { tr: 'Floransa', en: 'Florence' },
                'Venice': { tr: 'Venedik', en: 'Venice' },
                'Madrid': { tr: 'Madrid', en: 'Madrid' },
                'Barcelona': { tr: 'Barselona', en: 'Barcelona' },
                'Valencia': { tr: 'Valensiya', en: 'Valencia' },
                'Seville': { tr: 'Sevilla', en: 'Seville' },
                'Bilbao': { tr: 'Bilbao', en: 'Bilbao' },
                'Lisbon': { tr: 'Lizbon', en: 'Lisbon' },
                'Porto': { tr: 'Porto', en: 'Porto' },
                'Amsterdam': { tr: 'Amsterdam', en: 'Amsterdam' },
                'Rotterdam': { tr: 'Rotterdam', en: 'Rotterdam' },
                'The Hague': { tr: 'Lahey', en: 'The Hague' },
                'Brussels': { tr: 'Brüksel', en: 'Brussels' },
                'Antwerp': { tr: 'Anvers', en: 'Antwerp' },
                'Vienna': { tr: 'Viyana', en: 'Vienna' },
                'Zurich': { tr: 'Zürih', en: 'Zurich' },
                'Geneva': { tr: 'Cenevre', en: 'Geneva' },
                'Stockholm': { tr: 'Stokholm', en: 'Stockholm' },
                'Gothenburg': { tr: 'Göteborg', en: 'Gothenburg' },
                'Oslo': { tr: 'Oslo', en: 'Oslo' },
                'Copenhagen': { tr: 'Kopenhag', en: 'Copenhagen' },
                'Helsinki': { tr: 'Helsinki', en: 'Helsinki' },
                'Warsaw': { tr: 'Varşova', en: 'Warsaw' },
                'Krakow': { tr: 'Kraków', en: 'Krakow' },
                'Prague': { tr: 'Prag', en: 'Prague' },
                'Budapest': { tr: 'Budapeşte', en: 'Budapest' },
                'Bucharest': { tr: 'Bükreş', en: 'Bucharest' },
                'Sofia': { tr: 'Sofya', en: 'Sofia' },
                'Athens': { tr: 'Atina', en: 'Athens' },
                'Thessaloniki': { tr: 'Selanik', en: 'Thessaloniki' },
                'New York': { tr: 'New York', en: 'New York' },
                'Los Angeles': { tr: 'Los Angeles', en: 'Los Angeles' },
                'Chicago': { tr: 'Chicago', en: 'Chicago' },
                'Houston': { tr: 'Houston', en: 'Houston' },
                'Phoenix': { tr: 'Phoenix', en: 'Phoenix' },
                'Philadelphia': { tr: 'Philadelphia', en: 'Philadelphia' },
                'San Antonio': { tr: 'San Antonio', en: 'San Antonio' },
                'San Diego': { tr: 'San Diego', en: 'San Diego' },
                'Dallas': { tr: 'Dallas', en: 'Dallas' },
                'San Francisco': { tr: 'San Francisco', en: 'San Francisco' },
                'Washington': { tr: 'Washington', en: 'Washington' },
                'Boston': { tr: 'Boston', en: 'Boston' },
                'Las Vegas': { tr: 'Las Vegas', en: 'Las Vegas' },
                'Miami': { tr: 'Miami', en: 'Miami' },
                'Seattle': { tr: 'Seattle', en: 'Seattle' },
                'Toronto': { tr: 'Toronto', en: 'Toronto' },
                'Vancouver': { tr: 'Vancouver', en: 'Vancouver' },
                'Montreal': { tr: 'Montreal', en: 'Montreal' },
                'Ottawa': { tr: 'Ottawa', en: 'Ottawa' },
                'Calgary': { tr: 'Calgary', en: 'Calgary' },
                'São Paulo': { tr: 'São Paulo', en: 'São Paulo' },
                'Rio de Janeiro': { tr: 'Rio de Janeiro', en: 'Rio de Janeiro' },
                'Brasília': { tr: 'Brasília', en: 'Brasília' },
                'Salvador': { tr: 'Salvador', en: 'Salvador' },
                'Mexico City': { tr: 'Mexico City', en: 'Mexico City' },
                'Guadalajara': { tr: 'Guadalajara', en: 'Guadalajara' },
                'Buenos Aires': { tr: 'Buenos Aires', en: 'Buenos Aires' },
                'Lima': { tr: 'Lima', en: 'Lima' },
                'Bogotá': { tr: 'Bogota', en: 'Bogotá' },
                'Santiago': { tr: 'Santiago', en: 'Santiago' },
                'Caracas': { tr: 'Karakas', en: 'Caracas' },
                'Cairo': { tr: 'Kahire', en: 'Cairo' },
                'Alexandria': { tr: 'İskenderiye', en: 'Alexandria' },
                'Casablanca': { tr: 'Kazablanka', en: 'Casablanca' },
                'Lagos': { tr: 'Lagos', en: 'Lagos' },
                'Nairobi': { tr: 'Nairobi', en: 'Nairobi' },
                'Cape Town': { tr: 'Cape Town', en: 'Cape Town' },
                'Johannesburg': { tr: 'Johannesburg', en: 'Johannesburg' },
                'Tehran': { tr: 'Tahran', en: 'Tehran' },
                'Istanbul': { tr: 'İstanbul', en: 'Istanbul' },
                'Ankara': { tr: 'Ankara', en: 'Ankara' },
                'Izmir': { tr: 'İzmir', en: 'Izmir' },
                'Bursa': { tr: 'Bursa', en: 'Bursa' },
                'Adana': { tr: 'Adana', en: 'Adana' },
                'Gaziantep': { tr: 'Gaziantep', en: 'Gaziantep' },
                'Konya': { tr: 'Konya', en: 'Konya' },
                'Antalya': { tr: 'Antalya', en: 'Antalya' }
            },
            ui: {
                population: { tr: 'Nüfus', en: 'Population' },
                cities: { tr: 'Şehirler', en: 'Cities' },
                nationalCapital: { tr: 'Başkent', en: 'National Capital' },
                stateCapital: { tr: 'Eyalet/İl Merkezi', en: 'State/Province Capital' },
                majorCity: { tr: 'Büyük Şehir', en: 'Major City' },
                city: { tr: 'Şehir', en: 'City' },
                unknown: { tr: 'Bilinmiyor', en: 'Unknown' },
                notAvailable: { tr: 'Mevcut değil', en: 'Not available' }
            }
        };
    }

    init() {
        // Diğer özellikler
        this.countryIndex = new Map(); // ISO2 -> City[]
        this.userLocation = null;
        this.isAutoRotating = false;
        this.selectedCountry = null;
        this.currentCountryISO = null;
        this.hoverTimeout = null;
        this.povChangeTimeout = null;
        this.clickTimeout = null; // Click debounce için
        this.searchTimeout = null; // Arama debounce için
        this.currentPoints = []; // Mevcut points'leri takip et
        this.userLocationPoint = null; // Kullanıcı konumu
        this.currentHoveredPoint = null; // Hover takibi için
        
        this.setupApp();
    }
    
    async setupApp() {
        try {
            // DOM elementlerini önce bağla
            this.bindElements();
            
            // i18n sistemini başlat
            if (window.i18n) {
                await window.i18n.initialize();
                this.currentLanguage = window.i18n.getLang();
            }
            
            // Şimdi log kullanabiliriz
            this.log('🌍 Globe.gl 3D Dünya başlatılıyor...', 'info');
            
            // Globe'u oluştur
            this.createGlobe();
            
            // Event listener'ları kur
            this.setupEventListeners();
            
            // *** LOADING'İ HEMEN GİZLE - GLOBE HAZIR ***
            this.hideLoading();
            const globeReadyMsg = window.i18n ? window.i18n.t('msg.globe.ready', 'Globe ready - loading hidden!') : 'Globe ready - loading hidden!';
            this.log(`✅ ${globeReadyMsg}`, 'success');
            
            // Arka planda veri yükle (loading gizli olduğu için kullanıcı dünyayı görüyor)
            await this.loadData();
            
            // Globe'u yapılandır (ülke sınırları vs)
            this.configureGlobe();
            

            
            // Kullanıcı konumunu al (opsiyonel)
            this.requestUserLocation();
            
            // Otomatik veri güncelleme sistemini başlat
            this.startAutoUpdate();
            
            const worldReadyMsg = window.i18n ? window.i18n.t('msg.world.ready', '3D World ready! Use mouse to rotate, wheel to zoom') : '3D World ready! Use mouse to rotate, wheel to zoom';
            this.log(`✅ ${worldReadyMsg}`, 'success');
            
            // Global app referansını ayarla (Turkey provinces sistemi için)
            window.app = this;
            console.log('🔗 Global app reference set for province systems');
            
            // Initialize search system
            this.initializeSearchSystem();
            
            // Güvenli mouse position tracking for hover cards
            document.addEventListener('mousemove', (event) => {
                if (event && event.clientX !== undefined && event.clientY !== undefined) {
                    // Sadece geçerli pozisyonları kaydet
                    if (event.clientX > 0 || event.clientY > 0) {
                        this.mouseX = event.clientX;
                        this.mouseY = event.clientY;
                    }
                }
            });
            
            // Initial coordinate display
            this.updateCoordinates();
            
        } catch (error) {
            const startupErrorMsg = window.i18n ? window.i18n.t('msg.startup.error', 'Startup error') : 'Startup error';
            this.log(`❌ ${startupErrorMsg}: ${error.message}`, 'error');
            this.hideLoading();
        }
    }
    
    bindElements() {
        this.elements = {
            globeViz: document.getElementById('globeViz'),
            status: document.getElementById('status'),
            coordinates: document.getElementById('coordinates'),
            searchInput: document.getElementById('citySearch'),
            searchInputLeft: document.getElementById('citySearchLeft'),
            clearBtn: document.getElementById('clearSearch'),
            searchResults: document.getElementById('searchResults'),
            searchResultsLeft: document.getElementById('searchResultsLeft'),
            locationBtn: document.getElementById('locationBtn'),
            locationBtnLeft: document.getElementById('locationBtnLeft'),
            loading: document.getElementById('loadingIndicator'),
            // Country panel
            countryPanel: document.getElementById('countryPanel'),
            countryPanelTitle: document.getElementById('countryPanelTitle'),
            closeCountryPanel: document.getElementById('closeCountryPanel'),
            countryMeta: document.getElementById('countryMeta'),
            toggleCountryPoints: document.getElementById('toggleCountryPoints'),
            countryCityList: document.getElementById('countryCityList'),
            // Language selector - i18n tarafından yönetilir
            languageSelect: document.getElementById('langSelect'),
            loadingText: document.getElementById('loadingText'),
            // Auth buttons
            loginBtn: document.querySelector('.auth-btn.login'),
            signupBtn: document.querySelector('.auth-btn.signup')
        };
        
        // Auth button event handlers
        this.setupAuthButtons();
    }

    // Auth Buttons Setup
    setupAuthButtons() {
        if (this.elements.loginBtn) {
            this.elements.loginBtn.addEventListener('click', () => {
                this.handleLogin();
            });
        }
        
        if (this.elements.signupBtn) {
            this.elements.signupBtn.addEventListener('click', () => {
                this.handleSignup();
            });
        }
        
        console.log('✅ Auth buttons setup complete');
    }

    handleLogin() {
        console.log('🔐 Login button clicked');
        this.showLoginModal();
    }

    handleSignup() {
        console.log('📝 Signup button clicked');
        this.showSignupModal();
    }

    showLoginModal() {
        // Remove existing modal if any
        this.removeModal();
        
        const modalHTML = `
            <div class="auth-modal-overlay" id="authModalOverlay">
                <div class="auth-modal">
                    <div class="auth-modal-header">
                        <h2 data-i18n="auth.login.title"> Log In</h2>
                        <button class="close-modal" onclick="globeExplorer.removeModal()">×</button>
                    </div>
                    <form id="loginModalForm" class="auth-form">
                        <div class="form-group">
                            <label for="loginEmail" data-i18n="auth.email">Email:</label>
                            <input type="email" id="loginEmail" data-i18n-placeholder="auth.enter.email" placeholder="Enter your email" required>
                        </div>
                        <div class="form-group">
                            <label for="loginPassword" data-i18n="auth.password">Password:</label>
                            <input type="password" id="loginPassword" data-i18n-placeholder="auth.enter.password" placeholder="Enter your password" required>
                        </div>
                        <button type="submit" class="auth-submit-btn" data-i18n="auth.submit.login">Log In</button>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Apply translations to the modal
        if (window.i18n) {
            window.i18n.applyTranslations();
        }
        
        // Add login form handler
        document.getElementById('loginModalForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            console.log('Login attempt:', { email, password });
            alert(`Login attempt:\nEmail: ${email}\n\nLogin functionality will be implemented here!`);
            
            // You can add actual login logic here
            // this.removeModal(); // Close modal after successful login
        });
    }

    showSignupModal() {
        // Remove existing modal if any
        this.removeModal();
        
        const modalHTML = `
            <div class="auth-modal-overlay" id="authModalOverlay">
                <div class="auth-modal">
                    <div class="auth-modal-header">
                        <h2 data-i18n="auth.signup.title"> Sign Up</h2>
                        <button class="close-modal" onclick="globeExplorer.removeModal()">×</button>
                    </div>
                    <form id="signupModalForm" class="auth-form">
                        <div class="form-group">
                            <label for="signupName" data-i18n="auth.fullname">Full Name:</label>
                            <input type="text" id="signupName" data-i18n-placeholder="auth.enter.fullname" placeholder="Enter your full name" required>
                        </div>
                        <div class="form-group">
                            <label for="signupEmail" data-i18n="auth.email">Email:</label>
                            <input type="email" id="signupEmail" data-i18n-placeholder="auth.enter.email" placeholder="Enter your email" required>
                        </div>
                        <div class="form-group">
                            <label for="signupPassword" data-i18n="auth.password">Password:</label>
                            <input type="password" id="signupPassword" data-i18n-placeholder="auth.create.password" placeholder="Create a password" required>
                        </div>
                        <div class="form-group">
                            <label for="signupConfirmPassword" data-i18n="auth.confirm.password">Confirm Password:</label>
                            <input type="password" id="signupConfirmPassword" data-i18n-placeholder="auth.confirm.password.placeholder" placeholder="Confirm your password" required>
                        </div>
                        <div class="form-group" id="verificationGroup" style="display: none;">
                            <label for="verificationCode" data-i18n="auth.verification.code">Email Verification Code:</label>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <input type="text" id="verificationCode" data-i18n-placeholder="auth.verification.placeholder" placeholder="Enter 6-digit code" maxlength="6">
                                <button type="button" id="sendCodeBtn" class="send-code-btn" data-i18n="auth.send.code">Send Code</button>
                            </div>
                            <small style="color: rgba(255,255,255,0.7); margin-top: 5px; display: block;" data-i18n="auth.verification.info">We'll send a verification code to your email</small>
                        </div>
                        <button type="submit" class="auth-submit-btn" id="signupSubmitBtn" data-i18n="auth.send.verification">Send Verification Code</button>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Apply translations to the modal
        if (window.i18n) {
            window.i18n.applyTranslations();
        }
        
        // Add signup form logic
        this.setupSignupModal();
    }

    setupSignupModal() {
        let verificationSent = false;
        let generatedCode = '';

        document.getElementById('signupModalForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const fullName = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('signupConfirmPassword').value;
            const verificationCode = document.getElementById('verificationCode').value;
            
            if (password !== confirmPassword) {
                alert(window.i18n ? window.i18n.t('auth.passwords.not.match') : 'Passwords do not match!');
                return;
            }
            
            if (!verificationSent) {
                // Send verification code
                if (fullName && email && password && confirmPassword) {
                    generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
                    console.log('Generated code:', generatedCode);
                    
                    document.getElementById('verificationGroup').style.display = 'block';
                    const submitBtn = document.getElementById('signupSubmitBtn');
                    submitBtn.textContent = window.i18n ? window.i18n.t('auth.complete.signup') : 'Complete Sign Up';
                    verificationSent = true;
                    
                    const sentMsg = window.i18n ? window.i18n.t('auth.verification.sent') : 'Verification code sent to';
                    const noteMsg = window.i18n ? window.i18n.t('auth.verification.production.note') : '(In production, this would be sent via email)';
                    alert(`📧 ${sentMsg} ${email}\n\n🔢 Code: ${generatedCode}\n\n${noteMsg}`);
                } else {
                    alert(window.i18n ? window.i18n.t('auth.fill.all.fields') : 'Please fill in all fields!');
                }
            } else {
                // Verify code and complete signup
                if (verificationCode === generatedCode) {
                    alert(`✅ Account created successfully!\n\nName: ${fullName}\nEmail: ${email}\n\nWelcome to Global City Explorer!`);
                    this.removeModal();
                } else {
                    alert('❌ Invalid verification code!');
                }
            }
        });

        // Send code button
        document.getElementById('sendCodeBtn').addEventListener('click', () => {
            const email = document.getElementById('signupEmail').value;
            if (email) {
                generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
                alert(`📧 Code sent to ${email}: ${generatedCode}`);
            } else {
                alert('Please enter your email first!');
            }
        });
    }

    removeModal() {
        const modal = document.getElementById('authModalOverlay');
        if (modal) {
            modal.remove();
        }
    }

    // Dil sistemi fonksiyonları
    setupLanguageSelector() {
        // Dil seçici artık i18n-core.js tarafından yönetilir
        console.log('✅ Language selector handled by i18n-core.js');
    }

    changeLanguage(language) {
        this.currentLanguage = language;
        console.log(`🌐 Globe language changed to: ${language}`);
        
        // Globe polygon label'larını yeniden ayarla
        if (this.globe && this.globe.polygonsData().length > 0) {
            this.refreshGlobeLabels();
        }
        
        // Point labels'ı yenile (user location ve diğer noktalar için)
        if (this.globe) {
            this.refreshPointLabels();
        }
        
        // Açık olan ülke sayfası varsa yenile
        if (this.currentCountryISO) {
            this.refreshCurrentCountryPage();
        }
        
        // Arama sonuçlarını yenile
        if (this.elements.searchResults && this.elements.searchResults.children.length > 0) {
            this.refreshSearchResults();
        }
        
        // Location button tooltip'ini yenile (dil değiştiğinde)
        if (this.userLocationPoint) {
            this.updateLocationButtonTooltip(
                this.userLocationPoint.city, 
                this.userLocationPoint.country
            );
        }
    }

    // Globe ülke etiketlerini yenile
    refreshGlobeLabels() {
        if (!this.globe || !this.globe.polygonsData().length) {
            console.log('⚠️ No globe or polygons to refresh');
            return;
        }

        console.log('🔄 Refreshing globe country labels...');
        
        // Polygon label fonksiyonunu yeniden ayarla
        this.globe.polygonLabel(({ properties: d }) => {
            const countryName = d.ADMIN || d.NAME || 'Unknown';
            const translatedName = this.getCountryNameInCurrentLanguage(countryName);
            
            return `<div style="
                background: rgba(0, 0, 0, 0.85);
                color: white;
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                backdrop-filter: blur(8px);
                border: 1px solid rgba(255,255,255,0.2);
                text-align: center;
                white-space: nowrap;
                max-width: 200px;
            ">${translatedName}</div>`;
        });
        
        console.log('✅ Globe labels refreshed');
    }

    // Point labels'ı yenile (user location, cities için)
    refreshPointLabels() {
        if (!this.globe) {
            console.log('⚠️ No globe to refresh point labels');
            return;
        }

        console.log('🔄 Refreshing point labels with current language...');
        
        // Point label fonksiyonunu yeniden ayarla
        this.globe.pointLabel(d => {
            // Tooltip sistemi with i18n support
            const name = d.name || d.city || '';
            const originalCountry = d.country || '';
            
            // Get localized country name
            const localizedCountry = originalCountry ? this.getCountryNameInCurrentLanguage(originalCountry) : '';
            
            const label = localizedCountry && localizedCountry !== name ? `${name}, ${localizedCountry}` : name;
            
            return `<div style="
                background: rgba(0, 0, 0, 0.85);
                color: white;
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                backdrop-filter: blur(8px);
                border: 1px solid rgba(255,255,255,0.2);
                text-align: center;
                white-space: nowrap;
                max-width: 200px;
            ">${label}</div>`;
        });
        
        console.log('✅ Point labels refreshed');
    }

    // Ülke adını çevir
    async getTranslatedCountryName(countryName) {
        if (this.currentLanguage === 'en') {
            return countryName;
        }

        // Cache kontrolü
        const cacheKey = `${countryName}_${this.currentLanguage}`;
        if (this.countryTranslationCache.has(cacheKey)) {
            return this.countryTranslationCache.get(cacheKey);
        }

        // Önce manuel çeviriler sözlüğünden kontrol et
        const manualTranslation = this.getCountryNameInCurrentLanguage(countryName);
        if (manualTranslation !== countryName) {
            this.countryTranslationCache.set(cacheKey, manualTranslation);
            return manualTranslation;
        }

        // API üzerinden çevir
        try {
            const translatedName = await window.translator.translate(countryName, 'en', this.currentLanguage);
            this.countryTranslationCache.set(cacheKey, translatedName);
            return translatedName;
        } catch (error) {
            console.warn(`⚠️ Failed to translate country name "${countryName}":`, error);
            return countryName;
        }
    }

    getTranslation(key, subkey = null) {
        try {
            if (subkey) {
                return this.translations[key]?.[subkey]?.[this.currentLanguage] || 
                       this.translations[key]?.[subkey]?.['en'] || subkey;
            } else {
                return this.translations[key]?.[this.currentLanguage] || 
                       this.translations[key]?.['en'] || key;
            }
        } catch (error) {
            return subkey || key;
        }
    }

    getCountryNameInCurrentLanguage(countryName) {
        return this.translations.countries[countryName]?.[this.currentLanguage] || 
               this.translations.countries[countryName]?.['en'] || 
               countryName;
    }

    getCityNameInCurrentLanguage(cityName) {
        return this.translations.cities[cityName]?.[this.currentLanguage] || 
               this.translations.cities[cityName]?.['en'] || 
               cityName;
    }

    refreshCurrentCountryPage() {
        // Şu anki açık ülke sayfasını yenile
        if (this.currentCountryISO) {
            console.log('🔄 Refreshing current country page for:', this.currentCountryISO);
            
            // Mevcut ülke bilgilerini al ve sayfayı yeniden oluştur
            // Bu durumda basit bir reload yapalım
            if (window.opener) {
                // Eğer popup pencere ise yeniden yükle
                window.location.reload();
            }
        }
    }

    refreshPolygonLabels() {
        // Polygon label'larını dil değişikliği için yenile
        if (!this.globe || !this.globe.polygonsData().length) return;
        
        this.globe.polygonLabel(({ properties: d }) => {
            const countryName = d.ADMIN || d.NAME || 'Unknown';
            const localizedName = this.getCountryNameInCurrentLanguage(countryName);
            
            return `<div style="
                background: rgba(0, 0, 0, 0.85);
                color: white;
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0,  ,0,0.4);
                backdrop-filter: blur(8px);
                border: 1px solid rgba(255,255,255,0.2);
                text-align: center;
                white-space: nowrap;
                max-width: 200px;
            ">${localizedName}</div>`;
        });
    }

    // Arama sonuçlarını yenile
    refreshSearchResults() {
        // Eğer aktif arama sonuçları varsa yeniden oluştur
        const searchInput = this.elements.searchInput;
        if (searchInput && searchInput.value.trim()) {
            // Mevcut aramayı yenile
            this.handleSearch({ target: { value: searchInput.value } });
        }
    }

    // Globe'u güncelle (sadece istediğimiz noktalar) - Açıklama tekrarı silindi

    // MERKEZI POINTS YÖNETİM SİSTEMİ
    updateGlobePoints(newPoints = []) {
        // Hava kirliliği modu aktifse sadece kullanıcı konumunu yönet
        if (this.airPollutionMode) {
            console.log('⚠️ Air pollution mode active - using updateUserLocationDisplay()');
            this.updateUserLocationDisplay();
            return;
        }
        
        // ÖNCE TAMAMEN TEMİZLE (istenmeyen maviler için)
        this.globe.pointsData([]);
        
        // Mevcut points'leri güncelle
        this.currentPoints = [];
        
        // Kullanıcı konumu varsa ekle
        if (this.userLocationPoint) {
            this.currentPoints.push(this.userLocationPoint);
        }
        
        // Yeni points'leri ekle
        if (newPoints && newPoints.length > 0) {
            this.currentPoints.push(...newPoints);
        }
        
        // Globe'u güncelle - data ve point özelliklerini yeniden ayarla
        this.globe.pointsData(this.currentPoints)
            .pointColor(d => {
                // Kullanıcı konumu için mavi, diğerleri için kırmızı veya özel renk
                if (d.isUserLocation) {
                    return '#4fbdff'; // Mavi kullanıcı konumu
                }
                return d.color || '#ff6b6b'; // Diğer noktalar için kırmızı
            })
            .pointAltitude(d => {
                // Sabit yükseklik
                return d.isUserLocation ? 0.015 : 0.010;
            })
            .pointRadius(d => {
                // Kullanıcı konumu daha büyük
                return d.isUserLocation ? 0.6 : (d.size || 0.4);
            })
            .pointLabel(d => {
                if (d.isUserLocation) {
                    const yourLocationText = window.i18n ? window.i18n.t('msg.your.location', 'Your Location') : 'Your Location';
                    return `<div style="background: rgba(0,0,0,0.9); color: white; padding: 8px 12px; border-radius: 6px; font-size: 12px; border: 2px solid #4fbdff;">
                        <div style="font-weight: bold; color: #4fbdff;">📍 ${yourLocationText}</div>
                        <div style="margin-top: 4px;">${d.city}, ${d.country}</div>
                    </div>`;
                }
                return d.label || `<b>${d.name || 'Point'}</b>`;
            });
            
        console.log(`📍 Globe points updated: ${this.currentPoints.length} points`);
    }

    // Kullanıcı konumunu kaydet ve göster
    setUserLocation(lat, lng, name = 'Your Location', country = 'Unknown') {
        // Globe henüz hazır değilse, pending olarak kaydet
        if (!this.globeReady) {
            console.log('⏳ Globe not ready yet, pending user location');
            this.pendingUserLocation = { lat, lng, name, country };
            return;
        }
        
        // Ülke adını çevir (orijinal değeri koruyarak)
        const translatedCountry = this.getCountryNameInCurrentLanguage(country);
        
        this.userLocationPoint = {
            lat: lat,
            lng: lng,
            locationLabel: name,
            city: name,
            country: translatedCountry,
            isUserLocation: true,
            color: '#4fbdff', // Kullanıcı konumu için mavi renk
            size: 0.6,         // Point boyutu
            altitude: 0.015    // Point yüksekliği
        };
        
        console.log('📍 User location set:', { lat, lng, name, originalCountry: country, translatedCountry });
        console.log('📍 userLocationPoint created:', this.userLocationPoint);
        console.log('📍 MAVİ NOKTA KOORDİNATLARI: Lat:', lat, 'Lng:', lng);
        console.log('📍 Air pollution mode:', this.airPollutionMode);
        
        // Location button tooltip'ini güncelle - dil uyumlu
        this.updateLocationButtonTooltip(name, translatedCountry);
        
        // Eğer hava kirliliği modu aktifse points'i yenile
        if (this.airPollutionMode) {
            this.enableAirPollution();
        } else {
            this.updateGlobePoints();
        }
    }

    // Location button tooltip'ini güncelle - dil uyumlu
    updateLocationButtonTooltip(cityName, countryName) {
        if (!this.elements.locationBtn) return;
        
        // Ülke adını dil uyumlu çevir - double check
        let translatedCountry = countryName;
        
        // Eğer countryName İngilizce ülke adı ise tekrar çevir
        if (countryName && typeof countryName === 'string') {
            translatedCountry = this.getCountryNameInCurrentLanguage(countryName);
        }
        
        // Tooltip metni oluştur
        const tooltipText = `${cityName || 'Konum'}, ${translatedCountry || 'Bilinmeyen'}`;
        
        // Title attribute'unu ayarla
        this.elements.locationBtn.title = tooltipText;
        
        console.log('🎯 Location button tooltip güncellendi:', tooltipText);
    }

    // Temporary marker ekle (kullanıcı konumunu koruyarak)
    addTemporaryMarkerSafe(lat, lng, name, country, duration = 3000) {
        const tempMarker = {
            lat: lat,
            lng: lng,
            size: 0.6,
            color: '#ff6b6b',
            altitude: 0.010, // Dengeli yükseklik
            name: name,
            label: `<b>${name}</b><br/>${country}`,
            isTemporary: true
        };
        
        this.updateGlobePoints([tempMarker]);
        
        // Belirtilen süre sonra temporary marker'ı kaldır
        setTimeout(() => {
            this.updateGlobePoints(); // Sadece kullanıcı konumu kalır
        }, duration);
    }

    // Tüm points'leri temizle (kullanıcı konumu hariç)
    clearAllPoints() {
        this.updateGlobePoints(); // Sadece kullanıcı konumu kalır
    }

    // Tüm points'leri tamamen temizle (kullanıcı konumu dahil)
    clearAllPointsCompletely() {
        this.currentPoints = [];
        this.globe.pointsData([]);
        console.log('🧹 All points cleared completely');
    }
    
    createGlobe() {
        // Globe.gl ile Three.js tabanlı küre oluştur
        this.globe = Globe()(this.elements.globeViz)
            .backgroundColor('rgba(0,0,0,0)') // Şeffaf arka plan
            .showGlobe(true)
            .showGraticules(false) // Enlem/boylam çizgileri kapalı
            .showAtmosphere(true) // Atmosfer efekti
            .atmosphereColor('#87cefa') // Açık mavi atmosfer
            .atmosphereAltitude(0.12) // Atmosfer yüksekliği
            // BAŞTAN POINT ÖZELLİKLERİNİ AYARLA
            .pointsData([]) // Boş başla
            .pointColor(d => {
                // Kullanıcı konumu için mavi, diğerleri için kırmızı veya özel renk
                if (d.isUserLocation) {
                    return '#4fbdff'; // Mavi kullanıcı konumu
                }
                return d.color || '#ff6b6b'; // Diğer noktalar için kırmızı
            })
            .pointAltitude(d => {
                // Sabit yükseklik - animasyon yok
                return d.isUserLocation ? 0.012 : 0.010;
            })
            .pointRadius(d => {
                // Basit boyut - animasyon yok  
                let baseSize = d.isUserLocation ? 0.4 : (d.size || 0.3);
                return baseSize;
            })
            .pointLabel(d => {
                // Tooltip sistemi with i18n support
                let label = '';
                
                if (d.isUserLocation) {
                    // Kullanıcı konumu için şehir ismi göster
                    const name = d.city || d.locationLabel || '';
                    const country = d.country || '';
                    
                    if (name && country) {
                        label = `${name}, ${country}`;
                    } else if (name) {
                        label = name;
                    } else {
                        const locationText = window.i18n ? window.i18n.t('label.your.location', 'Your Location') : 'Your Location';
                        label = locationText;
                    }
                } else {
                    // Normal şehir noktaları için
                    const name = d.name || d.city || '';
                    const originalCountry = d.country || '';
                    
                    // Get localized country name
                    const localizedCountry = originalCountry ? this.getCountryNameInCurrentLanguage(originalCountry) : '';
                    
                    label = localizedCountry && localizedCountry !== name ? `${name}, ${localizedCountry}` : name;
                }
                
                return `<div style="
                    background: rgba(0, 0, 0, 0.85);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 500;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255,255,255,0.2);
                    text-align: center;
                    white-space: nowrap;
                    max-width: 150px;
                ">${label}</div>`;
            });
        
        // Dünya tekstürü
        this.globe.globeImageUrl('./dunya.jpg');
        
        // Kamera başlangıç pozisyonu
        this.globe.pointOfView({ 
            lat: 20, 
            lng: 0, 
            altitude: 2.2 
        });
        
        // Kontroller (OrbitControls)
        const controls = this.globe.controls();
        controls.enableDamping = true; // Yumuşak hareket
        controls.dampingFactor = 0.1;
        controls.enableZoom = true;
        controls.enableRotate = true;
        controls.enablePan = false; // Pan devre dışı
        controls.minDistance = 101; // Minimum mesafe (küreye çarpmasın)
        controls.maxDistance = 1000; // Maximum mesafe
        controls.autoRotate = false; // Başlangıçta kapalı
        controls.autoRotateSpeed = 0.5; // Yavaş döndürme
        
        // Kamera hareket ettiğinde nokta boyutlarını güncelle
        controls.addEventListener('change', () => {
            if (this.currentPoints && this.currentPoints.length > 0) {
                // Nokta boyutlarını yeniden hesapla ve güncelle
                this.globe.pointsData([...this.currentPoints]); // Array kopyası ile güncelle
            }
        });
        
        // Globe tamamen hazır olduğunda çalışacak callback
        this.globe.onGlobeReady(() => {
            console.log('🌍 Globe rendering completed - ready for points');
            this.globeReady = true;
            
            // Eğer bekleyen kullanıcı konumu varsa, şimdi ekle
            if (this.pendingUserLocation) {
                console.log('📍 Adding pending user location now');
                this.setUserLocation(
                    this.pendingUserLocation.lat, 
                    this.pendingUserLocation.lng, 
                    this.pendingUserLocation.name,
                    this.pendingUserLocation.country
                );
                this.pendingUserLocation = null;
            }
        });
        
        this.log('🌍 Globe.gl küre oluşturuldu', 'info');
    }
    
    setupEventListeners() {
        // Debug için elementleri kontrol et
        console.log('🔍 Search elements check:', {
            searchInput: !!this.elements.searchInput,
            clearBtn: !!this.elements.clearBtn,
            searchResults: !!this.elements.searchResults
        });
        
        // Search event listeners are handled in initializeSearchSystem() method
        
        if (this.elements.clearBtn) {
            this.elements.clearBtn.addEventListener('click', () => {
                console.log('🔍 Clear button clicked');
                this.clearSearch();
            });
            console.log('✅ Clear button listener added');
        } else {
            console.error('❌ Clear button element not found!');
        }
        
        // Kontrol butonları
        this.elements.locationBtn.addEventListener('click', () => this.goToUserLocation());
        
        // Location buton metnini hemen çevir
        if (window.i18n && this.elements.locationBtn) {
            const locationText = window.i18n.t('btn.location');
            if (locationText && locationText !== 'btn.location') {
                this.elements.locationBtn.textContent = locationText;
            }
        }
        
        // Globe tıklama ve hareket olayları
        this.globe.onGlobeClick((point, event) => this.handleGlobeClick(point, event));
        
        // Point hover olayları
        this.globe.onPointHover((point, prevPoint) => this.handlePointHover(point, prevPoint));
        
        // Polygon events are now handled in configureGlobe() method
        
        // Kamera hareket olayı
        this.globe.controls().addEventListener('change', () => {
            this.updateCoordinates();
            this.debouncedPOVChange();
        });
        
        // Country panel event listeners
        this.elements.closeCountryPanel.addEventListener('click', () => this.closeCountryPanel());
        this.elements.toggleCountryPoints.addEventListener('change', (e) => this.toggleCountryPoints(e.target.checked));
        
        // Location button event listeners (both right and left)
        if (this.elements.locationBtn) {
            this.elements.locationBtn.addEventListener('click', () => this.getUserLocation());
        }
        if (this.elements.locationBtnLeft) {
            this.elements.locationBtnLeft.addEventListener('click', () => this.getUserLocation());
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Mouse leave globe to hide hover card
        this.elements.globeViz.addEventListener('mouseleave', () => this.hideCountryHoverCard());
        
        // Globe mouse move için point detection
        this.elements.globeViz.addEventListener('mousemove', (event) => {
            this.checkPointHover(event);
        });
        
        // Air Pollution Toggle
        const airPollutionToggle = document.getElementById('airPollutionToggle');
        if (airPollutionToggle) {
            airPollutionToggle.addEventListener('click', () => this.toggleAirPollution());
            console.log('✅ Air pollution toggle listener added');
        } else {
            console.error('❌ Air pollution toggle element not found!');
        }

        // Air Quality Scale başlangıçta gizli olsun
        const airQualityScale = document.getElementById('airQualityScale');
        if (airQualityScale) {
            airQualityScale.style.display = 'none';
            console.log('✅ Air quality scale initialized (hidden)');
        }
    }

    // ==================
    // SEARCH SYSTEM
    // ==================
    
    initializeSearchSystem() {
        console.log('🔍 Initializing search system...');
        
        // Get DOM elements (both right and left)
        const citySearch = document.getElementById('citySearch');
        const searchResults = document.getElementById('searchResults');
        const clearSearch = document.getElementById('clearSearch');
        const citySearchLeft = document.getElementById('citySearchLeft');
        const searchResultsLeft = document.getElementById('searchResultsLeft');
        
        if (!citySearchLeft || !searchResultsLeft) {
            console.warn('⚠️ Left search elements not found');
            return;
        }
        
        // Store elements for easy access (prioritize left elements)
        this.searchElements = {
            input: citySearchLeft,
            results: searchResultsLeft,
            clearBtn: clearSearch
        };
        
        // Initialize search with debouncing (for left search)
        let searchTimeout;
        citySearchLeft.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.handleSearch(e.target.value.trim());
            }, 150); // 150ms debounce for faster response
        });
        
        // Arama kutusu odağını kaybettiğinde önerileri gizle
        citySearchLeft.addEventListener('blur', (e) => {
            // Kısa bir gecikme ile gizle ki kullanıcı öneri üzerine tıklayabilsin
            setTimeout(() => {
                if (!e.target.value.trim()) {
                    this.clearSearchResults();
                }
            }, 200);
        });
        
        // Clear search functionality
        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                this.clearSearch();
            });
        }
        
        // Enter key search (for left search)
        citySearchLeft.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const firstResult = searchResultsLeft.querySelector('.search-result-item');
                if (firstResult) {
                    firstResult.click();
                }
            }
        });
        
        // Set initial visibility based on air pollution mode
        this.updateSearchVisibility();
        
        console.log('✅ Basit arama sistemi hazır!');
    }
    
    handleSearch(query) {
        if (!query || query.length < 1) {
            this.clearSearchResults();
            // Arama kutusu boşken önerileri tamamen gizle
            if (this.searchElements && this.searchElements.results) {
                this.searchElements.results.style.display = 'none';
            }
            return;
        }
        
        // Arama yapılırken önerileri göster
        if (this.searchElements && this.searchElements.results) {
            this.searchElements.results.style.display = 'block';
        }
        
        console.log(`🔍 Basit arama: "${query}"`);
        
        // Şehir verilerini al
        let cityData = this.allCities || this.cities || [];
        
        if (!cityData || cityData.length === 0) {
            console.warn('⚠️ Şehir verileri yüklenmedi');
            this.searchElements.results.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #666;">
                    🔄 Şehir verileri yükleniyor...
                </div>
            `;
            return;
        }
        
        // Basit ve hızlı arama - sadece girilen harfle başlayanlar
        const searchResults = this.simpleSearch(query, cityData);
        this.displaySimpleResults(searchResults);
    }
    
    // Basit arama fonksiyonu - sadece başlayan harflerle, max 5 sonuç
    simpleSearch(query, cityData) {
        const searchTerm = query.toLowerCase().trim();
        const results = [];
        
        console.log(`🔍 "${searchTerm}" ile başlayan şehirler aranıyor...`);
        
        for (const city of cityData) {
            if (results.length >= 5) break; // Max 5 sonuç
            
            // Şehir adını al
            const cityName = city.city || city.name || city.cityName || '';
            if (!cityName) continue;
            
            const cityLower = cityName.toLowerCase();
            const stateName = city.admin_name || ''; // Eyalet/bölge adı
            const stateLower = stateName.toLowerCase();
            
            // Şehir adı VEYA eyalet/bölge adı ile eşleşme
            if (cityLower.startsWith(searchTerm) || stateLower.startsWith(searchTerm)) {
                results.push({
                    name: cityName,
                    country: city.country || city.countryName || '',
                    state: city.admin_name || '', // Eyalet bilgisi ekle
                    population: city.population || 0,
                    lat: city.lat || city.latitude,
                    lng: city.lng || city.longitude || city.lon,
                    isCapital: city.capital === 'primary'
                });
            }
        }
        
        // Nüfusa göre sırala (büyükten küçüğe)
        results.sort((a, b) => (b.population || 0) - (a.population || 0));
        
        console.log(`✅ ${results.length} şehir bulundu`);
        return results;
    }
    
    // Basit sonuç gösterimi
    displaySimpleResults(results) {
        const resultsContainer = this.searchElements.results;
        
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #666;">
                    🔍 Şehir bulunamadı
                </div>
            `;
            return;
        }
        
        const html = results.map((city, index) => {
            // Eyalet/bölge bilgisi varsa göster
            let locationInfo = city.country;
            if (city.state && city.state !== city.country) {
                locationInfo = `${city.state}, ${city.country}`;
            }
            
            return `
                <div class="search-result-item" data-index="${index}">
                    <div>
                        <div class="city-name">
                            ${city.isCapital ? '👑 ' : '📍 '}${city.name}
                        </div>
                        <div class="country-name">${locationInfo}</div>
                    </div>
                    <div class="city-population">
                        ${this.formatPopulation(city.population)}
                    </div>
                </div>
            `;
        }).join('');
        
        resultsContainer.innerHTML = html;
        
        // Tıklama olaylarını ekle
        this.addSimpleClickHandlers(results);
    }
    
    // Basit tıklama işleyicileri
    addSimpleClickHandlers(results) {
        const items = this.searchElements.results.querySelectorAll('.search-result-item');
        
        items.forEach((item, index) => {
            item.addEventListener('click', () => {
                const city = results[index];
                console.log(`🎯 Şehre gidiliyor: ${city.name}`);
                
                // Koordinatları kontrol et
                if (!city.lat || !city.lng) {
                    console.warn('⚠️ Koordinat bulunamadı:', city);
                    return;
                }
                
                // Şehre git
                this.goToCity(city);
                
                // Arama temizle
                this.searchElements.input.value = city.name;
                this.clearSearchResults();
            });
            
            // Hover efekti
            item.addEventListener('mouseenter', () => {
                item.style.background = 'rgba(74, 144, 226, 0.1)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.background = '';
            });
        });
    }
    
    // Şehre gitme fonksiyonu - geliştirilmiş
    goToCity(city) {
        if (!this.globe || !city.lat || !city.lng) {
            console.warn('⚠️ Globe veya koordinat mevcut değil');
            return;
        }
        
        const lat = parseFloat(city.lat);
        const lng = parseFloat(city.lng);
        
        console.log(`🚀 ${city.name} şehrine gidiliyor: ${lat}, ${lng}`);
        
        // İşaretleyici zoom ile aynı anda ekle
        this.addCityMarker(lat, lng, city.name, city.country);
        
        // Konumuma Git butonu ile aynı zoom seviyesi ve hız
        this.globe.pointOfView({
            lat: lat,
            lng: lng,
            altitude: 0.5 // Konumuma Git ile aynı zoom seviyesi
        }, 2000); // Konumuma Git ile aynı animasyon süresi
        
        // Animasyon tamamlandıktan sonra başarı mesajı
        setTimeout(() => {
            console.log(`✅ ${city.name} şehrine ulaşıldı!`);
            if (this.log) {
                this.log(`📍 ${city.name}, ${city.country} - Başarıyla ulaşıldı`, 'success');
            }
        }, 2100); // Animasyon tamamlandıktan sonra
    }
    
    // Şehir işaretleyicisi ekleme - mevcut sistem ile uyumlu
    addCityMarker(lat, lng, cityName, countryName) {
        if (!this.globe) return;
        
        console.log(`📍 Küçük şehir işaretleyici ekleniyor: ${cityName}`);
        
        // Şehir işaretleyicisi oluştur
        this.currentCityMarker = {
            lat: lat,
            lng: lng,
            locationLabel: cityName,
            city: cityName,
            country: countryName || '',
            color: '#FF4444', // Kırmızı şehir işaretleyicisi
            size: 0.3, // Çok küçük boyut
            altitude: 0.01, // Alçak yükseklik
            isCityMarker: true
        };
        
        // Globe noktalarını güncelle - mevcut sistem kullan
        this.updateGlobePoints([this.currentCityMarker]);
        
        console.log(`✅ ${cityName} işaretleyici eklendi`);
    }
    
    // Sadece şehir işaretleyicisini temizle, mevcut konum koru
    clearCityMarker() {
        if (this.currentCityMarker) {
            this.currentCityMarker = null;
            // Globe noktalarını güncelle (sadece kullanıcı konumu kalır)
            this.updateGlobePoints();
            console.log('🧹 Şehir işaretleyici temizlendi, mevcut konum korundu');
        }
    }
    
    performAdvancedSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        const results = [];
        
        // Enhanced predictive search with smart filtering
        const searchData = this.currentSearchData || this.allCities || this.cities || [];
        console.log(`🔍 Smart search through ${searchData.length} cities for: "${query}"`);
        
        // Multi-word search support
        const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
        const isMultiWord = searchWords.length > 1;
        
        for (const city of searchData) {
            // Support multiple field names for city data
            const cityField = city.city || city.name || city.cityName || '';
            if (!cityField) continue;
            
            const cityName = cityField.toLowerCase();
            const countryName = (city.country || city.countryName || '').toLowerCase();
            const cityAscii = (city.city_ascii || city.asciiName || cityField).toLowerCase();
            
            let score = 0;
            let hasMatch = false;
            let matchType = '';
            
            if (isMultiWord) {
                // Multi-word search logic
                let wordMatches = 0;
                let wordScore = 0;
                
                for (const word of searchWords) {
                    if (cityName.includes(word) || cityAscii.includes(word)) {
                        wordMatches++;
                        if (cityName.startsWith(word)) wordScore += 100;
                        else if (cityName.includes(word)) wordScore += 50;
                    }
                    if (countryName.includes(word)) {
                        wordMatches++;
                        wordScore += 25;
                    }
                }
                
                if (wordMatches > 0) {
                    score = wordScore * (wordMatches / searchWords.length);
                    hasMatch = true;
                    matchType = 'multi-word';
                }
            } else {
                // Single word search logic with enhanced scoring
                if (cityName === searchTerm) {
                    score += 1000;
                    hasMatch = true;
                    matchType = 'exact';
                }
                else if (cityName.startsWith(searchTerm)) {
                    score += 500;
                    hasMatch = true;
                    matchType = 'starts-with';
                    
                    // Extra bonus for very close matches
                    const lengthDiff = cityName.length - searchTerm.length;
                    if (lengthDiff <= 2) score += 200; // Very close
                    else if (lengthDiff <= 4) score += 100; // Close
                    else if (lengthDiff <= 6) score += 50; // Moderate
                }
                else if (cityAscii.startsWith(searchTerm)) {
                    score += 400;
                    hasMatch = true;
                    matchType = 'ascii-starts';
                }
                else if (cityName.includes(searchTerm)) {
                    score += 200;
                    hasMatch = true;
                    matchType = 'contains';
                    
                    // Bonus for position in name
                    const index = cityName.indexOf(searchTerm);
                    if (index === 1) score += 75; // Second character
                    else if (index === 2) score += 50; // Third character  
                    else if (index <= 4) score += 25; // Early in name
                }
                else if (cityAscii.includes(searchTerm)) {
                    score += 150;
                    hasMatch = true;
                    matchType = 'ascii-contains';
                }
                else if (countryName.startsWith(searchTerm)) {
                    score += 80;
                    hasMatch = true;
                    matchType = 'country-starts';
                }
                else if (countryName.includes(searchTerm)) {
                    score += 40;
                    hasMatch = true;
                    matchType = 'country-contains';
                }
            }
            
            if (hasMatch) {
                // Smart city importance scoring
                let importanceBonus = 0;
                
                // Capital city bonuses
                if (city.capital === 'primary') importanceBonus += 150; // National capitals
                else if (city.capital === 'admin') importanceBonus += 80; // Regional capitals
                else if (city.capital === 'major') importanceBonus += 40; // Major cities
                
                // Population-based importance
                if (city.population) {
                    if (city.population > 10000000) importanceBonus += 100; // Mega cities (10M+)
                    else if (city.population > 5000000) importanceBonus += 80;  // Major metros (5M+)
                    else if (city.population > 2000000) importanceBonus += 60;  // Large cities (2M+)
                    else if (city.population > 1000000) importanceBonus += 40;  // Big cities (1M+)
                    else if (city.population > 500000) importanceBonus += 25;   // Medium cities (500K+)
                    else if (city.population > 100000) importanceBonus += 10;   // Small cities (100K+)
                }
                
                // Famous city bonus (subjective but useful)
                const famousCities = ['london', 'paris', 'tokyo', 'new york', 'berlin', 'moscow', 'rome', 'istanbul', 'beijing', 'shanghai', 'los angeles', 'chicago', 'sydney', 'mumbai', 'delhi', 'singapore', 'dubai', 'hong kong'];
                if (famousCities.includes(cityName)) {
                    importanceBonus += 50;
                }
                
                const finalScore = score + importanceBonus;
                
                results.push({
                    ...city,
                    searchScore: finalScore,
                    matchType: matchType,
                    importanceBonus: importanceBonus
                });
            }
        }
        
        // Enhanced sorting with multiple criteria
        results.sort((a, b) => {
            // Primary: Search score
            if (b.searchScore !== a.searchScore) {
                return b.searchScore - a.searchScore;
            }
            
            // Secondary: Population (for same scores)
            if ((b.population || 0) !== (a.population || 0)) {
                return (b.population || 0) - (a.population || 0);
            }
            
            // Tertiary: Capital status
            const aCapitalPriority = a.capital === 'primary' ? 3 : a.capital === 'admin' ? 2 : a.capital === 'major' ? 1 : 0;
            const bCapitalPriority = b.capital === 'primary' ? 3 : b.capital === 'admin' ? 2 : b.capital === 'major' ? 1 : 0;
            
            return bCapitalPriority - aCapitalPriority;
        });
        
        // Return top 5 most relevant results
        const topResults = results.slice(0, 5);
        console.log(`🎯 Found ${results.length} matches, showing top ${topResults.length}`);
        
        return topResults;
    }
    
    displaySearchResults(results, query) {
        const { results: resultsContainer } = this.searchElements;
        
        if (results.length === 0) {
            const noResultsMsg = window.i18n ? window.i18n.t('search.no-results', 'No cities found') : 'No cities found';
            resultsContainer.innerHTML = `
                <div style="padding: 20px; text-align: center; color: rgba(255,255,255,0.6);">
                    <i>${noResultsMsg} "${query}"</i>
                </div>
            `;
            return;
        }
        
        const html = results.map(city => {
            const cityField = city.city || city.name || city.cityName || 'Unknown';
            const cityName = this.highlightSearchTerm(cityField, query);
            const countryName = city.country || city.countryName || 'Unknown';
            
            // Simple population formatting
            let population = 'Unknown';
            if (city.population) {
                if (city.population >= 1000000) {
                    population = `${(city.population / 1000000).toFixed(1)}M`;
                } else if (city.population >= 1000) {
                    population = `${(city.population / 1000).toFixed(0)}K`;
                } else {
                    population = city.population.toString();
                }
            }
            
            const capitalIcon = city.capital === 'primary' ? '⭐' : 
                               city.capital === 'admin' ? '🏛️' : 
                               city.capital === 'major' ? '🏙️' : '';
            
            return `
                <div class="search-result-item" 
                     data-lat="${city.lat || city.latitude}" 
                     data-lng="${city.lng || city.longitude}"
                     data-city="${cityField}"
                     data-country="${countryName}">
                    <div>
                        <div class="city-name">${capitalIcon} ${cityName}</div>
                        <div class="country-name">${countryName}</div>
                    </div>
                    <div class="city-population">${population}</div>
                </div>
            `;
        }).join('');
        
        resultsContainer.innerHTML = html;
        
        // Add click listeners to results
        this.addSearchResultListeners();
    }
    
    highlightSearchTerm(text, query) {
        if (!query) return text;
        
        const terms = query.toLowerCase().split(/\s+/);
        let result = text;
        
        for (const term of terms) {
            const regex = new RegExp(`(${term})`, 'gi');
            result = result.replace(regex, '<mark style="background: rgba(30,144,255,0.4); color: white;">$1</mark>');
        }
        
        return result;
    }
    
    addSearchResultListeners() {
        const resultItems = document.querySelectorAll('.search-result-item');
        
        resultItems.forEach(item => {
            item.addEventListener('click', () => {
                const lat = parseFloat(item.dataset.lat);
                const lng = parseFloat(item.dataset.lng);
                const city = item.dataset.city;
                const country = item.dataset.country;
                
                console.log(`🎯 Flying to: ${city}, ${country} (${lat}, ${lng})`);
                this.flyToCity(lat, lng, city, country);
                this.clearSearch();
            });
        });
    }
    
    flyToCity(lat, lng, cityName, countryName) {
        if (!this.globe) {
            console.warn('⚠️ Globe not initialized');
            return;
        }
        
        console.log(`🚀 Enhanced city navigation to: ${cityName}, ${countryName} (${lat}, ${lng})`);
        
        // Smart altitude calculation based on city importance
        let targetAltitude = 1.2; // Default zoom level
        
        // Check if it's a major city or capital for closer zoom
        const lowerCityName = cityName.toLowerCase();
        const megaCities = ['tokyo', 'new york', 'london', 'paris', 'beijing', 'shanghai', 'mumbai', 'delhi', 'istanbul', 'moscow', 'los angeles', 'chicago', 'singapore', 'dubai', 'hong kong', 'berlin', 'rome', 'sydney', 'toronto', 'bangkok'];
        
        if (megaCities.includes(lowerCityName)) {
            targetAltitude = 0.8; // Much closer for mega cities
        } else if (lowerCityName.includes('capital') || cityName.includes('★') || cityName.includes('⭐')) {
            targetAltitude = 1.0; // Closer for capitals
        }
        
        // Smooth animation with enhanced parameters
        this.globe.pointOfView({
            lat: lat,
            lng: lng,
            altitude: targetAltitude
        }, 2500); // Slightly slower for smoother experience
        
        // Enhanced status messaging with visual feedback
        if (this.log) {
            const flyingMsg = window.i18n ? 
                window.i18n.t('search.flying.to', `🚀 Şehre uçuş: ${cityName}`) : 
                `🚀 Şehre uçuş: ${cityName}`;
            this.log(`${flyingMsg}, ${countryName}`, 'info');
        }
        
        // Show temporary visual indicator
        this.showTemporaryCityMarker(lat, lng, cityName);
        
        // Arrival notification with enhanced feedback
        setTimeout(() => {
            const arrivedMsg = window.i18n ? 
                window.i18n.t('search.arrived.at', `📍 Varış noktası: ${cityName}`) : 
                `📍 Varış noktası: ${cityName}`;
            
            if (this.log) {
                this.log(`${arrivedMsg}, ${countryName} 🎯`, 'success');
            }
            
            console.log(`🎯 Successfully navigated to: ${cityName}, ${countryName}`);
        }, 2500);
    }
    
    // New method to show temporary city marker
    showTemporaryCityMarker(lat, lng, cityName) {
        if (!this.globe) return;
        
        // Create a temporary marker data
        const tempMarker = [{
            lat: lat,
            lng: lng,
            name: cityName,
            isTemporary: true
        }];
        
        // Add temporary point marker
        this.globe.pointsData(tempMarker)
            .pointColor(() => '#ff4444')
            .pointAltitude(0.02)
            .pointRadius(0.8)
            .pointLabel(d => `
                <div style="
                    background: linear-gradient(135deg, #ff4444, #ff6b6b);
                    color: white;
                    padding: 10px 15px;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 600;
                    box-shadow: 0 6px 20px rgba(255,68,68,0.4);
                    border: 2px solid rgba(255,255,255,0.3);
                    text-align: center;
                    animation: pulse 2s infinite;
                ">
                    📍 ${this.escapeHtml(d.name)}
                    <div style="font-size: 12px; margin-top: 4px; opacity: 0.9;">Şehir konumu</div>
                </div>
            `);
        
        // Remove temporary marker after 4 seconds
        setTimeout(() => {
            if (this.globe) {
                this.globe.pointsData([]);
            }
        }, 4000);
    }
    
    // Enhanced navigation method for search results
    navigateToCity(city) {
        if (!city || !this.globe) {
            console.warn('⚠️ Cannot navigate: missing city data or globe not initialized');
            return;
        }
        
        // Extract coordinates - support multiple field names
        const lat = city.lat || city.latitude || city.Latitude;
        const lng = city.lng || city.longitude || city.Longitude || city.lon;
        const cityName = city.city || city.name || city.cityName || 'Unknown City';
        const countryName = city.country || city.countryName || '';
        
        if (!lat || !lng) {
            console.warn('⚠️ Cannot navigate: missing coordinates for', cityName);
            if (this.log) {
                this.log(`❌ ${cityName} için koordinat bulunamadı`, 'error');
            }
            return;
        }
        
        console.log(`🧭 Navigating to: ${cityName}, ${countryName} (${lat}, ${lng})`);
        
        // Use the enhanced flyToCity method
        this.flyToCity(parseFloat(lat), parseFloat(lng), cityName, countryName);
    }
    
    clearSearch() {
        if (!this.searchElements) return;
        
        const { input, results } = this.searchElements;
        if (input) input.value = '';
        this.clearSearchResults();
        if (input) input.focus();
    }
    
    clearSearchResults() {
        if (this.searchElements && this.searchElements.results) {
            this.searchElements.results.innerHTML = '';
            // Önerileri tamamen gizle
            this.searchElements.results.style.display = 'none';
        }
    }
    
    clearSearch() {
        if (this.searchElements) {
            if (this.searchElements.input) this.searchElements.input.value = '';
            this.clearSearchResults();
            this.clearCityMarker(); // İşaretleyiciyi de temizle
            if (this.searchElements.input) this.searchElements.input.focus();
            
            if (this.log) {
                this.log('🧹 Arama ve işaretleyici temizlendi', 'info');
            }
        }
    }
    
    updateSearchVisibility() {
        const searchContainer = document.querySelector('.search-container');
        const searchResults = document.getElementById('searchResults');
        const searchContainerLeft = document.querySelector('.search-container-left');
        const searchResultsLeft = document.getElementById('searchResultsLeft');
        
        if (this.airPollutionMode) {
            // Air pollution active - hide search
            if (searchContainer) searchContainer.classList.add('hidden');
            if (searchResults) searchResults.classList.add('hidden');
            if (searchContainerLeft) searchContainerLeft.classList.add('hidden');
            if (searchResultsLeft) searchResultsLeft.classList.add('hidden');
            this.clearSearch();
            console.log('🔍 Search hidden (air pollution active)');
        } else {
            // Air pollution off - show search
            if (searchContainer) searchContainer.classList.remove('hidden');
            if (searchResults) searchResults.classList.remove('hidden');
            if (searchContainerLeft) searchContainerLeft.classList.remove('hidden');
            if (searchResultsLeft) searchResultsLeft.classList.remove('hidden');
            console.log('🔍 Search shown (air pollution inactive)');
        }
    }

    // Helper function for formatting population numbers
    formatPopulation(population) {
        if (!population || isNaN(population)) return '';
        
        const num = parseInt(population);
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(0)}K`;
        } else {
            return num.toString();
        }
    }
    
    async loadData() {
        try {
            // Şehir verisini yükle
            await this.loadCities();
            
            // Ülke sınırlarını yükle
            await this.loadCountries();
            
        } catch (error) {
            const dataErrorMsg = window.i18n ? window.i18n.t('msg.data.load.error', 'Data loading error') : 'Data loading error';
            this.log(`⚠️ ${dataErrorMsg}: ${error.message}`, 'warning');
        }
    }
    
    async loadCities() {
        try {
            const citiesLoadingMsg = window.i18n ? window.i18n.t('msg.cities.loading', 'Loading city data...') : 'Loading city data...';
            this.log(`🏙️ ${citiesLoadingMsg}`, 'info');
            
            // Önce CSV'yi dene
            try {
                console.log('📊 CSV yükleniyor: ./data/worldcities.csv');
                const response = await fetch('./data/worldcities.csv');
                console.log('📊 CSV response status:', response.status, response.statusText);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const csvText = await response.text();
                console.log('📊 CSV text length:', csvText.length, 'characters');
                console.log('📊 CSV first 200 chars:', csvText.substring(0, 200));
                
                this.cities = this.parseCSV(csvText);
                console.log('📊 Parsed cities count:', this.cities.length);
                
                // Türkiye şehirlerini kontrol et
                const turkishCities = this.cities.filter(c => c.country === 'Turkey' || c.iso2 === 'TR');
                console.log('🇹🇷 Türkiye şehirleri sayısı:', turkishCities.length);
                if (turkishCities.length > 0) {
                    console.log('🇹🇷 İlk 10 Türk şehri:', turkishCities.slice(0, 10).map(c => c.name));
                }
                
                const citiesLoadedMsg = window.i18n ? window.i18n.t('msg.cities.loaded', 'cities loaded from CSV') : 'cities loaded from CSV';
                this.log(`✅ CSV'den ${this.cities.length} ${citiesLoadedMsg}`, 'success');
                
            } catch (csvError) {
                console.error('❌ CSV yükleme hatası:', csvError);
                const csvFailedMsg = window.i18n ? window.i18n.t('msg.csv.failed', 'CSV could not be loaded, trying JSON') : 'CSV could not be loaded, trying JSON';
                this.log(`⚠️ ${csvFailedMsg}: ${csvError.message}`, 'warning');
                
                // CSV yoksa JSON'u dene
                const jsonResponse = await fetch('./data/cities.json');
                if (!jsonResponse.ok) {
                    throw new Error(`JSON da yüklenemedi: ${jsonResponse.status}`);
                }
                
                const jsonData = await jsonResponse.json();
                // JSON'u standart formata map et
                this.cities = jsonData.map(rec => ({
                    name: rec.name,
                    city: rec.name,
                    country: rec.country,
                    lat: +rec.lat,
                    lng: +rec.lng,
                    population: 0,
                    capital: '',
                    admin_name: ''
                }));
                this.log(`✅ JSON'dan ${this.cities.length} şehir yüklendi`, 'success');
            }
            
            // Şehirleri ülkeye göre indexle
            this.buildCountryIndex();
            
            this.log(`✅ Toplam ${this.cities.length} şehir indekslendi`, 'success');
            
        } catch (error) {
            console.error('❌ Genel şehir verisi yükleme hatası:', error);
            this.log(`❌ Şehir verisi yüklenemiyor: ${error.message}`, 'error');
            // Demo veri kullan
            this.cities = this.getDemoData();
            this.buildCountryIndex();
            this.log(`⚠️ Demo veriler kullanılıyor (${this.cities.length} şehir) - Konum tespiti sınırlı olabilir`, 'warning');
            console.log('📍 Konum tespiti uyarısı: Gerçek şehir verileri yüklenemediği için demo veriler kullanılıyor.');
            console.log('📍 Bu durum konum tespitinin doğruluğunu etkileyebilir. Lütfen data/worldcities.csv dosyasının var olduğundan emin olun.');
        }
    }
    
    async loadCountries() {
        try {
            this.log('🗺️ Ülke sınırları yükleniyor...', 'info');
            
            const response = await fetch('./data/countries.geojson');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const geojson = await response.json();
            this.countries = geojson.features;
            
            this.log(`✅ ${this.countries.length} ülke sınırı yüklendi`, 'success');
            
        } catch (error) {
            this.log(`❌ Ülke sınırları yüklenemiyor: ${error.message}`, 'error');
            this.countries = [];
        }
    }
    
    configureGlobe() {
        // NASA tarzı ülke sınırları - AYNI URL ve ayarları kullan
        fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
            .then(res => res.json())
            .then(countries => {
                this.log('🌍 NASA country data loaded successfully', 'success');
                
                // Ülke verilerini sakla (backup ve toggle için)
                this.countriesData = countries;
                
                // NASA'daki AYNI polygon konfigürasyonu
                this.globe.polygonsData(countries.features)
                    .polygonCapColor(() => 'rgba(0, 0, 0, 0)')  // NASA: şeffaf cap
                    .polygonSideColor(() => 'rgba(0, 0, 0, 0)')  // NASA: şeffaf side
                    .polygonStrokeColor(() => '#666')           // NASA: #666 stroke
                    .polygonAltitude(0.01)                      // Same altitude as city boundaries
                    .polygonLabel(({ properties: d }) => {
                        const countryName = d.ADMIN || d.NAME || 'Unknown';
                        
                        // Çevrilmiş ülke adını al - senkron olarak
                        const localizedName = this.getCountryNameInCurrentLanguage(countryName);
                        
                        return `<div style="
                            background: rgba(0, 0, 0, 0.8);
                            color: white;
                            padding: 8px 12px;
                            border-radius: 8px;
                            font-size: 14px;
                            font-weight: 500;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                            backdrop-filter: blur(8px);
                            border: 1px solid rgba(255,255,255,0.2);
                            text-align: center;
                            white-space: nowrap;
                            pointer-events: none;
                        ">${this.escapeHtml(localizedName)}</div>`;
                    })
                
                // NASA tarzı hover efekti - SMART ROUTER
                this.globe.onPolygonHover(hoverPolygon => {
                    this.globe.polygonCapColor(polygon => {
                        // Turkey provinces ve USA states için hover efekti yapma (renklerini koru)
                        const objectType = polygon.properties?.objectType;
                        if (objectType === 'turkey-province' || objectType === 'usa-state') {
                            return polygon.properties?.COLOR || 'rgba(0, 0, 0, 0)';
                        }
                        
                        // Diğer polygonlar için normal hover efekti
                        return polygon === hoverPolygon ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0)';
                    });
                    
                    // SMART ROUTER - Farklı polygon tiplerini farklı handler'lara yönlendir
                    if (hoverPolygon) {
                        const objectType = hoverPolygon.properties?.objectType;
                        console.log('🎯 SMART ROUTER - objectType:', objectType, 'properties:', hoverPolygon.properties);
                        
                        if (objectType === 'turkey-province') {
                            // Turkey provinces handler
                            console.log('🏛️ Routing to Turkey provinces handler');
                            if (this.turkeyProvinces && this.turkeyProvinces.isSystemEnabled()) {
                                this.turkeyProvinces.onProvinceHover(hoverPolygon);
                            }
                            return; // Important: prevent NASA handler from running
                        } else if (objectType === 'usa-state') {
                            // USA states handler
                            console.log('🇺🇸 Routing to USA states handler');
                            if (this.usaStates && this.usaStates.isSystemEnabled()) {
                                this.usaStates.onStateHover(hoverPolygon);
                            }
                            return; // Important: prevent NASA handler from running
                        } else {
                            // NASA countries handler (default) - AKTİF
                            console.log('🌍 Routing to NASA countries handler');
                            this.handleNASAPolygonHover(hoverPolygon);
                        }
                    } else {
                        // Hover yok - tüm card'ları temizle
                        this.hideCountryHoverCard();
                    }
                });
                
                // SMART CLICK HANDLER - farklı polygon tiplerini ayır
                this.globe.onPolygonClick((polygonData) => {
                    if (polygonData && polygonData.properties) {
                        const objectType = polygonData.properties?.objectType;
                        
                        if (objectType === 'turkey-province') {
                            // Turkey provinces click handler
                            if (this.turkeyProvinces && this.turkeyProvinces.isSystemEnabled()) {
                                this.turkeyProvinces.onProvinceClick(polygonData);
                            }
                        } else if (objectType === 'usa-state') {
                            // USA states click handler
                            if (this.usaStates && this.usaStates.isSystemEnabled()) {
                                this.usaStates.onStateClick(polygonData);
                            }
                        } else {
                            // NASA countries click handler (default)
                            this.handleNASAPolygonClick(polygonData);
                        }
                    }
                });
                
                const bordersMsg = window.i18n ? window.i18n.t('msg.borders.drawn', 'All world country borders drawn (NASA style)') : 'All world country borders drawn (NASA style)';
                this.log(`✅ ${bordersMsg}`, 'success');
            })
            .catch(error => {
                this.log(`❌ NASA country data error: ${error.message}`, 'error');
            });
        
        // İlk durumda şehir noktaları yok
        this.globe.pointsData([]);

        // Initialize Turkey provinces boundaries system
        if (window.TurkeyProvincesBoundaries) {
            this.turkeyProvinces = new window.TurkeyProvincesBoundaries();
            if (this.turkeyProvinces) {
                this.turkeyProvinces.setGlobe(this.globe);
                console.log('🏛️ Turkey provinces boundaries system initialized');
            }
        } else {
            console.warn('⚠️ TurkeyProvincesBoundaries not found in window');
        }

        // Initialize USA states boundaries system
        if (window.USAStatesBoundaries) {
            this.usaStates = new window.USAStatesBoundaries();
            if (this.usaStates) {
                this.usaStates.setGlobe(this.globe);
                console.log('🇺🇸 USA states boundaries system initialized');
            }
        } else {
            console.warn('⚠️ USAStatesBoundaries not found in window');
        }
    }

    parseCSV(csvText) {
        const lines = csvText.trim().split(/\r?\n/); // Windows/Unix line endings
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        console.log('CSV Headers:', headers);
        
        const cities = [];
        for (let i = 1; i < lines.length; i++) { // Tüm satırları işle
            const values = this.parseCSVLine(lines[i]);
            if (values.length < headers.length) continue;
            
            // CSV format: "city","city_ascii","lat","lng","country","iso2","iso3","admin_name","capital","population","id"
            const cityName = values[0]?.replace(/"/g, '').trim();
            const lat = values[2]?.replace(/"/g, '').trim();
            const lng = values[3]?.replace(/"/g, '').trim();
            const country = values[4]?.replace(/"/g, '').trim();
            const iso2 = values[5]?.replace(/"/g, '').trim();
            const iso3 = values[6]?.replace(/"/g, '').trim();
            const admin_name = values[7]?.replace(/"/g, '').trim();
            const capital = values[8]?.replace(/"/g, '').trim();
            const population = values[9]?.replace(/"/g, '').trim();
            const id = values[10]?.replace(/"/g, '').trim();
            
            // Geçerli koordinatlı şehirler
            if (lat && lng && cityName && country && 
                !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
                
                const pop = parseInt(population || 0);
                const isCapital = capital === 'admin' || capital === 'primary' || capital === 'minor';
                
                // Daha geniş filtre: başkentler VEYA nüfus >= 5,000 (daha fazla şehir)
                if (isCapital || pop >= 5000 || pop === 0) { // Nüfus bilgisi yoksa da dahil et
                    cities.push({
                        id: id,
                        name: cityName,  // *** NAME ALANINI EKLE ***
                        city: cityName,
                        country: country,
                        iso2: iso2.toUpperCase(),
                        iso3: iso3.toUpperCase(),
                        lat: parseFloat(lat),
                        lng: parseFloat(lng),
                        population: pop,
                        capital: capital,
                        admin_name: admin_name
                    });
                }
            }
        }
        
        console.log(`✅ Parsed ${cities.length} cities from CSV`);
        return cities;
    }
    
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '\"' && (i === 0 || line[i-1] === ',')) {
                inQuotes = true;
            } else if (char === '\"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
                inQuotes = false;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }
    
    getDemoData() {
        return [
            // Türkiye şehirleri (öncelikli)
            { name: 'Istanbul', city: 'Istanbul', country: 'Turkey', iso2: 'TR', lat: 41.0082, lng: 28.9784, population: 15462452 },
            { name: 'Ankara', city: 'Ankara', country: 'Turkey', iso2: 'TR', lat: 39.9334, lng: 32.8597, population: 5663322 },
            { name: 'Izmir', city: 'Izmir', country: 'Turkey', iso2: 'TR', lat: 38.4192, lng: 27.1287, population: 4394694 },
            { name: 'Bursa', city: 'Bursa', country: 'Turkey', iso2: 'TR', lat: 40.1826, lng: 29.0669, population: 3101833 },
            { name: 'Adana', city: 'Adana', country: 'Turkey', iso2: 'TR', lat: 37.0000, lng: 35.3213, population: 2274106 },
            { name: 'Gaziantep', city: 'Gaziantep', country: 'Turkey', iso2: 'TR', lat: 37.0662, lng: 37.3833, population: 2069364 },
            { name: 'Konya', city: 'Konya', country: 'Turkey', iso2: 'TR', lat: 37.8713, lng: 32.4846, population: 1395678 },
            { name: 'Antalya', city: 'Antalya', country: 'Turkey', iso2: 'TR', lat: 36.8969, lng: 30.7133, population: 1364513 },
            { name: 'Diyarbakir', city: 'Diyarbakir', country: 'Turkey', iso2: 'TR', lat: 37.9144, lng: 40.2306, population: 1362708 },
            { name: 'Mersin', city: 'Mersin', country: 'Turkey', iso2: 'TR', lat: 36.8000, lng: 34.6333, population: 1245899 },
            
            // Dünya şehirleri
            { name: 'London', city: 'London', country: 'United Kingdom', iso2: 'GB', lat: 51.5074, lng: -0.1278, population: 8982000 },
            { name: 'New York', city: 'New York', country: 'United States', iso2: 'US', lat: 40.7128, lng: -74.0060, population: 8336817 },
            { name: 'Tokyo', city: 'Tokyo', country: 'Japan', iso2: 'JP', lat: 35.6762, lng: 139.6503, population: 13929286 },
            { name: 'Paris', city: 'Paris', country: 'France', iso2: 'FR', lat: 48.8566, lng: 2.3522, population: 2165423 },
            { name: 'Dubai', city: 'Dubai', country: 'United Arab Emirates', iso2: 'AE', lat: 25.2048, lng: 55.2708, population: 3400000 }
        ];
    }
    
    // Şehirleri ülkeye göre indeksle
    buildCountryIndex() {
        this.countryIndex.clear();
        
        for (const city of this.cities) {
            if (!city.iso2) continue;
            
            if (!this.countryIndex.has(city.iso2)) {
                this.countryIndex.set(city.iso2, []);
            }
            
            this.countryIndex.get(city.iso2).push(city);
        }
        
        // Her ülkenin şehirlerini nüfusa göre sırala
        for (const [iso2, cities] of this.countryIndex) {
            cities.sort((a, b) => (b.population || 0) - (a.population || 0));
        }
        
        this.log(`📊 ${this.countryIndex.size} ülke için şehir indeksi oluşturuldu`, 'info');
    }
    


    // Gelişmiş arama algoritması
    performAdvancedSearch(query) {
        console.log('🔍 performAdvancedSearch called with:', query);
        console.log('🔍 Cities available:', this.cities?.length || 0);
        
        if (!this.cities || this.cities.length === 0) {
            console.error('❌ No cities data available for search');
            return [];
        }

        // *** SPACE DESTEĞİ EKLE - Çoklu kelime arama ***
        const queryWords = query.toLowerCase().trim().split(/\s+/).filter(word => word.length > 0);
        console.log('🔍 Query words:', queryWords);
        
        const normalizedQuery = this.normalizeText(query.toLowerCase());
        console.log('🔍 Normalized query:', normalizedQuery);
        
        const results = [];
        const seenCities = new Set();

        // 0. ÇOKLü KELİME TAM EŞLEŞMESİ (en yüksek öncelik)
        if (queryWords.length > 1) {
            this.cities.forEach(city => {
                const originalCityName = city.name || city.city || '';
                const translatedCityName = this.getCityNameInCurrentLanguage(originalCityName);
                if (seenCities.has(`${originalCityName}_${city.country}`)) return;
                
                const normalizedOriginalCity = this.normalizeText(originalCityName.toLowerCase());
                const normalizedTranslatedCity = this.normalizeText(translatedCityName.toLowerCase());
                const normalizedCountryName = this.normalizeText(city.country.toLowerCase());
                
                // Tüm kelimelerin şehir adında (orijinal veya çevrilmiş) veya ülke adında geçmesi
                const allWordsInOriginalCity = queryWords.every(word => normalizedOriginalCity.includes(this.normalizeText(word)));
                const allWordsInTranslatedCity = queryWords.every(word => normalizedTranslatedCity.includes(this.normalizeText(word)));
                const allWordsInCountry = queryWords.every(word => normalizedCountryName.includes(this.normalizeText(word)));
                const mixedMatch = (queryWords.some(word => normalizedOriginalCity.includes(this.normalizeText(word)) || 
                                                          normalizedTranslatedCity.includes(this.normalizeText(word)))) && 
                                 queryWords.some(word => normalizedCountryName.includes(this.normalizeText(word)));
                
                if (allWordsInOriginalCity || allWordsInTranslatedCity || allWordsInCountry || mixedMatch) {
                    let score = (allWordsInOriginalCity || allWordsInTranslatedCity) ? 95 : (allWordsInCountry ? 85 : 90);
                    results.push({ ...city, score, matchType: 'multi_word' });
                    seenCities.add(`${originalCityName}_${city.country}`);
                }
            });
        }
        
        // 1. Tam eşleşme (en yüksek öncelik)
        this.cities.forEach(city => {
            const originalCityName = city.name || city.city || '';
            const translatedCityName = this.getCityNameInCurrentLanguage(originalCityName);
            if (seenCities.has(`${originalCityName}_${city.country}`)) return;
            
            const normalizedOriginalCity = this.normalizeText(originalCityName.toLowerCase());
            const normalizedTranslatedCity = this.normalizeText(translatedCityName.toLowerCase());
            const normalizedCountryName = this.normalizeText(city.country.toLowerCase());
            const normalizedAdminName = city.admin ? this.normalizeText(city.admin.toLowerCase()) : '';
            
            if (normalizedOriginalCity === normalizedQuery || normalizedTranslatedCity === normalizedQuery) {
                results.push({ ...city, score: 100, matchType: 'exact' });
                seenCities.add(`${originalCityName}_${city.country}`);
            }
        });
        
        // 2. Başlangıç eşleşmesi (yüksek öncelik)
        this.cities.forEach(city => {
            const originalCityName = city.name || city.city || '';
            const translatedCityName = this.getCityNameInCurrentLanguage(originalCityName);
            if (seenCities.has(`${originalCityName}_${city.country}`)) return;
            
            const normalizedOriginalCity = this.normalizeText(originalCityName.toLowerCase());
            const normalizedTranslatedCity = this.normalizeText(translatedCityName.toLowerCase());
            const normalizedCountryName = this.normalizeText(city.country.toLowerCase());
            
            if (normalizedOriginalCity.startsWith(normalizedQuery) || normalizedTranslatedCity.startsWith(normalizedQuery) || normalizedCountryName.startsWith(normalizedQuery)) {
                const score = (normalizedOriginalCity.startsWith(normalizedQuery) || normalizedTranslatedCity.startsWith(normalizedQuery)) ? 90 : 80;
                results.push({ ...city, score, matchType: 'starts' });
                seenCities.add(`${originalCityName}_${city.country}`);
            }
        });
        
        // 3. İçerik eşleşmesi (orta öncelik)
        this.cities.forEach(city => {
            const originalCityName = city.name || city.city || '';
            const translatedCityName = this.getCityNameInCurrentLanguage(originalCityName);
            if (seenCities.has(`${originalCityName}_${city.country}`)) return;
            
            const normalizedOriginalCity = this.normalizeText(originalCityName.toLowerCase());
            const normalizedTranslatedCity = this.normalizeText(translatedCityName.toLowerCase());
            const normalizedCountryName = this.normalizeText(city.country.toLowerCase());
            const normalizedAdminName = city.admin ? this.normalizeText(city.admin.toLowerCase()) : '';
            
            if (normalizedOriginalCity.includes(normalizedQuery) || 
                normalizedTranslatedCity.includes(normalizedQuery) ||
                normalizedCountryName.includes(normalizedQuery) ||
                normalizedAdminName.includes(normalizedQuery)) {
                
                let score = 70;
                // Şehir adında eşleşme (orijinal veya çevrilmiş) daha yüksek puan
                if (normalizedOriginalCity.includes(normalizedQuery) || normalizedTranslatedCity.includes(normalizedQuery)) score = 75;
                
                results.push({ ...city, score, matchType: 'contains' });
                seenCities.add(`${originalCityName}_${city.country}`);
            }
        });
        
        // 4. Fuzzy matching (düşük öncelik)
        if (normalizedQuery.length >= 3) {
            this.cities.forEach(city => {
                if (seenCities.has(`${city.name}_${city.country}`)) return;
                
                const normalizedCityName = this.normalizeText(city.name.toLowerCase());
                const similarity = this.calculateSimilarity(normalizedQuery, normalizedCityName);
                
                if (similarity > 0.6) {
                    const score = Math.round(similarity * 60); // 0.6+ similarity = 36+ score
                    results.push({ ...city, score, matchType: 'fuzzy' });
                    seenCities.add(`${city.name}_${city.country}`);
                }
            });
        }
        
        // Puana göre sırala ve en iyi 15 sonucu döndür
        return results
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                // Eşit puan durumunda alfabetik sırala
                return a.name.localeCompare(b.name);
            })
            .slice(0, 15);
    }

    // Basit arama fonksiyonu (fallback)
    performSimpleSearch(query) {
        console.log('🔍 Using simple search for:', query);
        if (!this.cities || this.cities.length === 0) {
            console.error('❌ No cities data for simple search');
            return [];
        }
        
        const normalizedQuery = query.toLowerCase();
        const queryWords = query.toLowerCase().trim().split(/\s+/).filter(word => word.length > 0);
        const results = [];
        
        // *** ÇOKLU KELİME DESTEĞİ ***
        if (queryWords.length > 1) {
            this.cities.forEach(city => {
                const cityName = city.name || city.city || '';
                const normalizedCityName = cityName.toLowerCase();
                const normalizedCountryName = city.country.toLowerCase();
                
                // Tüm kelimeler şehir adında geçiyor mu
                const allWordsInCity = queryWords.every(word => normalizedCityName.includes(word));
                if (allWordsInCity) {
                    results.push({ ...city, score: 95, matchType: 'multi_word' });
                    return;
                }
                
                // Karma eşleşme: bazı kelimeler şehirde, bazıları ülkede
                const wordsInCity = queryWords.filter(word => normalizedCityName.includes(word));
                const wordsInCountry = queryWords.filter(word => normalizedCountryName.includes(word));
                
                if (wordsInCity.length + wordsInCountry.length === queryWords.length && wordsInCity.length > 0) {
                    results.push({ ...city, score: 85, matchType: 'multi_word' });
                }
            });
        }
        
        // Şehir adıyla başlayanlar (en yüksek öncelik)
        this.cities.forEach(city => {
            const cityName = city.name || city.city || '';
            if (cityName.toLowerCase().startsWith(normalizedQuery)) {
                results.push({ ...city, score: 90, matchType: 'starts_with' });
            }
        });
        
        // Şehir adı içerenler
        this.cities.forEach(city => {
            const cityName = city.name || city.city || '';
            if (cityName.toLowerCase().includes(normalizedQuery) && 
                !cityName.toLowerCase().startsWith(normalizedQuery)) {
                results.push({ ...city, score: 70, matchType: 'contains' });
            }
        });
        
        // Ülke adı eşleşenler
        this.cities.forEach(city => {
            if (city.country.toLowerCase().includes(normalizedQuery)) {
                results.push({ ...city, score: 60, matchType: 'country' });
            }
        });
        
        // Sonuçları sırala ve sınırla
        return results
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                const nameA = a.name || a.city || '';
                const nameB = b.name || b.city || '';
                return nameA.localeCompare(nameB);
            })
            .slice(0, 12);
    }
    
    // Türkçe karakter normalleştirme
    normalizeText(text) {
        return text
            .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
            .replace(/ü/g, 'u').replace(/Ü/g, 'U')
            .replace(/ş/g, 's').replace(/Ş/g, 'S')
            .replace(/ı/g, 'i').replace(/I/g, 'I')
            .replace(/ö/g, 'o').replace(/Ö/g, 'O')
            .replace(/ç/g, 'c').replace(/Ç/g, 'C')
            .replace(/[^a-z0-9\s]/g, ''); // Diğer özel karakterleri temizle
    }
    
    // Fuzzy matching için Levenshtein distance benzeri
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }
    
    // Levenshtein distance hesaplama
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    // *** PLACEHOLDER - This function is replaced by new search system ***
    displaySearchResultsOLD(cities, query) {
        // This function is no longer used - see new search system above
        console.warn('🔍 Old displaySearchResults called - should use new search system');
        return;
        
        if (cities.length === 0) {
            this.elements.searchResults.innerHTML = `
                <div style="color: rgba(255,255,255,0.5); text-align: center; padding: 15px;">
                    <div style="font-size: 24px; margin-bottom: 5px;">🔍</div>
                    <div>${window.t ? window.t('search.no-results', 'No cities found') : 'No cities found'}</div>
                    ${query ? `<div style="font-size: 12px; margin-top: 5px;">Searched: "${query}"</div>` : ''}
                </div>`;
            return;
        }
        
        console.log('🔍 First few cities:', cities.slice(0, 3));
        
        const normalizedQuery = this.normalizeText(query.toLowerCase());
        
        const html = cities.map((city, index) => {
            // NAME fallback ile şehir adını al
            const originalCityName = city.name || city.city || '';
            // Çevrilmiş şehir adını al
            const translatedCityName = this.getCityNameInCurrentLanguage(originalCityName);
            
            // Eşleşen metni vurgula - hem orijinal hem çevrilmiş isimde ara
            const highlightedName = this.highlightMatch(translatedCityName, normalizedQuery) !== translatedCityName ?
                this.highlightMatch(translatedCityName, normalizedQuery) :
                this.highlightMatch(originalCityName, normalizedQuery);
            
            const highlightedCountry = this.highlightMatch(city.country, normalizedQuery);
            
            // Popülasyon formatla
            const populationText = city.population ? this.formatPopulation(city.population) : '';
            
            // Admin bilgisi varsa göster
            const adminText = city.admin && city.admin !== originalCityName ? ` • ${city.admin}` : '';
            
            // Buton metni çevir
            const buttonText = window.t ? window.t('btn.zoom', 'Zoom') : 'Go';
            
            return `
                <div class="city-item" data-lat="${city.lat}" data-lng="${city.lng}" data-name="${this.escapeHtml(translatedCityName)}" data-country="${this.escapeHtml(city.country)}"
                     style="border-left: 3px solid ${this.getScoreColor(city.score)}; cursor: pointer;">
                    <div class="city-info">
                        <div class="city-name" style="display: flex; align-items: center;">
                            ${highlightedName}
                        </div>
                        <div class="city-details" style="font-size: 12px; color: rgba(255,255,255,0.7);">
                            ${highlightedCountry}${adminText}
                            ${populationText ? ` • ${populationText}` : ''}
                        </div>
                        ${city.score ? `<div style="font-size: 10px; color: rgba(255,255,255,0.5);">Score: ${city.score}/100</div>` : ''}
                    </div>
                    <div class="city-btn" style="
                        background: #4CAF50; 
                        color: white; 
                        padding: 6px 12px; 
                        border-radius: 15px; 
                        font-size: 11px; 
                        font-weight: 500;
                        border: none;
                        cursor: pointer;
                        min-width: 35px;
                        text-align: center;
                    ">${buttonText}</div>
                </div>
            `;
        }).join('');
        
        // Arama istatistikleri ekle
        const resultsText = window.t ? window.t('search.results', 'Results') : 'Results';
        const statsHtml = `
            <div style="text-align: center; padding: 8px; font-size: 11px; color: rgba(255,255,255,0.5); border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 5px;">
                ${cities.length} ${resultsText.toLowerCase()} • "${query}"
            </div>
        `;
        
        const finalHtml = statsHtml + html;
        console.log('🔍 Setting innerHTML with length:', finalHtml.length);
        this.elements.searchResults.innerHTML = finalHtml;
        console.log('🔍 innerHTML set successfully');
        
        // Click event listeners ekle
        this.addSearchResultListeners();
    }
    
    // Arama sonucu tıklama eventlerini ekle
    addSearchResultListeners() {
        const cityItems = this.elements.searchResults.querySelectorAll('.city-item');
        console.log(`🔍 Adding listeners to ${cityItems.length} city items`);
        
        cityItems.forEach((item, index) => {
            const lat = parseFloat(item.getAttribute('data-lat'));
            const lng = parseFloat(item.getAttribute('data-lng'));
            const name = item.getAttribute('data-name');
            const country = item.getAttribute('data-country');
            
            console.log(`🔍 Setting up listener for: ${name}, ${country} at ${lat}, ${lng}`);
            
            item.addEventListener('click', () => {
                console.log(`🔍 City item clicked: ${name}, ${country}`);
                
                // Şehir detay sayfasına yönlendir
                const detailUrl = `city-detail.html?city=${encodeURIComponent(name)}&country=${encodeURIComponent(country)}&lat=${lat}&lng=${lng}`;
                window.open(detailUrl, '_self'); // Aynı sekmede aç
            });
            
            // Hover effect
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = 'rgba(30, 144, 255, 0.3)';
                item.style.transform = 'translateX(3px)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                item.style.transform = 'translateX(0px)';
            });
        });
    }
    
    // Metindeki eşleşmeleri vurgula
    highlightMatch(text, normalizedQuery) {
        if (!normalizedQuery || normalizedQuery.length === 0) return this.escapeHtml(text);
        
        const normalizedText = this.normalizeText(text.toLowerCase());
        const index = normalizedText.indexOf(normalizedQuery);
        
        if (index === -1) return this.escapeHtml(text);
        
        const beforeMatch = text.substring(0, index);
        const match = text.substring(index, index + normalizedQuery.length);
        const afterMatch = text.substring(index + normalizedQuery.length);
        
        return `${this.escapeHtml(beforeMatch)}<span style="background: rgba(135, 206, 235, 0.3); color: #87ceeb; font-weight: bold; border-radius: 2px; padding: 1px 2px;">${this.escapeHtml(match)}</span>${this.escapeHtml(afterMatch)}`;
    }
    
    // Skor rengi al
    getScoreColor(score) {
        if (score >= 90) return '#4CAF50'; // Yeşil - Mükemmel
        if (score >= 75) return '#2196F3'; // Mavi - İyi
        if (score >= 60) return '#FF9800'; // Turuncu - Orta
        return '#9E9E9E'; // Gri - Düşük
    }
    
    clearSearch() {
        this.elements.searchInput.value = '';
        this.clearSearchResults();
    }
    
    clearSearchResults() {
        this.elements.searchResults.innerHTML = '';
    }
    
    flyToCity(lat, lng, name, country) {
        console.log(`🚀 flyToCity called: ${name}, ${country} at ${lat}, ${lng}`);
        
        // Globe hazır mı kontrol et
        if (!this.globe) {
            console.error('❌ Globe not initialized yet!');
            const waitMsg = window.i18n ? window.i18n.t('msg.globe.wait', 'Globe is still loading, please wait...') : 'Globe is still loading, please wait...';
            this.log(`⚠️ ${waitMsg}`, 'warning');
            return;
        }
        
        if (!this.globeReady) {
            console.error('❌ Globe not ready yet!');
            const waitMsg = window.i18n ? window.i18n.t('msg.world.wait', '3D World is still loading, please wait...') : '3D World is still loading, please wait...';
            this.log(`⚠️ ${waitMsg}`, 'warning');
            return;
        }
        
        // Koordinatları validate et
        if (isNaN(lat) || isNaN(lng)) {
            console.error('❌ Invalid coordinates:', { lat, lng });
            const invalidMsg = window.i18n ? window.i18n.t('msg.invalid.coordinates', 'Invalid coordinates') : 'Invalid coordinates';
            this.log(`⚠️ ${invalidMsg}: ${name}`, 'error');
            return;
        }
        
        console.log('✅ All checks passed, moving to city...');
        const flyingMsg = window.i18n ? window.i18n.t('msg.flying.to', 'Flying to') : 'Flying to';
        this.log(`🚀 ${name}, ${country} ${flyingMsg}...`, 'info');
        
        try {
            // Kamerayı şehre yönlendir (yumuşak animasyon) - Daha yakın zoom
            this.globe.pointOfView({ 
                lat: parseFloat(lat), 
                lng: parseFloat(lng), 
                altitude: 0.5 // Daha yakın zoom (eskiden 1.5)
            }, 2000); // 2 saniye animasyon
            
            console.log(`✅ Globe moved to: ${lat}, ${lng}`);
            
            // Animasyon tamamlandıktan sonra "ulaşıldı" mesajı göster
            setTimeout(() => {
                const arrivedMsg = window.i18n ? window.i18n.t('msg.arrived.at', 'Arrived at') : 'Arrived at';
                this.log(`🎯 ${name}, ${country} ${arrivedMsg}`, 'success');
            }, 2100); // Animasyon bitince (2000ms + 100ms buffer)
            
            // Geçici bir nokta ekle
            this.addTemporaryMarker(lat, lng, name, country);
            
            // Arama sonuçlarını temizle
            this.clearSearchResults();
            this.elements.searchInput.value = '';
            
        } catch (error) {
            console.error('❌ Error moving globe:', error);
            const errorMsg = window.i18n ? window.i18n.t('msg.location.error.move', 'Error while moving location') : 'Error while moving location';
            this.log(`⚠️ ${errorMsg}: ${error.message}`, 'error');
        }
    }
    
    addTemporaryMarker(lat, lng, name, country) {
        // YENİ GÜVENLİ VERSİYONU KULLAN
        this.addTemporaryMarkerSafe(lat, lng, name, country, 3000);
    }
    
    // NASA tarzı polygon hover handler
    // NASA tarzı polygon hover handler - AYNI mantık
    handleNASAPolygonHover(hoverPolygon) {
        if (hoverPolygon && hoverPolygon.properties) {
            // NASA GeoJSON'dan ülke adını al
            const countryName = hoverPolygon.properties.ADMIN || hoverPolygon.properties.NAME || 'Unknown';
            const iso2 = hoverPolygon.properties.ISO_A2 || '';
            const population = hoverPolygon.properties.POP_EST || 0;
            
            this.showNASACountryCard(countryName, iso2, population);
        }
    }

    // NASA tarzı polygon click handler - TÜM ÜLKELER İÇİN DİNAMİK
    handleNASAPolygonClick(polygonData) {
        // SADECE GEÇİCİ MARKERLARİ TEMİZLE (yeşil kullanıcı konumunu KORU!)
        this.clearAllPoints();
        
        const countryName = polygonData.properties.ADMIN || polygonData.properties.NAME || 'Unknown';
        const iso2 = polygonData.properties.ISO_A2 || '';
        const iso3 = polygonData.properties.ISO_A3 || '';
        
        const creatingPageMsg = window.i18n ? window.i18n.t('msg.creating.page', 'Creating dynamic page for') : 'Creating dynamic page for';
        
        if (window.i18n && window.i18n.currentLanguage === 'tr') {
            this.log(`🔷 ${countryName} ${creatingPageMsg}`, 'info');
        } else {
            this.log(`🔷 ${creatingPageMsg}: ${countryName}`, 'info');
        }
        
        this.createUniversalCountryPage(countryName, polygonData.properties, iso2, iso3);
    }

    // TÜM ÜLKELER için evrensel ülke sayfası oluşturma - YENİ TASARIM
    async createUniversalCountryPage(countryName, properties, iso2, iso3) {
        console.log(`🌍 Creating page for: ${countryName} (${iso2}/${iso3})`);
        console.log(`🔍 DEBUG - countryName: "${countryName}", iso2: "${iso2}", iso3: "${iso3}"`);
        
        try {
            // 1. Nüfus bilgisini REST Countries API'sinden al
            const countryData = await this.fetchCountryData(iso2);
            
            // 2. Şehir verilerini al
            const cities = await this.getCountryCitiesFromData(countryName, iso2, iso3);
            console.log(`🏙️ Cities received for ${countryName}:`, cities.length);
            
            // 3. Ülke ismini tamamen temizle ve düzelt
            let finalCountryName;
            let flagEmoji;
            
            if (iso2 === 'US') {
                // Amerika için sabit isim kullan ve bayrak kaldır
                finalCountryName = this.currentLanguage === 'tr' ? 'Amerika Birleşik Devletleri' : 'United States';
                flagEmoji = '';  // Bayrak boş - hiçbir şey gösterme
            } else {
                // Diğer ülkeler için normal işlem ama bayrakları kaldır
                finalCountryName = this.getLocalizedCountryName(countryName) || countryName;
                flagEmoji = '';  // Tüm ülkeler için bayrak kaldır
            }
            
            console.log(`🔍 FINAL COUNTRY NAME: "${finalCountryName}"`);
            console.log(`🔍 FLAG DEBUG - iso2: "${iso2}" -> flagEmoji: "${flagEmoji}"`);
            
            // 4. Ülke verilerini localStorage'a kaydet
            const pageData = {
                name: finalCountryName,
                flag: flagEmoji,
                iso2: iso2,
                cities: cities,
                population: countryData.population
            };
            
            localStorage.setItem('countryPageData', JSON.stringify(pageData));
            
            // 5. Ülke sayfasına yönlendir
            window.location.href = 'country-page.html';
            
            // 6. Log success
            this.logPageCreation(finalCountryName, cities.length);
            
        } catch (error) {
            console.error('❌ Error creating country page:', error);
            this.log(`❌ ${countryName} sayfası oluşturulamadı: ${error.message}`, 'error');
        }
    }

    // Çoklu API kaynaklarından ülke verisi çek
    async fetchCountryData(iso2) {
        // Önemli ülkeler için güncel nüfus verileri (2024-2025 güncel veriler)
        const currentPopulationData = {
            'TR': { population: 85326000, area: 783562, region: 'Asia', capital: 'Ankara', currency: 'Turkish lira', language: 'Turkish' }, // TÜİK 2024
            'US': { population: 340000000, area: 9833517, region: 'Americas', capital: 'Washington, D.C.', currency: 'US dollar', language: 'English' }, // 340M
            'CN': { population: 1425000000, area: 9596961, region: 'Asia', capital: 'Beijing', currency: 'Yuan', language: 'Chinese' }, // 1.425B
            'IN': { population: 1428000000, area: 3287263, region: 'Asia', capital: 'New Delhi', currency: 'Indian rupee', language: 'Hindi' }, // 1.428B
            'ID': { population: 278000000, area: 1904569, region: 'Asia', capital: 'Jakarta', currency: 'Indonesian rupiah', language: 'Indonesian' }, // 278M
            'PK': { population: 241000000, area: 881913, region: 'Asia', capital: 'Islamabad', currency: 'Pakistani rupee', language: 'Urdu' }, // 241M
            'BD': { population: 173000000, area: 147570, region: 'Asia', capital: 'Dhaka', currency: 'Bangladeshi taka', language: 'Bengali' }, // 173M
            'NG': { population: 230000000, area: 923768, region: 'Africa', capital: 'Abuja', currency: 'Nigerian naira', language: 'English' }, // 230M
            'BR': { population: 217000000, area: 8514877, region: 'Americas', capital: 'Brasília', currency: 'Brazilian real', language: 'Portuguese' }, // 217M
            'RU': { population: 146000000, area: 17098242, region: 'Europe', capital: 'Moscow', currency: 'Russian ruble', language: 'Russian' }, // 146M
            'MX': { population: 132000000, area: 1964375, region: 'Americas', capital: 'Mexico City', currency: 'Mexican peso', language: 'Spanish' }, // 132M
            'JP': { population: 124000000, area: 377930, region: 'Asia', capital: 'Tokyo', currency: 'Japanese yen', language: 'Japanese' }, // 124M
            'ET': { population: 126000000, area: 1104300, region: 'Africa', capital: 'Addis Ababa', currency: 'Ethiopian birr', language: 'Amharic' }, // 126M
            'PH': { population: 117000000, area: 300000, region: 'Asia', capital: 'Manila', currency: 'Philippine peso', language: 'Filipino' }, // 117M
            'EG': { population: 112000000, area: 1001450, region: 'Africa', capital: 'Cairo', currency: 'Egyptian pound', language: 'Arabic' }, // 112M
            'VN': { population: 98000000, area: 331212, region: 'Asia', capital: 'Hanoi', currency: 'Vietnamese dong', language: 'Vietnamese' }, // 98M
            'IR': { population: 86000000, area: 1648195, region: 'Asia', capital: 'Tehran', currency: 'Iranian rial', language: 'Persian' }, // 86M
            'DE': { population: 84000000, area: 357114, region: 'Europe', capital: 'Berlin', currency: 'Euro', language: 'German' }, // 84M
            'TH': { population: 71000000, area: 513120, region: 'Asia', capital: 'Bangkok', currency: 'Thai baht', language: 'Thai' }, // 71M
            'GB': { population: 68000000, area: 242495, region: 'Europe', capital: 'London', currency: 'Pound sterling', language: 'English' }, // 68M
            'FR': { population: 68000000, area: 643801, region: 'Europe', capital: 'Paris', currency: 'Euro', language: 'French' }, // 68M
            'IT': { population: 59000000, area: 301340, region: 'Europe', capital: 'Rome', currency: 'Euro', language: 'Italian' }, // 59M
            'ZA': { population: 61000000, area: 1221037, region: 'Africa', capital: 'Cape Town', currency: 'South African rand', language: 'Afrikaans' } // 61M
        };

        if (currentPopulationData[iso2]) {
            const data = currentPopulationData[iso2];
            return {
                ...data,
                flag: '',
                lastUpdated: new Date().toISOString()
            };
        }

        const apis = [
            {
                name: 'REST Countries (Primary)',
                url: `https://restcountries.com/v3.1/alpha/${iso2}?fields=name,population,area,region,capital,currencies,languages,flag`,
                parser: (data) => ({
                    population: data.population || 0,
                    area: data.area || 0,
                    region: data.region || '',
                    capital: data.capital?.[0] || '',
                    currency: Object.values(data.currencies || {})[0]?.name || '',
                    language: Object.values(data.languages || {})[0] || '',
                    flag: data.flag || '',
                    lastUpdated: new Date().toISOString()
                })
            },
            {
                name: 'World Bank (Backup)',
                url: `https://api.worldbank.org/v2/country/${iso2.toLowerCase()}?format=json&per_page=1`,
                parser: (data) => {
                    const country = data[1]?.[0];
                    return {
                        population: 0, // World Bank population endpoint ayrı çağrılacak
                        region: country?.region?.value || '',
                        capital: country?.capitalCity || '',
                        lastUpdated: new Date().toISOString()
                    };
                }
            }
        ];

        // Önce cache'den kontrol et
        const cacheKey = `country_${iso2}`;
        const cachedData = this.getFromCache(cacheKey);
        
        // Cache 24 saatten eski değilse kullan
        if (cachedData && this.isCacheValid(cachedData.lastUpdated, 24)) {
            console.log(`📦 Cache'den veri alındı: ${iso2}`);
            return cachedData;
        }

        // API'lerden veri çek
        for (const api of apis) {
            try {
                console.log(`🌐 ${api.name} API'sine istek gönderiliyor: ${iso2}`);
                const response = await fetch(api.url);
                
                if (response.ok) {
                    const rawData = await response.json();
                    const parsedData = api.parser(rawData);
                    
                    // Population verisi için ayrı endpoint çağır
                    if (parsedData.population === 0) {
                        parsedData.population = await this.fetchPopulationData(iso2);
                    }
                    
                    // Cache'e kaydet
                    this.saveToCache(cacheKey, parsedData);
                    console.log(`✅ ${api.name} başarılı: ${iso2} - Nüfus: ${parsedData.population?.toLocaleString()}`);
                    return parsedData;
                }
            } catch (error) {
                console.log(`⚠️ ${api.name} error for ${iso2}:`, error.message);
            }
        }

        // Hiçbir API çalışmazsa fallback data döndür
        console.log(`❌ Tüm API'ler başarısız oldu: ${iso2}`);
        return {
            population: 0,
            area: 0,
            region: 'Unknown',
            capital: '',
            currency: '',
            language: '',
            flag: '',
            lastUpdated: new Date().toISOString()
        };
    }

    // Özel nüfus verisi çekme fonksiyonu
    async fetchPopulationData(iso2) {
        const populationApis = [
            {
                name: 'World Bank Population',
                url: `https://api.worldbank.org/v2/country/${iso2.toLowerCase()}/indicator/SP.POP.TOTL?format=json&date=2023&per_page=1`,
                parser: (data) => data[1]?.[0]?.value || 0
            },
            {
                name: 'CountriesNow API',
                url: `https://countriesnow.space/api/v0.1/countries/population`,
                parser: (data, country) => {
                    const countryData = data.data?.find(c => 
                        c.code?.toLowerCase() === iso2.toLowerCase() ||
                        c.iso2?.toLowerCase() === iso2.toLowerCase()
                    );
                    return countryData?.populationCounts?.[0]?.value || 0;
                }
            }
        ];

        for (const api of populationApis) {
            try {
                const response = await fetch(api.url);
                if (response.ok) {
                    const data = await response.json();
                    const population = api.parser(data);
                    if (population > 0) {
                        console.log(`📊 ${api.name} nüfus verisi: ${iso2} - ${population.toLocaleString()}`);
                        return population;
                    }
                }
            } catch (error) {
                console.log(`⚠️ ${api.name} population error for ${iso2}:`, error.message);
            }
        }
        
        return 0;
    }

    // Cache yönetim fonksiyonları
    getFromCache(key) {
        try {
            const cached = localStorage.getItem(key);
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    }

    saveToCache(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.log('⚠️ Cache kaydetme hatası:', error.message);
        }
    }

    isCacheValid(lastUpdated, hoursValid = 24) {
        if (!lastUpdated) return false;
        const now = new Date();
        const updated = new Date(lastUpdated);
        const diffHours = (now - updated) / (1000 * 60 * 60);
        return diffHours < hoursValid;
    }

    // Tüm ülkeler için toplu veri güncelleme sistemi
    async initializeGlobalDataUpdate() {
        console.log('🌍 Global data update system starting...');
        
        // Güncelleme durumunu kontrol et
        const lastUpdate = this.getFromCache('global_update_timestamp');
        const now = new Date();
        
        // 24 saatten eski ise güncelle
        if (!lastUpdate || !this.isCacheValid(lastUpdate, 24)) {
            console.log('📊 Starting background data update for all countries...');
            this.performBackgroundUpdate();
            this.saveToCache('global_update_timestamp', now.toISOString());
        } else {
            console.log('📊 Global data is up to date');
        }
    }

    // Arka planda tüm ülkelerin verilerini güncelle
    async performBackgroundUpdate() {
        try {
            // Ülke listesi al
            const countryList = await this.getAllCountryCodes();
            console.log(`🌍 Found ${countryList.length} countries to update`);
            
            // Batch güncelleme (10'lu gruplar halinde)
            const batchSize = 10;
            const batches = [];
            
            for (let i = 0; i < countryList.length; i += batchSize) {
                batches.push(countryList.slice(i, i + batchSize));
            }
            
            console.log(`📦 Processing ${batches.length} batches of countries`);
            
            // Batch'leri sırayla işle (API rate limit için)
            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                console.log(`📦 Processing batch ${i + 1}/${batches.length}`);
                
                // Batch içindeki ülkeleri paralel işle
                const batchPromises = batch.map(country => 
                    this.updateCountryDataSilently(country.iso2)
                );
                
                await Promise.allSettled(batchPromises);
                
                // Batch'ler arası kısa bekleme (rate limiting)
                if (i < batches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            console.log('✅ Global data update completed');
            
        } catch (error) {
            console.error('❌ Global data update failed:', error);
        }
    }

    // Sessizce ülke verisi güncelle
    async updateCountryDataSilently(iso2) {
        try {
            await this.fetchCountryData(iso2);
            // Başarılı güncelleme - sessiz
        } catch (error) {
            // Hata durumu - sadece console'da göster
            console.log(`⚠️ Silent update failed for ${iso2}:`, error.message);
        }
    }

    // Tüm ülke kodlarını getir
    async getAllCountryCodes() {
        try {
            // Önce cache'den kontrol et
            const cached = this.getFromCache('all_country_codes');
            if (cached && this.isCacheValid(cached.timestamp, 7 * 24)) { // 7 gün
                return cached.data;
            }

            // REST Countries API'sinden tüm ülkeleri al
            const response = await fetch('https://restcountries.com/v3.1/all?fields=cca2,name');
            if (response.ok) {
                const countries = await response.json();
                const countryList = countries.map(country => ({
                    iso2: country.cca2,
                    name: country.name.common
                }));
                
                // Cache'e kaydet (7 gün)
                this.saveToCache('all_country_codes', {
                    data: countryList,
                    timestamp: new Date().toISOString()
                });
                
                return countryList;
            }
        } catch (error) {
            console.log('⚠️ Could not fetch country list:', error.message);
        }
        
        // Fallback: Bilinen önemli ülkeler
        return [
            { iso2: 'US', name: 'United States' },
            { iso2: 'CN', name: 'China' },
            { iso2: 'IN', name: 'India' },
            { iso2: 'ID', name: 'Indonesia' },
            { iso2: 'BR', name: 'Brazil' },
            { iso2: 'PK', name: 'Pakistan' },
            { iso2: 'BD', name: 'Bangladesh' },
            { iso2: 'NG', name: 'Nigeria' },
            { iso2: 'RU', name: 'Russia' },
            { iso2: 'MX', name: 'Mexico' },
            { iso2: 'JP', name: 'Japan' },
            { iso2: 'PH', name: 'Philippines' },
            { iso2: 'ET', name: 'Ethiopia' },
            { iso2: 'VN', name: 'Vietnam' },
            { iso2: 'EG', name: 'Egypt' },
            { iso2: 'TR', name: 'Turkey' },
            { iso2: 'IR', name: 'Iran' },
            { iso2: 'DE', name: 'Germany' },
            { iso2: 'TH', name: 'Thailand' },
            { iso2: 'GB', name: 'United Kingdom' },
            { iso2: 'FR', name: 'France' },
            { iso2: 'IT', name: 'Italy' },
            { iso2: 'ZA', name: 'South Africa' },
            { iso2: 'TZ', name: 'Tanzania' },
            { iso2: 'MM', name: 'Myanmar' },
            { iso2: 'KE', name: 'Kenya' },
            { iso2: 'KR', name: 'South Korea' },
            { iso2: 'CO', name: 'Colombia' },
            { iso2: 'ES', name: 'Spain' },
            { iso2: 'UG', name: 'Uganda' },
            { iso2: 'AR', name: 'Argentina' },
            { iso2: 'DZ', name: 'Algeria' },
            { iso2: 'SD', name: 'Sudan' },
            { iso2: 'UA', name: 'Ukraine' },
            { iso2: 'IQ', name: 'Iraq' },
            { iso2: 'PL', name: 'Poland' },
            { iso2: 'CA', name: 'Canada' },
            { iso2: 'AF', name: 'Afghanistan' },
            { iso2: 'MA', name: 'Morocco' },
            { iso2: 'SA', name: 'Saudi Arabia' },
            { iso2: 'UZ', name: 'Uzbekistan' },
            { iso2: 'PE', name: 'Peru' },
            { iso2: 'MY', name: 'Malaysia' },
            { iso2: 'AO', name: 'Angola' },
            { iso2: 'MZ', name: 'Mozambique' },
            { iso2: 'GH', name: 'Ghana' },
            { iso2: 'YE', name: 'Yemen' },
            { iso2: 'NP', name: 'Nepal' },
            { iso2: 'VE', name: 'Venezuela' },
            { iso2: 'MG', name: 'Madagascar' },
            { iso2: 'CM', name: 'Cameroon' },
            { iso2: 'CI', name: 'Ivory Coast' },
            { iso2: 'NE', name: 'Niger' },
            { iso2: 'AU', name: 'Australia' },
            { iso2: 'LK', name: 'Sri Lanka' },
            { iso2: 'BF', name: 'Burkina Faso' },
            { iso2: 'ML', name: 'Mali' },
            { iso2: 'MW', name: 'Malawi' },
            { iso2: 'CL', name: 'Chile' },
            { iso2: 'RO', name: 'Romania' },
            { iso2: 'KZ', name: 'Kazakhstan' },
            { iso2: 'ZM', name: 'Zambia' },
            { iso2: 'GT', name: 'Guatemala' },
            { iso2: 'EC', name: 'Ecuador' },
            { iso2: 'NL', name: 'Netherlands' },
            { iso2: 'SY', name: 'Syria' },
            { iso2: 'MW', name: 'Malawi' },
            { iso2: 'ZW', name: 'Zimbabwe' },
            { iso2: 'SN', name: 'Senegal' },
            { iso2: 'TD', name: 'Chad' },
            { iso2: 'SO', name: 'Somalia' },
            { iso2: 'ZM', name: 'Zambia' },
            { iso2: 'RW', name: 'Rwanda' },
            { iso2: 'GN', name: 'Guinea' },
            { iso2: 'BJ', name: 'Benin' },
            { iso2: 'TN', name: 'Tunisia' },
            { iso2: 'BI', name: 'Burundi' },
            { iso2: 'BO', name: 'Bolivia' },
            { iso2: 'BE', name: 'Belgium' },
            { iso2: 'HT', name: 'Haiti' },
            { iso2: 'CU', name: 'Cuba' },
            { iso2: 'DO', name: 'Dominican Republic' },
            { iso2: 'CZ', name: 'Czech Republic' },
            { iso2: 'GR', name: 'Greece' },
            { iso2: 'PT', name: 'Portugal' },
            { iso2: 'JO', name: 'Jordan' },
            { iso2: 'AZ', name: 'Azerbaijan' },
            { iso2: 'AT', name: 'Austria' },
            { iso2: 'HU', name: 'Hungary' },
            { iso2: 'BY', name: 'Belarus' },
            { iso2: 'TJ', name: 'Tajikistan' },
            { iso2: 'HN', name: 'Honduras' },
            { iso2: 'CH', name: 'Switzerland' },
            { iso2: 'IL', name: 'Israel' },
            { iso2: 'BG', name: 'Bulgaria' },
            { iso2: 'RS', name: 'Serbia' },
            { iso2: 'PY', name: 'Paraguay' },
            { iso2: 'LA', name: 'Laos' },
            { iso2: 'LY', name: 'Libya' },
            { iso2: 'LB', name: 'Lebanon' },
            { iso2: 'NI', name: 'Nicaragua' },
            { iso2: 'KG', name: 'Kyrgyzstan' },
            { iso2: 'SL', name: 'Sierra Leone' },
            { iso2: 'IE', name: 'Ireland' },
            { iso2: 'LR', name: 'Liberia' },
            { iso2: 'CR', name: 'Costa Rica' },
            { iso2: 'SK', name: 'Slovakia' },
            { iso2: 'FI', name: 'Finland' },
            { iso2: 'NO', name: 'Norway' },
            { iso2: 'OM', name: 'Oman' },
            { iso2: 'PS', name: 'Palestine' },
            { iso2: 'HR', name: 'Croatia' },
            { iso2: 'MN', name: 'Mongolia' },
            { iso2: 'UY', name: 'Uruguay' },
            { iso2: 'GE', name: 'Georgia' },
            { iso2: 'AM', name: 'Armenia' },
            { iso2: 'JM', name: 'Jamaica' },
            { iso2: 'QA', name: 'Qatar' },
            { iso2: 'AR', name: 'Argentina' },
            { iso2: 'LT', name: 'Lithuania' },
            { iso2: 'SI', name: 'Slovenia' },
            { iso2: 'LV', name: 'Latvia' },
            { iso2: 'EE', name: 'Estonia' },
            { iso2: 'TT', name: 'Trinidad and Tobago' },
            { iso2: 'MU', name: 'Mauritius' },
            { iso2: 'CY', name: 'Cyprus' },
            { iso2: 'SZ', name: 'Eswatini' },
            { iso2: 'DJ', name: 'Djibouti' },
            { iso2: 'FJ', name: 'Fiji' },
            { iso2: 'RE', name: 'Reunion' },
            { iso2: 'KM', name: 'Comoros' },
            { iso2: 'BT', name: 'Bhutan' },
            { iso2: 'SB', name: 'Solomon Islands' },
            { iso2: 'MT', name: 'Malta' },
            { iso2: 'MV', name: 'Maldives' },
            { iso2: 'BN', name: 'Brunei' },
            { iso2: 'IS', name: 'Iceland' },
            { iso2: 'BS', name: 'Bahamas' },
            { iso2: 'BZ', name: 'Belize' },
            { iso2: 'BB', name: 'Barbados' },
            { iso2: 'VC', name: 'Saint Vincent' },
            { iso2: 'ST', name: 'Sao Tome' },
            { iso2: 'LC', name: 'Saint Lucia' },
            { iso2: 'KI', name: 'Kiribati' },
            { iso2: 'GD', name: 'Grenada' },
            { iso2: 'MH', name: 'Marshall Islands' },
            { iso2: 'AD', name: 'Andorra' },
            { iso2: 'AG', name: 'Antigua and Barbuda' },
            { iso2: 'SC', name: 'Seychelles' },
            { iso2: 'PW', name: 'Palau' },
            { iso2: 'TO', name: 'Tonga' },
            { iso2: 'DM', name: 'Dominica' },
            { iso2: 'FM', name: 'Micronesia' },
            { iso2: 'LI', name: 'Liechtenstein' },
            { iso2: 'NR', name: 'Nauru' },
            { iso2: 'MC', name: 'Monaco' },
            { iso2: 'TV', name: 'Tuvalu' },
            { iso2: 'SM', name: 'San Marino' },
            { iso2: 'VA', name: 'Vatican' }
        ];
    }

    // Otomatik güncelleme sistemini başlat
    startAutoUpdate() {
        // Sayfa yüklendiğinde ilk güncellemeyi başlat
        setTimeout(() => {
            this.initializeGlobalDataUpdate();
        }, 5000); // 5 saniye sonra başla

        // Her 6 saatte bir kontrol et
        setInterval(() => {
            this.initializeGlobalDataUpdate();
        }, 6 * 60 * 60 * 1000); // 6 saat
    }

    // HTML sayfa içeriği oluştur (ESKİ TASARIM - GERİ YÜKLENDİ)
    generateCountryPageHTML(countryName, flagEmoji, iso2, cities, population) {
        // Çeviri fonksiyonu
        const t = (key, fallback) => {
            const translations = {
                'tr': {
                    'back': 'Haritaya Dön',
                    'cities': 'Şehirler', 
                    'admin': 'İdari Merkezler',
                    'population': 'Nüfus',
                    'iso': 'ISO Kodu',
                    'search-cities': 'Şehir ara...'
                },
                'en': {
                    'back': 'Back to Map',
                    'cities': 'Cities',
                    'admin': 'Admin Centers', 
                    'population': 'Population',
                    'iso': 'ISO Code',
                    'search-cities': 'Search cities...'
                }
            };
            
            const lang = this.currentLanguage || 'tr';
            return translations[lang]?.[key] || fallback || key;
        };

        // Nüfus formatla
        const formatPop = (pop) => {
            if (!pop || pop === '0') return 'N/A';
            const num = parseInt(pop);
            if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
            if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
            return num.toLocaleString();
        };

        return `
<!DOCTYPE html>
<html lang="${this.currentLanguage || 'tr'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${countryName} - Globe Explorer</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌍</text></svg>">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: radial-gradient(ellipse at center, #1a1a2e 0%, #16213e 50%, #0f1419 100%);
            background-attachment: fixed;
            min-height: 100vh;
            color: white;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        
        /* Sol üst köşe buton */
        .back-btn {
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1000;
            background: linear-gradient(45deg, #1e90ff, #87ceeb);
            color: white; border: none; padding: 8px 14px; 
            border-radius: 20px; cursor: pointer; font-size: 12px; font-weight: 600;
            transition: all 0.2s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        .back-btn:hover { transform: scale(1.05); box-shadow: 0 5px 20px rgba(30, 144, 255, 0.4); }
        
        .header {
            background: rgba(30, 30, 50, 0.9);
            padding: 20px; 
            border-radius: 15px;
            margin-bottom: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .header-left { display: flex; align-items: center; gap: 20px; }
        .flag { font-size: 48px; }
        .country-title .country-name { 
            font-size: 32px; font-weight: 700; color: #87ceeb; text-align: left;
        }
        .country-population {
            font-size: 16px; color: rgba(255, 255, 255, 0.6); 
            margin-top: 8px; font-weight: 400; text-align: left;
        }
        
        .cities-section {
            background: rgba(30, 30, 50, 0.95); padding: 25px; border-radius: 15px;
            backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .section-header {
            display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
        }
        .section-title { 
            font-size: 20px; color: #87ceeb; margin: 0; 
            display: flex; align-items: center; gap: 10px;
        }
        /* Arama çubuğu stili - NASA'dan esinlenmiş */
        .search-container {
            position: relative;
        }
        .search-input {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            color: white;
            padding: 8px 12px;
            font-size: 14px;
            width: 200px;
            transition: all 0.3s ease;
        }
        .search-input::placeholder {
            color: rgba(255, 255, 255, 0.6);
        }
        .search-input:focus {
            outline: none;
            background: rgba(255, 255, 255, 0.15);
            border-color: #87ceeb;
            box-shadow: 0 0 10px rgba(135, 206, 235, 0.3);
        }
        .cities-grid { 
            display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;
        }
        .city-card {
            background: rgba(255, 255, 255, 0.08); padding: 15px; border-radius: 10px;
            transition: all 0.2s ease; border: 1px solid rgba(255, 255, 255, 0.1);
            cursor: pointer;
        }
        .city-card:hover {
            background: rgba(30, 144, 255, 0.15);
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(30, 144, 255, 0.2);
            border-color: rgba(30, 144, 255, 0.3);
        }
        .city-card[style*="order"] {
            /* Sıralama efekti için hafif vurgu */
            border-color: rgba(135, 206, 235, 0.2);
        }
        .city-card:hover {
            background: rgba(30, 144, 255, 0.2); transform: translateY(-2px);
            border-color: rgba(30, 144, 255, 0.3);
        }
        .city-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .city-name { font-weight: 600; color: #87ceeb; font-size: 16px; }
        .city-population { color: rgba(255, 255, 255, 0.8); font-size: 14px; }
        .city-info { font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 8px; }
        .city-type {
            display: inline-block; padding: 3px 8px; border-radius: 10px;
            font-size: 11px; font-weight: 500;
        }
        .city-type.primary { background: #dc3545; color: white; }
        .city-type.admin { background: #ffc107; color: #000; }
        .city-type.major { background: #17a2b8; color: white; }
        .city-type.minor { background: #6c757d; color: white; }
        
        @media (max-width: 768px) {
            .header { text-align: center; }
            .country-name { font-size: 28px; }
            .cities-grid { grid-template-columns: 1fr; }
            .back-btn { position: relative; top: auto; left: auto; margin-bottom: 20px; }
            .section-header { flex-direction: column; gap: 15px; align-items: stretch; }
            .search-input { width: 100%; }
        }
    </style>
</head>
<body>
    <button class="back-btn" onclick="goBackToMap()">← ${t('back')}</button>
    <div class="container">
        <div class="header">
            <div class="header-left">
                ${flagEmoji ? `<div class="flag">${flagEmoji}</div>` : ''}
                <div class="country-title">
                    <div class="country-name">${countryName}${iso2 ? ` (${iso2})` : ''}</div>
                    <div class="country-population">${t('population')}: ${formatPop(population)}</div>
                </div>
            </div>
        </div>

        <div class="cities-section">
            <div class="section-header">
                <div class="section-title">${countryName} ${t('cities')}</div>
                <div class="search-container">
                    <input type="text" id="citySearchInput" class="search-input" placeholder="${t('search-cities', 'Şehir ara...')}">
                </div>
            </div>
            <div class="cities-grid" id="citiesGrid">
                ${cities.map(city => `
                    <div class="city-card" data-city-name="${(city.city || city.name).toLowerCase()}" 
                         onclick="openCityDetail('${encodeURIComponent(city.city || city.name)}', '${encodeURIComponent(countryName)}', ${city.lat || 0}, ${city.lng || 0})"
                         style="cursor: pointer;">
                        <div class="city-header">
                            <div class="city-name">${city.city || city.name}</div>
                            <div class="city-population">${formatPop(city.population)}</div>
                        </div>
                        <div class="city-info">${city.admin_name || city.country}</div>
                        ${(city.capital === 'primary') ? `<div class="city-type primary">${this.getCityTypeLabel('primary')}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    </div>

    <script>


        // Gelişmiş şehir arama fonksiyonu - Öncelik sırası ile
        function filterCities() {
            const searchTerm = document.getElementById('citySearchInput').value.toLowerCase().trim();
            const cityCards = document.querySelectorAll('.city-card');
            const citiesGrid = document.getElementById('citiesGrid');
            
            if (searchTerm === '') {
                // Arama boşsa tüm şehirleri göster, orijinal sıraya geri döndür
                cityCards.forEach(card => {
                    card.style.display = '';
                    card.style.order = '';
                });
                return;
            }

            const matchedCities = [];
            const startsWithCities = [];
            const containsCities = [];

            cityCards.forEach((card, index) => {
                const cityName = card.getAttribute('data-city-name');
                
                if (cityName.startsWith(searchTerm)) {
                    // İlk öncelik: Arama terimi ile başlayanlar
                    startsWithCities.push({ card, priority: 1, index });
                } else if (cityName.includes(searchTerm)) {
                    // İkinci öncelik: İçinde geçenler
                    containsCities.push({ card, priority: 2, index });
                } else {
                    // Eşleşmeyenler gizlenir
                    card.style.display = 'none';
                }
            });

            // Öncelik sırasına göre birleştir
            const allMatches = [...startsWithCities, ...containsCities];
            let visibleCount = 0;

            allMatches.forEach(({ card }, displayIndex) => {
                card.style.display = '';
                card.style.order = displayIndex; // CSS order ile sıralama
                visibleCount++;
            });

            // Sonuç yoksa console log
            if (visibleCount === 0) {
                console.log('Aranan şehir bulunamadı:', searchTerm);
            } else {
                console.log(visibleCount + ' şehir bulundu. Önce "' + searchTerm + '" ile başlayanlar gösteriliyor.');
            }
        }

        // Arama inputu hazır olduğunda event listener ekle
        document.addEventListener('DOMContentLoaded', function() {
            const searchInput = document.getElementById('citySearchInput');
            if (searchInput) {
                searchInput.addEventListener('input', filterCities);
                
                // Arama alanını temizlemek için ESC tuşu
                searchInput.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape') {
                        this.value = '';
                        filterCities();
                    }
                });
            }
        });
    </script>
</body>
</html>`;
    }

    // Sayfa oluşturma başarı mesajı
    logPageCreation(countryName, cityCount) {
        const pageCreatedMsg = this.currentLanguage === 'tr' ? 'için sayfa oluşturuldu' : 'page created for';
        const placesMsg = this.currentLanguage === 'tr' ? 'yer ile' : 'places';
        
        if (this.currentLanguage === 'tr') {
            this.log(`📄 ${countryName} ${pageCreatedMsg} ${cityCount} ${placesMsg}`, 'success');
        } else {
            this.log(`📄 Page created for ${countryName} with ${cityCount} ${placesMsg}`, 'success');
        }
    }

    // Şehir tipi etiketi 
    getCityTypeLabel(capital) {
        const labels = {
            'tr': {
                'primary': 'Başkent',
                'admin': 'İl Merkezi', 
                'major': 'Büyük Şehir',
                'minor': 'Şehir'
            },
            'en': {
                'primary': 'Capital',
                'admin': 'Admin Center',
                'major': 'Major City', 
                'minor': 'City'
            }
        };
        
        const lang = this.currentLanguage || 'tr';
        return labels[lang]?.[capital] || labels[lang]?.['minor'] || 'City';
    }

    // NASA tarzı hover card - Ülke isimleri için
    showNASACountryCard(countryName, iso2, population) {
        // Remove existing card
        this.hideCountryHoverCard();
        
        // Create hover card for countries
        const card = document.createElement('div');
        card.id = 'hover-info-card';
        
        // Position card on mouse cursor
        const cardX = this.mouseX + 15;
        const cardY = this.mouseY - 40;
        
        card.style.cssText = `
            position: fixed;
            left: ${cardX}px;
            top: ${cardY}px;
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            font-weight: 500;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            z-index: 10000;
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255,255,255,0.2);
            pointer-events: none;
            white-space: nowrap;
            transform: translateX(-50%);
        `;
        
        // Get localized country name
        const localizedName = this.getLocalizedCountryName(countryName) || countryName;
        card.innerHTML = `${localizedName}`;
        
        document.body.appendChild(card);
    }
    
    // Eski handlePolygonClick fonksiyonunu kaldır - artık sadece NASA handler kullanılacak

    // Ülke bilgilerini al (NASA GeoJSON ile uyumlu)
    getCountryInfo(countryName, iso2, iso3) {
        const basicInfo = {
            // NASA verisindeki ülke isimleri ile eşleştir
            'Turkey': { capital: 'Ankara', population: '84M', region: 'Asia/Europe', description: 'Transcontinental country bridging Europe and Asia' },
            'United States of America': { capital: 'Washington DC', population: '331M', region: 'North America', description: 'Federal republic of 50 states' },
            'United States': { capital: 'Washington DC', population: '331M', region: 'North America', description: 'Federal republic of 50 states' },
            'Russian Federation': { capital: 'Moscow', population: '146M', region: 'Europe/Asia', description: 'World\'s largest country by land area' },
            'Russia': { capital: 'Moscow', population: '146M', region: 'Europe/Asia', description: 'World\'s largest country by land area' },
            'Canada': { capital: 'Ottawa', population: '38M', region: 'North America', description: 'The Great White North' },
            'Germany': { capital: 'Berlin', population: '83M', region: 'Europe', description: 'Land of ideas and innovation' },
            'France': { capital: 'Paris', population: '67M', region: 'Europe', description: 'Republic of art and culture' },
            'United Kingdom': { capital: 'London', population: '67M', region: 'Europe', description: 'Island nation in Western Europe' },
            'Italy': { capital: 'Rome', population: '60M', region: 'Europe', description: 'Boot-shaped peninsula in Southern Europe' },
            'Spain': { capital: 'Madrid', population: '47M', region: 'Europe', description: 'Iberian Peninsula country' },
            'Japan': { capital: 'Tokyo', population: '125M', region: 'Asia', description: 'Island nation in East Asia' },
            'China': { capital: 'Beijing', population: '1.4B', region: 'Asia', description: 'World\'s most populous country' },
            'India': { capital: 'New Delhi', population: '1.4B', region: 'Asia', description: 'Subcontinent in South Asia' },
            'Brazil': { capital: 'Brasília', population: '215M', region: 'South America', description: 'Largest South American country' },
            'Australia': { capital: 'Canberra', population: '26M', region: 'Oceania', description: 'Continental island nation' },
            'Mexico': { capital: 'Mexico City', population: '130M', region: 'North America', description: 'Bridge between North and Central America' }
        };

        return basicInfo[countryName] || {
            capital: 'Unknown',
            population: 'Unknown', 
            region: 'Unknown',
            description: `Explore the beauty of ${countryName}`
        };
    }

    // Ülke bayrağı emoji al (Genişletilmiş NASA uyumlu)
    getCountryFlag(iso2) {
        const flags = {
            // Major countries (matches NASA GeoJSON ISO_A2 codes)
            'TR': '🇹🇷', 'US': '🇺🇸', 'RU': '🇷🇺', 'CA': '🇨🇦', 'DE': '🇩🇪',
            'FR': '🇫🇷', 'GB': '🇬🇧', 'IT': '🇮🇹', 'ES': '🇪🇸', 'JP': '🇯🇵',
            'CN': '🇨🇳', 'IN': '🇮🇳', 'BR': '🇧🇷', 'AU': '🇦🇺', 'MX': '🇲🇽',
            // European countries
            'NL': '🇳🇱', 'BE': '🇧🇪', 'CH': '🇨🇭', 'AT': '🇦🇹', 'SE': '🇸🇪',
            'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮', 'PL': '🇵🇱', 'CZ': '🇨🇿',
            'HU': '🇭🇺', 'GR': '🇬🇷', 'PT': '🇵🇹', 'IE': '🇮🇪', 'RO': '🇷🇴',
            // Asian countries  
            'KR': '🇰🇷', 'TH': '🇹🇭', 'VN': '🇻🇳', 'ID': '🇮🇩', 'MY': '🇲🇾',
            'SG': '🇸🇬', 'PH': '🇵🇭', 'TW': '🇹🇼', 'HK': '🇭🇰', 'PK': '🇵🇰',
            // Middle East & Africa
            'SA': '🇸🇦', 'AE': '🇦🇪', 'EG': '🇪🇬', 'IL': '🇮🇱', 'IR': '🇮🇷',
            'ZA': '🇿🇦', 'NG': '🇳🇬', 'KE': '🇰🇪', 'MA': '🇲🇦', 'ET': '🇪🇹',
            // Americas
            'AR': '🇦🇷', 'CL': '🇨🇱', 'CO': '🇨🇴', 'PE': '🇵🇪', 'VE': '🇻🇪'
        };
        return flags[iso2] || '';  // Emoji yoksa boş string döndür
    }

    // Cities dosyasından ülkenin şehirlerini bul - LOCAL VERİ ODAKLI
    async getCountryCitiesFromData(countryName, iso2, iso3) {
        try {
            console.log(`🔍 Searching cities for: ${countryName} (${iso2}/${iso3})`);
            
            // Eğer cities verisi henüz yüklenmediyse yükle
            if (!this.allCities || this.allCities.length === 0) {
                console.log('⏳ Loading cities data...');
                await this.loadAllCitiesData();
                console.log(` Loaded ${this.allCities.length} cities total`);
            }

            // Türkiye için özel filtreleme (sadece iller)
            if (iso2 === 'TR' || countryName.toLowerCase().includes('turkey') || countryName.toLowerCase().includes('türkiye')) {
                return this.getTurkishProvinces();
            }
            
            // Amerika için özel filtreleme (sadece ana şehirler)
            if (iso2 === 'US' || countryName.toLowerCase().includes('united states') || countryName.toLowerCase().includes('america')) {
                return this.getUSMajorCities();
            }

            // Diğer ülkeler için normal filtreleme
            return this.getCountryMajorCities(countryName, iso2, iso3);

            // 4. Kısmi eşleştirme (son çare)
            if (matchedCities.length === 0) {
                const partialMatches = this.allCities.filter(city => 
                    city.country && (
                        city.country.toLowerCase().includes(countryName.toLowerCase()) ||
                        countryName.toLowerCase().includes(city.country.toLowerCase())
                    )
                );
                matchedCities.push(...partialMatches);
                console.log(`📍 Found ${partialMatches.length} cities by partial match`);
            }

            // Tekrarları kaldır (id bazında)
            const uniqueCities = [...new Map(matchedCities.map(city => [city.id, city])).values()];
            console.log(`🎯 Total unique cities found: ${uniqueCities.length}`);

            // TÜRKİYE için özel işlem
            if (countryName === 'Turkey' || iso2 === 'TR') {
                return await this.filterTurkishCities(uniqueCities);
            }

            // Diğer ülkeler için akıllı filtreleme
            const smartFilteredCities = this.smartCityFilter(uniqueCities, countryName);
            console.log(`✅ Final filtered cities: ${smartFilteredCities.length} for ${countryName}`);
            
            return smartFilteredCities;

        } catch (error) {
            console.error(` Error loading cities for ${countryName}:`, error);
            return [];
        }
    }

    // Türkiye için özel filtreleme - İLLER ÖNCELİKLİ VE EKSIKSIZ
    async filterTurkishCities(cities) {
        try {
            // Türk illeri JSON'ını yükle
            const provinceResponse = await fetch('./data/turkish_provinces.json');
            const provinceData = await provinceResponse.json();
            
            // Cities verisinden Türk şehirlerini al
            const cityDataMap = new Map();
            cities.forEach(city => {
                const cityName = city.city || city.name;
                if (!cityDataMap.has(cityName) || city.capital === 'admin') {
                    cityDataMap.set(cityName, city);
                }
            });

            // 81 ili birleştir
            const allProvinces = provinceData.provinces.map(province => {
                const cityData = cityDataMap.get(province.name) || 
                                cityDataMap.get(province.name.toLowerCase()) ||
                                cityDataMap.get(province.name.replace('ı', 'i')) ||
                                {};

                return {
                    name: province.name,
                    code: province.code,
                    region: province.region,
                    city: province.name,
                    country: 'Turkey',
                    iso2: 'TR',
                    iso3: 'TUR',
                    capital: province.name === 'Ankara' ? 'primary' : 'admin',
                    population: cityData.population || '0',
                    lat: cityData.lat || '0',
                    lng: cityData.lng || '0',
                    admin: province.region,
                    id: cityData.id || `TR${province.code}`
                };
            });

            // Popülasyona göre sırala
            allProvinces.sort((a, b) => (parseInt(b.population) || 0) - (parseInt(a.population) || 0));

            this.log(`🇹🇷 All 81 Turkish provinces loaded`, 'success');
            return allProvinces;

        } catch (error) {
            this.log(` Error loading Turkish provinces: ${error.message}`, 'error');
            
            // Fallback: Sadece mevcut cities verisini kullan
            const provinces = cities.filter(city => city.capital === 'admin' || city.capital === 'primary');
            return provinces
                .sort((a, b) => (parseInt(b.population) || 0) - (parseInt(a.population) || 0))
                .slice(0, 81);
        }
    }

    // Diğer ülkeler için akıllı filtreleme - EVRENSEL ADMİN SİSTEMİ
    smartCityFilter(cities, countryName) {
        console.log(` Smart filtering ${cities.length} cities for ${countryName}`);
        
        // Öncelik sırası: ADMIN LEVEL (Eyalet/İl/Bölge) ÖNCE!
        // 1. Başkent (primary)
        // 2. Eyalet/bölge merkezleri (admin) - EN ÖNEMLİ
        // 3. Büyük şehirler (population > 500K)
        // 4. Diğer önemli şehirler

        const capitals = cities.filter(c => c.capital === 'primary');
        const adminCenters = cities.filter(c => c.capital === 'admin'); // EYALET/İL MERKEZLERİ
        const bigCities = cities.filter(c => 
            !c.capital && c.population && parseInt(c.population) > 500000
        );
        const otherCities = cities.filter(c => 
            c.capital === 'minor' && c.population && parseInt(c.population) > 200000
        );

        console.log(`   - Capitals: ${capitals.length}`);
        console.log(`   - Admin Centers: ${adminCenters.length}`);
        console.log(`   - Big Cities: ${bigCities.length}`);
        console.log(`   - Other Cities: ${otherCities.length}`);

        // ADMİN CENTERS (Eyaletler/İller) MUTLAKA DAHİL!
        const prioritizedCities = [
            ...capitals,
            ...adminCenters,  // Bu ülkenin TÜM eyalet/il merkezleri
            ...bigCities,
            ...otherCities
        ];

        // Tekrar kontrolü (id bazında)
        const uniqueCities = [...new Map(prioritizedCities.map(city => [city.id, city])).values()];
        console.log(`   - Unique cities after deduplication: ${uniqueCities.length}`);

        // Admin centers'ı başa al, sonra population sıralaması
        const sortedCities = uniqueCities.sort((a, b) => {
            // Admin centers önce
            if (a.capital === 'admin' && b.capital !== 'admin') return -1;
            if (b.capital === 'admin' && a.capital !== 'admin') return 1;
            // Primary capital en başta
            if (a.capital === 'primary' && b.capital !== 'primary') return -1;
            if (b.capital === 'primary' && a.capital !== 'primary') return 1;
            // Sonra population
            return (parseInt(b.population) || 0) - (parseInt(a.population) || 0);
        });

        // Ülkeye göre ADMIN odaklı limitler
        const adminLimits = {
            'United States': 60,    // 50 eyalet + büyük şehirler
            'United States of America': 60,
            'Russia': 90,           // 85 federal subject + büyükler  
            'Russian Federation': 90,
            'China': 80,            // 34 province + büyükler
            'India': 80,            // 28 eyalet + 8 union territory
            'Canada': 50,           // 10 eyalet + 3 territory + büyükler
            'Brazil': 70,           // 26 eyalet + 1 federal district
            'Australia': 40,        // 6 eyalet + 2 territory + büyükler
            'Germany': 25,          // 16 federal eyalet + büyükler
            'France': 40,           // 18 bölge + büyükler
            'Italy': 35,            // 20 bölge + büyükler
            'Spain': 30,            // 17 özerk topluluk + büyükler
            'United Kingdom': 30,   // İngiltere bölgeleri + İskoçya/Galler
            'Japan': 60,            // 47 prefektörlük + büyükler
            'Mexico': 50,           // 32 federal entity
            'Argentina': 35,        // 23 eyalet + büyükler
            'South Africa': 25,     // 9 eyalet + büyükler
            'Nigeria': 45,          // 36 eyalet + FCT
            'Indonesia': 50,        // 34 eyalet + büyükler
        };

        const limit = adminLimits[countryName] || 25; // Default: 25 admin center + büyük şehir
        const finalCities = sortedCities.slice(0, limit);
        
        console.log(` Smart filter result: ${finalCities.length} cities for ${countryName} (limit: ${limit})`);
        
        return finalCities;
    }

    // Tüm cities verisini yükle
    async loadAllCitiesData() {
        try {
            console.log('⏳ Loading cities database...');
            
            // Önce dünya başkentlerini yükle
            await this.loadWorldCapitals();
            
            const response = await fetch('./data/worldcities.csv');
            const csvText = await response.text();
            console.log(` CSV file size: ${csvText.length} characters`);
            
            this.allCities = this.parseCSV(csvText);
            console.log(`✅ Loaded ${this.allCities.length} cities from database`);
            
            // Örnek şehirler göster
            const sampleCities = this.allCities.slice(0, 10).map(c => `${c.city}, ${c.country}`);
            console.log('🌍 Sample cities:', sampleCities.join(' | '));
            
            // Ülke dağılımı göster
            const countries = [...new Set(this.allCities.map(c => c.country))];
            console.log(`🗺️ Cities from ${countries.length} countries`);
            
            // Dünya başkentlerini mevcut veriye ekle/güncelle
            this.mergeWorldCapitals();
            
            // İlk birkaç şehiri göster
            console.log('Sample cities:', this.allCities.slice(0, 5));
            
        } catch (error) {
            console.error(` Error loading cities database:`, error);
            this.allCities = [];
        }
    }

    // Dünya başkentlerini ve önemli şehirleri yükle
    async loadWorldCapitals() {
        try {
            console.log('🏛️ Loading world capitals...');
            const response = await fetch('./data/world-capitals.json');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: world-capitals.json not found`);
            }
            
            this.worldCapitals = await response.json();
            console.log(`✅ Loaded ${this.worldCapitals.length} world capitals and major cities`);
        } catch (error) {
            console.warn(`⚠️ World capitals file not found, using built-in data:`, error.message);
            
            // Basit başkent verisi kullan
            this.worldCapitals = this.getBuiltInCapitals();
            console.log(`✅ Using ${this.worldCapitals.length} built-in capitals`);
        }
    }
    
    // Yerleşik başkent verisi
    getBuiltInCapitals() {
        return [
            { city: "Ankara", country: "Turkey", lat: 39.9334, lng: 32.8597, capital: "primary", population: 5663322 },
            { city: "Istanbul", country: "Turkey", lat: 41.0082, lng: 28.9784, capital: "major", population: 15462452 },
            { city: "London", country: "United Kingdom", lat: 51.5074, lng: -0.1278, capital: "primary", population: 9648110 },
            { city: "Paris", country: "France", lat: 48.8566, lng: 2.3522, capital: "primary", population: 11017230 },
            { city: "Berlin", country: "Germany", lat: 52.5200, lng: 13.4050, capital: "primary", population: 3669491 },
            { city: "Madrid", country: "Spain", lat: 40.4168, lng: -3.7038, capital: "primary", population: 6642000 },
            { city: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964, capital: "primary", population: 4342212 },
            { city: "Washington", country: "United States", lat: 38.9072, lng: -77.0369, capital: "primary", population: 5379184 },
            { city: "New York", country: "United States", lat: 40.7128, lng: -74.0060, capital: "major", population: 18804000 },
            { city: "Los Angeles", country: "United States", lat: 34.0522, lng: -118.2437, capital: "major", population: 12448000 },
            { city: "Moscow", country: "Russia", lat: 55.7558, lng: 37.6173, capital: "primary", population: 12537954 },
            { city: "Beijing", country: "China", lat: 39.9042, lng: 116.4074, capital: "primary", population: 21893095 },
            { city: "Shanghai", country: "China", lat: 31.2304, lng: 121.4737, capital: "major", population: 28516904 },
            { city: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, capital: "primary", population: 37340000 },
            { city: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.9780, capital: "primary", population: 25514000 },
            { city: "Delhi", country: "India", lat: 28.7041, lng: 77.1025, capital: "primary", population: 32941308 },
            { city: "Mumbai", country: "India", lat: 19.0760, lng: 72.8777, capital: "major", population: 20411274 },
            { city: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, capital: "major", population: 5367206 },
            { city: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357, capital: "primary", population: 21322750 },
            { city: "Dubai", country: "United Arab Emirates", lat: 25.2048, lng: 55.2708, capital: "major", population: 3331420 }
        ];
    }

    // Dünya başkentlerini mevcut veriye birleştir
    mergeWorldCapitals() {
        if (!this.worldCapitals || !this.allCities) {
            console.log('⚠️ Missing data for capitals merge');
            return;
        }
        
        let added = 0;
        let updated = 0;
        
        try {
            for (const capital of this.worldCapitals) {
                if (!capital.city || !capital.country) continue; // Geçersiz veri atla
                
                // Aynı şehir zaten var mı kontrol et
                const existingIndex = this.allCities.findIndex(city => 
                    city.city?.toLowerCase() === capital.city.toLowerCase() &&
                    (city.iso2 === capital.iso2 || city.country?.toLowerCase() === capital.country.toLowerCase())
                );
                
                if (existingIndex !== -1) {
                    // Mevcut şehri güncelle (daha doğru veriyle)
                    this.allCities[existingIndex] = { ...this.allCities[existingIndex], ...capital };
                    updated++;
                } else {
                    // Yeni şehir ekle
                    this.allCities.push(capital);
                    added++;
                }
            }
            
            console.log(`✅ World capitals merge: ${added} added, ${updated} updated`);
        } catch (error) {
            console.error('❌ Error merging capitals:', error);
        }
    }

    // Ülke adı varyasyonları (eşleştirme için)
    getCountryNameVariations(countryName, iso2, iso3) {
        const variations = [countryName];
        
        // Bilinen ülke adı eşleştirmeleri - GENİŞ LİSTE
        const countryMappings = {
            'United States of America': ['United States', 'USA', 'US'],
            'United States': ['United States of America', 'USA', 'US'],
            'Russian Federation': ['Russia'],
            'Russia': ['Russian Federation'],
            'Korea, South': ['South Korea', 'Republic of Korea'],
            'Korea, North': ['North Korea', 'Democratic People\'s Republic of Korea'],
            'United Kingdom': ['UK', 'Britain', 'Great Britain'],
            'Iran': ['Islamic Republic of Iran'],
            'Syria': ['Syrian Arab Republic'],
            'Venezuela': ['Bolivarian Republic of Venezuela'],
            'Bolivia': ['Plurinational State of Bolivia'],
            'Tanzania': ['United Republic of Tanzania'],
            'Macedonia': ['North Macedonia', 'Former Yugoslav Republic of Macedonia'],
            'Congo': ['Democratic Republic of the Congo', 'Congo (Kinshasa)'],
            'Congo, Republic of the': ['Congo', 'Congo (Brazzaville)'],
            'Ivory Coast': ['Côte d\'Ivoire'],
            'Côte d\'Ivoire': ['Ivory Coast'],
            'Czech Republic': ['Czechia'],
            'Myanmar': ['Burma'],
            'Burma': ['Myanmar'],
            'East Timor': ['Timor-Leste'],
            'Timor-Leste': ['East Timor'],
            'Laos': ['Lao People\'s Democratic Republic'],
            'Vietnam': ['Viet Nam'],
            'Brunei': ['Brunei Darussalam'],
            'Cape Verde': ['Cabo Verde'],
            'Eswatini': ['Swaziland'],
            'Swaziland': ['Eswatini'],
            'Gambia': ['The Gambia'],
            'The Gambia': ['Gambia'],
            'Bahamas': ['The Bahamas'],
            'The Bahamas': ['Bahamas']
        };

        if (countryMappings[countryName]) {
            variations.push(...countryMappings[countryName]);
        }

        return variations;
    }

    // Ulusal başkent tespiti
    isNationalCapital(cityName, countryName) {
        const nationalCapitals = {
            'United States': ['washington'],
            'United States of America': ['washington'],
            'United Kingdom': ['london'],
            'Germany': ['berlin'],
            'France': ['paris'],
            'Italy': ['rome'],
            'Spain': ['madrid'],
            'Japan': ['tokyo'],
            'China': ['beijing'],
            'India': ['new delhi', 'delhi'],
            'Russia': ['moscow'],
            'Russian Federation': ['moscow'],
            'Brazil': ['brasilia'],
            'Canada': ['ottawa'],
            'Australia': ['canberra'],
            'Mexico': ['mexico city'],
            'Argentina': ['buenos aires'],
            'South Africa': ['cape town', 'pretoria', 'johannesburg'],
            'Egypt': ['cairo'],
            'Nigeria': ['abuja'],
            'Turkey': ['ankara']
        };
        
        const capitals = nationalCapitals[countryName];
        return capitals && capitals.some(capital => 
            cityName.toLowerCase().includes(capital.toLowerCase())
        );
    }

    // Eyalet/il başkenti tespiti
    isStateCapital(city, countryName) {
        // capital === 'admin' zaten eyalet başkentini gösterir
        // Ek kontroller eklenebilir
        const adminName = city.admin_name ? city.admin_name.toLowerCase() : '';
        const cityName = city.city ? city.city.toLowerCase() : '';
        
        // Şehir adı ile eyalet adı aynıysa genellikle eyalet başkentidir
        return adminName && cityName.includes(adminName.split(' ')[0]);
    }

    // Ülke bazında özel limitler
    getCountrySpecificLimits(countryName) {
        const limits = {
            'United States': { total: 65, stateCapitals: 50, majorCities: 15 },
            'United States of America': { total: 65, stateCapitals: 50, majorCities: 15 },
            'Russia': { total: 90, stateCapitals: 85, majorCities: 15 },
            'Russian Federation': { total: 90, stateCapitals: 85, majorCities: 15 },
            'China': { total: 80, stateCapitals: 34, majorCities: 20 },
            'India': { total: 80, stateCapitals: 36, majorCities: 20 },
            'Brazil': { total: 70, stateCapitals: 27, majorCities: 15 },
            'Canada': { total: 50, stateCapitals: 13, majorCities: 10 },
            'Germany': { total: 25, stateCapitals: 16, majorCities: 9 },
            'France': { total: 40, stateCapitals: 18, majorCities: 12 },
            'Italy': { total: 35, stateCapitals: 20, majorCities: 10 },
            'Spain': { total: 30, stateCapitals: 17, majorCities: 8 },
            'United Kingdom': { total: 30, stateCapitals: 15, majorCities: 10 },
            'Japan': { total: 60, stateCapitals: 47, majorCities: 13 },
            'Australia': { total: 40, stateCapitals: 8, majorCities: 12 },
            'Mexico': { total: 50, stateCapitals: 32, majorCities: 10 },
            'Indonesia': { total: 50, stateCapitals: 34, majorCities: 10 },
            'Turkey': { total: 85, stateCapitals: 81, majorCities: 4 } // Türkiye özel
        };
        
        return limits[countryName] || { total: 30, stateCapitals: 20, majorCities: 10 };
    }

    // Hover card göster
    showCountryHoverCard(countryName, properties, iso2) {
        if (!this.elements.countryCard) return;
        
        const translatedCountryName = this.getCountryNameInCurrentLanguage(countryName);
        const flagEmoji = this.getCountryFlag(iso2);
        const population = properties.POP_EST ? this.formatPopulation(properties.POP_EST) : this.getTranslation('ui', 'unknown');
        const populationLabel = this.getTranslation('ui', 'population');
        
        this.elements.countryCard.innerHTML = `
            <div class="country-flag">${flagEmoji}</div>
            <div class="country-details">
                <div class="country-name">${this.escapeHtml(translatedCountryName)}</div>
                <div class="country-code">ISO: ${iso2 || this.getTranslation('ui', 'unknown')}</div>
                <div class="country-pop">${populationLabel}: ${population}</div>
            </div>
        `;
        
        this.elements.countryCard.style.display = 'block';
    }

    // Show Turkey province hover card
    showTurkeyProvinceCard(provinceName, aqi, properties) {
        console.log('🏛️ Showing Turkey province card:', provinceName);
        
        // Remove existing card
        this.hideCountryHoverCard();
        
        // Create hover card
        const card = document.createElement('div');
        card.id = 'hover-info-card';
        
        // Position card on the province center (use mouse as fallback)
        let cardX = this.mouseX + 15;
        let cardY = this.mouseY - 40;
        
        // Try to get province center coordinates if available
        if (properties && properties.centerLat && properties.centerLng) {
            try {
                const screenCoords = this.globe.getScreenCoords(properties.centerLat, properties.centerLng);
                if (screenCoords) {
                    cardX = screenCoords.x; // Center on province
                    cardY = screenCoords.y - 30; // 30px above center
                    
                    // Keep card within screen bounds  
                    const cardWidth = 80; // Smaller estimated card width
                    const cardHeight = 28; // Smaller estimated card height
                    
                    if (cardX - cardWidth/2 < 10) cardX = cardWidth/2 + 10;
                    if (cardX + cardWidth/2 > window.innerWidth - 10) cardX = window.innerWidth - cardWidth/2 - 10;
                    if (cardY < 10) cardY = screenCoords.y + 35; // Show below if no space above
                    if (cardY + cardHeight > window.innerHeight - 10) cardY = window.innerHeight - cardHeight - 10;
                }
            } catch (e) {
                console.log('Using mouse position as fallback');
            }
        }
        
        card.style.cssText = `
            position: fixed;
            left: ${cardX}px;
            top: ${cardY}px;
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            font-weight: 500;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            z-index: 10000;
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255,255,255,0.2);
            pointer-events: none;
            white-space: nowrap;
            transform: translateX(-50%);
        `;
        
        card.innerHTML = `${provinceName}`;
        
        document.body.appendChild(card);
    }

    // Show USA state hover card
    showUSAStateCard(stateName, aqi, properties) {
        console.log('🇺🇸 Showing USA state card:', stateName);
        
        // Remove existing card
        this.hideCountryHoverCard();
        
        // Create hover card
        const card = document.createElement('div');
        card.id = 'hover-info-card';
        
        // Position card on the state center (use mouse as fallback)
        let cardX = this.mouseX + 15;
        let cardY = this.mouseY - 40;
        
        // Try to get state center coordinates if available
        if (properties && properties.centerLat && properties.centerLng) {
            try {
                const screenCoords = this.globe.getScreenCoords(properties.centerLat, properties.centerLng);
                if (screenCoords) {
                    cardX = screenCoords.x; // Center on state
                    cardY = screenCoords.y - 30; // 30px above center
                    
                    // Keep card within screen bounds
                    const cardWidth = 80; // Smaller estimated card width
                    const cardHeight = 28; // Smaller estimated card height
                    
                    if (cardX - cardWidth/2 < 10) cardX = cardWidth/2 + 10;
                    if (cardX + cardWidth/2 > window.innerWidth - 10) cardX = window.innerWidth - cardWidth/2 - 10;
                    if (cardY < 10) cardY = screenCoords.y + 35; // Show below if no space above
                    if (cardY + cardHeight > window.innerHeight - 10) cardY = window.innerHeight - cardHeight - 10;
                }
            } catch (e) {
                console.log('Using mouse position as fallback');
            }
        }
        
        card.style.cssText = `
            position: fixed;
            left: ${cardX}px;
            top: ${cardY}px;
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            font-weight: 500;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            z-index: 10000;
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255,255,255,0.2);
            pointer-events: none;
            white-space: nowrap;
            transform: translateX(-50%);
        `;
        
        card.innerHTML = `${stateName}`;
        
        document.body.appendChild(card);
    }

    // Get AQI color for display
    getAQIColor(aqi) {
        if (!aqi) return '#00e640'; // Default green
        if (aqi >= 300) return '#7e0023'; // 300+ Bordo
        if (aqi >= 201) return '#8f3f97'; // 201-300 Mor
        if (aqi >= 151) return '#ff0000'; // 151-200 Kırmızı
        if (aqi >= 101) return '#ff7e00'; // 101-150 Turuncu
        if (aqi >= 51) return '#ffff00';  // 51-100 Sarı
        return '#00e640'; // 0-50 Yeşil
    }

    // Get AQI level description (Turkish)
    getAQILevel(aqi) {
        if (!aqi) return 'İyi';
        if (aqi >= 300) return 'Tehlikeli';
        if (aqi >= 201) return 'Çok Sağlıksız';
        if (aqi >= 151) return 'Sağlıksız';
        if (aqi >= 101) return 'Hassas Gruplar için Sağlıksız';
        if (aqi >= 51) return 'Orta';
        return 'İyi';
    }

    // Get AQI level description (English)
    getAQILevelEn(aqi) {
        if (!aqi) return 'Good';
        if (aqi >= 300) return 'Hazardous';
        if (aqi >= 201) return 'Very Unhealthy';
        if (aqi >= 151) return 'Unhealthy';
        if (aqi >= 101) return 'Unhealthy for Sensitive Groups';
        if (aqi >= 51) return 'Moderate';
        return 'Good';
    }

    // Hover card gizle - TÜM HOVER CARDLARI TEMİZLE
    hideCountryHoverCard() {
        // Tüm hover card'ları temizle (farklı id'lere sahip olabilir)
        const existingCards = document.querySelectorAll('[id*="hover"], [id*="card"], [class*="hover"], [class*="tooltip"], .nasa-hover, .country-hover, .province-hover, .state-hover');
        existingCards.forEach(card => card.remove());
        
        // Güvenli silme için spesifik ID'ler
        const cardIds = ['hover-info-card', 'country-hover-card', 'province-hover-card', 'state-hover-card', 'nasa-hover-card', 'point-hover-card', 'air-pollution-card'];
        cardIds.forEach(id => {
            const card = document.getElementById(id);
            if (card) card.remove();
        });
    }
    
    // Point hover card göster
    showPointHoverCard(point) {
        console.log('🎯 showPointHoverCard called with:', point);
        console.log('🎯 Mouse position:', { x: this.mouseX, y: this.mouseY });
        console.log('🎯 Point properties:', { 
            isUserLocation: point.isUserLocation, 
            city: point.city, 
            country: point.country,
            locationLabel: point.locationLabel 
        });
        
        this.hideCountryHoverCard();
        
        const card = document.createElement('div');
        card.id = 'point-hover-card';
        
        // Point'in ekran koordinatlarını al
        let cardX = this.mouseX;
        let cardY = this.mouseY + 20;
        
        if (point.lat && point.lng) {
            const screenCoords = this.globe.getScreenCoords(point.lat, point.lng);
            if (screenCoords) {
                cardX = screenCoords.x;
                cardY = screenCoords.y + 20;
            }
        }
        
        card.style.cssText = `
            position: fixed;
            left: ${cardX}px;
            top: ${cardY}px;
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            font-weight: 500;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            z-index: 10000;
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255,255,255,0.2);
            pointer-events: none;
            white-space: nowrap;
            transform: translateX(-50%);
        `;
        
        // İçerik oluştur - pointLabel ile aynı mantık
        let label = '';
        
        if (point.isUserLocation) {
            // Kullanıcı konumu için şehir ismi göster
            const name = point.city || point.locationLabel || '';
            const originalCountry = point.country || '';
            
            // Ülke adını çeviri sistemiyle çevir
            const translatedCountry = originalCountry ? this.getCountryNameInCurrentLanguage(originalCountry) : '';
            
            if (name && translatedCountry) {
                label = `${name}, ${translatedCountry}`;
            } else if (name) {
                label = name;
            } else {
                const locationText = window.i18n ? window.i18n.t('label.your.location', 'Your Location') : 'Your Location';
                label = locationText;
            }
        } else {
            // Normal şehir noktaları için
            const name = point.name || point.city || '';
            const originalCountry = point.country || '';
            
            // Get localized country name
            const localizedCountry = originalCountry ? this.getCountryNameInCurrentLanguage(originalCountry) : '';
            
            label = localizedCountry && localizedCountry !== name ? `${name}, ${localizedCountry}` : name;
        }
        
        card.innerHTML = `${label}`;
        document.body.appendChild(card);
    }
    
    // Ülkenin şehirlerini geçici olarak highlight et
    highlightCountryCities(iso2, countryName) {
        const cities = this.countryIndex.get(iso2) || [];
        
        if (cities.length === 0) {
            this.log(`⚠️ No cities found for ${countryName}`, 'warning');
            return;
        }
        
        // NASA tarzı şehir noktaları - ŞİMDİLİK DEVRE DIŞI (çakışma önlemek için)
        /*
        const cityPoints = cities.slice(0, 50).map(city => ({
            lat: city.lat,
            lng: city.lng,
            color: city.population > 1000000 ? '#ff4444' : '#ff8844',
            size: Math.max(0.3, Math.min(0.9, (city.population || 0) / 1500000)),
            label: `<b>${city.name}</b><br/>${this.formatPopulation(city.population || 0)}`
        }));
        
        this.globe.pointsData(cityPoints)
            .pointColor('color')
            .pointAltitude(0.015)
            .pointRadius('size')
            .pointLabel('label');
        */
        
        // Points'leri temizle
        this.clearAllPoints();
        
        console.log(`✨ City points disabled for ${countryName} to prevent conflicts`);
    }
    
    // Yeni hover handler
    handleCountryHover(polygon, event) {
        // Clear any existing timeout
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = null;
        }
        
        // Debounce hover to avoid flicker
        this.hoverTimeout = setTimeout(() => {
            this.showCountryHoverCard(polygon);
            
            // Dinamik arka plan sistemi kaldırıldı
        }, 80);
    }
    
    // Country hover card gösterme
    showCountryHoverCard(polygon) {
        if (!polygon || !polygon.properties) {
            this.hideCountryHoverCard();
            return;
        }
        
        const countryName = polygon.properties.NAME || polygon.properties.ADMIN || 'Bilinmeyen Ülke';
        const iso2 = isoFromFeature(polygon);
        const cityCount = this.countryIndex.get(iso2)?.length || 0;
        
        const flagUrl = iso2 ? `https://flagcdn.com/48x36/${iso2.toLowerCase()}.png` : '';
        
        const cardHTML = `
            <div class="card-content">
                ${flagUrl ? `<img src="${flagUrl}" alt="${countryName} Flag" class="flag-img" onerror="this.style.display='none'">` : ''}
                <div class="card-info">
                    <h4>${this.escapeHtml(countryName)}</h4>
                    <p>Cities: ${cityCount}</p>
                </div>
            </div>
            <div class="hover-hint">Click to open city panel</div>
        `;
        
        this.elements.countryHoverCard.innerHTML = cardHTML;
        this.elements.countryHoverCard.classList.remove('hidden');
    }

    // Country panel açma
    openCountryPanel(polygon) {
        if (!polygon || !polygon.properties) return;
        
        const countryName = polygon.properties.NAME || polygon.properties.ADMIN || 'Bilinmeyen Ülke';
        const iso2 = isoFromFeature(polygon);
        const cities = this.countryIndex.get(iso2) || [];
        
        this.currentCountryISO = iso2;
        this.selectedCountry = { name: countryName, iso2: iso2 };
        
        // Panel header
        this.elements.countryPanelTitle.textContent = `${countryName} — Cities`;
        
        // Panel meta
        const flagUrl = iso2 ? `https://flagcdn.com/48x36/${iso2.toLowerCase()}.png` : '';
        this.elements.countryMeta.innerHTML = `
            <div class="meta-info">
                ${flagUrl ? `<img src="${flagUrl}" alt="${countryName} Flag" class="flag-img" onerror="this.style.display='none'">` : ''}
                <div>
                    <h4>${this.escapeHtml(countryName)}</h4>
                    <p>${cities.length} cities found</p>
                </div>
            </div>
        `;
        
        // City list
        this.renderCityList(cities);
        
        // Open panel
        this.elements.countryPanel.classList.remove('hidden');
        this.elements.countryPanel.classList.add('open');
        
        // Focus close button for accessibility
        this.elements.closeCountryPanel.focus();
        
        // Update points if checkbox is checked
        if (this.elements.toggleCountryPoints.checked) {
            this.updateCountryPoints();
        }
    }
    
    renderCityList(cities) {
        if (cities.length === 0) {
            this.elements.countryCityList.innerHTML = '<p style="text-align: center; color: #666;">No cities found</p>';
            return;
        }
        
        const cityRows = cities.map(city => {
            const originalCityName = city.name || city.city || '';
            const translatedCityName = this.getCityNameInCurrentLanguage(originalCityName);
            const populationText = city.population ? this.formatPopulation(city.population) : '—';
            
            return `
            <div class="city-row">
                <div class="city-info">
                    <div class="name">${this.escapeHtml(translatedCityName)}</div>
                    <div class="meta">${populationText}</div>
                </div>
                <div class="actions">
                    <button class="zoom-btn" onclick="globeApp.zoomToCity(${city.lat}, ${city.lng}, '${this.escapeHtml(translatedCityName)}')">Zoom</button>
                </div>
            </div>
            `;
        }).join('');
        
        this.elements.countryCityList.innerHTML = cityRows;
    }
    
    closeCountryPanel() {
        this.elements.countryPanel.classList.remove('open');
        this.elements.countryPanel.classList.add('hidden');
        
        // Toggle'ı kapat
        this.elements.toggleCountryPoints.checked = false;
        
        // MERKEZI SİSTEM KULLAN - kullanıcı konumu korunur
        this.clearAllPoints();
        
        this.currentCountryISO = null;
        this.selectedCountry = null;
        
        this.log(' Country panel closed', 'info');
    }

    // === DİNAMİK ARKA PLAN SİSTEMİ ===
    
    // Dinamik arka plan sistemini başlat
    initDynamicBackground() {
        this.backgroundElement = document.getElementById('dynamicBackground');
        if (this.backgroundElement) {
            console.log('✅ Dinamik arka plan sistemi aktif');
            // Varsayılan arka planı yükle
            this.resetToDefaultBackground();
        }
    }
    
    // Ülkeye göre arka planı değiştir
    changeBackgroundForCountry(countryName) {
        if (!this.backgroundElement) return;
        
        // Eğer aynı ülke ise değiştirme
        if (this.currentBackgroundCountry === countryName) return;
        
        // Uygun arka planı bul
        const backgroundImage = COUNTRY_BACKGROUNDS[countryName] || COUNTRY_BACKGROUNDS['default'];
        
        console.log(`🖼️ Arka plan değiştiriliyor: ${countryName} -> ${backgroundImage}`);
        
        // Arka planı değiştir
        this.backgroundElement.style.backgroundImage = `url('${backgroundImage}')`;
        this.backgroundElement.classList.add('active');
        
        // Mevcut ülkeyi kaydet
        this.currentBackgroundCountry = countryName;
    }
    
    // Varsayılan arka plana dön
    resetToDefaultBackground() {
        if (!this.backgroundElement) return;
        
        console.log('🖼️ Varsayılan arka plana dönülüyor');
        
        this.backgroundElement.style.backgroundImage = `url('${COUNTRY_BACKGROUNDS['default']}')`;
        this.backgroundElement.classList.add('active');
        this.currentBackgroundCountry = null;
    }
    
    // Arka planı gizle
    hideBackground() {
        if (!this.backgroundElement) return;
        
        this.backgroundElement.classList.remove('active');
        this.currentBackgroundCountry = null;
    }
    
    toggleCountryPoints(show) {
        if (show && this.currentCountryISO) {
            this.updateCountryPoints();
        } else {
            // MERKEZI SİSTEM KULLAN - kullanıcı konumu korunur
            this.clearAllPoints();
        }
    }
    
    updateCountryPoints() {
        if (!this.currentCountryISO) return;
        
        const cities = this.countryIndex.get(this.currentCountryISO) || [];
        const threshold = this.thresholdByAltitude();
        const points = this.countryPoints(cities, threshold);
        
        // MERKEZI SİSTEM KULLAN - doğrudan globe.pointsData kullanma
        this.updateGlobePoints(points);
        
        console.log(` Country points updated for ${this.currentCountryISO}: ${points.length} cities`);
    }
    
    thresholdByAltitude() {
        const altitude = this.globe.pointOfView().altitude;
        
        if (altitude > 3) return 1000000;    // >= 1M
        if (altitude > 2) return 500000;     // >= 500K
        if (altitude > 1.5) return 100000;   // >= 100K
        return 50000;                        // >= 50K
    }
    
    countryPoints(cities, minPop) {
        const filteredCities = cities.filter(city => (city.population || 0) >= minPop);
        const cappedCities = filteredCities.slice(0, 300); // Cap to 300 items
        
        return cappedCities.map(city => ({
            lat: city.lat,
            lng: city.lng,
            color: '#2e7dd7',
            size: Math.max(0.25, Math.min(0.8, (city.population || 0) / 2000000)),
            label: `${city.name} (${this.formatPopulation(city.population || 0)})`
        }));
    }
    
    debouncedPOVChange() {
        if (this.povChangeTimeout) {
            clearTimeout(this.povChangeTimeout);
        }
        
        this.povChangeTimeout = setTimeout(() => {
            if (this.elements.toggleCountryPoints.checked && this.currentCountryISO) {
                this.updateCountryPoints();
            }
        }, 120);
    }
    
    zoomToCity(lat, lng, name) {
        this.globe.pointOfView({ 
            lat: lat, 
            lng: lng, 
            altitude: 1.6 
        }, 1200);
        
        this.log(` Zooming to ${name}`, 'info');
    }
    
    handleGlobeClick(point, event) {
        // Boş alana tıklama - hover card'ı gizle
        this.hideCountryHoverCard();
        
        // Şehir işaretleyicisini temizle (mevcut konum korunur)
        this.clearCityMarker();
        
        // Varsayılan arka plana dön
        this.resetToDefaultBackground();
        
        console.log('🌍 Globe tıklandı - şehir işaretleyici temizlendi');
    }
    
    handlePointHover(point, prevPoint) {
        console.log('🔍 Point hover event triggered:', { point, prevPoint });
        
        // Önceki hover card'ı temizle
        this.hideCountryHoverCard();
        
        if (point) {
            // Point üzerine hover - card göster
            this.showPointHoverCard(point);
            console.log('📍 Point hover card shown for:', point.name || point.city || 'Unknown point');
        } else {
            console.log('📍 Point hover ended');
        }
    }
    
    checkPointHover(event) {
        // Event ve mouse pozisyonunu kontrol et
        if (!event || event.clientX === undefined || event.clientY === undefined) {
            return;
        }
        
        // Mouse pozisyonunu globe koordinatlarına çevir
        const rect = this.elements.globeViz.getBoundingClientRect();
        const x = (event.clientX || 0) - rect.left;
        const y = (event.clientY || 0) - rect.top;
        
        // Mevcut points'leri kontrol et
        const tolerance = 20; // Pixel tolerance
        let hoveredPoint = null;
        
        this.currentPoints.forEach(point => {
            if (point.lat && point.lng) {
                // 3D koordinatları 2D ekran koordinatlarına çevir
                const screenCoords = this.globe.getScreenCoords(point.lat, point.lng);
                if (screenCoords) {
                    const distance = Math.sqrt(
                        Math.pow(screenCoords.x - x, 2) + 
                        Math.pow(screenCoords.y - y, 2)
                    );
                    
                    if (distance < tolerance) {
                        hoveredPoint = point;
                    }
                }
            }
        });
        
        // Hover durumu değişti mi?
        if (hoveredPoint !== this.currentHoveredPoint) {
            this.currentHoveredPoint = hoveredPoint;
            
            if (hoveredPoint) {
                this.showPointHoverCard(hoveredPoint);
                console.log('📍 Manual hover detected:', hoveredPoint.name || hoveredPoint.city || 'Unknown');
            } else {
                this.hideCountryHoverCard();
            }
        }
    }
    
    resetView() {
        const resetMsg = window.i18n ? window.i18n.t('msg.resetting.view', 'Resetting view...') : 'Resetting view...';
        this.log(` ${resetMsg}`, 'info');
        
        // Otomatik döndürmeyi durdur
        this.isAutoRotating = false;
        this.globe.controls().autoRotate = false;
        
        // Başlangıç pozisyonuna dön
        this.globe.pointOfView({ 
            lat: 20, 
            lng: 0, 
            altitude: 2.2 
        }, 1500);
        
        // SADECE GEÇİCİ MARKERLARİ temizle (kullanıcı konumunu KORU!)
        this.clearAllPoints();
        this.selectedCountry = null;
    }
    
    requestUserLocation() {
        if (!navigator.geolocation) {
            const noSupportMsg = window.i18n ? window.i18n.t('msg.location.no.support', 'Browser does not support location') : 'Browser does not support location';
            this.log(`⚠️ ${noSupportMsg}`, 'warning');
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => this.handleUserLocation(position),
            (error) => this.handleLocationError(error),
            { 
                timeout: 15000, 
                enableHighAccuracy: true, // Yüksek doğruluk aç
                maximumAge: 60000 // 1 dakika cache
            }
        );
    }
    
    handleUserLocation(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        console.log(' Kullanıcı konumu alındı:', lat, lng);
        
        this.userLocation = { lat, lng };
        
        // Şehir verisi yüklü mü kontrol et
        if (!this.cities || this.cities.length === 0) {
            console.log(' Şehir verisi henüz yüklenmedi, bekleyin...');
            // Demo veri kullan geçici olarak
            this.cities = this.getDemoData();
        }
        
        // En yakın şehri bul
        let nearestCity = this.findNearestCity(lat, lng);
        let locationLabel;
        let countryName = ''; // Değişkeni dışarıda tanımla
        
        if (nearestCity) {
            // Basit şehir adı al
            let cityName = nearestCity.name || nearestCity.city || '';
            countryName = nearestCity.country || '';
            
            // Şehir adından sadece şehir kısmını al (virgül öncesi)
            if (cityName.includes(',')) {
                cityName = cityName.split(',')[0].trim();
            }
            
            locationLabel = cityName;
        } else {
            locationLabel = `Koordinat: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
        
        console.log(' Belirlenen konum etiketi:', locationLabel);
        
        // Sadece ülke adını çevir
        let finalCountryName = 'Bilinmeyen';
        if (nearestCity && countryName) {
            finalCountryName = this.getCountryNameInCurrentLanguage(countryName);
        }
        
        console.log('🌍 Final country name:', finalCountryName);
        console.log('📍 GERÇEK GPS KOORDİNATLARI:', lat, lng, '(Bu koordinatlarda mavi nokta olacak)');
        
        // GERÇEK GPS koordinatlarını kullan, tahmin edilen şehir koordinatlarını değil
        this.setUserLocation(lat, lng, locationLabel, finalCountryName);
        
        // Globe'u kullanıcı konumuna odakla (gerçek GPS koordinatlarına)
        this.globe.pointOfView({ lat: lat, lng: lng, altitude: 2 }, 2000);
        
        console.log('📍 Konum işlemi tamamlandı - Mavi nokta gerçek GPS koordinatlarınızda olmalı');
        
        // Konum butonunu güncellle
        
    }
    
    // En yakın şehri bul
    findNearestCity(userLat, userLng) {
        console.log('🔍 findNearestCity çağrıldı:', userLat, userLng);
        console.log('🔍 cities array length:', this.cities?.length || 0);
        
        // Şehir verilerinin demo mu gerçek mi olduğunu kontrol et
        if (this.cities && this.cities.length <= 10) {
            console.log('⚠️ Demo veri kullanılıyor - gerçek şehir verileri yüklenemedi!');
            console.log('🔍 Demo şehirler:', this.cities.map(c => c.name).join(', '));
        }
        
        if (!this.cities || this.cities.length === 0) {
            console.log('❌ Şehir verisi yok!');
            return null;
        }
        
        let nearestCity = null;
        let minDistance = Infinity;
        let checkedCities = 0;
        let turkishCities = [];
        
        this.cities.forEach(city => {
            checkedCities++;
            // Türkiye şehirlerini özel olarak logla
            if (city.country === 'Turkey' || city.iso2 === 'TR') {
                turkishCities.push({
                    name: city.name || city.city,
                    distance: this.calculateDistance(userLat, userLng, city.lat, city.lng)
                });
            }
            
            // Haversine formülü ile mesafe hesapla
            const distance = this.calculateDistance(userLat, userLng, city.lat, city.lng);
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestCity = city;
            }
        });
        
        console.log(`🔍 ${checkedCities} şehir kontrol edildi`);
        console.log('🇹🇷 Türkiye şehirleri bulundu:', turkishCities.length);
        if (turkishCities.length > 0) {
            // En yakın 5 Türk şehrini göster
            const closestTurkish = turkishCities
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 5);
            console.log('🇹🇷 En yakın Türk şehirleri:', closestTurkish);
        }
        console.log('🎯 En yakın şehir:', nearestCity?.name, nearestCity?.country, `(${minDistance.toFixed(2)} km)`);
        
        // 200km'den yakın şehir varsa döndür (mesafeyi düşürdük daha hassas olması için)
        return minDistance < 200 ? nearestCity : null;
    }
    
    // İki nokta arasındaki mesafeyi hesapla (Haversine formülü)
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Dünya yarıçapı (km)
        const dLat = this.degreesToRadians(lat2 - lat1);
        const dLng = this.degreesToRadians(lng2 - lng1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Mesafe km cinsinden
    }
    
    // Derece'yi radyana çevir
    degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    handleLocationError(error) {
        const locationErrorMsg = window.i18n ? window.i18n.t('msg.location.error', 'Could not get location') : 'Could not get location';
        this.log(`⚠️ ${locationErrorMsg}: ${error.message}`, 'warning');
        this.elements.locationBtn.style.opacity = '0.5';
    }
    
    getUserLocation() {
        if (!this.userLocation) {
            this.requestUserLocation();
            return;
        }
        
        // i18n sözlüğüne ekleyelim
        const arrivedAtLocationMsg = window.i18n ? window.i18n.t('msg.arrived.location', 'Arrived at your location') : 'Arrived at your location';
        
        this.globe.pointOfView({ 
            lat: this.userLocation.lat, 
            lng: this.userLocation.lng, 
            altitude: 0.5 // Daha yakın zoom (eskiden 1.5)
        }, 2000);
        
        const goingMsg = window.i18n ? window.i18n.t('msg.location.going', 'Going to your location...') : 'Going to your location...';
        this.log(`🎯 ${goingMsg}`, 'info');
        
        // Animasyon tamamlandıktan sonra "ulaşıldı" mesajı göster
        setTimeout(() => {
            this.log(`🎯 ${arrivedAtLocationMsg}`, 'success');
        }, 2100);
    }

    goToUserLocation() {
        // getUserLocation ile aynı işi yapar
        this.getUserLocation();
    }
    
    updateCoordinates() {
        const pov = this.globe.pointOfView();
        const lat = pov.lat;
        const lng = pov.lng;
        
        const latDir = lat >= 0 ? 'N' : 'S';
        const lngDir = lng >= 0 ? 'E' : 'W';
        
        this.elements.coordinates.textContent = 
            `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lng).toFixed(2)}°${lngDir} • Alt: ${pov.altitude.toFixed(1)}`;
    }
    
    handleKeyboard(event) {
        switch(event.key) {
            case 'r':
            case 'R':
                this.resetView();
                break;
            case 'l':
            case 'L':
                this.goToUserLocation();
                break;
            case 'Escape':
                this.clearSearch();
                this.hideCountryHoverCard();
                if (this.elements.countryPanel.classList.contains('open')) {
                    this.closeCountryPanel();
                }
                break;
        }
    }
    
    hideLoading() {
        this.elements.loading.style.display = 'none';
    }
    
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        
        const logMessage = `${icons[type]} ${message}`;
        console.log(`[${timestamp}] ${logMessage}`);
        
        if (this.elements.status) {
            this.elements.status.textContent = message;
        }
    }

    // === AIR POLLUTION FEATURES ===
    
    // Hava kirliliği modunu toggle et
    async toggleAirPollution() {
        console.log('🔄 toggleAirPollution called, current mode:', this.airPollutionMode);
        this.airPollutionMode = !this.airPollutionMode;
        console.log('🔄 New air pollution mode:', this.airPollutionMode);
        
        const toggle = document.getElementById('airPollutionToggle');
        const scalePanel = document.getElementById('airQualityScale');
        
        if (toggle) {
            toggle.classList.toggle('active', this.airPollutionMode);
        }
        
        if (scalePanel) {
            if (this.airPollutionMode) {
                scalePanel.style.display = 'block';
                // Animasyon için küçük gecikme
                setTimeout(() => {
                    scalePanel.classList.add('show');
                }, 10);
            } else {
                scalePanel.classList.remove('show');
                // Animasyon bitince gizle
                setTimeout(() => {
                    if (!this.airPollutionMode) {
                        scalePanel.style.display = 'none';
                    }
                }, 300);
            }
        }
        
        // === CITY BOUNDARIES TOGGLE LOGIC BEGINS ===
        if (this.airPollutionMode) {
            const enabledMsg = window.i18n ? window.i18n.t('air.mode.enabled', 'Türkiye ve ABD şehir sınırları modu AÇIK') : 'Türkiye ve ABD şehir sınırları modu AÇIK';
            this.log(`�️ ${enabledMsg}`, 'info');
            console.log('�️ Şehir sınırları modu aktifleştirildi - ülke sınırları gizleniyor');
            
            // Sadece Türkiye ve ABD şehir sınırlarını göster
            await this.enableTurkeyUSABoundaries();
            
        } else {
            const disabledMsg = window.i18n ? window.i18n.t('air.mode.disabled', 'Ülke sınırları modu AÇIK') : 'Ülke sınırları modu AÇIK';
            this.log(`� ${disabledMsg}`, 'info');
            console.log('� Ülke sınırları modu aktifleştirildi - şehir sınırları gizleniyor');
            
            // Türkiye ve ABD sınırlarını kapat, normal ülke sınırlarını göster
            this.disableTurkeyUSABoundaries();
        }
        
        // Update search system visibility based on air pollution mode
        this.updateSearchVisibility();
        
        // === ONLY TURKEY & USA BOUNDARIES SYSTEM ENDS ===
    }

    // === TURKEY & USA ONLY SYSTEM ===
    async enableTurkeyUSABoundaries() {
        console.log('🏛️ Sadece Türkiye ve ABD sınırları aktifleştiriliyor...');
        
        // COMPLETE RESET: Tüm veriyi temizle ve sıfırla
        this.resetGlobeForAirPollution();
        
        // Sequential loading: önce Türkiye sonra ABD
        let turkeyLoaded = false;
        let usaLoaded = false;
        
        // Türkiye sistemini aktifleştir
        if (this.turkeyProvinces) {
            try {
                // Türkiye sistemini tamamen sıfırla ve yeniden başlat
                await this.turkeyProvinces.forceReset();
                await this.turkeyProvinces.enable();
                turkeyLoaded = true;
                console.log('✅ Türkiye illeri aktifleştirildi');
                
                // Küçük gecikme ile ABD'yi yükle
                setTimeout(async () => {
                    if (this.usaStates) {
                        try {
                            // ABD sistemini tamamen sıfırla ve yeniden başlat
                            await this.usaStates.forceReset();
                            await this.usaStates.enable();
                            usaLoaded = true;
                            console.log('✅ ABD eyaletleri aktifleştirildi');
                            
                            // Eğer Virginia gibi problemli veriler varsa temizle
                            this.cleanupProblematicGeometries();
                            
                        } catch (error) {
                            console.error('❌ ABD sistemi hatası:', error);
                            this.log('❌ ABD sınırları yüklenemedi, sadece Türkiye gösteriliyor', 'warning');
                        }
                    } else {
                        console.warn('⚠️ ABD sistemi bulunamadı');
                    }
                }, 500); // 500ms gecikme
                
            } catch (error) {
                console.error('❌ Türkiye sistemi hatası:', error);
            }
        } else {
            console.warn('⚠️ Türkiye sistemi bulunamadı');
        }
        
        
        // Kullanıcıya bilgi ver
        const successMsg = window.i18n ? 
            window.i18n.t('turkey_usa.enabled', '🎯 Sadece Türkiye ve ABD şehir sınırları gösteriliyor - Hızlı yükleme!') : 
            '🎯 Sadece Türkiye ve ABD şehir sınırları gösteriliyor - Hızlı yükleme!';
        this.log(successMsg, 'success');
        console.log('🎯 Turkey & USA boundaries enabled - Fast loading completed!');
    }

    // Globe'u tamamen sıfırla hava kirliliği modu için
    resetGlobeForAirPollution() {
        console.log('🔄 Globe sıfırlanıyor - hava kirliliği modu için...');
        
        // Kullanıcı konumunu koru
        const userLocationPoint = this.currentPoints.find(p => p.isUserLocation);
        
        // Polygon verilerini temizle ama user location'ı koru
        this.globe.polygonsData([]);
        
        // Points verilerini güncelle - sadece user location'ı tut
        if (userLocationPoint) {
            this.currentPoints = [userLocationPoint];
            console.log('📍 User location preserved during reset');
        } else {
            this.currentPoints = [];
        }
        this.updateGlobePoints();
        
        // Polygon ayarlarını sıfırla
        this.currentHoverPolygon = null; // Hover tracking için
        
        this.globe
            .polygonCapColor(() => 'rgba(0, 0, 0, 0)')
            .polygonSideColor(() => 'rgba(0, 0, 0, 0)')
            .polygonStrokeColor(() => '#666')
            .polygonAltitude(0.01)
            .polygonLabel(d => {
                // Sadece hover edilen polygon için label göster
                if (this.currentHoverPolygon && this.currentHoverPolygon === d) {
                    return this.createUniversalPolygonLabel(d);
                }
                return '';
            })
            .onPolygonClick(() => {})
            .onPolygonHover(hoverPolygon => {
                // Hover tracking
                this.currentHoverPolygon = hoverPolygon;
                
                // Hava kirliliği modunda hover tooltip'leri göster
                if (hoverPolygon) {
                    this.showAirPollutionTooltip(hoverPolygon);
                } else {
                    this.hideCountryHoverCard();
                }
            });
        
        console.log('✅ Globe tamamen sıfırlandı');
    }

    // Universal polygon label creator - handles all polygon types (SIMPLE HTML VERSION)
    createUniversalPolygonLabel(d) {
        if (!d || !d.properties) {
            return '';
        }

        const objectType = d.properties.objectType;
        
        // Türkiye illeri için - hover label
        if (objectType === 'turkey-province') {
            const provinceName = d.properties.name || 'Unknown Province';
            console.log('🏷️ Turkey hover label:', provinceName);
            // Basit beyaz metin, ülke isimleri gibi
            return provinceName;
        }

        // ABD eyaletleri için - hover label
        if (objectType === 'usa-state') {
            const stateName = d.properties.NAME || 'Unknown State';
            console.log('🏷️ USA hover label:', stateName);
            // Basit beyaz metin, ülke isimleri gibi
            return stateName;
        }

        // Normal ülke sınırları için
        const countryName = d.properties.ADMIN || d.properties.NAME || 'Unknown';
        const localizedName = this.getCountryNameInCurrentLanguage(countryName);
        return localizedName;
    }

    // Hava kirliliği modunda hover tooltip göster
    showAirPollutionTooltip(hoverPolygon) {
        if (!hoverPolygon || !hoverPolygon.properties) return;

        const objectType = hoverPolygon.properties.objectType;
        console.log('🖱️ Air pollution hover:', objectType);

        // Türkiye ili için
        if (objectType === 'turkey-province') {
            const provinceName = hoverPolygon.properties.name || 'Unknown Province';
            const aqi = hoverPolygon.properties.aqi || 50;
            
            console.log('🖱️ Hovering Turkey province:', provinceName, 'AQI:', aqi);
            
            // Basit tooltip: sadece şehir ismi ve AQI
            this.showAirPollutionHoverCard(`${provinceName}`, `AQI: ${aqi}`);
            return;
        }

        // ABD eyaleti için
        if (objectType === 'usa-state') {
            const stateName = hoverPolygon.properties.NAME || 'Unknown State';
            const aqi = hoverPolygon.properties.AQI || 50;
            
            console.log('🖱️ Hovering USA state:', stateName, 'AQI:', aqi);
            
            // Basit tooltip: sadece şehir ismi ve AQI
            this.showAirPollutionHoverCard(`${stateName}`, `AQI: ${aqi}`);
            return;
        }

        // Normal ülke için
        this.handleNASAPolygonHover(hoverPolygon);
    }

    // AQI seviyesi hesapla
    getAQILevel(aqi) {
        if (!aqi) return 'Unknown';
        if (aqi >= 300) return 'Hazardous';
        if (aqi >= 201) return 'Very Unhealthy';
        if (aqi >= 151) return 'Unhealthy';
        if (aqi >= 101) return 'Unhealthy for Sensitive';
        if (aqi >= 51) return 'Moderate';
        return 'Good';
    }

    // Air pollution hover card göster
    showAirPollutionHoverCard(cityName, aqiInfo) {
        console.log('📍 Showing air pollution card:', cityName, aqiInfo);
        
        // Mevcut tooltip'i kaldır
        this.hideCountryHoverCard();
        
        // Yeni hover card oluştur ve DOM'a ekle
        let card = document.getElementById('air-pollution-card');
        if (!card) {
            card = document.createElement('div');
            card.id = 'air-pollution-card';
            card.style.cssText = `
                position: absolute;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: normal;
                box-shadow: none;
                z-index: 10000;
                pointer-events: none;
                border: none;
                white-space: nowrap;
                transform: translate(-50%, 10px);
                text-align: center;
            `;
            document.body.appendChild(card);
            
            // Mouse takip için güvenli event listener ekle
            document.addEventListener('mousemove', (e) => {
                if (card.style.display === 'block' && e && e.clientX !== undefined && e.clientY !== undefined) {
                    // Mouse pozisyonunu kontrol et
                    let mouseX = e.clientX || 0;
                    let mouseY = e.clientY || 0;
                    
                    // Eğer mouse pozisyonu geçersizse tooltip'i gizle
                    if (mouseX === 0 && mouseY === 0) {
                        card.style.display = 'none';
                        return;
                    }
                    
                    // Viewport boyutlarını al
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;
                    
                    // Tooltip boyutlarını hesapla
                    const cardRect = card.getBoundingClientRect();
                    const cardWidth = cardRect.width || 150;
                    const cardHeight = cardRect.height || 30;
                    
                    // Güvenli pozisyon hesapla
                    let x = mouseX + 15; // Mouse'un sağında
                    let y = mouseY + 15; // Mouse'un altında
                    
                    // Sağ kenar kontrolü
                    if (x + cardWidth > viewportWidth - 10) {
                        x = mouseX - cardWidth - 15; // Sol tarafa kaydır
                    }
                    
                    // Alt kenar kontrolü
                    if (y + cardHeight > viewportHeight - 10) {
                        y = mouseY - cardHeight - 15; // Üst tarafa kaydır
                    }
                    
                    // Minimum sınırlar (sol üst köşeye çakılmasını engelle)
                    x = Math.max(10, Math.min(viewportWidth - cardWidth - 10, x));
                    y = Math.max(10, Math.min(viewportHeight - cardHeight - 10, y));
                    
                    // Pozisyonu uygula
                    card.style.left = x + 'px';
                    card.style.top = y + 'px';
                }
            });
        }
        
        // Sadece şehir ismi ve AQI değeri
        card.innerHTML = `${cityName} - ${aqiInfo}`;
        card.style.display = 'block';
        
        // İlk pozisyonlamayı güvenli bir şekilde yap
        if (this.mouseX && this.mouseY && this.mouseX > 0 && this.mouseY > 0) {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const cardRect = card.getBoundingClientRect();
            const cardWidth = cardRect.width || 150;
            const cardHeight = cardRect.height || 30;
            
            let x = this.mouseX + 15;
            let y = this.mouseY + 15;
            
            // Sağ ve alt kenar kontrolü
            if (x + cardWidth > viewportWidth - 10) {
                x = this.mouseX - cardWidth - 15;
            }
            if (y + cardHeight > viewportHeight - 10) {
                y = this.mouseY - cardHeight - 15;
            }
            
            // Minimum sınırlar
            x = Math.max(10, Math.min(viewportWidth - cardWidth - 10, x));
            y = Math.max(10, Math.min(viewportHeight - cardHeight - 10, y));
            
            card.style.left = x + 'px';
            card.style.top = y + 'px';
        } else {
            // Eğer mouse pozisyonu yoksa merkezi bir konuma yerleştir
            card.style.left = '50%';
            card.style.top = '50%';
            card.style.transform = 'translate(-50%, -50%)';
        }
    }

    disableTurkeyUSABoundaries() {
        console.log('🌍 Türkiye ve ABD sınırları kapatılıyor, normal mod...');
        
        // Kullanıcı konumunu koru
        const userLocationPoint = this.currentPoints.find(p => p.isUserLocation);
        
        // Polygon verilerini temizle
        this.globe.polygonsData([]);
        
        // Points verilerini güncelle - sadece user location'ı tut
        if (userLocationPoint) {
            this.currentPoints = [userLocationPoint];
            console.log('📍 User location preserved during disable');
        } else {
            this.currentPoints = [];
        }
        this.updateGlobePoints();
        
        // Türkiye sistemini kapat
        if (this.turkeyProvinces) {
            try {
                this.turkeyProvinces.disable();
                console.log('✅ Türkiye illeri kapatıldı');
            } catch (error) {
                console.error('❌ Türkiye kapatma hatası:', error);
            }
        }
        
        // ABD sistemini kapat
        if (this.usaStates) {
            try {
                this.usaStates.disable();
                console.log('✅ ABD eyaletleri kapatıldı');
            } catch (error) {
                console.error('❌ ABD kapatma hatası:', error);
            }
        }
        
        // PROPER RESET: Globe ayarlarını sıfırla
        this.globe
            .polygonCapColor(() => 'rgba(0, 0, 0, 0)')
            .polygonSideColor(() => 'rgba(0, 0, 0, 0)')
            .polygonStrokeColor(() => '#666')
            .polygonAltitude(0.01)
            .polygonLabel(() => '')
            .onPolygonClick(() => {})
            .onPolygonHover(() => {});
        
        // Normal ülke sınırlarını geri yükle
        if (this.countriesData) {
            // Küçük gecikme ile normal verileri yükle (temizlik sonrası)
            setTimeout(() => {
                this.globe.polygonsData(this.countriesData.features)
                    .polygonCapColor(() => 'rgba(0, 0, 0, 0)')
                    .polygonSideColor(() => 'rgba(0, 0, 0, 0)')
                    .polygonStrokeColor(() => '#666')
                    .polygonAltitude(0.01)
                    .polygonLabel(d => this.createUniversalPolygonLabel(d))
                    .onPolygonClick((polygonData) => {
                        if (polygonData && polygonData.properties) {
                            this.handleNASAPolygonClick(polygonData);
                        }
                    })
                    .onPolygonHover(hoverPolygon => {
                        this.globe.polygonCapColor(polygon => 
                            polygon === hoverPolygon ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0)'
                        );
                        
                        if (hoverPolygon) {
                            this.handleNASAPolygonHover(hoverPolygon);
                        } else {
                            this.hideCountryHoverCard();
                        }
                    });
                
                console.log('🌍 Normal ülke sınırları ve ülke tıklama fonksiyonu geri yüklendi');
            }, 200); // 200ms gecikme ile temiz yükleme
        }
        
        // Normal şehir noktalarını geri yükleme - KALDIRILDI
        // this.restoreNormalCityPoints(); // Katman yüksekliği sorunu nedeniyle kaldırıldı
    }

    // Normal şehir noktalarını geri yükle
    restoreNormalCityPoints() {
        if (!this.cities || this.cities.length === 0) {
            console.warn('⚠️ No cities data available to restore');
            return;
        }

        console.log('🏙️ Normal şehir noktaları geri yükleniyor...');
        
        // Normal şehir noktalarını globe'a ekle
        this.globe.pointsData(this.cities)
            .pointLat('lat')
            .pointLng('lng')
            .pointColor(() => '#ffaa00')
            .pointAltitude(0.01)
            .pointRadius(0.3)
            .pointLabel(d => {
                const cityName = d.name || d.city || 'Unknown';
                const countryName = d.country || 'Unknown';
                const populationText = d.population ? 
                    new Intl.NumberFormat(this.currentLanguage).format(d.population) : 
                    'Unknown';
                
                return `<div style="
                    background: rgba(0, 0, 0, 0.85);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    text-align: center;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                ">
                    <div style="font-weight: bold;">${cityName}</div>
                    <div style="opacity: 0.8;">${countryName}</div>
                    <div style="opacity: 0.7;">Pop: ${populationText}</div>
                </div>`;
            })
            .onPointClick((pointData, event) => {
                if (pointData) {
                    const cityName = pointData.name || pointData.city || 'Unknown';
                    const countryName = pointData.country || 'Unknown Country';
                    const lat = pointData.lat || 0;
                    const lng = pointData.lng || 0;
                    
                    console.log('🏙️ City clicked:', cityName, 'in', countryName);
                    
                    // Şehir detay sayfasına yönlendir
                    const detailUrl = `city-detail.html?city=${encodeURIComponent(cityName)}&country=${encodeURIComponent(countryName)}&lat=${lat}&lng=${lng}`;
                    window.open(detailUrl, '_self'); // Aynı sekmede aç
                }
            });

        console.log(`✅ ${this.cities.length} şehir noktası geri yüklendi`);
    }

    // Problematik geometrileri temizle
    cleanupProblematicGeometries() {
        const currentPolygons = this.globe.polygonsData() || [];
        
        // Virginia ve diğer problemli geometrileri filtrele
        const cleanedPolygons = currentPolygons.filter(polygon => {
            const name = polygon.properties?.NAME || polygon.properties?.name || '';
            
            // Virginia artık dahil - problematik geometri filtrelemesi kaldırıldı
            // Virginia filtrelemesi devre dışı bırakıldı
            
            // Çok büyük koordinat sayısını blokla (Alaska için limit artırıldı)
            if (polygon.geometry?.coordinates?.[0]?.length > 5000) {
                console.warn('🧹 Removing oversized geometry:', name);
                return false;
            }
            
            return true;
        });
        
        if (cleanedPolygons.length !== currentPolygons.length) {
            console.log(`🔧 Cleaned up geometries: ${currentPolygons.length} → ${cleanedPolygons.length}`);
            this.globe.polygonsData(cleanedPolygons);
        }
    }

    // === CITY BOUNDARIES SYSTEM ===
    
    async showCityBoundaries() {
        if (!this.globe) {
            console.warn('⚠️ Globe not ready for city boundaries');
            return;
        }

        console.log('🏙️ Loading Global ADM2 city boundaries...');
        this.log('🏙️ Global ADM2 şehir sınırları yükleniyor...', 'info');

        try {
            // Load city boundaries data if not cached
            if (!this.cityBoundariesData) {
                await this.loadCityBoundariesData();
            }

            if (!this.cityBoundariesData || !this.cityBoundariesData.features) {
                console.warn('⚠️ No city boundaries data available');
                this.showCountryBoundaries(); // Fallback to countries
                return;
            }

            // CRITICAL: Clear country polygons completely to prevent leaking
            this.globe.polygonsData([]);
            
            console.log(`🏙️ Rendering ${this.cityBoundariesData.features.length} ADM2 city boundaries...`);
            
            // Configure city boundary appearance BEFORE setting data (transparent cap, stroke only)
            this.globe
                .polygonCapColor(() => 'rgba(0, 0, 0, 0)')          // Transparent cap (stroke only)
                .polygonSideColor(() => 'rgba(0, 0, 0, 0)')         // Transparent sides  
                .polygonStrokeColor(() => 'rgba(30, 144, 255, 0.8)') // Blue stroke for boundaries
                .polygonAltitude(0.01)                               // Same altitude as countries
                .polygonLabel(({ properties: d }) => {
                    // Enhanced property access for various ADM2 formats
                    const name = d.shapeName || d.NAME_2 || d.NAME_1 || d.NAME || d.ADMIN || d.name || 'Unknown';
                    const country = d.shapeISO || d.NAME_0 || d.COUNTRY || d.country || '';
                    const adminLevel = d.shapeType || d.admin_level || 'ADM2';
                    
                    const displayName = country && country !== name ? `${name}, ${country}` : name;
                    
                    return `<div style="
                        background: rgba(0, 0, 0, 0.85);
                        color: white;
                        padding: 8px 12px;
                        border-radius: 8px;
                        font-size: 12px;
                        font-weight: 500;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                        backdrop-filter: blur(8px);
                        border: 1px solid rgba(30, 144, 255, 0.3);
                        text-align: center;
                        white-space: nowrap;
                        max-width: 200px;
                    ">${displayName}<br><small style="opacity:0.7">${adminLevel}</small></div>`;
                });

            // Always use progressive rendering for ADM2 data (likely large datasets)
            if (this.cityBoundariesData.features.length > 800) {
                console.log(`🔄 Using progressive rendering for ${this.cityBoundariesData.features.length} ADM2 features`);
                await this.renderCityBoundariesProgressively(this.cityBoundariesData.features, 2500);
            } else {
                // Standard rendering for smaller datasets
                this.globe.polygonsData(this.cityBoundariesData.features);
            }

            // Set up city boundaries interaction handlers
            this.globe.onPolygonClick((polygonData) => {
                if (polygonData && polygonData.properties) {
                    const props = polygonData.properties;
                    const cityName = props.shapeName || props.NAME_2 || props.NAME || 'Unknown City';
                    const country = props.shapeISO || props.country || 'Unknown Country';
                    console.log(`🏙️ ADM2 boundary clicked: ${cityName}, ${country}`, props);
                }
            });
            
            this.globe.onPolygonHover(hoverPolygon => {
                // Keep stroke-only appearance for city boundaries
                this.globe.polygonStrokeColor(polygon => 
                    polygon === hoverPolygon ? 'rgba(30, 144, 255, 1.0)' : 'rgba(30, 144, 255, 0.8)'
                );
            });

            console.log(`✅ Successfully rendered ${this.cityBoundariesData.features.length} ADM2 city boundaries`);
            this.log(`✅ ${this.cityBoundariesData.features.length} ADM2 şehir sınırı gösterildi`, 'success');

            // Display failed countries if any
            if (this.failedCountries && this.failedCountries.length > 0) {
                const failedMsg = `Yüklenemeyen ülkeler (${this.failedCountries.length}): ${this.failedCountries.join(', ')}`;
                console.warn(`⚠️ ${failedMsg}`);
                this.log(`⚠️ ${failedMsg}`, 'warning');
            }

        } catch (error) {
            console.error('❌ City boundaries loading failed:', error);
            this.log(`❌ Şehir sınırları yüklenemedi: ${error.message}`, 'error');
            
            // Fallback: restore country boundaries
            this.showCountryBoundaries();
        }
    }

    showCountryBoundaries() {
        if (!this.globe || !this.countriesData) {
            console.warn('⚠️ Globe or countries data not ready');
            return;
        }

        console.log('🌍 Restoring country boundaries');
        this.log('🌍 Ülke sınırları geri yükleniyor', 'info');
        
        // CRITICAL: Clear any existing polygons first
        this.globe.polygonsData([]);
        
        // Small delay to ensure clean state transition
        setTimeout(() => {
            // Restore original country boundaries with NASA styling
            this.globe.polygonsData(this.countriesData.features)
            .polygonCapColor(() => 'rgba(0, 0, 0, 0)')  // NASA: transparent cap
            .polygonSideColor(() => 'rgba(0, 0, 0, 0)')  // NASA: transparent side
            .polygonStrokeColor(() => '#666666')         // NASA: #666 stroke
            .polygonAltitude(0.01)                       // Restored to original altitude
            .polygonLabel(({ properties: d }) => {
                const countryName = d.ADMIN || d.NAME || 'Unknown';
                const localizedName = this.getCountryNameInCurrentLanguage(countryName);
                
                return `<div style="
                    background: rgba(0, 0, 0, 0.85);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 500;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255,255,255,0.2);
                    text-align: center;
                    white-space: nowrap;
                    max-width: 200px;
                ">${localizedName}</div>`;
            });

            // Restore click and hover handlers
            this.globe.onPolygonClick((polygonData) => {
                if (polygonData && polygonData.properties) {
                    this.handleNASAPolygonClick(polygonData);
                }
            });
            
            this.globe.onPolygonHover(hoverPolygon => {
                this.globe.polygonCapColor(polygon => 
                    polygon === hoverPolygon ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0)'
                );
                
                if (hoverPolygon) {
                    this.handleNASAPolygonHover(hoverPolygon);
                } else {
                    this.hideCountryHoverCard();
                }
            });
        }, 50); // Close setTimeout

        // Force refresh to ensure proper positioning
        setTimeout(() => {
            if (this.globe && this.globe.refresh) {
                this.globe.refresh();
            }
        }, 100);

        this.log('🌍 Ülke sınırları gösteriliyor', 'success');
    }

    async loadCityBoundariesData() {
        const cacheKey = 'comprehensive_world_smart_v1'; // Cache key for comprehensive world with smart limits
        
        // Check cache first - never clear cache to avoid repeated failures
        if (this.cityBoundariesCache.has(cacheKey)) {
            console.log('📦 Using cached city boundaries data');
            this.cityBoundariesData = this.cityBoundariesCache.get(cacheKey);
            console.log(`✅ Loaded ${this.cityBoundariesData.features.length} cached city boundaries`);
            return;
        }

        // Configuration for real administrative boundaries
        const CITY_LIMITS = { 
            simplify: 0.05, // PERFORMANCE: Aggressive simplification for speed
            batchSize: 200, // BALANCED: Reasonable batches for smooth rendering
            maxTotal: 2000, // COMPREHENSIVE: Tüm dünya için yeterli ama performanslı
            progressiveRender: true
        };

        // COMPREHENSIVE Country-by-Country Administrative Boundaries
        const dataSources = [
            {
                name: 'Turkey 81 Provinces - WORKING',
                url: 'https://raw.githubusercontent.com/cihadturhan/tr-geojson/master/geo/tr-cities-utf8.json',
                type: 'direct',
                priority: 1
            },
            {
                name: 'World Major Admin1 (States/Provinces) - WORKING',
                url: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson',
                type: 'direct',
                priority: 2
            },
            {
                name: 'USA States and Counties',
                url: 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json',
                type: 'direct',
                priority: 3
            },
            {
                name: 'China Provinces',
                url: 'https://raw.githubusercontent.com/longwosion/geojson-map-china/master/geometryProvince/110000_full.json',
                type: 'direct',
                priority: 4
            },
            {
                name: 'India States',
                url: 'https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson',
                type: 'direct',
                priority: 5
            },
            {
                name: 'Brazil States',
                url: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson',
                type: 'direct',
                priority: 6
            },
            {
                name: 'Canada Provinces',
                url: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/canada.geojson',
                type: 'direct',
                priority: 7
            },
            {
                name: 'Australia States',
                url: 'https://raw.githubusercontent.com/tonywr71/GeoJson-Data/master/australian-states.json',
                type: 'direct',
                priority: 8
            },
            {
                name: 'Germany States',
                url: 'https://raw.githubusercontent.com/isellsoap/deutschlandGeoJSON/master/2_bundeslaender/1_sehr_hoch.geo.json',
                type: 'direct',
                priority: 9
            },
            {
                name: 'France Regions',
                url: 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions.geojson',
                type: 'direct',
                priority: 10
            },
            {
                name: 'UK Countries',
                url: 'https://raw.githubusercontent.com/martinjc/UK-GeoJSON/master/json/administrative/gb/countries.json',
                type: 'direct',
                priority: 11
            },
            {
                name: 'Italy Regions',
                url: 'https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_IT_regions.geojson',
                type: 'direct',
                priority: 12
            },
            {
                name: 'Spain Regions',
                url: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/spain-provinces.geojson',
                type: 'direct',
                priority: 13
            },
            {
                name: 'Netherlands Provinces',
                url: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/netherlands.geojson',
                type: 'direct',
                priority: 14
            },
            {
                name: 'Poland Voivodeships',
                url: 'https://raw.githubusercontent.com/ppatrzyk/polska-geojson/master/wojewodztwa/wojewodztwa.geojson',
                type: 'direct',
                priority: 15
            },
            {
                name: 'Sweden Counties - Alternative',
                url: 'https://raw.githubusercontent.com/deldersveld/topojson/master/countries/sweden/sweden-counties.json',
                type: 'direct',
                priority: 16
            },
            {
                name: 'Portugal Districts',
                url: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/portugal.geojson',
                type: 'direct',
                priority: 19
            },
            {
                name: 'Switzerland Cantons',
                url: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/switzerland.geojson',
                type: 'direct',
                priority: 20
            },

            {
                name: 'Japan Prefectures',
                url: 'https://raw.githubusercontent.com/dataofjapan/land/master/japan.geojson',
                type: 'direct',
                priority: 23
            },
            {
                name: 'South Korea Provinces',
                url: 'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-provinces-2018-geo.json',
                type: 'direct',
                priority: 24
            },
            {
                name: 'Russia Federal Subjects',
                url: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/russia.geojson',
                type: 'direct',
                priority: 25
            },
            {
                name: 'Mexico States',
                url: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/mexico.geojson',
                type: 'direct',
                priority: 26
            },
            {
                name: 'Argentina Provinces',
                url: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/argentina.geojson',
                type: 'direct',
                priority: 27
            },
            {
                name: 'South Africa Provinces',
                url: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/south-africa.geojson',
                type: 'direct',
                priority: 28
            },
            {
                name: 'Indonesia Provinces',
                url: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/indonesia.geojson',
                type: 'direct',
                priority: 29
            },
            {
                name: 'Thailand Provinces',
                url: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/thailand.geojson',
                type: 'direct',
                priority: 30
            },
            {
                name: 'Egypt Governorates',
                url: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/egypt.geojson',
                type: 'direct',
                priority: 31
            },
            {
                name: 'Nigeria States',
                url: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/nigeria.geojson',
                type: 'direct',
                priority: 32
            }
        ];

        // Load and combine multiple data sources WITHOUT OVERLAP
        const allFeatures = [];
        const addedCities = new Set(); // Prevent duplicates
        let loadedSources = [];
        
        for (const source of dataSources) {
            try {
                console.log(`🌐 Loading ${source.name}...`);
                this.log(`🌐 ${source.name} yükleniyor...`, 'info');
                
                // Simple direct data loading - çalışan sistem
                console.log(`📥 Loading ${source.name}...`);
                const response = await fetch(source.url, {
                    headers: {
                        'Accept': 'application/json,application/geo+json,*/*',
                        'User-Agent': 'Mozilla/5.0'
                    }
                });
                
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                let data;
                if (source.type === 'direct') {
                    // Direct GeoJSON - ÇOK İYİ ÇALIŞIYOR!
                    data = await response.json();
                    
                    // Simplify geometry if too complex
                    if (data.features && data.features.length > CITY_LIMITS.batchSize) {
                        console.log(`🔧 Simplifying ${data.features.length} features...`);
                        data = this.simplifyGeoJSON(data, CITY_LIMITS.simplify);
                    }
                // Artık sadece direct GeoJSON kullanıyoruz - gerçek sınırlar
                } else if (source.type === 'geoboundaries-adm2') {
                    // Handle GeoBoundaries ADM2 API with timeout
                    console.log('🌍 Loading GeoBoundaries Global ADM2 dataset...');
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
                    
                    const response = await fetch(source.url, {
                        signal: controller.signal,
                        headers: {
                            'Accept': 'application/json',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    
                    const apiResponse = await response.json();
                    console.log('🔍 GeoBoundaries API Response:', apiResponse);
                    
                    // GeoBoundaries API response can have different formats
                    let downloadUrl = null;
                    
                    if (apiResponse) {
                        // Check multiple possible response formats
                        downloadUrl = apiResponse.gjDownloadURL || 
                                     apiResponse.downloadURL || 
                                     apiResponse.simplifiedGeometryGeoJSON ||
                                     (Array.isArray(apiResponse) && apiResponse[0]?.gjDownloadURL);
                    }
                    
                    if (downloadUrl) {
                        console.log('📦 Downloading ADM2 boundaries from:', downloadUrl);
                        
                        // Add timeout for large GeoJSON download
                        const geoController = new AbortController();
                        const geoTimeoutId = setTimeout(() => geoController.abort(), 30000); // 30s for large file
                        
                        const geoResponse = await fetch(downloadUrl, {
                            signal: geoController.signal,
                            headers: {
                                'Accept': 'application/json,application/geo+json,*/*',
                                'User-Agent': 'Mozilla/5.0'
                            }
                        });
                        
                        clearTimeout(geoTimeoutId);
                        
                        if (!geoResponse.ok) throw new Error(`GeoJSON download failed: ${geoResponse.status}`);
                        data = await geoResponse.json();
                        
                        console.log(`🗺️ Downloaded ${data.features?.length || 0} ADM2 boundaries`);
                    } else {
                        console.warn('⚠️ GeoBoundaries API Response does not contain download URL:', apiResponse);
                        throw new Error('GeoBoundaries API response missing download URL');
                    }
                } else if (source.type === 'cities-json') {
                    // Handle JSON cities array with boundary generation
                    console.log(`🏗️ Loading cities JSON with boundary generation...`);
                    const response = await fetch(source.url);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const citiesArray = await response.json();
                    
                    data = this.convertCitiesJSONToGeoJSONWithBoundaries(citiesArray, CITY_LIMITS.maxTotal);
                } else if (source.type === 'populated_places') {
                    // REMOVED: Populated places create circular boundaries
                    console.log(`⚠️ Populated places handler removed - using only real administrative boundaries`);
                    continue;
                } else if (source.type === 'csv') {
                    // REMOVED: CSV creates circular boundaries
                    console.log(`⚠️ CSV handler removed - using only real administrative boundaries`);
                    continue;
                } else if (source.type === 'json') {
                    // REMOVED: JSON creates circular boundaries  
                    console.log(`⚠️ JSON handler removed - using only real administrative boundaries`);
                    continue;
                } else if (source.type === 'world-cities-boundaries') {
                    // Handle specialized world cities boundaries
                    console.log('🏙️ Loading world cities with boundaries...');
                    const response = await fetch(source.url, {
                        headers: {
                            'Accept': 'application/json,application/geo+json,*/*',
                            'User-Agent': 'Mozilla/5.0'
                        }
                    });
                    
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    data = await response.json();
                    
                    console.log(`🗺️ Downloaded ${data.features?.length || 0} city boundaries`);
                } else {
                    // Direct GeoJSON download (Natural Earth Admin1)
                    const response = await fetch(source.url);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    data = await response.json();
                    
                    // Simplify geometry if too complex
                    if (data.features && data.features.length > CITY_LIMITS.batchSize) {
                        console.log(`🔧 Simplifying ${data.features.length} features...`);
                        data = this.simplifyGeoJSON(data, CITY_LIMITS.simplify);
                    }
                }

                // Validate GeoJSON data
                if (!data || !data.features || !Array.isArray(data.features)) {
                    throw new Error('Invalid GeoJSON format');
                }

                // Apply hard limit if needed
                if (data.features.length > CITY_LIMITS.maxTotal) {
                    console.log(`📊 Dataset has ${data.features.length} features, applying maxTotal limit: ${CITY_LIMITS.maxTotal}`);
                    data.features = data.features.slice(0, CITY_LIMITS.maxTotal);
                }
                
                // SMART PERFORMANCE: Priority-based limits
                let featureLimit = 40; // Default limit
                
                // High priority countries get more features
                if (source.name.includes('Turkey') || source.name.includes('Türkiye')) {
                    featureLimit = 1000; // Turkey gets ALL provinces
                } else if (source.name.includes('USA') || source.name.includes('China') || source.name.includes('India') || source.name.includes('Brazil')) {
                    featureLimit = 60; // Major countries get more
                } else if (source.name.includes('Mexico') || source.name.includes('Russia') || source.name.includes('Canada')) {
                    featureLimit = 50; // Large countries get more
                }
                
                if (data.features.length > featureLimit) {
                    console.log(`⚡ Smart limiting ${source.name} from ${data.features.length} to ${featureLimit} features`);
                    data.features = data.features.slice(0, featureLimit);
                } else {
                    console.log(`✅ ${source.name}: ${data.features.length} features (within limit)`);
                }

                console.log(`✅ Successfully loaded ${data.features.length} boundaries from ${source.name}`);
                this.log(`✅ ${data.features.length} sınır yüklendi - ${source.name}`, 'success');
                
                // Add features with TURKEY PRIORITY and duplicate prevention
                let addedCount = 0;
                data.features.forEach(feature => {
                    const name = feature.properties.name || feature.properties.NAME || 'Unknown';
                    const country = feature.properties.country || feature.properties.COUNTRY || 'Unknown';
                    const cityKey = `${name}_${country}`.toLowerCase();
                    
                    // Turkey provinces get absolute priority - NO DUPLICATE CHECK!
                    if (source.name.includes('Turkey') || country === 'Turkey' || country === 'Türkiye') {
                        allFeatures.push(feature);
                        // Don't add to addedCities set for Turkey - allow all Turkish cities
                        addedCount++;
                        console.log(`🇹🇷 Added Turkish province: ${name}`);
                    } else if (!addedCities.has(cityKey)) {
                        addedCities.add(cityKey);
                        allFeatures.push(feature);
                        addedCount++;
                    }
                });
                
                loadedSources.push(source.name);
                console.log(`✅ Added ${addedCount} unique cities from ${source.name} (${data.features.length - addedCount} duplicates skipped)`);
                console.log(`📊 Total accumulated features: ${allFeatures.length}`);
                
                // Continue to next source (don't return here!)
                
            } catch (error) {
                console.warn(`⚠️ ${source.name} failed:`, error.message);
                this.log(`⚠️ ${source.name} başarısız: ${error.message}`, 'warning');
                
                // Log more details for debugging
                if (error.name === 'AbortError') {
                    console.log('⏱️ Request timed out');
                } else if (error.message.includes('HTTP')) {
                    console.log('🌐 Network error');
                } else {
                    console.log('🐛 Data processing error');
                }
                
                continue; // Try next source
            }
        }

        // Combine all loaded features into final dataset
        if (allFeatures.length > 0) {
            console.log(`🎯 Combining ${allFeatures.length} features from ${loadedSources.length} sources:`);
            loadedSources.forEach(source => console.log(`   ✅ ${source}`));
            
            // Apply final limit if needed
            if (allFeatures.length > CITY_LIMITS.maxTotal) {
                console.log(`📊 Total features (${allFeatures.length}) exceeds limit, applying maxTotal: ${CITY_LIMITS.maxTotal}`);
                allFeatures.splice(CITY_LIMITS.maxTotal); // Keep first maxTotal features
            }
            
            // Create final combined dataset
            const combinedData = {
                type: 'FeatureCollection',
                features: allFeatures
            };
            
            console.log(`🌍 Final combined dataset: ${combinedData.features.length} boundaries`);
            this.log(`🌍 ${combinedData.features.length} toplam sınır birleştirildi`, 'success');
            
            // Cache and set the combined data
            this.cityBoundariesCache.set(cacheKey, combinedData);
            this.cityBoundariesData = combinedData;
            
            // Set up progressive rendering for large combined dataset
            if (combinedData.features.length > CITY_LIMITS.batchSize && CITY_LIMITS.progressiveRender) {
                this.shouldUseProgressiveRendering = true;
                console.log(`📊 Will use progressive rendering for ${combinedData.features.length} features`);
            }
            
            return; // Success with combined data
        }

        // If all sources failed, try CSV fallback
        console.warn('⚠️ All remote sources failed, trying CSV fallback');
        this.log('⚠️ Uzak kaynaklar başarısız, CSV yedek deneniyor', 'warning');
        
        try {
            const csvResponse = await fetch('https://raw.githubusercontent.com/datasets/world-cities/master/data/world-cities.csv');
            if (csvResponse.ok) {
                const csvText = await csvResponse.text();
                console.log('📥 Processing CSV fallback...');
                
                // Process cities with reasonable limit
                this.cityBoundariesData = this.convertCitiesCSVToGeoJSON(csvText, false, CITY_LIMITS.maxTotal);
                
                console.log(`✅ Created CSV fallback with ${this.cityBoundariesData.features.length} cities`);
                this.log(`✅ ${this.cityBoundariesData.features.length} şehirli CSV yedek oluşturuldu`, 'success');
                
                // Cache the fallback data
                this.cityBoundariesCache.set(cacheKey, this.cityBoundariesData);
                return;
            }
        } catch (error) {
            console.warn('⚠️ CSV fallback also failed:', error.message);
        }
        
        // Final hardcoded fallback as last resort
        console.warn('⚠️ All sources failed, using hardcoded fallback');
        this.log('⚠️ Tüm kaynaklar başarısız, sabit kodlu yedek kullanılıyor', 'warning');
        
        // Create a comprehensive fallback with major world cities as circular boundaries
        this.cityBoundariesData = {
            type: "FeatureCollection",
            features: [
                // MEGA CITIES (>10M population) - Largest circles (0.7°)
                this.createCityBoundary('Tokyo', 35.6762, 139.6503, 'Japan', 0.7),
                this.createCityBoundary('Shanghai', 31.2304, 121.4737, 'China', 0.7),
                this.createCityBoundary('Delhi', 28.7041, 77.1025, 'India', 0.7),
                this.createCityBoundary('São Paulo', -23.5505, -46.6333, 'Brazil', 0.7),
                this.createCityBoundary('Mexico City', 19.4326, -99.1332, 'Mexico', 0.7),
                this.createCityBoundary('Cairo', 30.0444, 31.2357, 'Egypt', 0.7),
                this.createCityBoundary('Mumbai', 19.0760, 72.8777, 'India', 0.7),
                this.createCityBoundary('Beijing', 39.9042, 116.4074, 'China', 0.7),
                this.createCityBoundary('Dhaka', 23.8103, 90.4125, 'Bangladesh', 0.7),
                this.createCityBoundary('Osaka', 34.6937, 135.5023, 'Japan', 0.7),
                this.createCityBoundary('New York', 40.7128, -74.0060, 'United States', 0.7),
                this.createCityBoundary('Karachi', 24.8607, 67.0011, 'Pakistan', 0.7),
                this.createCityBoundary('Buenos Aires', -34.6118, -58.3960, 'Argentina', 0.7),
                this.createCityBoundary('Chongqing', 29.4316, 106.9123, 'China', 0.7),
                this.createCityBoundary('Istanbul', 41.0082, 28.9784, 'Turkey', 0.7),
                
                // LARGE CITIES (5-10M) - Large circles (0.5°)
                this.createCityBoundary('London', 51.5074, -0.1278, 'United Kingdom', 0.5),
                this.createCityBoundary('Lagos', 6.5244, 3.3792, 'Nigeria', 0.5),
                this.createCityBoundary('Bangkok', 13.7563, 100.5018, 'Thailand', 0.5),
                this.createCityBoundary('Kinshasa', -4.4419, 15.2663, 'DR Congo', 0.5),
                this.createCityBoundary('Manila', 14.5995, 120.9842, 'Philippines', 0.5),
                this.createCityBoundary('Tianjin', 39.3434, 117.3616, 'China', 0.5),
                this.createCityBoundary('Rio de Janeiro', -22.9068, -43.1729, 'Brazil', 0.5),
                this.createCityBoundary('Guangzhou', 23.1291, 113.2644, 'China', 0.5),
                this.createCityBoundary('Lahore', 31.5497, 74.3436, 'Pakistan', 0.5),
                this.createCityBoundary('Shenzhen', 22.5431, 114.0579, 'China', 0.5),
                this.createCityBoundary('Moscow', 55.7558, 37.6173, 'Russia', 0.5),
                this.createCityBoundary('Bogota', 4.7110, -74.0721, 'Colombia', 0.5),
                this.createCityBoundary('Paris', 48.8566, 2.3522, 'France', 0.5),
                this.createCityBoundary('Jakarta', -6.2088, 106.8456, 'Indonesia', 0.5),
                this.createCityBoundary('Lima', -12.0464, -77.0428, 'Peru', 0.5),
                this.createCityBoundary('Chennai', 13.0827, 80.2707, 'India', 0.5),
                this.createCityBoundary('Bangalore', 12.9716, 77.5946, 'India', 0.5),
                this.createCityBoundary('Hyderabad', 17.3850, 78.4867, 'India', 0.5),
                this.createCityBoundary('Kolkata', 22.5726, 88.3639, 'India', 0.5),
                this.createCityBoundary('Tehran', 35.6892, 51.3890, 'Iran', 0.5),
                
                // MAJOR CITIES (1-5M) - Medium circles (0.3°)
                this.createCityBoundary('Berlin', 52.5200, 13.4050, 'Germany', 0.3),
                this.createCityBoundary('Madrid', 40.4168, -3.7038, 'Spain', 0.3),
                this.createCityBoundary('Rome', 41.9028, 12.4964, 'Italy', 0.3),
                this.createCityBoundary('Sydney', -33.8688, 151.2093, 'Australia', 0.3),
                this.createCityBoundary('Toronto', 43.6532, -79.3832, 'Canada', 0.3),
                this.createCityBoundary('Chicago', 41.8781, -87.6298, 'United States', 0.3),
                this.createCityBoundary('Houston', 29.7604, -95.3698, 'United States', 0.3),
                this.createCityBoundary('Phoenix', 33.4484, -112.0740, 'United States', 0.3),
                this.createCityBoundary('Philadelphia', 39.9526, -75.1652, 'United States', 0.3),
                this.createCityBoundary('San Antonio', 29.4241, -98.4936, 'United States', 0.3),
                this.createCityBoundary('San Diego', 32.7157, -117.1611, 'United States', 0.3),
                this.createCityBoundary('Dallas', 32.7767, -96.7970, 'United States', 0.3),
                this.createCityBoundary('San Jose', 37.3382, -121.8863, 'United States', 0.3),
                this.createCityBoundary('Austin', 30.2672, -97.7431, 'United States', 0.3),
                this.createCityBoundary('Montreal', 45.5017, -73.5673, 'Canada', 0.3),
                this.createCityBoundary('Vancouver', 49.2827, -123.1207, 'Canada', 0.3),
                this.createCityBoundary('Melbourne', -37.8136, 144.9631, 'Australia', 0.3),
                this.createCityBoundary('Perth', -31.9505, 115.8605, 'Australia', 0.3),
                this.createCityBoundary('Brisbane', -27.4698, 153.0251, 'Australia', 0.3),
                this.createCityBoundary('Adelaide', -34.9285, 138.6007, 'Australia', 0.3),
                this.createCityBoundary('Los Angeles', 34.0522, -118.2437, 'United States', 0.3),
                this.createCityBoundary('Barcelona', 41.3851, 2.1734, 'Spain', 0.3),
                this.createCityBoundary('Milan', 45.4642, 9.1900, 'Italy', 0.3),
                this.createCityBoundary('Naples', 40.8518, 14.2681, 'Italy', 0.3),
                this.createCityBoundary('Vienna', 48.2082, 16.3738, 'Austria', 0.3),
                this.createCityBoundary('Prague', 50.0755, 14.4378, 'Czech Republic', 0.3),
                this.createCityBoundary('Budapest', 47.4979, 19.0402, 'Hungary', 0.3),
                this.createCityBoundary('Warsaw', 52.2297, 21.0122, 'Poland', 0.3),
                this.createCityBoundary('Amsterdam', 52.3676, 4.9041, 'Netherlands', 0.3),
                this.createCityBoundary('Lisbon', 38.7223, -9.1393, 'Portugal', 0.3),
                this.createCityBoundary('Athens', 37.9755, 23.7348, 'Greece', 0.3),
                this.createCityBoundary('Bucharest', 44.4268, 26.1025, 'Romania', 0.3),
                this.createCityBoundary('Kiev', 50.4501, 30.5234, 'Ukraine', 0.3),
                this.createCityBoundary('Seoul', 37.5665, 126.9780, 'South Korea', 0.3),
                this.createCityBoundary('Singapore', 1.3521, 103.8198, 'Singapore', 0.3),
                this.createCityBoundary('Hong Kong', 22.3193, 114.1694, 'Hong Kong', 0.3),
                this.createCityBoundary('Taipei', 25.0330, 121.5654, 'Taiwan', 0.3),
                this.createCityBoundary('Kuala Lumpur', 3.1390, 101.6869, 'Malaysia', 0.3),
                this.createCityBoundary('Ho Chi Minh City', 10.8231, 106.6297, 'Vietnam', 0.3),
                this.createCityBoundary('Hanoi', 21.0285, 105.8542, 'Vietnam', 0.3),
                this.createCityBoundary('Yangon', 16.8661, 96.1951, 'Myanmar', 0.3),
                this.createCityBoundary('Colombo', 6.9271, 79.8612, 'Sri Lanka', 0.3),
                this.createCityBoundary('Kabul', 34.5553, 69.2075, 'Afghanistan', 0.3),
                this.createCityBoundary('Tashkent', 41.2995, 69.2401, 'Uzbekistan', 0.3),
                this.createCityBoundary('Almaty', 43.2220, 76.8512, 'Kazakhstan', 0.3),
                this.createCityBoundary('Baku', 40.4093, 49.8671, 'Azerbaijan', 0.3),
                this.createCityBoundary('Tel Aviv', 32.0853, 34.7818, 'Israel', 0.3),
                this.createCityBoundary('Riyadh', 24.7136, 46.6753, 'Saudi Arabia', 0.3),
                this.createCityBoundary('Jeddah', 21.4858, 39.1925, 'Saudi Arabia', 0.3),
                this.createCityBoundary('Dubai', 25.2048, 55.2708, 'UAE', 0.3),
                this.createCityBoundary('Abu Dhabi', 24.2992, 54.6970, 'UAE', 0.3),
                this.createCityBoundary('Doha', 25.2760, 51.5200, 'Qatar', 0.3),
                this.createCityBoundary('Kuwait City', 29.3759, 47.9774, 'Kuwait', 0.3),
                this.createCityBoundary('Baghdad', 33.3152, 44.3661, 'Iraq', 0.3),
                this.createCityBoundary('Damascus', 33.5138, 36.2765, 'Syria', 0.3),
                this.createCityBoundary('Aleppo', 36.2021, 37.1343, 'Syria', 0.3),
                this.createCityBoundary('Amman', 31.9539, 35.9106, 'Jordan', 0.3),
                this.createCityBoundary('Johannesburg', -26.2041, 28.0473, 'South Africa', 0.3),
                this.createCityBoundary('Cape Town', -33.9249, 18.4241, 'South Africa', 0.3),
                this.createCityBoundary('Durban', -29.8587, 31.0218, 'South Africa', 0.3),
                this.createCityBoundary('Nairobi', -1.2921, 36.8219, 'Kenya', 0.3),
                this.createCityBoundary('Addis Ababa', 9.1450, 40.4897, 'Ethiopia', 0.3),
                this.createCityBoundary('Dar es Salaam', -6.7924, 39.2083, 'Tanzania', 0.3),
                this.createCityBoundary('Kampala', 0.3476, 32.5825, 'Uganda', 0.3),
                this.createCityBoundary('Accra', 5.6037, -0.1870, 'Ghana', 0.3),
                this.createCityBoundary('Abidjan', 5.3600, -4.0083, 'Ivory Coast', 0.3),
                this.createCityBoundary('Dakar', 14.7167, -17.4677, 'Senegal', 0.3),
                this.createCityBoundary('Bamako', 12.6392, -8.0029, 'Mali', 0.3),
                this.createCityBoundary('Ouagadougou', 12.3714, -1.5197, 'Burkina Faso', 0.3),
                this.createCityBoundary('Abuja', 9.0765, 7.3986, 'Nigeria', 0.3),
                this.createCityBoundary('Kano', 12.0022, 8.5919, 'Nigeria', 0.3),
                this.createCityBoundary('Ibadan', 7.3775, 3.9470, 'Nigeria', 0.3),
                this.createCityBoundary('Casablanca', 33.5731, -7.5898, 'Morocco', 0.3),
                this.createCityBoundary('Tunis', 36.8065, 10.1815, 'Tunisia', 0.3),
                this.createCityBoundary('Algiers', 36.7538, 3.0588, 'Algeria', 0.3),
                this.createCityBoundary('Tripoli', 32.8872, 13.1913, 'Libya', 0.3),
                this.createCityBoundary('Alexandria', 31.2001, 29.9187, 'Egypt', 0.3),
                this.createCityBoundary('Khartoum', 15.5007, 32.5599, 'Sudan', 0.3),
                this.createCityBoundary('Miami', 25.7617, -80.1918, 'United States', 0.3),
                this.createCityBoundary('Las Vegas', 36.1699, -115.1398, 'United States', 0.3),
                this.createCityBoundary('Seattle', 47.6062, -122.3321, 'United States', 0.3),
                this.createCityBoundary('Denver', 39.7392, -104.9903, 'United States', 0.3),
                this.createCityBoundary('Boston', 42.3601, -71.0589, 'United States', 0.3),
                this.createCityBoundary('Atlanta', 33.7490, -84.3880, 'United States', 0.3),
                this.createCityBoundary('Detroit', 42.3314, -83.0458, 'United States', 0.3),
                this.createCityBoundary('Minneapolis', 44.9778, -93.2650, 'United States', 0.3),
                this.createCityBoundary('Tampa', 27.9506, -82.4572, 'United States', 0.3),
                this.createCityBoundary('New Orleans', 29.9511, -90.0715, 'United States', 0.3),
                this.createCityBoundary('Guadalajara', 20.6597, -103.3496, 'Mexico', 0.3),
                this.createCityBoundary('Monterrey', 25.6866, -100.3161, 'Mexico', 0.3),
                this.createCityBoundary('Puebla', 19.0414, -98.2063, 'Mexico', 0.3),
                this.createCityBoundary('Tijuana', 32.5149, -117.0382, 'Mexico', 0.3),
                this.createCityBoundary('Guatemala City', 14.6349, -90.5069, 'Guatemala', 0.3),
                
                // REGIONAL CENTERS (500k-1M) - Small circles (0.2°)
                this.createCityBoundary('Ankara', 39.9334, 32.8597, 'Turkey', 0.2),
                this.createCityBoundary('Izmir', 38.4192, 27.1287, 'Turkey', 0.2),
                this.createCityBoundary('Bursa', 40.1826, 29.0669, 'Turkey', 0.2),
                this.createCityBoundary('Antalya', 36.8841, 30.7056, 'Turkey', 0.2),
                this.createCityBoundary('Adana', 37.0000, 35.3213, 'Turkey', 0.2),
                this.createCityBoundary('Konya', 37.8746, 32.4932, 'Turkey', 0.2),
                this.createCityBoundary('Gaziantep', 37.0662, 37.3833, 'Turkey', 0.2),
                this.createCityBoundary('Kayseri', 38.7312, 35.4787, 'Turkey', 0.2),
                this.createCityBoundary('Mersin', 36.8121, 34.6415, 'Turkey', 0.2),
                this.createCityBoundary('Diyarbakır', 37.9144, 40.2306, 'Turkey', 0.2),
                this.createCityBoundary('Trabzon', 41.0015, 39.7178, 'Turkey', 0.2),
                this.createCityBoundary('Samsun', 41.2867, 36.3300, 'Turkey', 0.2),
                this.createCityBoundary('Malatya', 38.3552, 38.3095, 'Turkey', 0.2),
                this.createCityBoundary('Erzurum', 39.9334, 41.2760, 'Turkey', 0.2),
                this.createCityBoundary('Van', 38.4891, 43.4089, 'Turkey', 0.2),
                this.createCityBoundary('Sanliurfa', 37.1674, 38.7955, 'Turkey', 0.2),
                this.createCityBoundary('Eskisehir', 39.7767, 30.5206, 'Turkey', 0.2),
                this.createCityBoundary('Denizli', 37.7765, 29.0864, 'Turkey', 0.2),
                this.createCityBoundary('Sakarya', 40.7569, 30.3783, 'Turkey', 0.2),
                this.createCityBoundary('Kahramanmaras', 37.5847, 36.9250, 'Turkey', 0.2),
                this.createCityBoundary('Stockholm', 59.3293, 18.0686, 'Sweden', 0.2),
                this.createCityBoundary('Oslo', 59.9139, 10.7522, 'Norway', 0.2),
                this.createCityBoundary('Copenhagen', 55.6761, 12.5683, 'Denmark', 0.2),
                this.createCityBoundary('Helsinki', 60.1699, 24.9384, 'Finland', 0.2),
                this.createCityBoundary('Zurich', 47.3769, 8.5417, 'Switzerland', 0.2),
                this.createCityBoundary('Geneva', 46.2044, 6.1432, 'Switzerland', 0.2),
                this.createCityBoundary('Turin', 45.0703, 7.6869, 'Italy', 0.2),
                this.createCityBoundary('Florence', 43.7696, 11.2558, 'Italy', 0.2),
                this.createCityBoundary('Venice', 45.4408, 12.3155, 'Italy', 0.2),
                this.createCityBoundary('Porto', 41.1579, -8.6291, 'Portugal', 0.2),
                this.createCityBoundary('Sofia', 42.6977, 23.3219, 'Bulgaria', 0.2),
                this.createCityBoundary('Belgrade', 44.7866, 20.4489, 'Serbia', 0.2),
                this.createCityBoundary('Zagreb', 45.8150, 15.9819, 'Croatia', 0.2),
                this.createCityBoundary('Brussels', 50.8476, 4.3572, 'Belgium', 0.2),
                this.createCityBoundary('Rotterdam', 51.9244, 4.4777, 'Netherlands', 0.2),
                this.createCityBoundary('The Hague', 52.0705, 4.3007, 'Netherlands', 0.2),
                this.createCityBoundary('Antwerp', 51.2194, 4.4025, 'Belgium', 0.2),
                this.createCityBoundary('Gothenburg', 57.7089, 11.9746, 'Sweden', 0.2),
                this.createCityBoundary('Busan', 35.1796, 129.0756, 'South Korea', 0.2),
                this.createCityBoundary('Kathmandu', 27.7172, 85.3240, 'Nepal', 0.2),
                this.createCityBoundary('Thimphu', 27.4728, 89.6393, 'Bhutan', 0.2),
                this.createCityBoundary('Yerevan', 40.1792, 44.4991, 'Armenia', 0.2),
                this.createCityBoundary('Tbilisi', 41.7151, 44.8271, 'Georgia', 0.2),
                this.createCityBoundary('Jerusalem', 31.7683, 35.2137, 'Israel', 0.2),
                this.createCityBoundary('Manama', 26.0667, 50.5577, 'Bahrain', 0.2),
                this.createCityBoundary('Muscat', 23.5859, 58.4059, 'Oman', 0.2),
                this.createCityBoundary('Isfahan', 32.6539, 51.6660, 'Iran', 0.2),
                this.createCityBoundary('Beirut', 33.8938, 35.5018, 'Lebanon', 0.2),
                this.createCityBoundary('Kigali', -1.9441, 30.0619, 'Rwanda', 0.2),
                this.createCityBoundary('Niamey', 13.5116, 2.1254, 'Niger', 0.2),
                this.createCityBoundary('Rabat', 34.0209, -6.8416, 'Morocco', 0.2),
                this.createCityBoundary('Marrakech', 31.6295, -7.9811, 'Morocco', 0.2),
                this.createCityBoundary('Orlando', 28.5383, -81.3792, 'United States', 0.2),
                this.createCityBoundary('Portland', 45.5152, -122.6784, 'United States', 0.2),
                this.createCityBoundary('Salt Lake City', 40.7608, -111.8910, 'United States', 0.2),
                this.createCityBoundary('Nashville', 36.1627, -86.7816, 'United States', 0.2),
                this.createCityBoundary('Memphis', 35.1495, -90.0490, 'United States', 0.2),
                this.createCityBoundary('León', 21.1619, -101.6921, 'Mexico', 0.2),
                this.createCityBoundary('San Salvador', 13.6929, -89.2182, 'El Salvador', 0.2),
                this.createCityBoundary('Tegucigalpa', 14.0723, -87.1921, 'Honduras', 0.2),
                this.createCityBoundary('Managua', 12.1364, -86.2514, 'Nicaragua', 0.2),
                this.createCityBoundary('San José', 9.9281, -84.0907, 'Costa Rica', 0.2),
                this.createCityBoundary('Panama City', 8.9824, -79.5199, 'Panama', 0.2),
                this.createCityBoundary('Havana', 23.1136, -82.3666, 'Cuba', 0.4),
                this.createCityBoundary('Kingston', 17.9771, -76.7674, 'Jamaica', 0.2),
                this.createCityBoundary('Santo Domingo', 18.4861, -69.9312, 'Dominican Republic', 0.3),
                this.createCityBoundary('Port-au-Prince', 18.5944, -72.3074, 'Haiti', 0.3),
                this.createCityBoundary('San Juan', 18.4655, -66.1057, 'Puerto Rico', 0.2),
                this.createCityBoundary('Caracas', 10.4806, -66.9036, 'Venezuela', 0.5),
                this.createCityBoundary('Maracaibo', 10.6317, -71.6400, 'Venezuela', 0.3),
                this.createCityBoundary('Barranquilla', 10.9639, -74.7964, 'Colombia', 0.3),
                this.createCityBoundary('Cali', 3.4516, -76.5320, 'Colombia', 0.3),
                this.createCityBoundary('Medellín', 6.2504, -75.5636, 'Colombia', 0.3),
                this.createCityBoundary('Cartagena', 10.3910, -75.4794, 'Colombia', 0.2),
                this.createCityBoundary('Quito', -0.1807, -78.4678, 'Ecuador', 0.3),
                this.createCityBoundary('Guayaquil', -2.1709, -79.9224, 'Ecuador', 0.3),
                this.createCityBoundary('La Paz', -16.5000, -68.1193, 'Bolivia', 0.3),
                this.createCityBoundary('Santa Cruz', -17.8146, -63.1560, 'Bolivia', 0.3),
                this.createCityBoundary('Asunción', -25.2637, -57.5759, 'Paraguay', 0.2),
                this.createCityBoundary('Montevideo', -34.9011, -56.1645, 'Uruguay', 0.3),
                this.createCityBoundary('Santiago', -33.4489, -70.6693, 'Chile', 0.5),
                this.createCityBoundary('Valparaíso', -33.0472, -71.6127, 'Chile', 0.2),
                this.createCityBoundary('Córdoba', -31.4201, -64.1888, 'Argentina', 0.3),
                this.createCityBoundary('Rosario', -32.9442, -60.6505, 'Argentina', 0.3),
                this.createCityBoundary('Mendoza', -32.8895, -68.8458, 'Argentina', 0.2),
                this.createCityBoundary('Brasília', -15.8267, -47.9218, 'Brazil', 0.4),
                this.createCityBoundary('Salvador', -12.9714, -38.5014, 'Brazil', 0.4),
                this.createCityBoundary('Fortaleza', -3.7319, -38.5267, 'Brazil', 0.4),
                this.createCityBoundary('Belo Horizonte', -19.9208, -43.9378, 'Brazil', 0.4),
                this.createCityBoundary('Manaus', -3.1190, -60.0217, 'Brazil', 0.3),
                this.createCityBoundary('Curitiba', -25.4284, -49.2733, 'Brazil', 0.3),
                this.createCityBoundary('Recife', -8.0476, -34.8770, 'Brazil', 0.3),
                this.createCityBoundary('Porto Alegre', -30.0346, -51.2177, 'Brazil', 0.3),
                
                // Oceania  
                this.createCityBoundary('Auckland', -36.8485, 174.7633, 'New Zealand', 0.3),
                this.createCityBoundary('Wellington', -41.2865, 174.7762, 'New Zealand', 0.2),
                this.createCityBoundary('Christchurch', -43.5321, 172.6362, 'New Zealand', 0.2),
                this.createCityBoundary('Suva', -18.1248, 178.4501, 'Fiji', 0.1),
                this.createCityBoundary('Port Moresby', -9.4438, 147.1803, 'Papua New Guinea', 0.2),
                this.createCityBoundary('Nuku\'alofa', -21.1385, -175.2206, 'Tonga', 0.1),
                this.createCityBoundary('Apia', -13.8506, -171.7513, 'Samoa', 0.1),
                this.createCityBoundary('Port Vila', -17.7334, 168.3273, 'Vanuatu', 0.1),
                
                // Additional Asian Cities
                this.createCityBoundary('Pune', 18.5204, 73.8567, 'India', 0.3),
                this.createCityBoundary('Ahmedabad', 23.0225, 72.5714, 'India', 0.3),
                this.createCityBoundary('Surat', 21.1702, 72.8311, 'India', 0.2),
                this.createCityBoundary('Jaipur', 26.9124, 75.7873, 'India', 0.2),
                this.createCityBoundary('Lucknow', 26.8467, 80.9462, 'India', 0.2),
                this.createCityBoundary('Kanpur', 26.4499, 80.3319, 'India', 0.2),
                this.createCityBoundary('Nagpur', 21.1458, 79.0882, 'India', 0.2),
                this.createCityBoundary('Indore', 22.7196, 75.8577, 'India', 0.2),
                this.createCityBoundary('Thane', 19.2183, 72.9781, 'India', 0.2),
                this.createCityBoundary('Bhopal', 23.2599, 77.4126, 'India', 0.2),
                this.createCityBoundary('Visakhapatnam', 17.6868, 83.2185, 'India', 0.2),
                this.createCityBoundary('Pimpri-Chinchwad', 18.6298, 73.7997, 'India', 0.2),
                this.createCityBoundary('Patna', 25.5941, 85.1376, 'India', 0.2),
                this.createCityBoundary('Vadodara', 22.3072, 73.1812, 'India', 0.2),
                this.createCityBoundary('Ghaziabad', 28.6692, 77.4538, 'India', 0.2),
                this.createCityBoundary('Ludhiana', 30.9010, 75.8573, 'India', 0.2),
                this.createCityBoundary('Agra', 27.1767, 78.0081, 'India', 0.2),
                this.createCityBoundary('Nashik', 19.9975, 73.7898, 'India', 0.2),
                this.createCityBoundary('Faridabad', 28.4089, 77.3178, 'India', 0.2),
                this.createCityBoundary('Meerut', 28.9845, 77.7064, 'India', 0.2),
                this.createCityBoundary('Rajkot', 22.3039, 70.8022, 'India', 0.2),
                this.createCityBoundary('Kalyan-Dombivli', 19.2403, 73.1305, 'India', 0.2),
                this.createCityBoundary('Vasai-Virar', 19.4912, 72.8054, 'India', 0.2),
                this.createCityBoundary('Varanasi', 25.3176, 82.9739, 'India', 0.2),
                this.createCityBoundary('Srinagar', 34.0837, 74.7973, 'India', 0.2),
                this.createCityBoundary('Aurangabad', 19.8762, 75.3433, 'India', 0.2),
                this.createCityBoundary('Dhanbad', 23.7957, 86.4304, 'India', 0.2),
                this.createCityBoundary('Amritsar', 31.6340, 74.8723, 'India', 0.2),
                this.createCityBoundary('Navi Mumbai', 19.0330, 73.0297, 'India', 0.2),
                this.createCityBoundary('Allahabad', 25.4358, 81.8463, 'India', 0.2),
                this.createCityBoundary('Howrah', 22.5958, 88.2636, 'India', 0.2),
                this.createCityBoundary('Ranchi', 23.3441, 85.3096, 'India', 0.2),
                this.createCityBoundary('Gwalior', 26.2183, 78.1828, 'India', 0.2),
                this.createCityBoundary('Jabalpur', 23.1815, 79.9864, 'India', 0.2),
                this.createCityBoundary('Coimbatore', 11.0168, 76.9558, 'India', 0.2),
                this.createCityBoundary('Vijayawada', 16.5062, 80.6480, 'India', 0.2),
                this.createCityBoundary('Jodhpur', 26.2389, 73.0243, 'India', 0.2),
                this.createCityBoundary('Madurai', 9.9252, 78.1198, 'India', 0.2),
                this.createCityBoundary('Raipur', 21.2514, 81.6296, 'India', 0.2),
                this.createCityBoundary('Kota', 25.2138, 75.8648, 'India', 0.2),
                
                // More Chinese Cities
                this.createCityBoundary('Wuhan', 30.5928, 114.3055, 'China', 0.3),
                this.createCityBoundary('Chengdu', 30.5728, 104.0668, 'China', 0.3),
                this.createCityBoundary('Nanjing', 32.0603, 118.7969, 'China', 0.3),
                this.createCityBoundary('Xi\'an', 34.3416, 108.9398, 'China', 0.3),
                this.createCityBoundary('Hangzhou', 30.2741, 120.1551, 'China', 0.3),
                this.createCityBoundary('Shenyang', 41.8057, 123.4315, 'China', 0.3),
                this.createCityBoundary('Harbin', 45.8038, 126.5349, 'China', 0.2),
                this.createCityBoundary('Suzhou', 31.2989, 120.5853, 'China', 0.2),
                this.createCityBoundary('Qingdao', 36.0671, 120.3826, 'China', 0.2),
                this.createCityBoundary('Dalian', 38.9140, 121.6147, 'China', 0.2),
                this.createCityBoundary('Zhengzhou', 34.7466, 113.6253, 'China', 0.2),
                this.createCityBoundary('Changsha', 28.2282, 112.9388, 'China', 0.2),
                this.createCityBoundary('Kunming', 25.0389, 102.7183, 'China', 0.2),
                this.createCityBoundary('Taiyuan', 37.8706, 112.5489, 'China', 0.2),
                this.createCityBoundary('Shijiazhuang', 38.0428, 114.5149, 'China', 0.2),
                this.createCityBoundary('Changchun', 43.8171, 125.3235, 'China', 0.2),
                this.createCityBoundary('Hefei', 31.8206, 117.2272, 'China', 0.2),
                this.createCityBoundary('Nanning', 22.8167, 108.3669, 'China', 0.2),
                this.createCityBoundary('Ürümqi', 43.8256, 87.6168, 'China', 0.2),
                this.createCityBoundary('Foshan', 23.0301, 113.1219, 'China', 0.2),
                this.createCityBoundary('Dongguan', 23.0489, 113.7447, 'China', 0.2),
                this.createCityBoundary('Yantai', 37.4638, 121.4478, 'China', 0.2),
                this.createCityBoundary('Wuxi', 31.4912, 120.3124, 'China', 0.2),
                
                // More Southeast Asian Cities
                this.createCityBoundary('Medan', -3.5952, 98.6722, 'Indonesia', 0.3),
                this.createCityBoundary('Bandung', -6.9175, 107.6191, 'Indonesia', 0.3),
                this.createCityBoundary('Bekasi', -6.2383, 106.9756, 'Indonesia', 0.2),
                this.createCityBoundary('Palembang', -2.9761, 104.7754, 'Indonesia', 0.2),
                this.createCityBoundary('Tangerang', -6.1783, 106.6319, 'Indonesia', 0.2),
                this.createCityBoundary('Makassar', -5.1477, 119.4327, 'Indonesia', 0.2),
                this.createCityBoundary('Semarang', -6.9667, 110.4167, 'Indonesia', 0.2),
                this.createCityBoundary('Depok', -6.4025, 106.7942, 'Indonesia', 0.2),
                this.createCityBoundary('Batam', 1.1456, 104.0305, 'Indonesia', 0.2),
                this.createCityBoundary('Padang', -0.9471, 100.4172, 'Indonesia', 0.2),
                this.createCityBoundary('Bandar Lampung', -5.3971, 105.2668, 'Indonesia', 0.2),
                this.createCityBoundary('Malang', -7.9666, 112.6326, 'Indonesia', 0.2),
                this.createCityBoundary('Surabaya', -7.2575, 112.7521, 'Indonesia', 0.3),
                this.createCityBoundary('Bogor', -6.5944, 106.7892, 'Indonesia', 0.2),
                this.createCityBoundary('Pekanbaru', 0.5073, 101.4481, 'Indonesia', 0.2),
                this.createCityBoundary('Banjarmasin', -3.3194, 114.5906, 'Indonesia', 0.2),
                this.createCityBoundary('Samarinda', -0.5020, 117.1534, 'Indonesia', 0.2),
                this.createCityBoundary('Denpasar', -8.6500, 115.2167, 'Indonesia', 0.2),
                this.createCityBoundary('Pontianak', -0.0263, 109.3425, 'Indonesia', 0.2),
                this.createCityBoundary('Balikpapan', -1.2675, 116.8289, 'Indonesia', 0.2),
                
                // More Middle Eastern Cities
                this.createCityBoundary('Mashhad', 36.2605, 59.6168, 'Iran', 0.3),
                this.createCityBoundary('Karaj', 35.8327, 50.9916, 'Iran', 0.2),
                this.createCityBoundary('Shiraz', 29.5918, 52.5837, 'Iran', 0.2),
                this.createCityBoundary('Tabriz', 38.0962, 46.2738, 'Iran', 0.2),
                this.createCityBoundary('Qom', 34.6401, 50.8764, 'Iran', 0.2),
                this.createCityBoundary('Ahvaz', 31.3203, 48.6693, 'Iran', 0.2),
                this.createCityBoundary('Kermanshah', 34.3277, 47.0778, 'Iran', 0.2),
                this.createCityBoundary('Urmia', 37.5527, 45.0761, 'Iran', 0.2),
                this.createCityBoundary('Zahedan', 29.4963, 60.8629, 'Iran', 0.2),
                this.createCityBoundary('Rasht', 37.2809, 49.5832, 'Iran', 0.2),
                this.createCityBoundary('Hamadan', 34.7992, 48.5146, 'Iran', 0.2),
                this.createCityBoundary('Kerman', 30.2839, 57.0834, 'Iran', 0.2),
                this.createCityBoundary('Yazd', 31.8974, 54.3569, 'Iran', 0.2),
                this.createCityBoundary('Ardabil', 38.2498, 48.2933, 'Iran', 0.2),
                this.createCityBoundary('Bandar Abbas', 27.1865, 56.2808, 'Iran', 0.2),
                this.createCityBoundary('Arak', 34.0954, 49.7013, 'Iran', 0.2),
                this.createCityBoundary('Eslamshahr', 35.5528, 51.2306, 'Iran', 0.2),
                this.createCityBoundary('Ilam', 33.6374, 46.4227, 'Iran', 0.1),
                this.createCityBoundary('Bushehr', 28.9684, 50.8385, 'Iran', 0.1),
                this.createCityBoundary('Zanjan', 36.6736, 48.4787, 'Iran', 0.1),
                
                // More Russian Cities  
                this.createCityBoundary('Novosibirsk', 55.0084, 82.9357, 'Russia', 0.3),
                this.createCityBoundary('Yekaterinburg', 56.8431, 60.6454, 'Russia', 0.3),
                this.createCityBoundary('Nizhny Novgorod', 56.2965, 43.9361, 'Russia', 0.2),
                this.createCityBoundary('Kazan', 55.8304, 49.0661, 'Russia', 0.2),
                this.createCityBoundary('Chelyabinsk', 55.1644, 61.4368, 'Russia', 0.2),
                this.createCityBoundary('Omsk', 54.9885, 73.3242, 'Russia', 0.2),
                this.createCityBoundary('Samara', 53.2001, 50.1500, 'Russia', 0.2),
                this.createCityBoundary('Rostov-on-Don', 47.2357, 39.7015, 'Russia', 0.2),
                this.createCityBoundary('Ufa', 54.7388, 55.9721, 'Russia', 0.2),
                this.createCityBoundary('Krasnoyarsk', 56.0184, 92.8672, 'Russia', 0.2),
                this.createCityBoundary('Perm', 58.0105, 56.2502, 'Russia', 0.2),
                this.createCityBoundary('Voronezh', 51.6720, 39.1843, 'Russia', 0.2),
                this.createCityBoundary('Volgograd', 48.7080, 44.5133, 'Russia', 0.2),
                this.createCityBoundary('Krasnodar', 45.0355, 38.9753, 'Russia', 0.2),
                this.createCityBoundary('Saratov', 51.5924, 46.0348, 'Russia', 0.2),
                this.createCityBoundary('Tolyatti', 53.5303, 49.3461, 'Russia', 0.2),
                this.createCityBoundary('Izhevsk', 56.8527, 53.2116, 'Russia', 0.2),
                this.createCityBoundary('Barnaul', 53.3606, 83.7636, 'Russia', 0.2),
                this.createCityBoundary('Ulyanovsk', 54.3170, 48.4003, 'Russia', 0.2),
                this.createCityBoundary('Irkutsk', 52.2978, 104.2964, 'Russia', 0.2),
                this.createCityBoundary('Khabarovsk', 48.4827, 135.0840, 'Russia', 0.2),
                this.createCityBoundary('Yaroslavl', 57.6261, 39.8845, 'Russia', 0.2),
                this.createCityBoundary('Vladivostok', 43.1056, 131.8735, 'Russia', 0.2),
                this.createCityBoundary('Mahachkala', 42.9849, 47.5047, 'Russia', 0.2),
                this.createCityBoundary('Tomsk', 56.5018, 84.9776, 'Russia', 0.2),
                this.createCityBoundary('Orenburg', 51.7727, 55.0988, 'Russia', 0.2),
                this.createCityBoundary('Novokuznetsk', 53.7596, 87.1216, 'Russia', 0.2),
                this.createCityBoundary('Kemerovo', 55.3331, 86.0831, 'Russia', 0.2),
                this.createCityBoundary('Ryazan', 54.6269, 39.6916, 'Russia', 0.2),
                this.createCityBoundary('Naberezhnye Chelny', 55.7423, 52.4111, 'Russia', 0.2),
                this.createCityBoundary('Astrakhan', 46.3497, 48.0408, 'Russia', 0.2),
                this.createCityBoundary('Lipetsk', 52.6031, 39.5708, 'Russia', 0.2)
            ]
        };
        
        console.log(`✅ Created comprehensive fallback with ${this.cityBoundariesData.features.length} cities`);
        this.log(`✅ ${this.cityBoundariesData.features.length} şehirli kapsamlı varsayılan oluşturuldu`, 'success');
    }

    // === GeoBoundaries ADM2 Global Loader ===
    async loadGeoBoundariesADM2Global(config) {
        console.log('🌐 Loading GeoBoundaries ADM2 global dataset...');
        
        try {
            // Step 1: Get list of all countries with ADM2 data
            const listUrl = 'https://www.geoboundaries.org/api/current/gbOpen/ALL/ADM2/';
            console.log(`📡 Fetching country list from: ${listUrl}`);
            
            const response = await fetch(listUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const countryList = await response.json();
            
            // Validate response is array
            if (!Array.isArray(countryList)) {
                throw new Error('GeoBoundaries API returned non-array response');
            }
            
            console.log(`📋 Found ${countryList.length} countries with ADM2 data`);
            
            // DEBUG: Log first few countries to see structure
            if (countryList.length > 0) {
                console.log('🔍 GeoBoundaries API Response Sample:');
                console.log('🔍 Total countries:', countryList.length);
                console.log('🔍 First country object:', countryList[0]);
                console.log('🔍 Available properties:', Object.keys(countryList[0]));
                console.log('🔍 Sample properties values:');
                Object.keys(countryList[0]).forEach(key => {
                    console.log(`   ${key}: ${countryList[0][key]}`);
                });
            }
            
            // Step 2: Filter countries with valid download URLs
            const validCountries = countryList.filter(country => 
                country && country.gjDownloadURL && typeof country.gjDownloadURL === 'string'
            );
            
            console.log(`✅ ${validCountries.length} countries have valid download URLs`);
            
            if (validCountries.length === 0) {
                throw new Error('No valid countries found in GeoBoundaries response');
            }
            
            // Step 3: Download with concurrency control
            const allFeatures = await this.downloadADM2WithConcurrency(validCountries, config);
            
            // Step 4: De-duplicate features
            const uniqueFeatures = this.deduplicateFeatures(allFeatures);
            console.log(`🔧 Deduplicated: ${allFeatures.length} → ${uniqueFeatures.length} features`);
            
            // Step 5: Simplify geometries if needed
            const simplifiedFeatures = this.simplifyFeaturesOptimal(uniqueFeatures, config.simplify);
            console.log(`🔧 Simplified ${simplifiedFeatures.length} ADM2 features`);
            
            // Step 6: Apply hard cap if needed
            const finalFeatures = simplifiedFeatures.length > config.maxTotal 
                ? simplifiedFeatures.slice(0, config.maxTotal)
                : simplifiedFeatures;
            
            if (simplifiedFeatures.length > config.maxTotal) {
                console.log(`📊 Applied hard cap: ${simplifiedFeatures.length} → ${finalFeatures.length} features`);
            }
            
            return {
                type: 'FeatureCollection',
                features: finalFeatures
            };
            
        } catch (error) {
            console.error('❌ GeoBoundaries ADM2 global load failed:', error);
            throw error;
        }
    }

    async downloadADM2WithConcurrency(countries, config) {
        console.log(`📦 Starting concurrent ADM2 downloads (max ${MAX_ADM2_CONCURRENCY} parallel)...`);
        
        // Extract ISO3 codes from countries - comprehensive property check
        const iso3List = countries.map((country, index) => {
            // Try all possible property names for ISO3 code
            const possibleProps = [
                'shapeISO', 'iso3', 'boundaryISO', 'ISO', 'iso', 
                'countryISO', 'country_iso', 'ISO3', 'iso_3',
                'shapeGroup', 'boundaryName'
            ];
            
            let iso3 = 'UNK';
            for (const prop of possibleProps) {
                if (country[prop] && typeof country[prop] === 'string' && country[prop].length === 3) {
                    iso3 = country[prop].toUpperCase();
                    break;
                }
            }
            
            // If we still don't have it, log the entire object for the first few
            if (iso3 === 'UNK' && index < 5) {
                console.log(`🔍 Country ${index} object:`, country);
                console.log(`🔍 Available properties:`, Object.keys(country));
            }
            
            return iso3;
        }).filter(iso3 => iso3 !== 'UNK' && iso3.length === 3); // Filter out unknown countries and ensure 3-letter codes
        
        console.log(`📋 Valid ISO3 codes extracted: ${iso3List.length} countries`);
        console.log(`📋 Sample ISO3 codes:`, iso3List.slice(0, 10));
        const results = {};
        const failed = [];
        let i = 0;

        // Worker function for concurrent downloads with cache support
        const self = this; // Capture 'this' for worker function
        async function worker() {
            while (i < iso3List.length) {
                const iso3 = iso3List[i++];
                try {
                    console.log(`📥 [${i}/${iso3List.length}] Loading ADM2 for ${iso3}...`);
                    const geoJson = await self.fetchADM2WithCache(iso3);
                    const features = geoJson.features || [];
                    results[iso3] = features;
                    console.log(`✅ [ADM2] ${iso3} yüklendi - ${features.length} features`);
                } catch (err) {
                    console.warn(`[ADM2] ${iso3} indirilemedi: ${err.message}`);
                    failed.push(iso3);
                }
            }
        }

        // Run workers concurrently
        await Promise.all(Array.from({ length: MAX_ADM2_CONCURRENCY }, worker));
        
        // Collect all features
        const allFeatures = Object.values(results).flat();
        
        // Store failed countries for UI display
        this.failedCountries = failed;
        
        console.log(`📊 Downloaded ${allFeatures.length} total ADM2 features from ${Object.keys(results).length} countries`);
        
        if (failed.length > 0) {
            console.warn(`⚠️ Failed to load ${failed.length} countries: ${failed.join(', ')}`);
            this.log(`⚠️ Yüklenemeyen ülkeler (${failed.length}): ${failed.join(', ')}`, 'warning');
        }
        
        return allFeatures;
    }

    // Cache-aware fetch for ADM2 data
    async fetchADM2WithCache(iso3) {
        try {
            // Try cache first
            const cache = await caches.open('adm2-v1');
            const cacheKey = buildAdm2Url(iso3);
            const cached = await cache.match(cacheKey);
            
            if (cached) {
                console.log(`💾 Using cached ADM2 data for ${iso3}`);
                return await cached.json();
            }
            
            // Fetch fresh data
            const geoJson = await fetchGeoJsonWithFallback(iso3);
            
            // Cache the response
            try {
                await cache.put(cacheKey, new Response(JSON.stringify(geoJson), {
                    headers: { 'Content-Type': 'application/json' }
                }));
                console.log(`💾 Cached ADM2 data for ${iso3}`);
            } catch (cacheError) {
                console.warn(`⚠️ Failed to cache ${iso3}:`, cacheError.message);
            }
            
            return geoJson;
            
        } catch (error) {
            // If cache operations fail, fall back to direct fetch
            console.warn(`⚠️ Cache operation failed for ${iso3}, using direct fetch`);
            return await fetchGeoJsonWithFallback(iso3);
        }
    }

    // Quick test method for specific countries
    async testADM2Countries(testIso3List = ['AFG', 'AGO', 'AUS', 'AUT']) {
        console.log('🧪 Testing ADM2 countries for CORS issues...');
        const results = {};
        
        for (const iso3 of testIso3List) {
            try {
                console.log(`🧪 Testing ${iso3}...`);
                const start = Date.now();
                const geoJson = await this.fetchADM2WithCache(iso3);
                const duration = Date.now() - start;
                const featureCount = geoJson.features ? geoJson.features.length : 0;
                
                results[iso3] = {
                    success: true,
                    features: featureCount,
                    duration: `${duration}ms`,
                    source: 'primary or fallback'
                };
                
                console.log(`✅ ${iso3}: ${featureCount} features loaded in ${duration}ms`);
                
            } catch (error) {
                results[iso3] = {
                    success: false,
                    error: error.message
                };
                console.error(`❌ ${iso3} failed: ${error.message}`);
            }
        }
        
        console.table(results);
        return results;
    }

    createConcurrencyLimit(maxConcurrent) {
        let running = 0;
        const queue = [];
        
        return async function(task) {
            return new Promise((resolve, reject) => {
                queue.push({ task, resolve, reject });
                processQueue();
            });
        };
        
        function processQueue() {
            if (running >= maxConcurrent || queue.length === 0) return;
            
            running++;
            const { task, resolve, reject } = queue.shift();
            
            task()
                .then(resolve)
                .catch(reject)
                .finally(() => {
                    running--;
                    processQueue();
                });
        }
    }

    deduplicateFeatures(features) {
        const seen = new Set();
        const unique = [];
        
        for (const feature of features) {
            // Create stable key from properties
            const props = feature.properties || {};
            const key = `${props.shapeID || ''}|${props.shapeName || ''}|${props.shapeISO || ''}|${props.shapeType || ''}`;
            
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(feature);
            }
        }
        
        return unique;
    }

    simplifyFeaturesOptimal(features, tolerance) {
        if (!tolerance || tolerance === 0) return features;
        
        console.log(`🔧 Simplifying ${features.length} features with tolerance ${tolerance}...`);
        
        return features.map((feature, index) => {
            if (index % 1000 === 0 && index > 0) {
                console.log(`🔧 Simplified ${index}/${features.length} features...`);
            }
            
            return {
                ...feature,
                geometry: this.simplifyGeometry(feature.geometry, tolerance)
            };
        });
    }

    simplifyGeometry(geometry, tolerance) {
        if (!geometry || !geometry.coordinates) return geometry;
        
        switch (geometry.type) {
            case 'Polygon':
                return {
                    ...geometry,
                    coordinates: geometry.coordinates.map(ring => 
                        this.simplifyRing(ring, tolerance)
                    )
                };
            case 'MultiPolygon':
                return {
                    ...geometry,
                    coordinates: geometry.coordinates.map(polygon =>
                        polygon.map(ring => this.simplifyRing(ring, tolerance))
                    )
                };
            default:
                return geometry;
        }
    }
    
    // === OSM Overpass ADM2 Fallback ===
    async loadOSMAdministrativeBoundaries(config) {
        console.log('🌐 Loading OSM administrative boundaries as ADM2 fallback...');
        
        try {
            // OSM Overpass query for administrative boundaries (levels 6-8 for city-like)
            const overpassQuery = `
                [out:json][timeout:60];
                (
                  relation["boundary"="administrative"]["admin_level"~"^[678]$"];
                );
                out geom;
            `;
            
            const overpassUrl = 'https://overpass-api.de/api/interpreter';
            
            console.log('📡 Querying OSM Overpass API for administrative boundaries...');
            
            const response = await fetch(overpassUrl, {
                method: 'POST',
                body: overpassQuery,
                headers: {
                    'Content-Type': 'text/plain'
                }
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const osmData = await response.json();
            const features = this.convertOSMToGeoJSON(osmData.elements || []);
            
            console.log(`✅ Converted ${features.length} OSM administrative boundaries to GeoJSON`);
            
            return {
                type: 'FeatureCollection',
                features: features.slice(0, config.maxTotal)
            };
            
        } catch (error) {
            console.error('❌ OSM Overpass fallback failed:', error);
            throw error;
        }
    }

        

    convertOSMToGeoJSON(osmElements) {
        const features = [];
        
        for (const element of osmElements) {
            if (element.type !== 'relation' || !element.members) continue;
            
            try {
                const geometry = this.buildPolygonFromOSMRelation(element);
                if (!geometry) continue;
                
                const feature = {
                    type: 'Feature',
                    geometry,
                    properties: {
                        NAME: element.tags?.name || element.tags?.['name:en'] || `OSM-${element.id}`,
                        admin_level: element.tags?.admin_level,
                        country: element.tags?.['addr:country'] || element.tags?.country,
                        type: 'osm-administrative',
                        osm_id: element.id
                    }
                };
                
                features.push(feature);
                
            } catch (error) {
                console.warn(`⚠️ Failed to convert OSM relation ${element.id}:`, error.message);
            }
        }
        
        return features;
    }

    buildPolygonFromOSMRelation(relation) {
        // Simplified OSM relation to polygon conversion
        // This is a basic implementation - OSM relations can be very complex
        const outerWays = [];
        const innerWays = [];
        
        for (const member of relation.members) {
            if (member.type === 'way' && member.geometry) {
                const coordinates = member.geometry.map(node => [node.lon, node.lat]);
                
                if (member.role === 'outer') {
                    outerWays.push(coordinates);
                } else if (member.role === 'inner') {
                    innerWays.push(coordinates);
                }
            }
        }
        
        if (outerWays.length === 0) return null;
        
        // Simplified: use first outer way as main polygon
        const mainRing = outerWays[0];
        
        // Ensure ring is closed
        if (mainRing.length > 0 && 
            (mainRing[0][0] !== mainRing[mainRing.length - 1][0] || 
             mainRing[0][1] !== mainRing[mainRing.length - 1][1])) {
            mainRing.push(mainRing[0]);
        }
        
        return {
            type: 'Polygon',
            coordinates: [mainRing, ...innerWays]
        };
    }

    createCityBoundary(name, lat, lng, country, radius = 0.5) {
        // Create a simple circular boundary around city center
        const points = [];
        
        for (let i = 0; i <= 32; i++) {
            const angle = (i * 2 * Math.PI) / 32;
            const x = lng + radius * Math.cos(angle);
            const y = lat + radius * Math.sin(angle);
            points.push([x, y]);
        }
        
        return {
            type: "Feature",
            properties: {
                NAME: name,
                NAME_1: name,
                COUNTRY: country,
                NAME_0: country,
                ENGTYPE_1: "Metropolitan Area"
            },
            geometry: {
                type: "Polygon",
                coordinates: [points]
            }
        };
    }

    // Convert OpenStreetMap Overpass API data to GeoJSON
    convertOSMToGeoJSON(osmData) {
        const features = [];
        
        if (osmData.elements) {
            osmData.elements.forEach(element => {
                if (element.type === 'relation' && element.geometry) {
                    const coordinates = element.geometry.map(geom => 
                        geom.map(coord => [coord.lon, coord.lat])
                    );
                    
                    features.push({
                        type: "Feature",
                        properties: {
                            NAME: element.tags?.name || 'Unknown City',
                            NAME_1: element.tags?.name || 'Unknown City',
                            COUNTRY: element.tags?.country || element.tags?.['addr:country'] || 'Unknown',
                            NAME_0: element.tags?.country || element.tags?.['addr:country'] || 'Unknown',
                            ENGTYPE_1: "City",
                            admin_level: element.tags?.admin_level || "8"
                        },
                        geometry: {
                            type: "Polygon",
                            coordinates: coordinates
                        }
                    });
                }
            });
        }
        
        return {
            type: "FeatureCollection",
            features: features
        };
    }

    // Convert Cities CSV to GeoJSON with circular boundaries
    convertCitiesCSVToGeoJSON(csvText, limitRows = true, maxRows = 3000) {
        const features = [];
        const lines = csvText.split('\n');
        if (lines.length < 2) return { type: "FeatureCollection", features: [] };
        
        const headers = lines[0].split(',');
        
        // Find column indices (case insensitive)
        const nameIdx = headers.findIndex(h => /name|city/i.test(h.trim()));
        const latIdx = headers.findIndex(h => /lat/i.test(h.trim()));
        const lngIdx = headers.findIndex(h => /lng|lon/i.test(h.trim()));
        const countryIdx = headers.findIndex(h => /country/i.test(h.trim()));
        const populationIdx = headers.findIndex(h => /population|pop/i.test(h.trim()));
        
        // Determine processing limit
        const endIndex = limitRows && maxRows > 0 ? Math.min(lines.length, maxRows + 1) : lines.length;
        
        console.log(`📊 Processing ${endIndex - 1} cities from CSV (total available: ${lines.length - 1})`);
        
        for (let i = 1; i < endIndex; i++) {
            const cols = lines[i].split(',');
            if (cols.length < 3) continue;
            
            const name = cols[nameIdx]?.replace(/"/g, '').trim() || 'Unknown City';
            const lat = parseFloat(cols[latIdx]);
            const lng = parseFloat(cols[lngIdx]);
            const country = cols[countryIdx]?.replace(/"/g, '').trim() || 'Unknown';
            const population = cols[populationIdx]?.replace(/"/g, '').trim() || '0';
            
            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                // Create circular boundary based on population (bigger cities = bigger circles)
                const pop = parseInt(population) || 0;
                let radius = 0.1; // Base radius
                if (pop > 10000000) radius = 0.7;     // Mega cities >10M
                else if (pop > 5000000) radius = 0.5; // Large cities 5-10M
                else if (pop > 1000000) radius = 0.3; // Major cities 1-5M  
                else if (pop > 500000) radius = 0.2;  // Medium cities 500k-1M
                else if (pop > 100000) radius = 0.15; // Small cities 100k-500k
                
                const cityBoundary = this.createCityBoundary(name, lat, lng, country, radius);
                cityBoundary.properties.POPULATION = population;
                cityBoundary.properties.POP_NUM = pop;
                cityBoundary.properties.NAME_1 = name; // For consistent labeling
                cityBoundary.properties.NAME_0 = country;
                features.push(cityBoundary);
            }
        }
        
        return {
            type: "FeatureCollection", 
            features: features
        };
    }

    // Convert Cities JSON array to GeoJSON with circular boundaries
    convertCitiesJSONToGeoJSON(citiesArray, maxCities = 0) {
        const features = [];
        
        // Handle different JSON formats
        let cities = citiesArray;
        if (citiesArray.cities) cities = citiesArray.cities;
        if (!Array.isArray(cities)) cities = Object.values(cities);
        
        const endIndex = maxCities > 0 ? Math.min(cities.length, maxCities) : cities.length;
        console.log(`📊 Processing ${endIndex} cities from JSON (total available: ${cities.length})`);
        
        for (let i = 0; i < endIndex; i++) {
            const city = cities[i];
            if (!city) continue;
            
            const name = city.name || city.city || city.Name || 'Unknown City';
            const lat = parseFloat(city.lat || city.latitude || city.Latitude || 0);
            const lng = parseFloat(city.lng || city.longitude || city.Longitude || city.lon || 0);
            const country = city.country || city.Country || city.countryCode || 'Unknown';
            const population = city.population || city.Population || '0';
            
            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                // Create circular boundary based on population
                const pop = parseInt(population) || 0;
                let radius = 0.15; // Base radius
                if (pop > 10000000) radius = 0.7;     // Mega cities >10M
                else if (pop > 5000000) radius = 0.5; // Large cities 5-10M  
                else if (pop > 1000000) radius = 0.3; // Major cities 1-5M
                else if (pop > 500000) radius = 0.2;  // Medium cities 500k-1M
                else if (pop > 100000) radius = 0.15; // Small cities 100k-500k
                
                const cityBoundary = this.createCityBoundary(name, lat, lng, country, radius);
                cityBoundary.properties.POPULATION = population;
                cityBoundary.properties.POP_NUM = pop;
                cityBoundary.properties.NAME_1 = name; // For consistent labeling
                cityBoundary.properties.NAME_0 = country;
                features.push(cityBoundary);
            }
        }
        
        return {
            type: "FeatureCollection", 
            features: features
        };
    }

    // Simplify GeoJSON geometry to reduce complexity
    simplifyGeoJSON(geojson, tolerance = 0.01) {
        if (!geojson || !geojson.features) return geojson;
        
        // Simple Douglas-Peucker-like simplification for polygons
        const simplifiedFeatures = geojson.features.map(feature => {
            if (feature.geometry && feature.geometry.type === 'Polygon') {
                const coordinates = feature.geometry.coordinates;
                const simplifiedCoords = coordinates.map(ring => 
                    this.simplifyRing(ring, tolerance)
                );
                
                return {
                    ...feature,
                    geometry: {
                        ...feature.geometry,
                        coordinates: simplifiedCoords
                    }
                };
            }
            return feature;
        });
        
        return {
            ...geojson,
            features: simplifiedFeatures
        };
    }

    // Simple ring simplification
    simplifyRing(ring, tolerance) {
        if (ring.length <= 3) return ring;
        
        // Keep every nth point based on tolerance
        const step = Math.max(1, Math.floor(tolerance * ring.length));
        const simplified = [];
        
        for (let i = 0; i < ring.length; i += step) {
            simplified.push(ring[i]);
        }
        
        // Always keep the first and last points
        if (simplified[simplified.length - 1] !== ring[ring.length - 1]) {
            simplified.push(ring[ring.length - 1]);
        }
        
        return simplified;
    }

    // Progressive rendering for large datasets
    async renderCityBoundariesProgressively(features, batchSize = 3000) {
        console.log(`🔄 Starting progressive rendering of ${features.length} city boundaries`);
        this.log(`🔄 ${features.length} şehir sınırı aşamalı gösteriliyor`, 'info');
        
        let renderedCount = 0;
        
        for (let i = 0; i < features.length; i += batchSize) {
            const batch = features.slice(i, i + batchSize);
            
            // Use requestIdleCallback if available, otherwise setTimeout
            await new Promise(resolve => {
                const renderBatch = () => {
                    // Get existing data and add new batch
                    const existingData = this.globe.polygonsData() || [];
                    const newData = [...existingData, ...batch];
                    
                    this.globe.polygonsData(newData);
                    renderedCount += batch.length;
                    
                    console.log(`📊 Rendered ${renderedCount} / ${features.length} city boundaries`);
                    resolve();
                };
                
                if (window.requestIdleCallback) {
                    requestIdleCallback(renderBatch, { timeout: 50 });
                } else {
                    setTimeout(renderBatch, 50); // Balanced delay for smooth rendering
                }
            });
        }
        
        console.log(`✅ Progressive rendering complete: ${renderedCount} city boundaries`);
        this.log(`✅ Aşamalı gösterim tamamlandı: ${renderedCount} şehir sınırı`, 'success');
    }

    // Process large CSV data using Web Worker
    async processLargeCSVInWorker(csvText, maxCities = 0) {
        return new Promise((resolve, reject) => {
            console.log('🔄 Starting Web Worker for large CSV processing...');
            
            const worker = new Worker('worker/city-loader.worker.js');
            
            worker.onmessage = (e) => {
                const { success, data, error, type, progress, processed, total, count } = e.data;
                
                if (type === 'progress') {
                    console.log(`📊 Worker progress: ${progress}% (${processed}/${total} cities)`);
                    return;
                }
                
                if (success) {
                    console.log(`✅ Web Worker completed: ${count} cities processed`);
                    worker.terminate();
                    resolve(data);
                } else {
                    console.error('❌ Web Worker failed:', error);
                    worker.terminate();
                    reject(new Error(error));
                }
            };
            
            worker.onerror = (error) => {
                console.error('❌ Web Worker error:', error);
                worker.terminate();
                reject(error);
            };
            
            // Start processing
            worker.postMessage({ csvText, maxCities });
        });
    }

    createCityBoundary(name, lat, lng, country, radius = 0.5) {
        if (!pop || isNaN(pop)) return '';
        const num = parseInt(pop);
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(0) + 'K';
        }
        return num.toString();
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text.toString();
        return div.innerHTML;
    }

    // Merkezi çeviri fonksiyonu - tüm ülkeler için
    getLocalizedCountryName(countryName) {
        const countryTranslations = {
            // Ana ülkeler
            'Turkey': { tr: 'Türkiye', en: 'Turkey' },
            'United States of America': { tr: 'Amerika Birleşik Devletleri', en: 'United States' },
            'United States': { tr: 'Amerika Birleşik Devletleri', en: 'United States' },
            'United Kingdom': { tr: 'Birleşik Krallık', en: 'United Kingdom' },
            'Germany': { tr: 'Almanya', en: 'Germany' },
            'France': { tr: 'Fransa', en: 'France' },
            'Italy': { tr: 'İtalya', en: 'Italy' },
            'Spain': { tr: 'İspanya', en: 'Spain' },
            'Portugal': { tr: 'Portekiz', en: 'Portugal' },
            'Russia': { tr: 'Rusya', en: 'Russia' },
            'Russian Federation': { tr: 'Rusya', en: 'Russia' },
            'China': { tr: 'Çin', en: 'China' },
            'Japan': { tr: 'Japonya', en: 'Japan' },
            'South Korea': { tr: 'Güney Kore', en: 'South Korea' },
            'North Korea': { tr: 'Kuzey Kore', en: 'North Korea' },
            'India': { tr: 'Hindistan', en: 'India' },
            'Pakistan': { tr: 'Pakistan', en: 'Pakistan' },
            'Bangladesh': { tr: 'Bangladeş', en: 'Bangladesh' },
            'Indonesia': { tr: 'Endonezya', en: 'Indonesia' },
            'Thailand': { tr: 'Tayland', en: 'Thailand' },
            'Vietnam': { tr: 'Vietnam', en: 'Vietnam' },
            'Philippines': { tr: 'Filipinler', en: 'Philippines' },
            'Malaysia': { tr: 'Malezya', en: 'Malaysia' },
            'Singapore': { tr: 'Singapur', en: 'Singapore' },
            'Brunei': { tr: 'Brunei', en: 'Brunei' },
            'Taiwan': { tr: 'Tayvan', en: 'Taiwan' },
            'Hong Kong': { tr: 'Hong Kong', en: 'Hong Kong' },
            'Macao': { tr: 'Makao', en: 'Macao' },
            // Amerika kıtası
            'Brazil': { tr: 'Brezilya', en: 'Brazil' },
            'Canada': { tr: 'Kanada', en: 'Canada' },
            'Mexico': { tr: 'Meksika', en: 'Mexico' },
            'Argentina': { tr: 'Arjantin', en: 'Argentina' },
            'Chile': { tr: 'Şili', en: 'Chile' },
            'Peru': { tr: 'Peru', en: 'Peru' },
            'Colombia': { tr: 'Kolombiya', en: 'Colombia' },
            'Venezuela': { tr: 'Venezuela', en: 'Venezuela' },
            'Ecuador': { tr: 'Ekvador', en: 'Ecuador' },
            'Uruguay': { tr: 'Uruguay', en: 'Uruguay' },
            'Paraguay': { tr: 'Paraguay', en: 'Paraguay' },
            'Bolivia': { tr: 'Bolivya', en: 'Bolivia' },
            'Guyana': { tr: 'Guyana', en: 'Guyana' },
            'Suriname': { tr: 'Surinam', en: 'Suriname' },
            'French Guiana': { tr: 'Fransız Guyanası', en: 'French Guiana' },
            'Cuba': { tr: 'Küba', en: 'Cuba' },
            'Jamaica': { tr: 'Jamaika', en: 'Jamaica' },
            'Haiti': { tr: 'Haiti', en: 'Haiti' },
            'Dominican Republic': { tr: 'Dominik Cumhuriyeti', en: 'Dominican Republic' },
            'Puerto Rico': { tr: 'Porto Riko', en: 'Puerto Rico' },
            'Trinidad and Tobago': { tr: 'Trinidad ve Tobago', en: 'Trinidad and Tobago' },
            'Barbados': { tr: 'Barbados', en: 'Barbados' },
            'Bahamas': { tr: 'Bahamalar', en: 'Bahamas' },
            'Belize': { tr: 'Belize', en: 'Belize' },
            'Costa Rica': { tr: 'Kosta Rika', en: 'Costa Rica' },
            'El Salvador': { tr: 'El Salvador', en: 'El Salvador' },
            'Guatemala': { tr: 'Guatemala', en: 'Guatemala' },
            'Honduras': { tr: 'Honduras', en: 'Honduras' },
            'Nicaragua': { tr: 'Nikaragua', en: 'Nicaragua' },
            'Panama': { tr: 'Panama', en: 'Panama' },
            // Avrupa (tüm ülkeler)
            'Netherlands': { tr: 'Hollanda', en: 'Netherlands' },
            'Belgium': { tr: 'Belçika', en: 'Belgium' },
            'Luxembourg': { tr: 'Lüksemburg', en: 'Luxembourg' },
            'Switzerland': { tr: 'İsviçre', en: 'Switzerland' },
            'Austria': { tr: 'Avusturya', en: 'Austria' },
            'Liechtenstein': { tr: 'Liechtenstein', en: 'Liechtenstein' },
            'Monaco': { tr: 'Monako', en: 'Monaco' },
            'San Marino': { tr: 'San Marino', en: 'San Marino' },
            'Vatican': { tr: 'Vatikan', en: 'Vatican' },
            'Andorra': { tr: 'Andorra', en: 'Andorra' },
            'Sweden': { tr: 'İsveç', en: 'Sweden' },
            'Norway': { tr: 'Norveç', en: 'Norway' },
            'Finland': { tr: 'Finlandiya', en: 'Finland' },
            'Denmark': { tr: 'Danimarka', en: 'Denmark' },
            'Iceland': { tr: 'İzlanda', en: 'Iceland' },
            'Ireland': { tr: 'İrlanda', en: 'Ireland' },
            'Poland': { tr: 'Polonya', en: 'Poland' },
            'Czech Republic': { tr: 'Çek Cumhuriyeti', en: 'Czech Republic' },
            'Slovakia': { tr: 'Slovakya', en: 'Slovakia' },
            'Hungary': { tr: 'Macaristan', en: 'Hungary' },
            'Romania': { tr: 'Romanya', en: 'Romania' },
            'Bulgaria': { tr: 'Bulgaristan', en: 'Bulgaria' },
            'Croatia': { tr: 'Hırvatistan', en: 'Croatia' },
            'Serbia': { tr: 'Sırbistan', en: 'Serbia' },
            'Bosnia and Herzegovina': { tr: 'Bosna Hersek', en: 'Bosnia and Herzegovina' },
            'Montenegro': { tr: 'Karadağ', en: 'Montenegro' },
            'Albania': { tr: 'Arnavutluk', en: 'Albania' },
            'North Macedonia': { tr: 'Kuzey Makedonya', en: 'North Macedonia' },
            'Slovenia': { tr: 'Slovenya', en: 'Slovenia' },
            'Greece': { tr: 'Yunanistan', en: 'Greece' },
            'Cyprus': { tr: 'Kıbrıs', en: 'Cyprus' },
            'Malta': { tr: 'Malta', en: 'Malta' },
            'Ukraine': { tr: 'Ukrayna', en: 'Ukraine' },
            'Belarus': { tr: 'Belarus', en: 'Belarus' },
            'Lithuania': { tr: 'Litvanya', en: 'Lithuania' },
            'Latvia': { tr: 'Letonya', en: 'Latvia' },
            'Estonia': { tr: 'Estonya', en: 'Estonia' },
            'Moldova': { tr: 'Moldova', en: 'Moldova' },
            'Georgia': { tr: 'Gürcistan', en: 'Georgia' },
            'Armenia': { tr: 'Ermenistan', en: 'Armenia' },
            'Azerbaijan': { tr: 'Azerbaycan', en: 'Azerbaijan' },
            // Afrika (tüm ülkeler)
            'Egypt': { tr: 'Mısır', en: 'Egypt' },
            'Libya': { tr: 'Libya', en: 'Libya' },
            'Tunisia': { tr: 'Tunus', en: 'Tunisia' },
            'Algeria': { tr: 'Cezayir', en: 'Algeria' },
            'Morocco': { tr: 'Fas', en: 'Morocco' },
            'Sudan': { tr: 'Sudan', en: 'Sudan' },
            'South Sudan': { tr: 'Güney Sudan', en: 'South Sudan' },
            'Ethiopia': { tr: 'Etiyopya', en: 'Ethiopia' },
            'Eritrea': { tr: 'Eritre', en: 'Eritrea' },
            'Djibouti': { tr: 'Cibuti', en: 'Djibouti' },
            'Somalia': { tr: 'Somali', en: 'Somalia' },
            'Kenya': { tr: 'Kenya', en: 'Kenya' },
            'Tanzania': { tr: 'Tanzanya', en: 'Tanzania' },
            'Uganda': { tr: 'Uganda', en: 'Uganda' },
            'Rwanda': { tr: 'Ruanda', en: 'Rwanda' },
            'Burundi': { tr: 'Burundi', en: 'Burundi' },
            'Democratic Republic of the Congo': { tr: 'Demokratik Kongo Cumhuriyeti', en: 'Democratic Republic of the Congo' },
            'Congo': { tr: 'Kongo', en: 'Congo' },
            'Central African Republic': { tr: 'Orta Afrika Cumhuriyeti', en: 'Central African Republic' },
            'Chad': { tr: 'Çad', en: 'Chad' },
            'Cameroon': { tr: 'Kamerun', en: 'Cameroon' },
            'Nigeria': { tr: 'Nijerya', en: 'Nigeria' },
            'Niger': { tr: 'Nijer', en: 'Niger' },
            'Mali': { tr: 'Mali', en: 'Mali' },
            'Burkina Faso': { tr: 'Burkina Faso', en: 'Burkina Faso' },
            'Ghana': { tr: 'Gana', en: 'Ghana' },
            'Togo': { tr: 'Togo', en: 'Togo' },
            'Benin': { tr: 'Benin', en: 'Benin' },
            'Ivory Coast': { tr: 'Fildişi Sahili', en: 'Ivory Coast' },
            'Liberia': { tr: 'Liberya', en: 'Liberia' },
            'Sierra Leone': { tr: 'Sierra Leone', en: 'Sierra Leone' },
            'Guinea': { tr: 'Gine', en: 'Guinea' },
            'Guinea-Bissau': { tr: 'Gine-Bissau', en: 'Guinea-Bissau' },
            'Senegal': { tr: 'Senegal', en: 'Senegal' },
            'Gambia': { tr: 'Gambiya', en: 'Gambia' },
            'Mauritania': { tr: 'Moritanya', en: 'Mauritania' },
            'Western Sahara': { tr: 'Batı Sahara', en: 'Western Sahara' },
            'South Africa': { tr: 'Güney Afrika', en: 'South Africa' },
            'Lesotho': { tr: 'Lesotho', en: 'Lesotho' },
            'Swaziland': { tr: 'Svaziland', en: 'Swaziland' },
            'Botswana': { tr: 'Botsvana', en: 'Botswana' },
            'Namibia': { tr: 'Namibya', en: 'Namibia' },
            'Angola': { tr: 'Angola', en: 'Angola' },
            'Zambia': { tr: 'Zambiya', en: 'Zambia' },
            'Zimbabwe': { tr: 'Zimbabve', en: 'Zimbabwe' },
            'Mozambique': { tr: 'Mozambik', en: 'Mozambique' },
            'Malawi': { tr: 'Malavi', en: 'Malawi' },
            'Madagascar': { tr: 'Madagaskar', en: 'Madagascar' },
            'Mauritius': { tr: 'Mauritius', en: 'Mauritius' },
            'Seychelles': { tr: 'Seyşeller', en: 'Seychelles' },
            'Comoros': { tr: 'Komorlar', en: 'Comoros' },
            'Cape Verde': { tr: 'Yeşil Burun Adaları', en: 'Cape Verde' },
            'São Tomé and Príncipe': { tr: 'São Tomé ve Príncipe', en: 'São Tomé and Príncipe' },
            'Equatorial Guinea': { tr: 'Ekvator Ginesi', en: 'Equatorial Guinea' },
            'Gabon': { tr: 'Gabon', en: 'Gabon' },
            // Orta Doğu ve Asya (tüm ülkeler)
            'Saudi Arabia': { tr: 'Suudi Arabistan', en: 'Saudi Arabia' },
            'Iran': { tr: 'İran', en: 'Iran' },
            'Iraq': { tr: 'Irak', en: 'Iraq' },
            'Syria': { tr: 'Suriye', en: 'Syria' },
            'Lebanon': { tr: 'Lübnan', en: 'Lebanon' },
            'Jordan': { tr: 'Ürdün', en: 'Jordan' },
            'Israel': { tr: 'İsrail', en: 'Israel' },
            'Palestine': { tr: 'Filistin', en: 'Palestine' },
            'Kuwait': { tr: 'Kuveyt', en: 'Kuwait' },
            'Qatar': { tr: 'Katar', en: 'Qatar' },
            'United Arab Emirates': { tr: 'Birleşik Arap Emirlikleri', en: 'United Arab Emirates' },
            'Oman': { tr: 'Umman', en: 'Oman' },
            'Yemen': { tr: 'Yemen', en: 'Yemen' },
            'Bahrain': { tr: 'Bahreyn', en: 'Bahrain' },
            'Afghanistan': { tr: 'Afganistan', en: 'Afghanistan' },
            'Kazakhstan': { tr: 'Kazakistan', en: 'Kazakhstan' },
            'Uzbekistan': { tr: 'Özbekistan', en: 'Uzbekistan' },
            'Turkmenistan': { tr: 'Türkmenistan', en: 'Turkmenistan' },
            'Kyrgyzstan': { tr: 'Kırgızistan', en: 'Kyrgyzstan' },
            'Tajikistan': { tr: 'Tacikistan', en: 'Tajikistan' },
            'Mongolia': { tr: 'Moğolistan', en: 'Mongolia' },
            'Nepal': { tr: 'Nepal', en: 'Nepal' },
            'Bhutan': { tr: 'Butan', en: 'Bhutan' },
            'Sri Lanka': { tr: 'Sri Lanka', en: 'Sri Lanka' },
            'Maldives': { tr: 'Maldivler', en: 'Maldives' },
            'Myanmar': { tr: 'Myanmar', en: 'Myanmar' },
            'Cambodia': { tr: 'Kamboçya', en: 'Cambodia' },
            'Laos': { tr: 'Laos', en: 'Laos' },
            'Timor-Leste': { tr: 'Doğu Timor', en: 'Timor-Leste' },
            // Okyanusya (tüm ülkeler)
            'Australia': { tr: 'Avustralya', en: 'Australia' },
            'New Zealand': { tr: 'Yeni Zelanda', en: 'New Zealand' },
            'Papua New Guinea': { tr: 'Papua Yeni Gine', en: 'Papua New Guinea' },
            'Fiji': { tr: 'Fiji', en: 'Fiji' },
            'Solomon Islands': { tr: 'Solomon Adaları', en: 'Solomon Islands' },
            'Vanuatu': { tr: 'Vanuatu', en: 'Vanuatu' },
            'New Caledonia': { tr: 'Yeni Kaledonya', en: 'New Caledonia' },
            'French Polynesia': { tr: 'Fransız Polinezyası', en: 'French Polynesia' },
            'Samoa': { tr: 'Samoa', en: 'Samoa' },
            'American Samoa': { tr: 'Amerikan Samoası', en: 'American Samoa' },
            'Tonga': { tr: 'Tonga', en: 'Tonga' },
            'Kiribati': { tr: 'Kiribati', en: 'Kiribati' },
            'Tuvalu': { tr: 'Tuvalu', en: 'Tuvalu' },
            'Nauru': { tr: 'Nauru', en: 'Nauru' },
            'Palau': { tr: 'Palau', en: 'Palau' },
            'Marshall Islands': { tr: 'Marshall Adaları', en: 'Marshall Islands' },
            'Micronesia': { tr: 'Mikronezya', en: 'Micronesia' },
            'Guam': { tr: 'Guam', en: 'Guam' },
            // Diğer özel durumlar
            'Greenland': { tr: 'Grönland', en: 'Greenland' },
            'Faroe Islands': { tr: 'Faroe Adaları', en: 'Faroe Islands' },
            'Antarctica': { tr: 'Antarktika', en: 'Antarctica' },
            'Svalbard': { tr: 'Svalbard', en: 'Svalbard' },
            'Macedonia': { tr: 'Makedonya', en: 'Macedonia' },
            'Republic of Serbia': { tr: 'Sırbistan', en: 'Serbia' },
            'Northern Cyprus': { tr: 'Kuzey Kıbrıs', en: 'Northern Cyprus' },
        };
        
        if (countryTranslations[countryName]) {
            return countryTranslations[countryName][this.currentLanguage] || countryName;
        }
        return countryName;
    }

    // Hava kirliliği modunu aktif et  
    async enableAirPollution() {
        this.airPollutionMode = true;
        
        const toggle = document.getElementById('airPollutionToggle');
        const scalePanel = document.getElementById('airQualityScale');
        
        if (toggle) {
            toggle.classList.toggle('active', this.airPollutionMode);
        }
        
        if (scalePanel) {
            if (this.airPollutionMode) {
                scalePanel.style.display = 'block';
                // Animasyon için küçük gecikme
                setTimeout(() => {
                    scalePanel.classList.add('show');
                }, 10);
            } else {
                scalePanel.classList.remove('show');
                // Animasyon bitince gizle
                setTimeout(() => {
                    if (!this.airPollutionMode) {
                        scalePanel.style.display = 'none';
                    }
                }, 300);
            }
        }
        
        if (this.airPollutionMode) {
            this.enableAirPollution();
            const enabledMsg = window.i18n ? window.i18n.t('air.mode.enabled') : 'Hava kirliliği modu AÇIK';
            this.log(`🌫️ ${enabledMsg}`, 'info');
            
            // Enable Turkey provinces boundaries when air pollution is ON
            if (this.turkeyProvinces) {
                try {
                    console.log('�️ Türkiye illeri sınırları etkinleştiriliyor (81 il, filled polygons)...');
                    this.turkeyProvinces.enable();
                    
                    // Get status info
                    const status = this.turkeyProvinces.getStatus();
                    console.log('🐛 Turkey Provinces Status:', status);
                    
                    if (status.dataLoaded && status.provincesCount > 0) {
                        console.log(`✅ ${status.provincesCount} ${window.i18n ? window.i18n.t('turkey.provinces.count') : 'il'} polygon halinde yüklendi (${window.i18n ? window.i18n.t('turkey.provinces.filled.polygons') : 'dolu poligonlar'})`);
                        const statusMsg = window.i18n ? window.i18n.t('turkey.provinces.enabled') : 'İl sınırları etkin';
                        this.log(`�️ ${statusMsg} - ${status.provincesCount} il (filled polygons)`, 'success');
                    } else {
                        console.log('🔄 İl verileri yükleniyor, tekrar deneyin...');
                        const loadingMsg = window.i18n ? window.i18n.t('turkey.provinces.loading') : 'İl verileri yükleniyor...';
                        this.log(`🔄 ${loadingMsg}`, 'info');
                        
                        // Veri yüklenmesini bekle ve tekrar dene
                        setTimeout(() => {
                            if (this.airPollutionMode) {
                                this.turkeyProvinces.enable();
                            }
                        }, 1000);
                    }
                    
                } catch (error) {
                    const enableErrorMsg = window.i18n ? window.i18n.t('turkey.provinces.error.enable') : 'Error enabling provinces boundaries:';
                    console.error(`❌ ${enableErrorMsg}`, error);
                    this.log(`❌ ${enableErrorMsg} ${error.message}`, 'error');
                }
            } else {
                const unavailableMsg = window.i18n ? window.i18n.t('turkey.provinces.system.unavailable') : 'Turkey provinces system not available';
                console.warn(`⚠️ ${unavailableMsg}`);
                this.log(`⚠️ ${unavailableMsg}`, 'warning');
            }

            // Enable USA states boundaries when air pollution is ON
            if (this.usaStates) {
                try {
                    console.log('🇺🇸 USA eyalet sınırları etkinleştiriliyor (50 eyalet + DC, filled polygons)...');
                    this.usaStates.enable();
                    
                    // Get status info
                    const usaStatus = this.usaStates.getCurrentData();
                    console.log('🐛 USA States Status:', usaStatus);
                    
                    if (usaStatus.isDataLoaded && usaStatus.statesCount > 0) {
                        console.log(`✅ ${usaStatus.statesCount} eyalet polygon halinde yüklendi (dolu poligonlar)`);
                        this.log(`🇺🇸 USA eyalet sınırları etkin - ${usaStatus.statesCount} eyalet (filled polygons)`, 'success');
                    } else {
                        console.log('🔄 USA eyalet verileri yükleniyor, tekrar deneyin...');
                        this.log(`🔄 USA eyalet verileri yükleniyor...`, 'info');
                        
                        // Veri yüklenmesini bekle ve tekrar dene
                        setTimeout(() => {
                            if (this.airPollutionMode) {
                                this.usaStates.enable();
                            }
                        }, 1000);
                    }
                    
                } catch (error) {
                    console.error(`❌ Error enabling USA states boundaries:`, error);
                    this.log(`❌ USA eyalet sınırları etkinleştirme hatası: ${error.message}`, 'error');
                }
            } else {
                console.warn(`⚠️ USA states system not available`);
                this.log(`⚠️ USA eyalet sistemi mevcut değil`, 'warning');
            }
        } else {
            this.disableAirPollution();
            const disabledMsg = window.i18n ? window.i18n.t('air.mode.disabled') : 'Hava kirliliği modu KAPALI';
            this.log(`🌬️ ${disabledMsg}`, 'info');
            
            // Disable Turkey provinces boundaries when air pollution is OFF
            if (this.turkeyProvinces) {
                try {
                    console.log('🚫 Türkiye illeri sınırları devre dışı bırakılıyor (polygons)...');
                    this.turkeyProvinces.disable();
                    const disabledMsg = window.i18n ? window.i18n.t('turkey.provinces.disabled') : 'İl sınırları kapatıldı';
                    this.log(`🌬️ ${disabledMsg}`, 'info');
                } catch (error) {
                    const disableErrorMsg = window.i18n ? window.i18n.t('turkey.provinces.error.disable') : 'Error disabling provinces boundaries:';
                    console.error(`❌ ${disableErrorMsg}`, error);
                    this.log(`❌ ${disableErrorMsg} ${error.message}`, 'error');
                }
            }

            // Disable USA states boundaries when air pollution is OFF
            if (this.usaStates) {
                try {
                    console.log('🚫 USA eyalet sınırları devre dışı bırakılıyor (polygons)...');
                    this.usaStates.disable();
                    this.log(`🌬️ USA eyalet sınırları kapatıldı`, 'info');
                } catch (error) {
                    console.error(`❌ Error disabling USA states boundaries:`, error);
                    this.log(`❌ USA eyalet sınırları kapatma hatası: ${error.message}`, 'error');
                }
            }
            
            // Ülke sınırlarını geri yükle (orijinal countries data ile)
            if (this.countriesData) {
                console.log('🌍 Ülke sınırları geri yükleniyor...');
                this.globe.polygonsData(this.countriesData.features)
                    .polygonCapColor(() => 'rgba(0, 0, 0, 0)')  
                    .polygonSideColor(() => 'rgba(0, 0, 0, 0)')  
                    .polygonStrokeColor(() => '#666')           
                    .polygonLabel(({ properties: d }) => {
                        const countryName = d.ADMIN || d.NAME || 'Unknown';
                        const localizedName = this.getCountryNameInCurrentLanguage(countryName);
                        return `<div style="
                            background: rgba(0, 0, 0, 0.8);
                            color: white;
                            padding: 8px 12px;
                            border-radius: 6px;
                            font-family: Arial, sans-serif;
                            font-size: 14px;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        ">
                            ${localizedName}
                        </div>`;
                    });
                    
                // Click handler'ları geri ekle
                this.globe.onPolygonClick((polygonData) => {
                    if (polygonData && polygonData.properties) {
                        this.handleNASAPolygonClick(polygonData);
                    }
                });
                
                // Hover handler'ları geri ekle
                this.globe.onPolygonHover(hoverPolygon => {
                    this.globe.polygonCapColor(polygon => 
                        polygon === hoverPolygon ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0)'
                    );
                    
                    if (hoverPolygon) {
                        this.handleNASAPolygonHover(hoverPolygon);
                    } else {
                        this.hideCountryHoverCard();
                    }
                });
                
                console.log('✅ Ülke sınırları click ve hover özellikleri geri eklendi');
            }
        }
    }
    
    // Hava kirliliği modunu aktif et
    async enableAirPollution() {
        this.airPollutionMode = true;
        this.generateTestAirPollutionData();
        this.globe.ringsData([]);

        console.log('🌫️ Hava kirliliği modu aktifleştirildi');
        console.log('🏙️ Şehir sınırları city-boundaries-layer.js sistemi ile yönetiliyor');
        
        // NOT: Turkey provinces toggleAirPollution() tarafından yönetilir
        
        // NOT: Ülke sınırları polygonsData'da kalır (değişmez)
        // NOT: Şehir sınırları pathsData ile city-boundaries-layer.js tarafından yönetilir
        // NOT: Bu fonksiyon sadece air pollution data'sını aktif eder
        
        // Eski Three.js overlay sistemini temizle (artık kullanmıyoruz)
        if (this.cityOverlayGroup) {
            this.globe.scene().remove(this.cityOverlayGroup);
            this.cityOverlayGroup = null;
            console.log('🧹 Eski Three.js city overlay temizlendi');
        }
    }

    // Kullanıcı konumunu güncelle/göster
    updateUserLocationDisplay() {
        if (this.userLocationPoint) {
            this.globe.pointsData([this.userLocationPoint])
                .pointLat(d => d.lat)
                .pointLng(d => d.lng)
                .pointColor(d => {
                    // Kullanıcı konumu için mavi renk
                    if (d.isUserLocation) {
                        return '#4fbdff'; // Mavi kullanıcı konumu
                    }
                    return d.color || '#ff6b6b';
                })
                .pointRadius(d => d.isUserLocation ? 0.6 : 0.4) // Biraz daha büyük
                .pointAltitude(d => d.isUserLocation ? 0.015 : 0.010) // En üst katman
                .pointLabel(d => `
                    <div style="
                        background: rgba(0,0,0,0.9); 
                        color: white; 
                        padding: 8px 12px; 
                        border-radius: 6px; 
                        font-size: 12px;
                        border: 2px solid #4fbdff;
                        min-width: 120px;
                    ">
                        <div style="font-weight: bold; color: #4fbdff;">
                            📍 ${window.i18n ? window.i18n.t('msg.your.location', 'Your Location') : 'Your Location'}
                        </div>
                        <div style="color: #ccc; font-size: 11px;">
                            ${d.locationLabel || d.city || 'Current Position'}
                        </div>
                    </div>
                `);
            
            console.log('📍 User location display updated (blue color)');
        } else {
            // Kullanıcı konumu yoksa points'i temizle
            this.globe.pointsData([]);
        }
    }

    // Yedek hava kirliliği sistemi (şehir sınırları yüklenemediğinde)
    enableAirPollutionFallback() {
        console.log('🔄 Using fallback air pollution system');
        
        // Test verileri oluştur
        this.generateTestAirPollutionData();
        
        // Hex sistemini devre dışı bırak
        this.globe.hexBinPointsData([]);
        this.globe.polygonsData([]);
        
        // Rings kullan - yedek sistem
        this.globe.ringsData(this.airPollutionData)
            .ringLat(d => d.lat)
            .ringLng(d => d.lng)
            .ringMaxRadius(d => {
                const baseRadius = Math.max(d.aqi / 40, 0.8); // Daha büyük ring
                return Math.min(baseRadius, 3); 
            })
            .ringPropagationSpeed(0)
            .ringRepeatPeriod(0)
            .ringColor(d => this.getAQIColor(d.aqi, 0.7))
            .ringLabel(d => {
                const category = this.getAQICategory(d.aqi);
                const color = this.getAQIColor(d.aqi, 1);
                
                return `
                    <div style="
                        background: rgba(0,0,0,0.9); 
                        color: white; 
                        padding: 8px 12px; 
                        border-radius: 6px; 
                        font-size: 12px;
                        border: 2px solid ${color};
                        min-width: 150px;
                    ">
                        <div style="font-weight: bold; margin-bottom: 4px;">
                            🌫️ ${d.city}
                        </div>
                        <div style="color: ${color}; font-weight: bold; margin-bottom: 2px;">
                            AQI: ${d.aqi} - ${category}
                        </div>
                        <div style="color: #ccc; font-size: 11px;">
                            ${d.country}
                        </div>
                    </div>
                `;
            });
    }

    // Ülkelere hava kirliliği renkleri uygula
    applyAirPollutionToCountries() {
        if (!this.countries || !this.airPollutionData) {
            console.warn('⚠️ Countries or air pollution data not available');
            return;
        }

        // Her ülke için ortalama AQI hesapla
        const countryAQIMap = new Map();
        
        this.airPollutionData.forEach(dataPoint => {
            const country = dataPoint.country;
            if (!countryAQIMap.has(country)) {
                countryAQIMap.set(country, { total: 0, count: 0 });
            }
            const countryData = countryAQIMap.get(country);
            countryData.total += dataPoint.aqi;
            countryData.count++;
        });

        // Ortalama AQI değerlerini hesapla
        const countryAverageAQI = new Map();
        for (const [country, data] of countryAQIMap) {
            countryAverageAQI.set(country, Math.round(data.total / data.count));
        }

        // Globe polygon renklerini güncelle
        this.globe.polygonColor(d => {
            const countryName = d.properties.NAME || d.properties.ADMIN;
            const aqi = countryAverageAQI.get(countryName);
            
            if (aqi) {
                // Şeffaf hava kirliliği rengi döndür
                return this.getAQIColor(aqi, 0.4); // %40 şeffaflık
            } else {
                // Hava kirliliği verisi olmayan ülkeler için varsayılan renk
                return 'rgba(120, 120, 120, 0.1)';
            }
        });
        
        // Polygon tooltip'lerini güncelle
        this.globe.polygonLabel(d => {
            const countryName = d.properties.NAME || d.properties.ADMIN;
            const aqi = countryAverageAQI.get(countryName);
            
            if (aqi) {
                const category = this.getAQICategory(aqi);
                const color = this.getAQIColor(aqi, 0.8);
                
                return `
                    <div style="
                        background: rgba(0,0,0,0.9); 
                        color: white; 
                        padding: 8px 12px; 
                        border-radius: 6px; 
                        font-size: 12px;
                        border: 2px solid ${color};
                    ">
                        <div style="font-weight: bold; margin-bottom: 4px;">
                            🌫️ ${countryName}
                        </div>
                        <div style="color: ${color}; font-weight: bold;">
                            AQI: ${aqi} - ${category}
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div style="
                        background: rgba(0,0,0,0.9); 
                        color: white; 
                        padding: 8px 12px; 
                        border-radius: 6px; 
                        font-size: 12px;
                    ">
                        <div style="font-weight: bold;">
                            ${countryName}
                        </div>
                        <div style="color: #999; font-size: 11px;">
                            No air quality data
                        </div>
                    </div>
                `;
            }
        });
    }
    
    // Hava kirliliği modunu deaktive et
    disableAirPollution() {
        this.airPollutionMode = false;
        this.globe.hexBinPointsData([]);
        this.globe.ringsData([]);
        
        console.log('🌬️ Hava kirliliği modu kapatıldı');
        console.log('🏙️ Şehir sınırları city-boundaries-layer.js sistemi tarafından kapatılacak');
        
        // NOT: Turkey provinces ve countries toggleAirPollution() tarafından yönetilir
        
        // Eski city overlay sistemini temizle (artık kullanmıyoruz)
        if (this.cityOverlayGroup) {
            this.globe.scene().remove(this.cityOverlayGroup);
            this.cityOverlayGroup = null;
            console.log('🧹 Eski city overlay temizlendi');
        }
        
        // NOT: Ülke sınırları polygonsData'da kalır, hiç dokunmuyoruz
        console.log('�️ Ülke sınırları korundu (polygonsData değişmez)');
    }
    
    // Test hava kirliliği verilerini oluştur
    generateTestAirPollutionData() {
        this.airPollutionData = [
            // Test şehirleri - farklı AQI seviyeleri
            
            // Türkiye şehirleri
            { lat: 41.0082, lng: 28.9784, aqi: 120, city: 'İstanbul', country: 'Turkey' },    // Orta-Kötü (Turuncu)
            { lat: 39.9334, lng: 32.8597, aqi: 85, city: 'Ankara', country: 'Turkey' },       // Orta (Sarı)
            { lat: 38.4192, lng: 27.1287, aqi: 75, city: 'İzmir', country: 'Turkey' },        // İyi-Orta (Sarı-Yeşil)
            
            // Avrupa - temiz hava
            { lat: 48.8566, lng: 2.3522, aqi: 45, city: 'Paris', country: 'France' },         // İyi (Yeşil)
            { lat: 51.5074, lng: -0.1278, aqi: 60, city: 'London', country: 'United Kingdom' }, // Orta (Sarı)
            { lat: 52.5200, lng: 13.4050, aqi: 35, city: 'Berlin', country: 'Germany' },       // İyi (Yeşil)
            
            // Asya - yoğun kirlilik
            { lat: 39.9042, lng: 116.4074, aqi: 180, city: 'Beijing', country: 'China' },      // Kötü (Kırmızı)
            { lat: 28.7041, lng: 77.1025, aqi: 220, city: 'New Delhi', country: 'India' },     // Çok Kötü (Mor)
            { lat: 35.6762, lng: 139.6503, aqi: 55, city: 'Tokyo', country: 'Japan' },         // Orta (Sarı)
            
            // Amerika
            { lat: 40.7128, lng: -74.0060, aqi: 95, city: 'New York', country: 'United States' }, // Orta (Sarı)
            { lat: 34.0522, lng: -118.2437, aqi: 140, city: 'Los Angeles', country: 'United States' }, // Orta-Kötü (Turuncu)
            
            // Güney Amerika
            { lat: -23.5505, lng: -46.6333, aqi: 110, city: 'São Paulo', country: 'Brazil' }, // Orta-Kötü (Turuncu)
            
            // Afrika
            { lat: -26.2041, lng: 28.0473, aqi: 80, city: 'Johannesburg', country: 'South Africa' }, // İyi-Orta (Sarı)
            
            // Avustralya - temiz hava
            { lat: -33.8688, lng: 151.2093, aqi: 25, city: 'Sydney', country: 'Australia' },   // İyi (Yeşil)
        ];
        
        console.log(`🌫️ Generated ${this.airPollutionData.length} air quality data points`);
    }
    
    // AQI (Air Quality Index) değerine göre renk döndür
    getAQIColor(aqi, opacity = 1) {
        let color;
        
        if (aqi <= 50) {
            // 0-50 İyi (Yeşil)
            color = `rgba(0, 230, 64, ${opacity})`;
        } else if (aqi <= 100) {
            // 51-100 İyi-Orta (Sarı)
            color = `rgba(255, 255, 0, ${opacity})`;
        } else if (aqi <= 150) {
            // 101-150 Orta (Turuncu)
            color = `rgba(255, 126, 0, ${opacity})`;
        } else if (aqi <= 200) {
            // 151-200 Orta-Kötü (Kırmızı)
            color = `rgba(255, 0, 0, ${opacity})`;
        } else if (aqi <= 300) {
            // 201-300 Kötü (Mor)
            color = `rgba(143, 63, 151, ${opacity})`;
        } else {
            // 300+ Çok Kötü (Bordo)
            color = `rgba(126, 0, 35, ${opacity})`;
        }
        
        return color;
    }

    // AQI kategorisi adını döndür
    getAQICategory(aqi) {
        if (aqi <= 50) {
            return window.i18n ? window.i18n.t('air.quality.good') : 'İyi';
        } else if (aqi <= 100) {
            return window.i18n ? window.i18n.t('air.quality.moderate') : 'İyi-Orta';
        } else if (aqi <= 150) {
            return window.i18n ? window.i18n.t('air.quality.unhealthy.sensitive') : 'Orta';
        } else if (aqi <= 200) {
            return window.i18n ? window.i18n.t('air.quality.unhealthy') : 'Orta-Kötü';
        } else if (aqi <= 300) {
            return window.i18n ? window.i18n.t('air.quality.very.unhealthy') : 'Kötü';
        } else {
            return window.i18n ? window.i18n.t('air.quality.hazardous') : 'Çok Kötü';
        }
    }

    // === SYNTHETIC CITY BOUNDARIES GENERATION ===
    convertGeoNamesTSVToGeoJSONWithBoundaries(tsvText, maxCities = 10000) {
        console.log('🏗️ Converting GeoNames TSV to GeoJSON with synthetic boundaries...');
        
        const lines = tsvText.trim().split('\n');
        console.log('📊 Total GeoNames lines:', lines.length);
        
        const features = [];
        
        for (let i = 0; i < Math.min(lines.length, maxCities); i++) {
            const values = lines[i].split('\t'); // TAB separated
            
            // GeoNames format: 0=geonameid, 1=name, 2=asciiname, 3=alternatenames, 4=latitude, 5=longitude, 6=feature_class, 7=feature_code, 8=country_code, 9=cc2, 10=admin1_code, 11=admin2_code, 12=admin3_code, 13=admin4_code, 14=population, 15=elevation, 16=dem, 17=timezone, 18=modification_date
            
            if (values.length >= 6) {
                const lat = parseFloat(values[4]); // latitude
                const lng = parseFloat(values[5]); // longitude
                const name = values[1]; // name
                const population = parseInt(values[14]) || 0; // population
                const countryCode = values[8]; // country_code
                
                // Debug first few cities
                if (i <= 3) {
                    console.log(`🔍 GeoNames ${i}: name=${name}, lat=${lat}, lng=${lng}, pop=${population}, country=${countryCode}`);
                }
                
                if (!isNaN(lat) && !isNaN(lng) && name) {
                    // Create synthetic circular boundary around city
                    const cityProps = { population: population };
                    const radius = this.getCityRadius(cityProps);
                    const boundary = this.createCircularBoundary(lat, lng, radius);
                    
                    features.push({
                        type: 'Feature',
                        properties: {
                            name: name,
                            country: countryCode,
                            population: population,
                            admin_level: 'city',
                            boundary_type: 'synthetic',
                            geonameid: values[0]
                        },
                        geometry: boundary
                    });
                }
            }
        }
        
        console.log(`✅ Created ${features.length} synthetic city boundaries from GeoNames`);
        
        return {
            type: 'FeatureCollection',
            features: features
        };
    }

    convertCitiesCSVToGeoJSONWithBoundaries(csvText, maxCities = 10000) {
        console.log('🏗️ Converting CSV cities to GeoJSON with synthetic boundaries...');
        
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        console.log('📋 CSV Headers:', headers);
        console.log('📊 Total lines:', lines.length);
        
        const features = [];
        
        for (let i = 1; i < Math.min(lines.length, maxCities + 1); i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const city = {};
            
            headers.forEach((header, index) => {
                city[header] = values[index];
            });
            
            // Debug first few cities
            if (i <= 3) {
                console.log(`🔍 City ${i}:`, city);
            }
            
            // Try multiple possible field names for coordinates
            const lat = parseFloat(
                city.lat || city.latitude || city.Latitude || 
                city.LAT || city.LATITUDE || city.geoname_lat
            );
            const lng = parseFloat(
                city.lng || city.longitude || city.Longitude || 
                city.LON || city.LONGITUDE || city.lon || city.geoname_lng
            );
            
            // Debug coordinates for first few cities
            if (i <= 3) {
                console.log(`🎯 City ${i} coordinates: lat=${lat}, lng=${lng}`);
            }
            
            if (!isNaN(lat) && !isNaN(lng)) {
                // Create synthetic circular boundary around city
                const radius = this.getCityRadius(city);
                const boundary = this.createCircularBoundary(lat, lng, radius);
                
                features.push({
                    type: 'Feature',
                    properties: {
                        name: city.name || city.city || city.City || city.NAME || city.geoname_name,
                        country: city.country || city.Country || city.COUNTRY || city.country_name,
                        population: city.population || city.Population || city.POPULATION,
                        admin_level: 'city',
                        boundary_type: 'synthetic'
                    },
                    geometry: boundary
                });
            } else if (i <= 3) {
                console.log(`❌ City ${i} invalid coordinates: lat=${lat}, lng=${lng}`);
            }
        }
        
        console.log(`✅ Created ${features.length} synthetic city boundaries from CSV`);
        
        return {
            type: 'FeatureCollection',
            features: features
        };
    }

    convertCitiesJSONToGeoJSONWithBoundaries(citiesArray, maxCities = 10000) {
        console.log('🏗️ Converting JSON cities to GeoJSON with synthetic boundaries...');
        
        const features = [];
        const cities = Array.isArray(citiesArray) ? citiesArray : [citiesArray];
        
        for (let i = 0; i < Math.min(cities.length, maxCities); i++) {
            const city = cities[i];
            const lat = parseFloat(city.lat || city.latitude || city.coords?.lat);
            const lng = parseFloat(city.lng || city.longitude || city.coords?.lng);
            
            if (!isNaN(lat) && !isNaN(lng)) {
                // Create synthetic circular boundary around city
                const radius = this.getCityRadius(city);
                const boundary = this.createCircularBoundary(lat, lng, radius);
                
                features.push({
                    type: 'Feature',
                    properties: {
                        name: city.name || city.city,
                        country: city.country,
                        population: city.population,
                        admin_level: 'city',
                        boundary_type: 'synthetic'
                    },
                    geometry: boundary
                });
            }
        }
        
        console.log(`✅ Created ${features.length} synthetic city boundaries from JSON`);
        
        return {
            type: 'FeatureCollection',
            features: features
        };
    }

    convertPlacesToCityBoundaries(placesData, maxCities = 25000) {
        console.log('🏗️ Converting populated places to city boundaries...');
        
        const features = [];
        const places = placesData.features || [];
        
        console.log(`📊 Processing ${places.length} populated places...`);
        
        // ALL populated places - no filtering by population
        const filteredPlaces = places.filter(place => {
            const featureClass = place.properties?.FEATURECLA;
            const scaleRank = place.properties?.SCALERANK;
            
            return featureClass && (
                featureClass === 'Admin-0 capital' || // Country capitals
                featureClass === 'Admin-1 capital' || // State capitals  
                featureClass === 'Admin-1 region capital' || // Regional capitals
                featureClass === 'Populated place' || // All populated places
                scaleRank <= 6 // Include more cities by scale rank
            );
        });
        
        console.log(`🏙️ Filtered to ${filteredPlaces.length} city-type places`);
        
        for (let i = 0; i < Math.min(filteredPlaces.length, maxCities); i++) {
            const place = filteredPlaces[i];
            const coords = place.geometry?.coordinates;
            
            if (coords && coords.length >= 2) {
                const lng = coords[0];
                const lat = coords[1];
                
                // Create synthetic circular boundary around place
                const radius = this.getCityRadius(place.properties);
                const boundary = this.createCircularBoundary(lat, lng, radius);
                
                features.push({
                    type: 'Feature',
                    properties: {
                        name: place.properties.NAME,
                        country: place.properties.SOV0NAME || place.properties.ADM0NAME,
                        population: place.properties.POP_MAX || place.properties.POP_MIN,
                        admin_level: 'city',
                        boundary_type: 'synthetic',
                        featurecla: place.properties.FEATURECLA,
                        scalerank: place.properties.SCALERANK
                    },
                    geometry: boundary
                });
            }
        }
        
        console.log(`✅ Created ${features.length} synthetic city boundaries from populated places`);
        
        return {
            type: 'FeatureCollection',
            features: features
        };
    }

    getCityRadius(cityProps) {
        // Calculate radius based on population or city type
        const population = parseInt(cityProps.population || cityProps.POP_MAX || 0);
        
        if (population > 5000000) return 0.5;      // Megacity: ~55km radius
        if (population > 1000000) return 0.3;     // Major city: ~33km radius  
        if (population > 500000) return 0.2;      // Large city: ~22km radius
        if (population > 100000) return 0.15;     // Medium city: ~16km radius
        if (population > 50000) return 0.1;       // Small city: ~11km radius
        
        // Default for unknown population or small towns
        return 0.08; // ~9km radius
    }

    createCircularBoundary(lat, lng, radiusDegrees) {
        // Create a circular polygon around the point
        const points = 32; // Number of points in circle
        const coordinates = [[]];
        
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * 2 * Math.PI;
            const pointLat = lat + radiusDegrees * Math.cos(angle);
            const pointLng = lng + radiusDegrees * Math.sin(angle) / Math.cos(lat * Math.PI / 180);
            
            coordinates[0].push([pointLng, pointLat]);
        }
        
        // Close the polygon
        coordinates[0].push(coordinates[0][0]);
        
        return {
            type: 'Polygon',
            coordinates: coordinates
        };
    }

    convertCSVToGeoJSONWithBoundaries(csvText, maxCities = 25000) {
        console.log('📊 Converting CSV worldcities to GeoJSON with boundaries...');
        
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
        
        console.log(`📋 CSV Headers: ${headers.join(', ')}`);
        
        const features = [];
        
        // Process CSV rows (skip header)
        for (let i = 1; i < Math.min(lines.length, maxCities + 1); i++) {
            const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
            
            if (values.length >= headers.length) {
                const city = {};
                headers.forEach((header, index) => {
                    city[header] = values[index];
                });
                
                const lat = parseFloat(city.lat);
                const lng = parseFloat(city.lng);
                const population = parseInt(city.population) || 0;
                
                if (!isNaN(lat) && !isNaN(lng)) {
                    // Create boundary based on population
                    const radius = this.getCityRadiusFromPopulation(population);
                    const boundary = this.createCircularBoundary(lat, lng, radius);
                    
                    features.push({
                        type: 'Feature',
                        properties: {
                            name: city.city || city.city_ascii || 'Unknown',
                            country: city.country,
                            population: population,
                            admin_level: 'city',
                            boundary_type: 'synthetic_csv',
                            iso2: city.iso2,
                            iso3: city.iso3
                        },
                        geometry: boundary
                    });
                }
            }
        }
        
        console.log(`✅ Created ${features.length} city boundaries from CSV`);
        
        return {
            type: 'FeatureCollection',
            features: features
        };
    }

    getCityRadiusFromPopulation(population) {
        // Calculate radius based on population
        if (population > 10000000) return 0.6;    // Mega city: ~66km radius
        if (population > 5000000) return 0.4;     // Very large: ~44km radius
        if (population > 1000000) return 0.25;    // Large city: ~27km radius  
        if (population > 500000) return 0.18;     // Medium city: ~20km radius
        if (population > 100000) return 0.12;     // Small city: ~13km radius
        if (population > 50000) return 0.08;      // Town: ~9km radius
        
        return 0.05; // Default for unknown/small: ~5km radius
    }

    convertCitiesJSONToGeoJSONWithBoundaries(citiesArray, maxCities = 25000) {
        console.log('🏗️ Converting cities JSON to GeoJSON with boundaries...');
        
        const features = [];
        
        for (let i = 0; i < Math.min(citiesArray.length, maxCities); i++) {
            const city = citiesArray[i];
            const lat = parseFloat(city.lat || city.latitude);
            const lng = parseFloat(city.lng || city.longitude);
            const population = parseInt(city.population) || 0;
            
            if (!isNaN(lat) && !isNaN(lng)) {
                const radius = this.getCityRadiusFromPopulation(population);
                const boundary = this.createCircularBoundary(lat, lng, radius);
                
                features.push({
                    type: 'Feature',
                    properties: {
                        name: city.name || city.city || 'Unknown',
                        country: city.country,
                        population: population,
                        admin_level: 'city',
                        boundary_type: 'synthetic_json'
                    },
                    geometry: boundary
                });
            }
        }
        
        console.log(`✅ Created ${features.length} city boundaries from JSON`);
        
        return {
            type: 'FeatureCollection',
            features: features
        };
    }
}

// === UYGULAMA BAŞLATMA ===
let globeApp;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🌍 DOM ready, starting Globe.gl 3D World application...');
    
    // i18n sistemini önce başlat
    if (window.i18n) {
        try {
            await window.i18n.initialize();
            console.log('✅ i18n system initialized');
        } catch (error) {
            console.warn('⚠️ i18n initialization failed:', error);
        }
    }

    // Location butonunu HEMEN güncelle - fallback metni asla görünmesin
    const locationBtn = document.getElementById('locationBtn');
    if (locationBtn && window.i18n) {
        const locationText = window.i18n.t('btn.location');
        if (locationText && locationText !== 'btn.location') {
            locationBtn.textContent = locationText;
            console.log('✅ Location button text set to:', locationText);
        }
    }
    
    // Globe uygulamasını başlat
    console.log('🌍 Globe.gl 3D Dünya uygulaması başlatılıyor...');
    globeApp = new GlobeExplorer();
    globeExplorer = globeApp; // Modal functions için global erişim
    window.globeApp = globeApp; // Debug için global erişim
    
    // Debug için console mesaj
    console.log('🐛 Debug: window.globeApp ve window.debugGlobe mevcut');
    console.log('🐛 Test için: debugGlobe.getCityBoundariesInfo()');
    
    // Dil değişikliği için globe'a callback bağla
    if (window.i18n && globeApp) {
        // Dil değişikliği event'ini dinle
        const originalSetLang = window.i18n.setLang.bind(window.i18n);
        window.i18n.setLang = function(language) {
            const oldLang = this.currentLanguage;
            originalSetLang(language);
            
            // Globe'da dil değişikliğini bildir
            if (globeApp && oldLang !== language) {
                globeApp.changeLanguage(language);
            }
        };
    }
});

// Global fonksiyonlar
window.globeApp = null;
window.GlobeExplorer = GlobeExplorer; // Export class globally for debugging

// Debug fonksiyonları
window.debugGlobe = {
    getApp: () => globeApp,
    getCities: () => globeApp ? globeApp.cities : [],
    getCountries: () => globeApp ? globeApp.countries : [],
    reset: () => globeApp ? globeApp.resetView() : null,
    getGlobe: () => globeApp ? globeApp.globe : null,
    // i18n debug
    getTranslationStats: () => window.translator ? window.translator.getStats() : null,
    clearTranslationCache: () => window.translator ? window.translator.clearCache() : null,
    getCurrentLanguage: () => window.i18n ? window.i18n.getLang() : null,
    // Real city boundaries debug
    getRealCityBoundaries: () => globeApp ? globeApp.realCityBoundaries : null,
    getRealCityBoundariesStatus: () => globeApp && globeApp.realCityBoundaries ? globeApp.realCityBoundaries.getStatus() : null,
    enableRealCityBoundaries: () => globeApp && globeApp.realCityBoundaries ? globeApp.realCityBoundaries.enable() : null,
    disableRealCityBoundaries: () => globeApp && globeApp.realCityBoundaries ? globeApp.realCityBoundaries.disable() : null
};

console.log('🌍 Globe.gl Global City Explorer yüklendi!');
console.log('💡 Debug için window.debugGlobe kullanabilirsiniz');

// Türkiye için sadece 81 ili getir
GlobeExplorer.prototype.getTurkishProvinces = function() {
    // Türkiye'nin 81 ili - öncelik sırasına göre
    const turkishProvinces = [
        // İl merkezleri (capital: admin)
        { city: 'Ankara', city_ascii: 'Ankara', lat: 39.9334, lng: 32.8597, country: 'Turkey', iso2: 'TR', iso3: 'TUR', admin_name: 'Ankara', capital: 'admin', population: 5663322 },
        { city: 'İstanbul', city_ascii: 'Istanbul', lat: 41.0082, lng: 28.9784, country: 'Turkey', iso2: 'TR', iso3: 'TUR', admin_name: 'İstanbul', capital: 'major', population: 15462452 },
        { city: 'İzmir', city_ascii: 'Izmir', lat: 38.4192, lng: 27.1287, country: 'Turkey', iso2: 'TR', iso3: 'TUR', admin_name: 'İzmir', capital: 'admin', population: 4367251 },
        { city: 'Bursa', city_ascii: 'Bursa', lat: 40.1826, lng: 29.0669, country: 'Turkey', iso2: 'TR', iso3: 'TUR', admin_name: 'Bursa', capital: 'admin', population: 3139744 },
        { city: 'Antalya', city_ascii: 'Antalya', lat: 36.8969, lng: 30.7133, country: 'Turkey', iso2: 'TR', iso3: 'TUR', admin_name: 'Antalya', capital: 'admin', population: 2548308 },
        { city: 'Konya', city_ascii: 'Konya', lat: 37.8667, lng: 32.4833, country: 'Turkey', iso2: 'TR', iso3: 'TUR', admin_name: 'Konya', capital: 'admin', population: 2232374 },
        { city: 'Şanlıurfa', city_ascii: 'Sanliurfa', lat: 37.1591, lng: 38.7969, country: 'Turkey', iso2: 'TR', iso3: 'TUR', admin_name: 'Şanlıurfa', capital: 'admin', population: 2115256 },
        { city: 'Gaziantep', city_ascii: 'Gaziantep', lat: 37.0594, lng: 37.3825, country: 'Turkey', iso2: 'TR', iso3: 'TUR', admin_name: 'Gaziantep', capital: 'admin', population: 2069364 },
        { city: 'Kocaeli', city_ascii: 'Kocaeli', lat: 40.8533, lng: 29.8815, country: 'Turkey', iso2: 'TR', iso3: 'TUR', admin_name: 'Kocaeli', capital: 'admin', population: 1953035 },
        { city: 'Mersin', city_ascii: 'Mersin', lat: 36.8000, lng: 34.6333, country: 'Turkey', iso2: 'TR', iso3: 'TUR', admin_name: 'Mersin', capital: 'admin', population: 1868757 },
        
        // Daha fazla il eklemeye devam edebiliriz...
        // Şimdilik mevcut cities.json'dan Türkiye verilerini filtreleyelim
    ];
    
    // Eğer allCities yüklüyse Türkiye'deki admin şehirleri çek
    if (this.allCities && this.allCities.length > 0) {
        const turkishCities = this.allCities.filter(city => 
            (city.iso2 === 'TR' || city.country?.toLowerCase().includes('turkey')) &&
            (city.capital === 'admin' || city.capital === 'primary')
        );
        
        // Eğer admin şehirler 81'den azsa, major şehirleri de ekle
        if (turkishCities.length < 81) {
            const majorCities = this.allCities.filter(city => 
                (city.iso2 === 'TR' || city.country?.toLowerCase().includes('turkey')) &&
                city.capital === 'major'
            );
            turkishCities.push(...majorCities);
        }
        
        // Nüfus sırasına göre sırala ve 81 ile sınırla
        turkishCities.sort((a, b) => (b.population || 0) - (a.population || 0));
        const result = turkishCities.slice(0, 81);
        
        console.log(`🇹🇷 Türkiye için ${result.length} il bulundu`);
        return result;
    }
    
    return turkishProvinces;
};

// Amerika için eyaletler ve federal bölge getir (50 eyalet + 1 federal bölge)
GlobeExplorer.prototype.getUSMajorCities = function() {
    // 50 ABD eyaleti + 1 federal bölge (District of Columbia)
    const usStatesAndDC = [
        { name: 'Alabama', capital: 'Montgomery', lat: 32.361538, lng: -86.279118 },
        { name: 'Alaska', capital: 'Juneau', lat: 58.301935, lng: -134.419740 },
        { name: 'Arizona', capital: 'Phoenix', lat: 33.448457, lng: -112.073844 },
        { name: 'Arkansas', capital: 'Little Rock', lat: 34.736009, lng: -92.331122 },
        { name: 'California', capital: 'Sacramento', lat: 38.576668, lng: -121.493629 },
        { name: 'Colorado', capital: 'Denver', lat: 39.739236, lng: -104.990251 },
        { name: 'Connecticut', capital: 'Hartford', lat: 41.767, lng: -72.677 },
        { name: 'Delaware', capital: 'Dover', lat: 39.161921, lng: -75.526755 },
        { name: 'Florida', capital: 'Tallahassee', lat: 30.4518, lng: -84.27277 },
        { name: 'Georgia', capital: 'Atlanta', lat: 33.76, lng: -84.39 },
        { name: 'Hawaii', capital: 'Honolulu', lat: 21.30895, lng: -157.826182 },
        { name: 'Idaho', capital: 'Boise', lat: 43.613739, lng: -116.237651 },
        { name: 'Illinois', capital: 'Springfield', lat: 39.78325, lng: -89.650373 },
        { name: 'Indiana', capital: 'Indianapolis', lat: 39.790942, lng: -86.147685 },
        { name: 'Iowa', capital: 'Des Moines', lat: 41.590939, lng: -93.620866 },
        { name: 'Kansas', capital: 'Topeka', lat: 39.04, lng: -95.69 },
        { name: 'Kentucky', capital: 'Frankfort', lat: 38.197274, lng: -84.86311 },
        { name: 'Louisiana', capital: 'Baton Rouge', lat: 30.45809, lng: -91.140229 },
        { name: 'Maine', capital: 'Augusta', lat: 44.323535, lng: -69.765261 },
        { name: 'Maryland', capital: 'Annapolis', lat: 38.972945, lng: -76.501157 },
        { name: 'Massachusetts', capital: 'Boston', lat: 42.2352, lng: -71.0275 },
        { name: 'Michigan', capital: 'Lansing', lat: 42.354558, lng: -84.955255 },
        { name: 'Minnesota', capital: 'Saint Paul', lat: 44.95, lng: -93.094 },
        { name: 'Mississippi', capital: 'Jackson', lat: 32.354668, lng: -90.178217 },
        { name: 'Missouri', capital: 'Jefferson City', lat: 38.572954, lng: -92.189283 },
        { name: 'Montana', capital: 'Helena', lat: 46.595805, lng: -112.027031 },
        { name: 'Nebraska', capital: 'Lincoln', lat: 40.809868, lng: -96.675345 },
        { name: 'Nevada', capital: 'Carson City', lat: 39.161921, lng: -119.753877 },
        { name: 'New Hampshire', capital: 'Concord', lat: 43.220093, lng: -71.549896 },
        { name: 'New Jersey', capital: 'Trenton', lat: 40.221741, lng: -74.756138 },
        { name: 'New Mexico', capital: 'Santa Fe', lat: 35.667231, lng: -105.964575 },
        { name: 'New York', capital: 'Albany', lat: 42.659829, lng: -73.781339 },
        { name: 'North Carolina', capital: 'Raleigh', lat: 35.771, lng: -78.638 },
        { name: 'North Dakota', capital: 'Bismarck', lat: 46.813343, lng: -100.779004 },
        { name: 'Ohio', capital: 'Columbus', lat: 39.961176, lng: -82.998794 },
        { name: 'Oklahoma', capital: 'Oklahoma City', lat: 35.482309, lng: -97.534994 },
        { name: 'Oregon', capital: 'Salem', lat: 44.931109, lng: -123.029159 },
        { name: 'Pennsylvania', capital: 'Harrisburg', lat: 40.269789, lng: -76.875613 },
        { name: 'Rhode Island', capital: 'Providence', lat: 41.82355, lng: -71.422132 },
        { name: 'South Carolina', capital: 'Columbia', lat: 34.000, lng: -81.035 },
        { name: 'South Dakota', capital: 'Pierre', lat: 44.367966, lng: -100.336378 },
        { name: 'Tennessee', capital: 'Nashville', lat: 36.165, lng: -86.784 },
        { name: 'Texas', capital: 'Austin', lat: 30.266667, lng: -97.75 },
        { name: 'Utah', capital: 'Salt Lake City', lat: 40.777477, lng: -111.888237 },
        { name: 'Vermont', capital: 'Montpelier', lat: 44.26639, lng: -72.580536 },
        { name: 'Virginia', capital: 'Richmond', lat: 37.54, lng: -77.46 },
        { name: 'Washington', capital: 'Olympia', lat: 47.042418, lng: -122.893077 },
        { name: 'West Virginia', capital: 'Charleston', lat: 38.349497, lng: -81.633294 },
        { name: 'Wisconsin', capital: 'Madison', lat: 43.074722, lng: -89.384444 },
        { name: 'Wyoming', capital: 'Cheyenne', lat: 41.145548, lng: -104.802042 },
        // Federal District
        { name: 'District of Columbia', capital: 'Washington D.C.', lat: 38.9072, lng: -77.0369 }
    ];
    
    // Her eyalet için uygun formatta veri hazırla
    const result = usStatesAndDC.map((state, index) => {
        return {
            id: `US_STATE_${index + 1}`,
            city: state.name,
            name: state.name,
            country: 'United States',
            iso2: 'US',
            iso3: 'USA',
            admin: state.name,
            capital: state.name === 'District of Columbia' ? 'primary' : 'admin',
            lat: state.lat,
            lng: state.lng,
            population: state.name === 'California' ? '39538223' : 
                       state.name === 'Texas' ? '29145505' :
                       state.name === 'Florida' ? '21538187' :
                       state.name === 'New York' ? '20201249' :
                       state.name === 'Pennsylvania' ? '13002700' :
                       state.name === 'Illinois' ? '12812508' :
                       state.name === 'Ohio' ? '11799448' :
                       state.name === 'Georgia' ? '10711908' :
                       state.name === 'North Carolina' ? '10439388' :
                       state.name === 'Michigan' ? '10037261' :
                       '1000000' // Varsayılan değer
        };
    });
    
    // District of Columbia'yı en üste koy (federal başkent)
    result.sort((a, b) => {
        if (a.capital === 'primary') return -1;
        if (b.capital === 'primary') return 1;
        return a.name.localeCompare(b.name); // Alfabetik sıralama
    });
    
    console.log(`🇺🇸 Amerika için ${result.length} eyalet ve federal bölge bulundu (50 eyalet + DC)`);
    return result;
};

// Diğer ülkeler için ana şehirleri getir (başkent + büyük şehirler)
GlobeExplorer.prototype.getCountryMajorCities = function(countryName, iso2, iso3) {
    if (!this.allCities || this.allCities.length === 0) {
        return [];
    }
    
    let matchedCities = [];
    
    // 1. ISO kodları ile eşleştirme (en güvenilir)
    if (iso2) {
        const isoMatches = this.allCities.filter(city => 
            city.iso2 === iso2 || city.iso3 === iso3
        );
        matchedCities.push(...isoMatches);
        console.log(`📍 Found ${isoMatches.length} cities by ISO codes for ${countryName}`);
    }

    // 2. Ülke adı ile direkt eşleştirme
    const nameMatches = this.allCities.filter(city => 
        city.country && city.country.toLowerCase() === countryName.toLowerCase()
    );
    matchedCities.push(...nameMatches);
    console.log(`📍 Found ${nameMatches.length} cities by exact name match for ${countryName}`);

    // 3. Ülke adı varyasyonları ile eşleştirme
    const variations = this.getCountryNameVariations(countryName, iso2, iso3);
    for (const variation of variations) {
        const varMatches = this.allCities.filter(city => 
            city.country && city.country.toLowerCase() === variation.toLowerCase()
        );
        matchedCities.push(...varMatches);
    }
    
    // Duplicate'leri kaldır
    const uniqueCities = [];
    const seen = new Set();
    for (const city of matchedCities) {
        const key = `${city.city}_${city.lat}_${city.lng}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueCities.push(city);
        }
    }
    
    // Öncelik sırasına göre filtrele ve sırala
    const priorityCities = uniqueCities.filter(city => 
        city.capital === 'primary' || 
        city.capital === 'admin' || 
        city.capital === 'major' || 
        (city.population && city.population > 100000)
    );
    
    // Başkent ve büyük şehirler önce, sonra nüfus sırasına göre
    priorityCities.sort((a, b) => {
        // 1. Primary capital (başkent) en önce
        if (a.capital === 'primary' && b.capital !== 'primary') return -1;
        if (b.capital === 'primary' && a.capital !== 'primary') return 1;
        
        // 2. Admin centers (önemli şehirler)
        if (a.capital === 'admin' && b.capital !== 'admin') return -1;
        if (b.capital === 'admin' && a.capital !== 'admin') return 1;
        
        // 3. Major cities
        if (a.capital === 'major' && b.capital !== 'major') return -1;
        if (b.capital === 'major' && a.capital !== 'major') return 1;
        
        // 4. Population based sorting
        return (b.population || 0) - (a.population || 0);
    });
    
    // En fazla 50 şehir göster
    const result = priorityCities.slice(0, 50);
    console.log(`🌍 ${countryName} için ${result.length} ana şehir bulundu`);

    
    return result;
}

// Global access for modal functions
let globeExplorer;