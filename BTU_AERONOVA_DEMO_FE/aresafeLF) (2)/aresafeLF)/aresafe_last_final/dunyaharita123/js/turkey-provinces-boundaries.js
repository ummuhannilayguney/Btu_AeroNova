/**
 * Turkey Provinces Boundaries System
 * Renders all 81 Turkish provinces with filled polygons based on AQI data
 */

class TurkeyProvincesBoundaries {
    constructor() {
        this.isEnabled = false;
        this.isDataLoaded = false;
        this.provincePolygons = [];
        this.originalData = null;
        this.globe = null; // Globe referansı
        
        console.log('🏛️ Turkey Provinces Boundaries System initialized');
    }

    // Globe referansını ayarla
    setGlobe(globe) {
        this.globe = globe;
        console.log('🔗 Globe reference set for Turkey provinces system');
    }

    // Initialize the provinces system
    async initialize() {
        if (!this.isDataLoaded) {
            console.log('🔄 Initializing Turkey provinces...');
            await this.loadProvincesBoundaries();
        }
        return this.isDataLoaded;
    }

    // Load Turkey provinces data
    async loadProvincesBoundaries() {
        try {
            console.log('🔄 Loading Turkey provinces (81 provinces)...');
            
            const response = await fetch('https://raw.githubusercontent.com/cihadturhan/tr-geojson/master/geo/tr-cities-utf8.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Turkey provinces loaded:', data.features?.length || 0, 'provinces');
            
            this.originalData = data;
            this.processProvincesBoundaries(data);
            this.isDataLoaded = true;
            
        } catch (error) {
            console.error('❌ Error loading Turkey provinces:', error);
            this.createFallbackProvinces();
            this.isDataLoaded = true; // Fallback ile de veri yüklendi sayılsın
        }
    }

    // Process real GeoJSON province boundaries
    processProvincesBoundaries(data) {
        if (!data?.features) {
            console.warn('⚠️ No features found in Turkey provinces data');
            return;
        }

        console.log(`🏛️ Processing ${data.features.length} Turkey provinces...`);
        
        // Filter out any non-Turkish data and validate geometry
        const validFeatures = data.features.filter(feature => {
            const name = feature.properties?.name || '';
            
            // Block Virginia or any non-Turkish data
            if (name.toLowerCase().includes('virginia') || name.toLowerCase().includes('united states')) {
                console.warn('⚠️ Filtering out non-Turkish data:', name);
                return false;
            }
            
            if (!feature.geometry || !feature.geometry.coordinates) {
                console.warn('⚠️ Skipping Turkey province without geometry:', name);
                return false;
            }
            
            return true;
        });
        
        console.log(`✅ Filtered to ${validFeatures.length} valid Turkish provinces`);
        
        this.provincePolygons = validFeatures.map(feature => {
            const { name, aqi, region, population, code } = feature.properties || {};
            const coordinates = feature.geometry?.coordinates?.[0] || [];
            
            // Calculate center coordinates
            const center = this.calculatePolygonCenter(coordinates);

            return {
                ...feature,
                properties: {
                    ...feature.properties,
                    objectType: 'turkey-province',
                    name: name || 'Unknown Province',
                    region: region || 'Unknown',
                    population: population || 1000000,
                    code: code || '00',
                    aqi: aqi || 50,
                    // Center coordinates for hover card positioning
                    centerLat: center.lat,
                    centerLng: center.lng,
                    // Colors for filled polygons
                    COLOR: this.getProvinceColorFromAQI(aqi),
                    STROKE_COLOR: this.getStrokeColorFromAQI(aqi),
                    boundaryType: 'filled-province'
                }
            };
        });

        this.isDataLoaded = true;
        console.log(`✅ Processed ${this.provincePolygons.length} Turkey provinces with filled polygons`);
        
        // If enabled, render immediately
        if (this.isEnabled) {
            this.renderProvincesBoundaries();
        }
    }

    // Get fill color based on AQI - Matches air quality scale exactly
    getProvinceColorFromAQI(aqi) {
        if (!aqi) return 'rgba(0, 230, 64, 0.6)'; // Default green
        if (aqi >= 300) return 'rgba(126, 0, 35, 0.8)';    // 300+ Bordo
        if (aqi >= 201) return 'rgba(143, 63, 151, 0.8)';  // 201-300 Mor
        if (aqi >= 151) return 'rgba(255, 0, 0, 0.8)';     // 151-200 Kırmızı
        if (aqi >= 101) return 'rgba(255, 126, 0, 0.8)';   // 101-150 Turuncu
        if (aqi >= 51) return 'rgba(255, 255, 0, 0.7)';    // 51-100 Sarı
        return 'rgba(0, 230, 64, 0.7)';                    // 0-50 Yeşil
    }

    // Get stroke color based on AQI - Matches air quality scale exactly
    getStrokeColorFromAQI(aqi) {
        if (!aqi) return '#00e640'; // Default green
        if (aqi >= 300) return '#7e0023'; // 300+ Bordo
        if (aqi >= 201) return '#8f3f97'; // 201-300 Mor
        if (aqi >= 151) return '#ff0000'; // 151-200 Kırmızı
        if (aqi >= 101) return '#ff7e00'; // 101-150 Turuncu
        if (aqi >= 51) return '#ffff00';  // 51-100 Sarı
        return '#00e640'; // 0-50 Yeşil
    }

    // Get AQI level description - Matches air quality scale exactly
    getAQILevel(aqi) {
        if (!aqi) return 'Unknown';
        if (aqi >= 300) return 'Very Unhealthy'; // Hazardous
        if (aqi >= 201) return 'Unhealthy';      // Very Unhealthy
        if (aqi >= 151) return 'Moderate-Unhealthy'; // Unhealthy
        if (aqi >= 101) return 'Moderate';           // Unhealthy for Sensitive
        if (aqi >= 51) return 'Good-Moderate';       // Moderate
        return 'Good';
    }

    // Create fallback provinces if data loading fails
    createFallbackProvinces() {
        console.warn('⚠️ Creating fallback Turkey provinces...');
        
        // Basic major provinces as fallback
        const majorProvinces = [
            {name: 'İstanbul', lat: 41.0, lng: 29.0, aqi: 95},
            {name: 'Ankara', lat: 39.9, lng: 32.8, aqi: 80},
            {name: 'İzmir', lat: 38.4, lng: 27.1, aqi: 70},
            {name: 'Bursa', lat: 40.2, lng: 29.1, aqi: 85},
            {name: 'Antalya', lat: 36.9, lng: 30.7, aqi: 60}
        ];

        this.provincePolygons = majorProvinces.map((province, index) => ({
            type: 'Feature',
            properties: {
                objectType: 'turkey-province',
                name: province.name,
                aqi: province.aqi,
                COLOR: this.getProvinceColorFromAQI(province.aqi),
                STROKE_COLOR: this.getStrokeColorFromAQI(province.aqi),
                boundaryType: 'fallback-rectangle',
                code: String(index + 1).padStart(2, '0')
            },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [province.lng - 0.3, province.lat - 0.2],
                    [province.lng + 0.3, province.lat - 0.2],
                    [province.lng + 0.3, province.lat + 0.2],
                    [province.lng - 0.3, province.lat + 0.2],
                    [province.lng - 0.3, province.lat - 0.2]
                ]]
            }
        }));

        this.isDataLoaded = true;
        console.log(`✅ Created ${this.provincePolygons.length} fallback provinces`);
    }

    // Enable provinces display
    async enable() {
        this.isEnabled = true;
        console.log('🏛️ Turkey provinces boundaries enabled');
        
        if (!this.isDataLoaded) {
            console.log('📦 Initializing Turkey provinces data...');
            await this.initialize();
        }
        
        if (this.isDataLoaded) {
            this.renderProvincesBoundaries();
        } else {
            console.error('❌ Failed to load Turkey provinces data');
        }
    }

    // Disable provinces display
    disable() {
        this.isEnabled = false;
        console.log('🔘 Turkey provinces boundaries disabled');
        this.clearProvincesBoundaries();
    }

    // Force reset - tamamen sıfırla (ikinci toggle için)
    async forceReset() {
        console.log('🔄 Turkey provinces system force reset...');
        this.isEnabled = false;
        this.clearProvincesBoundaries();
        
        // Veri durumunu sıfırla
        this.provincePolygons = [];
        this.isDataLoaded = false;
        
        // Yeniden yükle
        await this.initialize();
        console.log('✅ Turkey provinces system completely reset and reloaded');
    }

    // Toggle provinces display
    toggle() {
        if (this.isEnabled) {
            this.disable();
        } else {
            this.enable();
        }
    }

    // Render provinces boundaries on globe
    renderProvincesBoundaries() {
        if (!this.globe || !this.provincePolygons?.length) {
            console.warn('⚠️ Globe or provinces data not available for rendering');
            return;
        }

        console.log(`🎨 Rendering ${this.provincePolygons.length} Turkey provinces with filled polygons...`);

        // 🌈 Özel AQI değerleri - 5 şehir farklı renkler
        const specialCities = {
            'İstanbul': { aqi: 180, description: 'Sağlıksız' },
            'Ankara': { aqi: 75, description: 'Orta' },
            'İzmir': { aqi: 35, description: 'İyi' },
            'Bursa': { aqi: 125, description: 'Hassas Gruplar İçin Sağlıksız' },
            'Antalya': { aqi: 25, description: 'İyi' }
        };
        
        console.log('🎨 Özel AQI değerleri uygulanıyor:', specialCities);

        // Ensure all provinces have proper properties before rendering
        const validatedProvinces = this.provincePolygons.map(province => {
            // Ensure properties exist and are valid
            if (!province.properties) {
                province.properties = {};
            }
            
            // Ensure name exists
            if (!province.properties.name) {
                province.properties.name = province.properties.NAME || 'Unknown Province';
            }
            
            // 🎨 Özel şehirler için AQI değerlerini uygula
            const provinceName = province.properties.name;
            let aqi = province.properties.aqi || 50;
            
            if (specialCities[provinceName]) {
                aqi = specialCities[provinceName].aqi;
                province.properties.aqi = aqi;
                console.log(`🌈 ${provinceName} için özel AQI uygulandı: ${aqi} (${specialCities[provinceName].description})`);
            }
            
            // Re-apply colors with new AQI values
            province.properties.COLOR = this.getProvinceColorFromAQI(aqi);
            province.properties.STROKE_COLOR = this.getStrokeColorFromAQI(aqi);
            province.properties.objectType = 'turkey-province';
            
            console.log(`🏛️ Validating province: ${province.properties.name} - AQI: ${aqi} - Color: ${province.properties.COLOR}`);
            
            return province;
        });

        // Önce mevcut polygon verilerini al (ABD verileri korunması için)
        const existingPolygons = this.globe.polygonsData() || [];
        
        // Türkiye verilerini mevcut verilere ekle
        const combinedPolygons = [...existingPolygons, ...validatedProvinces];
        
        // Birleştirilmiş verileri set et
        this.globe.polygonsData(combinedPolygons)
            .polygonAltitude(0.01) // Same as country boundaries
            .polygonCapColor(d => {
                // Türkiye illeri için özel renk, diğerleri şeffaf
                if (d.properties?.objectType === 'turkey-province') {
                    const color = d.properties.COLOR || this.getProvinceColorFromAQI(d.properties.aqi || 50);
                    console.log(`🎨 Applying cap color: ${color} to ${d.properties.name}`);
                    return color;
                }
                return 'rgba(0, 0, 0, 0)'; // Transparent for others
            })
            .polygonSideColor(d => {
                if (d.properties?.objectType === 'turkey-province') {
                    const color = d.properties.COLOR || this.getProvinceColorFromAQI(d.properties.aqi || 50);
                    return color;
                }
                return 'rgba(0, 0, 0, 0)';
            })
            .polygonStrokeColor(d => {
                if (d.properties?.objectType === 'turkey-province') {
                    const strokeColor = d.properties.STROKE_COLOR || this.getStrokeColorFromAQI(d.properties.aqi || 50);
                    return strokeColor;
                }
                return d.properties?.STROKE_COLOR || '#666';
            })
            // Labels handled by point system, not polygon labels
            .onPolygonHover(hoverPolygon => {
                // Hover tooltip için main.js'teki universal handler'ı çağır
                if (window.globeExplorer && window.globeExplorer.showAirPollutionTooltip) {
                    if (hoverPolygon) {
                        window.globeExplorer.showAirPollutionTooltip(hoverPolygon);
                    } else {
                        window.globeExplorer.hideCountryHoverCard();
                    }
                }
            })
            // Click handlers are managed by main.js smart router

        console.log('✅ Turkey provinces rendered with filled polygons');
        
        // HTML label'ları artık hover-only modunda kullanmıyoruz
        // this.addProvinceHTMLLabels();
    }

    // Add province labels as point labels (more visible than polygon labels)
    addProvinceLabels() {
        if (!this.globe || !this.provincePolygons?.length) return;

        console.log('🏷️ Adding Turkey province labels as points...');
        
        // Create label points for each province
        const labelPoints = this.provincePolygons.map(province => {
            const center = this.calculatePolygonCenter(province.geometry.coordinates[0]);
            return {
                lat: center.lat,
                lng: center.lng,
                name: province.properties.name || 'Unknown',
                type: 'turkey-label',
                aqi: province.properties.aqi || 0
            };
        });

        // Get existing points and add label points
        const existingPoints = this.globe.pointsData() || [];
        const combinedPoints = [...existingPoints, ...labelPoints];
        
        this.globe.pointsData(combinedPoints)
            .pointLat('lat')
            .pointLng('lng')
            .pointColor(d => d.type === 'turkey-label' ? 'rgba(0,0,0,0)' : '#ffaa00') // Transparent for labels
            .pointRadius(d => d.type === 'turkey-label' ? 0.001 : 0.3) // Very small radius for labels
            .pointAltitude(d => d.type === 'turkey-label' ? 0.01 : 0.01) // Altitude for labels
            .pointLabel(d => {
                if (d.type === 'turkey-label') {
                    console.log('🏷️ Point label for Turkey province:', d.name);
                    return d.name; // Basit text dene
                }
                // Normal city labels
                const cityName = d.name || d.city || 'Unknown';
                const countryName = d.country || 'Unknown';
                const populationText = d.population ? 
                    new Intl.NumberFormat('tr').format(d.population) : 
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
            });

        console.log(`✅ Added ${labelPoints.length} Turkey province labels as points`);
    }

    // Add province labels as HTML overlays (more reliable than point labels)
    addProvinceHTMLLabels() {
        if (!this.globe || !this.provincePolygons?.length) return;

        console.log('🏷️ Adding Turkey province HTML labels...');
        
        // Create HTML label data for Globe.gl htmlElements
        const htmlLabels = this.provincePolygons.map(province => {
            const center = this.calculatePolygonCenter(province.geometry.coordinates[0]);
            return {
                lat: center.lat,
                lng: center.lng,
                name: province.properties.name || 'Unknown',
                type: 'turkey-html-label'
            };
        });

        // Use Globe.gl's htmlElementsData for reliable HTML labels
        this.globe.htmlElementsData(htmlLabels)
            .htmlLat('lat')
            .htmlLng('lng')
            .htmlElement(d => {
                if (d.type === 'turkey-html-label') {
                    console.log('🏷️ Creating HTML label for:', d.name);
                    const el = document.createElement('div');
                    el.innerHTML = d.name;
                    el.style.cssText = `
                        background: rgba(0,0,0,0.8);
                        color: white;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: bold;
                        text-align: center;
                        white-space: nowrap;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.5);
                        pointer-events: none;
                        font-family: Arial, sans-serif;
                    `;
                    return el;
                }
                return document.createElement('div');
            })
            .htmlAltitude(0.01);

        console.log(`✅ Added ${htmlLabels.length} Turkey province HTML labels`);
    }

    // Clear provinces boundaries
    clearProvincesBoundaries() {
        if (!this.globe) return;
        
        console.log('🧹 Clearing Turkey provinces boundaries and labels...');
        
        // Sadece Türkiye verilerini kaldır, diğerlerini koru
        const currentPolygons = this.globe.polygonsData() || [];
        const nonTurkeyPolygons = currentPolygons.filter(polygon => 
            polygon.properties?.objectType !== 'turkey-province'
        );
        
        // Türkiye label point'larını da kaldır
        const currentPoints = this.globe.pointsData() || [];
        const nonTurkeyPoints = currentPoints.filter(point => 
            point.type !== 'turkey-label'
        );
        
        // Türkiye HTML label'larını da kaldır
        const currentHtmlLabels = this.globe.htmlElementsData() || [];
        const nonTurkeyHtmlLabels = currentHtmlLabels.filter(label => 
            label.type !== 'turkey-html-label'
        );
        
        this.globe.polygonsData(nonTurkeyPolygons);
        this.globe.pointsData(nonTurkeyPoints);
        this.globe.htmlElementsData(nonTurkeyHtmlLabels);
    }

    // Create province label
    createProvinceLabel(properties) {
        const { name, aqi } = properties;
        
        console.log('🏷️ Creating label for province:', name, 'AQI:', aqi);
        
        const displayName = name || 'Unknown Province';
        const strokeColor = this.getStrokeColorFromAQI(aqi);
        
        return `<div style="
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255,255,255,0.2);
            text-align: center;
            white-space: nowrap;
            max-width: 250px;
        ">
            <div style="font-size: 16px; margin-bottom: 4px;">🇹🇷 ${displayName}</div>
            <div style="color: ${strokeColor}; font-size: 13px;">
                AQI: ${aqi || 'N/A'}
            </div>
        </div>`;
    }

    // Create USA state label (Turkey sistem tarafından çağrılır)
    createUSAStateLabel(properties) {
        const { NAME, AQI } = properties;
        const displayName = NAME || 'Unknown State';
        const aqi = AQI || 0;
        
        console.log('🏷️ Creating USA state label for:', displayName, 'AQI:', aqi);
        
        // ABD için stroke color hesabı (Turkey sistemindeki method kullanılır)
        const strokeColor = this.getStrokeColorFromAQI(aqi);
        
        return `<div style="
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 10px 14px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255,255,255,0.2);
            text-align: center;
            white-space: nowrap;
            max-width: 200px;
        ">
            <div style="font-weight: bold; margin-bottom: 4px; font-size: 16px;">🇺🇸 ${displayName}</div>
            <div style="font-size: 13px;">AQI: <span style="color: ${strokeColor}; font-weight: bold;">${aqi || 'N/A'}</span></div>
        </div>`;
    }

    // Get AQI color for text
    getAQIColor(aqi) {
        if (!aqi) return '#ffffff';
        if (aqi >= 150) return '#8B0000'; // Dark red
        if (aqi >= 100) return '#FF0000'; // Red
        if (aqi >= 70) return '#FFA500';  // Orange
        if (aqi >= 50) return '#FFFF00';  // Yellow
        return '#00FF00'; // Green
    }

    // Handle province click
    onProvinceClick(province, event) {
        if (!province?.properties?.objectType === 'turkey-province') return;
        
        const { name, aqi, region, population, code } = province.properties;
        console.log(`🖱️ Clicked Turkey province: ${name} (${code}) - AQI: ${aqi}`);
        
        // You can add more click functionality here
        // Example: show detailed info panel, zoom to province, etc.
    }

    // Handle province hover
    onProvinceHover(province, previousProvince) {
        if (province?.properties?.objectType === 'turkey-province') {
            const { name, aqi } = province.properties;
            console.log(`🖱️ Hovering over Turkey province: ${name} - AQI: ${aqi}`);
            console.log('DEBUG - Full properties:', province.properties);
            
            // Show Turkey province hover card via main.js
            if (window.app && window.app.showTurkeyProvinceCard) {
                window.app.showTurkeyProvinceCard(name, aqi, province.properties);
            }
        }
    }

    // Get status info
    getStatus() {
        return {
            enabled: this.isEnabled,
            dataLoaded: this.isDataLoaded,
            provincesCount: this.provincePolygons?.length || 0,
            systemName: 'Turkey Provinces (81 Provinces)'
        };
    }

    // Get provinces data for external use
    getProvincesData() {
        return {
            provinces: this.provincePolygons,
            originalData: this.originalData,
            status: this.getStatus()
        };
    }

    // Check if system is enabled (for main.js compatibility)
    isSystemEnabled() {
        return this.isEnabled;
    }

    // Calculate polygon center (simple average of coordinates)
    calculatePolygonCenter(coordinates) {
        if (!coordinates || coordinates.length === 0) {
            return { lat: 39.9334, lng: 32.8597 }; // Ankara fallback
        }

        let totalLat = 0;
        let totalLng = 0;
        let validPoints = 0;

        coordinates.forEach(coord => {
            if (Array.isArray(coord) && coord.length >= 2) {
                totalLng += coord[0]; // longitude
                totalLat += coord[1]; // latitude
                validPoints++;
            }
        });

        if (validPoints === 0) {
            return { lat: 39.9334, lng: 32.8597 }; // Ankara fallback
        }

        return {
            lat: totalLat / validPoints,
            lng: totalLng / validPoints
        };
    }
}

// Create global instance
window.TurkeyProvincesBoundaries = TurkeyProvincesBoundaries;
console.log('🏛️ Turkey Provinces Boundaries system loaded and ready');