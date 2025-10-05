/**
 * USA States Boundaries System
 * Renders all 50 US states + DC with filled polygons based on AQI data
 */

class USAStatesBoundaries {
    constructor() {
        this.isEnabled = false;
        this.isDataLoaded = false;
        this.statePolygons = [];
        this.originalData = null;
        this.globe = null; // Globe referansı
        
        console.log('🇺🇸 USA States Boundaries System initialized');
    }

    // Globe referansını ayarla
    setGlobe(globe) {
        this.globe = globe;
        console.log('🔗 Globe reference set for USA states system');
    }

    // Initialize the states system
    async initialize() {
        if (!this.isDataLoaded) {
            console.log('🔄 Initializing USA states...');
            await this.loadStatesBoundaries();
        }
        return this.isDataLoaded;
    }

    // Load USA states data
    async loadStatesBoundaries() {
        try {
            console.log('🔄 Loading USA states (50 states + DC)...');
            
            // Use clean and reliable US states GeoJSON data source
            const statesResponse = await fetch('https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/united-states.geojson');
            
            if (!statesResponse.ok) {
                throw new Error(`HTTP error! status: ${statesResponse.status}`);
            }
            
            const data = await statesResponse.json();
            console.log('✅ USA states loaded:', data.features?.length || 0, 'states');
            
            this.originalData = data;
            await this.processStatesBoundaries(data);
            this.isDataLoaded = true;
            
        } catch (error) {
            console.error('❌ Error loading USA states:', error);
            console.log('🔄 Trying fallback data source...');
            
            try {
                // Fallback to alternative source
                const fallbackResponse = await fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson');
                if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    
                    // Filter only USA states from world admin data
                    const usaStates = fallbackData.features.filter(feature => {
                        const country = feature.properties?.admin || feature.properties?.ADMIN || '';
                        return country.toLowerCase().includes('united states');
                    });
                    
                    if (usaStates.length > 0) {
                        console.log(`✅ Loaded ${usaStates.length} USA states from fallback source`);
                        const usaData = { type: 'FeatureCollection', features: usaStates };
                        this.originalData = usaData;
                        this.processStatesBoundaries(usaData);
                        this.isDataLoaded = true;
                        return;
                    }
                }
            } catch (fallbackError) {
                console.error('❌ Fallback also failed:', fallbackError);
            }
            
            // Last resort: Create demo data for major US states
            this.createDemoStatesData();
        }
    }

    // Process states boundaries data
    async processStatesBoundaries(data) {
        if (!data || !data.features) {
            console.error('❌ Invalid USA states data format');
            return;
        }

        // Filter out invalid geometries and problematic states
        const validFeatures = data.features.filter(feature => {
            const stateName = feature.properties?.NAME || feature.properties?.name || '';
            
            if (!feature.geometry || !feature.geometry.coordinates) {
                console.warn('⚠️ Skipping feature without geometry:', stateName);
                return false;
            }
            
            // Virginia artık dahil edildi - geometrik sorunlar çözüldü
            // Virginia filtrelemesi kaldırıldı
            
            // Check for oversized polygons (Alaska dahil için limit artırıldı)
            const coords = feature.geometry.coordinates;
            if (coords && coords[0] && coords[0].length > 5000) {
                console.warn('⚠️ Skipping oversized polygon:', stateName, 'coordinates:', coords[0].length);
                return false;
            }
            
            // Check coordinate bounds (must be within USA bounds)
            if (coords && coords[0]) {
                const firstCoord = coords[0][0];
                if (Array.isArray(firstCoord) && firstCoord.length >= 2) {
                    const lng = firstCoord[0];
                    const lat = firstCoord[1];
                    
                    // Extended USA bounds: Alaska dahil -200 to -60 longitude, 15 to 80 latitude
                    // Alaska: ~-180 to -130 longitude, 55 to 72 latitude
                    if (lng < -200 || lng > -60 || lat < 15 || lat > 80) {
                        console.warn('⚠️ Skipping state with invalid coordinates:', stateName, 'coords:', lng, lat);
                        return false;
                    }
                }
            }
            
            return true;
        });

        console.log(`📊 Filtered ${validFeatures.length} valid states from ${data.features.length} total`);
        
        // Debug: Check if Alaska and Virginia are included
        const alaskaFeature = validFeatures.find(f => f.properties?.NAME?.toLowerCase().includes('alaska'));
        const virginiaFeature = validFeatures.find(f => f.properties?.NAME?.toLowerCase().includes('virginia'));
        console.log('🏔️ Alaska found:', alaskaFeature ? '✅' : '❌', alaskaFeature?.properties?.NAME);
        console.log('🏛️ Virginia found:', virginiaFeature ? '✅' : '❌', virginiaFeature?.properties?.NAME);

        this.statePolygons = validFeatures.map(feature => {
            const stateName = feature.properties.NAME || feature.properties.name || 'Unknown State';
            const stateCode = feature.properties.STATE || feature.properties.code || '';
            
            // Generate demo AQI values for US states (realistic ranges)
            const aqi = this.generateStateAQI(stateName);
            
            // Calculate center coordinates
            const coordinates = feature.geometry?.coordinates?.[0] || [];
            const center = this.calculatePolygonCenter(coordinates, stateName);
            
            return {
                ...feature,
                properties: {
                    ...feature.properties,
                    NAME: stateName,
                    STATE_CODE: stateCode,
                    AQI: aqi,
                    // Center coordinates for hover card positioning
                    centerLat: center.lat,
                    centerLng: center.lng,
                    COLOR: this.getColorFromAQI(aqi),
                    STROKE_COLOR: this.getStrokeColorFromAQI(aqi),
                    objectType: 'usa-state'
                }
            };
        });

        // Eksik Alaska'yı gerçek geometriyle ekle
        await this.addMissingStates();

        console.log(`🎨 Processed ${this.statePolygons.length} USA states with AQI colors`);
    }

    // Generate realistic AQI values for US states
    generateStateAQI(stateName) {
        const stateAQIMap = {
            // Cleaner states (Western mountains, rural areas)
            'Montana': 25 + Math.random() * 20,
            'Wyoming': 20 + Math.random() * 15,
            'Vermont': 30 + Math.random() * 15,
            'New Hampshire': 35 + Math.random() * 15,
            'Maine': 30 + Math.random() * 20,
            'Alaska': 15 + Math.random() * 15,
            'Hawaii': 25 + Math.random() * 15,
            
            // Moderate states (mixed urban/rural)
            'Colorado': 45 + Math.random() * 25,
            'Oregon': 40 + Math.random() * 20,
            'Washington': 45 + Math.random() * 20,
            'Minnesota': 50 + Math.random() * 20,
            'Wisconsin': 50 + Math.random() * 20,
            'Iowa': 55 + Math.random() * 20,
            
            // More polluted states (industrial, high traffic)
            'California': 85 + Math.random() * 40, // Variable due to size
            'Texas': 75 + Math.random() * 35,
            'Florida': 65 + Math.random() * 25,
            'New York': 80 + Math.random() * 30,
            'Pennsylvania': 75 + Math.random() * 25,
            'Ohio': 80 + Math.random() * 25,
            'Illinois': 85 + Math.random() * 25,
            'Michigan': 75 + Math.random() * 30,
            
            // High pollution states (industrial, coal, traffic)
            'West Virginia': 95 + Math.random() * 25,
            'Kentucky': 90 + Math.random() * 25,
            'Indiana': 85 + Math.random() * 30,
            'Louisiana': 90 + Math.random() * 35,
            'Mississippi': 85 + Math.random() * 25,
            'Alabama': 80 + Math.random() * 25,
            'Tennessee': 75 + Math.random() * 25,
            'North Carolina': 70 + Math.random() * 25,
            'South Carolina': 75 + Math.random() * 20,
            'Georgia': 75 + Math.random() * 25,
            'Virginia': 70 + Math.random() * 25,
            'Maryland': 80 + Math.random() * 25,
            'Delaware': 75 + Math.random() * 20,
            'New Jersey': 90 + Math.random() * 25,
            'Connecticut': 75 + Math.random() * 20,
            'Rhode Island': 70 + Math.random() * 20,
            'Massachusetts': 75 + Math.random() * 25,
            
            // Southwest (dust, heat, urban)
            'Arizona': 80 + Math.random() * 30,
            'Nevada': 75 + Math.random() * 25,
            'New Mexico': 65 + Math.random() * 25,
            'Utah': 70 + Math.random() * 25,

            // Midwest
            'Missouri': 75 + Math.random() * 25,
            'Kansas': 65 + Math.random() * 25,
            'Nebraska': 60 + Math.random() * 25,
            'South Dakota': 45 + Math.random() * 20,
            'North Dakota': 50 + Math.random() * 20,
            'Oklahoma': 75 + Math.random() * 25,
            'Arkansas': 70 + Math.random() * 25,
            
            // Washington DC
            'District of Columbia': 85 + Math.random() * 20
        };

        return Math.round(stateAQIMap[stateName] || (50 + Math.random() * 40));
    }

    // Get color based on AQI value (same as Turkey system)
    getColorFromAQI(aqi) {
        if (aqi >= 300) return 'rgba(126,0,35,0.8)';      // Hazardous - Maroon
        if (aqi >= 201) return 'rgba(143,63,151,0.8)';    // Very Unhealthy - Purple  
        if (aqi >= 151) return 'rgba(255,0,0,0.8)';       // Unhealthy - Red
        if (aqi >= 101) return 'rgba(255,126,0,0.8)';     // Unhealthy for Sensitive - Orange
        if (aqi >= 51) return 'rgba(255,255,0,0.7)';      // Moderate - Yellow
        return 'rgba(0,228,0,0.6)';                       // Good - Green
    }

    // Get stroke color based on AQI value (same as Turkey system)
    getStrokeColorFromAQI(aqi) {
        if (aqi >= 300) return '#7e0023';      // Hazardous - Maroon
        if (aqi >= 201) return '#8f3f97';      // Very Unhealthy - Purple  
        if (aqi >= 151) return '#ff0000';      // Unhealthy - Red
        if (aqi >= 101) return '#ff7e00';      // Unhealthy for Sensitive - Orange
        if (aqi >= 51) return '#ffff00';       // Moderate - Yellow
        return '#00e640';                      // Good - Green
    }

    // Get stroke color based on AQI
    getStrokeColorFromAQI(aqi) {
        if (aqi >= 300) return '#7e0023';
        if (aqi >= 201) return '#8f3f97';
        if (aqi >= 151) return '#cc0000';
        if (aqi >= 101) return '#ff7e00';
        if (aqi >= 51) return '#cccc00';
        return '#00cc00';
    }

    // Create demo data if remote data fails
    createDemoStatesData() {
        console.log('⚠️ Creating simplified USA states data...');
        
        // Create simplified rectangles for major US states
        const majorStates = [
            { name: 'California', lat: 36.7783, lng: -119.4179, aqi: 85 },
            { name: 'Texas', lat: 31.9686, lng: -99.9018, aqi: 75 },
            { name: 'Florida', lat: 27.7663, lng: -82.7001, aqi: 70 },
            { name: 'New York', lat: 42.1657, lng: -74.9481, aqi: 90 },
            { name: 'Pennsylvania', lat: 41.2033, lng: -77.1945, aqi: 80 },
            { name: 'Illinois', lat: 40.3363, lng: -89.0022, aqi: 85 },
            { name: 'Ohio', lat: 40.3888, lng: -82.7649, aqi: 82 },
            { name: 'Georgia', lat: 33.76, lng: -84.39, aqi: 78 },
            { name: 'North Carolina', lat: 35.771, lng: -78.638, aqi: 73 },
            { name: 'Michigan', lat: 43.3266, lng: -84.5361, aqi: 77 }
        ];

        this.statePolygons = majorStates.map((state, index) => ({
            type: 'Feature',
            properties: {
                NAME: state.name,
                STATE_CODE: String(index + 1).padStart(2, '0'),
                AQI: state.aqi,
                COLOR: this.getColorFromAQI(state.aqi),
                STROKE_COLOR: this.getStrokeColorFromAQI(state.aqi),
                objectType: 'usa-state-demo'
            },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [state.lng - 2, state.lat - 1.5],
                    [state.lng + 2, state.lat - 1.5],
                    [state.lng + 2, state.lat + 1.5],
                    [state.lng - 2, state.lat + 1.5],
                    [state.lng - 2, state.lat - 1.5]
                ]]
            }
        }));

        this.isDataLoaded = true;
        this.usingDemoData = true;
        console.log(`✅ Created ${this.statePolygons.length} demo USA states`);
    }

    // Enable USA states rendering
    async enable() {
        if (!this.globe) {
            console.error('❌ Globe reference not set for USA states');
            return false;
        }

        if (!this.isDataLoaded) {
            console.log('📦 Initializing USA states data...');
            const initialized = await this.initialize();
            if (!initialized) {
                console.error('❌ Failed to initialize USA states data');
                return false;
            }
        }

        console.log('🇺🇸 Enabling USA states boundaries...');
        
        // Ensure all states have proper properties before rendering
        const validatedStates = this.statePolygons.map(polygon => {
            // Ensure properties exist and are valid
            if (!polygon.properties) {
                polygon.properties = {};
            }
            
            // Re-apply colors in case they were lost
            const aqi = polygon.properties.AQI || 50;
            polygon.properties.COLOR = this.getColorFromAQI(aqi);
            polygon.properties.STROKE_COLOR = this.getStrokeColorFromAQI(aqi);
            polygon.properties.objectType = 'usa-state';
            
            // Ensure name exists
            if (!polygon.properties.NAME) {
                polygon.properties.NAME = polygon.properties.name || 'Unknown State';
            }
            
            console.log(`🇺🇸 Validating state: ${polygon.properties.NAME} - AQI: ${aqi} - Color: ${polygon.properties.COLOR}`);
            
            return polygon;
        });
        
        // Önce mevcut polygon verilerini al (Türkiye verileri korunması için)
        const existingPolygons = this.globe.polygonsData() || [];
        
        // ABD verilerini mevcut verilere ekle
        const combinedPolygons = [...existingPolygons, ...validatedStates];
        
        // Birleştirilmiş verileri set et
        this.globe.polygonsData(combinedPolygons)
            .polygonCapColor(d => {
                // ABD eyaletleri için özel renk, diğerleri korunur
                if (d.properties?.objectType === 'usa-state') {
                    const color = d.properties.COLOR || this.getColorFromAQI(d.properties.AQI || 50);
                    console.log(`🎨 Applying USA cap color: ${color} to ${d.properties.NAME}`);
                    return color;
                }
                if (d.properties?.objectType === 'turkey-province') {
                    return d.properties.COLOR;
                }
                return 'rgba(0, 0, 0, 0)';
            })
            .polygonSideColor(d => {
                if (d.properties?.objectType === 'usa-state') {
                    const color = d.properties.COLOR || this.getColorFromAQI(d.properties.AQI || 50);
                    return color;
                }
                if (d.properties?.objectType === 'turkey-province') {
                    return d.properties.COLOR;
                }
                return 'rgba(0, 0, 0, 0)';
            })
            .polygonStrokeColor(d => {
                if (d.properties?.objectType === 'usa-state') {
                    const strokeColor = d.properties.STROKE_COLOR || this.getStrokeColorFromAQI(d.properties.AQI || 50);
                    return strokeColor;
                }
                if (d.properties?.objectType === 'turkey-province') {
                    return d.properties.STROKE_COLOR;
                }
                return d.properties?.STROKE_COLOR || '#666';
            })
            .polygonAltitude(0.01)
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

        this.isEnabled = true;
        console.log(`✅ USA states boundaries enabled (${this.statePolygons.length} states)`);
        
        // HTML label'ları artık hover-only modunda kullanmıyoruz
        // this.addStateHTMLLabels();
        return true;
    }

    // Add state labels as point labels (more visible than polygon labels)
    addStateLabels() {
        if (!this.globe || !this.statePolygons?.length) return;

        console.log('🏷️ Adding USA state labels as points...');
        
        // Create label points for each state
        const labelPoints = this.statePolygons.map(state => {
            const center = this.calculatePolygonCenter(state.geometry.coordinates[0]);
            return {
                lat: center.lat,
                lng: center.lng,
                name: state.properties.NAME || 'Unknown',
                type: 'usa-label',
                aqi: state.properties.AQI || 0
            };
        });

        // Get existing points and add label points
        const existingPoints = this.globe.pointsData() || [];
        const combinedPoints = [...existingPoints, ...labelPoints];
        
        this.globe.pointsData(combinedPoints)
            .pointLat('lat')
            .pointLng('lng')
            .pointColor(d => {
                if (d.type === 'usa-label' || d.type === 'turkey-label') return 'rgba(0,0,0,0)'; // Transparent for labels
                return '#ffaa00';
            })
            .pointRadius(d => {
                if (d.type === 'usa-label' || d.type === 'turkey-label') return 0.001; // Very small radius for labels
                return 0.3;
            })
            .pointAltitude(d => {
                if (d.type === 'usa-label' || d.type === 'turkey-label') return 0.01; // Altitude for labels
                return 0.01;
            })
            .pointLabel(d => {
                if (d.type === 'usa-label') {
                    console.log('🏷️ Point label for USA state:', d.name);
                    return d.name; // Basit text dene
                }
                if (d.type === 'turkey-label') {
                    console.log('🏷️ Point label for Turkey province via USA:', d.name);
                    return d.name; // Basit text dene
                }
                
                // Normal city labels
                const cityName = d.name || d.city || 'Unknown';
                const countryName = d.country || 'Unknown';
                const populationText = d.population ? 
                    new Intl.NumberFormat('en').format(d.population) : 
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

        console.log(`✅ Added ${labelPoints.length} USA state labels as points`);
    }

    // Calculate polygon center
    calculatePolygonCenter(coordinates) {
        if (!coordinates || coordinates.length === 0) {
            return { lat: 0, lng: 0 };
        }
        
        let totalLat = 0;
        let totalLng = 0;
        let count = 0;
        
        coordinates.forEach(coord => {
            if (Array.isArray(coord) && coord.length >= 2) {
                totalLng += coord[0];
                totalLat += coord[1];
                count++;
            }
        });
        
        return {
            lat: count > 0 ? totalLat / count : 0,
            lng: count > 0 ? totalLng / count : 0
        };
    }

    // Add state labels as HTML overlays (more reliable than point labels)
    addStateHTMLLabels() {
        if (!this.globe || !this.statePolygons?.length) return;

        console.log('🏷️ Adding USA state HTML labels...');
        
        // Get existing HTML labels and add state labels
        const currentHtmlLabels = this.globe.htmlElementsData() || [];
        
        // Create HTML label data for Globe.gl htmlElements
        const stateHtmlLabels = this.statePolygons.map(state => {
            const center = this.calculatePolygonCenter(state.geometry.coordinates[0]);
            return {
                lat: center.lat,
                lng: center.lng,
                name: state.properties.NAME || 'Unknown',
                type: 'usa-html-label'
            };
        });

        // Combine existing and new labels
        const combinedHtmlLabels = [...currentHtmlLabels, ...stateHtmlLabels];

        // Use Globe.gl's htmlElementsData for reliable HTML labels
        this.globe.htmlElementsData(combinedHtmlLabels)
            .htmlLat('lat')
            .htmlLng('lng')
            .htmlElement(d => {
                if (d.type === 'usa-html-label') {
                    console.log('🏷️ Creating HTML label for USA state:', d.name);
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
                if (d.type === 'turkey-html-label') {
                    console.log('🏷️ Creating HTML label for Turkey province via USA:', d.name);
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

        console.log(`✅ Added ${stateHtmlLabels.length} USA state HTML labels`);
    }

    // Disable USA states rendering
    disable() {
        if (!this.globe) return;

        console.log('🇺🇸 Disabling USA states boundaries and labels...');
        
        // Sadece ABD verilerini kaldır, diğerlerini koru
        const currentPolygons = this.globe.polygonsData() || [];
        const nonUSAPolygons = currentPolygons.filter(polygon => 
            polygon.properties?.objectType !== 'usa-state'
        );
        
        // ABD label point'larını da kaldır
        const currentPoints = this.globe.pointsData() || [];
        const nonUSAPoints = currentPoints.filter(point => 
            point.type !== 'usa-label'
        );
        
        // USA HTML label'larını da kaldır
        const currentHtmlLabels = this.globe.htmlElementsData() || [];
        const nonUSAHtmlLabels = currentHtmlLabels.filter(label => 
            label.type !== 'usa-html-label'
        );
        
        this.globe.polygonsData(nonUSAPolygons);
        this.globe.pointsData(nonUSAPoints);
        this.globe.htmlElementsData(nonUSAHtmlLabels);
        
        this.isEnabled = false;
        console.log('✅ USA states boundaries and labels disabled, other data preserved');
    }

    // Force reset - tamamen sıfırla (ikinci toggle için)
    async forceReset() {
        console.log('🔄 USA states system force reset...');
        this.isEnabled = false;
        this.disable();
        
        // Veri durumunu sıfırla
        this.statePolygons = [];
        this.isDataLoaded = false;
        
        // Yeniden yükle
        await this.initialize();
        console.log('✅ USA states system completely reset and reloaded');
    }

    // Get AQI level description
    getAQILevel(aqi) {
        if (aqi >= 300) return 'Hazardous';
        if (aqi >= 201) return 'Very Unhealthy';
        if (aqi >= 151) return 'Unhealthy';
        if (aqi >= 101) return 'Unhealthy for Sensitive';
        if (aqi >= 51) return 'Moderate';
        return 'Good';
    }

    // Escape HTML for security
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Handle state hover
    onStateHover(state, previousState) {
        if (state?.properties?.objectType === 'usa-state') {
            const { NAME, AQI } = state.properties;
            console.log(`🖱️ Hovering over USA state: ${NAME} - AQI: ${AQI}`);
            console.log('DEBUG - Full properties:', state.properties);
            
            // Show USA state hover card via main.js
            if (window.app && window.app.showUSAStateCard) {
                window.app.showUSAStateCard(NAME, AQI, state.properties);
            }
        }
    }

    // Handle state click
    onStateClick(state) {
        if (state?.properties?.objectType === 'usa-state') {
            const { NAME, AQI } = state.properties;
            console.log(`🖱️ Clicked on USA state: ${NAME} - AQI: ${AQI}`);
            
            // Open state details with cities
            this.openStateDetails(NAME, state.properties);
        }
    }

    // Open state details view with city list
    async openStateDetails(stateName, stateProperties) {
        console.log(`🏛️ Opening state details for: ${stateName}`);
        
        try {
            // Create state details modal/overlay
            this.createStateDetailsModal(stateName, stateProperties);
            
            // Load cities for this state
            const cities = await this.getCitiesForState(stateName);
            console.log(`🏙️ Found ${cities.length} cities for ${stateName}`);
            
            // Render cities list
            this.renderCitiesList(cities, stateName);
            
        } catch (error) {
            console.error('❌ Error opening state details:', error);
            this.showStateError(stateName, 'Failed to load state details');
        }
    }

    // Create state details modal UI
    createStateDetailsModal(stateName, stateProperties) {
        // Remove existing modal if any
        const existing = document.getElementById('state-details-modal');
        if (existing) {
            existing.remove();
        }

        // Create modal HTML
        const modal = document.createElement('div');
        modal.id = 'state-details-modal';
        modal.innerHTML = `
            <div class="state-modal-overlay">
                <div class="state-modal-content">
                    <div class="state-header">
                        <h2>${stateName}</h2>
                        <button class="close-state-modal" aria-label="Close">&times;</button>
                    </div>
                    <div class="state-body">
                        <div class="cities-section">
                            <h3>Cities in ${stateName}</h3>
                            <div class="city-search-container">
                                <input type="text" id="state-city-search" placeholder="Search cities..." />
                            </div>
                            <div id="cities-list-container">
                                <div class="loading-cities">Loading cities...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .state-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(5px);
            }

            .state-modal-content {
                background: linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(15, 20, 25, 0.95));
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                width: 90vw;
                max-width: 800px;
                max-height: 85vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            }

            .state-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 25px 15px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .state-header h2 {
                color: white;
                font-size: 24px;
                margin: 0;
                font-weight: 600;
            }

            .close-state-modal {
                background: none;
                border: none;
                color: #ccc;
                font-size: 28px;
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 0.2s ease;
            }

            .close-state-modal:hover {
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }

            .state-body {
                padding: 20px 25px;
                flex: 1;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }

            .cities-section h3 {
                color: white;
                font-size: 18px;
                margin: 0 0 15px 0;
                font-weight: 500;
            }

            .city-search-container {
                margin-bottom: 15px;
            }

            #state-city-search {
                width: 100%;
                padding: 10px 15px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                color: white;
                font-size: 14px;
                box-sizing: border-box;
            }

            #state-city-search::placeholder {
                color: rgba(255, 255, 255, 0.5);
            }

            #state-city-search:focus {
                outline: none;
                border-color: rgba(64, 150, 255, 0.6);
                background: rgba(255, 255, 255, 0.15);
            }

            #cities-list-container {
                flex: 1;
                overflow-y: auto;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                background: rgba(0, 0, 0, 0.2);
            }

            .loading-cities {
                text-align: center;
                padding: 40px 20px;
                color: #ccc;
                font-style: italic;
            }

            .cities-list {
                padding: 10px;
            }

            .city-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 15px;
                margin-bottom: 8px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .city-item:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(64, 150, 255, 0.4);
                transform: translateY(-1px);
            }

            .city-info {
                flex: 1;
            }

            .city-name {
                color: white;
                font-weight: 500;
                font-size: 15px;
                margin-bottom: 3px;
            }

            .city-meta {
                color: #ccc;
                font-size: 12px;
                opacity: 0.8;
            }

            .city-action {
                background: rgba(64, 150, 255, 0.8);
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
            }

            .city-action:hover {
                background: rgba(64, 150, 255, 1);
                transform: scale(1.05);
            }

            .cities-empty {
                text-align: center;
                padding: 40px 20px;
                color: #999;
            }

            .cities-error {
                text-align: center;
                padding: 40px 20px;
                color: #f44336;
            }

            .cities-error button {
                margin-top: 10px;
                background: rgba(244, 67, 54, 0.8);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
            }

            .cities-error button:hover {
                background: rgba(244, 67, 54, 1);
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(modal);

        // Setup modal event listeners
        const closeBtn = modal.querySelector('.close-state-modal');
        const overlay = modal.querySelector('.state-modal-overlay');
        const searchInput = modal.querySelector('#state-city-search');

        closeBtn.addEventListener('click', () => this.closeStateModal());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeStateModal();
        });

        // Setup search with debouncing
        let searchTimeout;
        let currentCities = [];
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filterCities(currentCities, e.target.value, stateName);
            }, 200);
        });

        // Store search callback for later use
        this.currentSearchCallback = (cities) => {
            currentCities = cities;
        };

        // ESC key handler
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                this.closeStateModal();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }

    // Close state modal
    closeStateModal() {
        const modal = document.getElementById('state-details-modal');
        if (modal) {
            modal.remove();
        }
    }

    // Get cities for a specific state (cached)
    async getCitiesForState(stateName) {
        // Check cache first
        if (!this.statesCityCache) {
            this.statesCityCache = new Map();
        }

        if (this.statesCityCache.has(stateName)) {
            return this.statesCityCache.get(stateName);
        }

        try {
            const cities = await this.fetchCitiesByState(stateName);
            this.statesCityCache.set(stateName, cities);
            return cities;
        } catch (error) {
            console.error(`❌ Error fetching cities for ${stateName}:`, error);
            return [];
        }
    }

    // Fetch cities by state from worldcities.csv data
    async fetchCitiesByState(stateName) {
        try {
            // Get the global cities data from the main app
            const globeExplorer = window.globeExplorer;
            if (!globeExplorer || !globeExplorer.allCities) {
                console.warn('⚠️ Cities data not available, loading from CSV...');
                await this.loadCitiesData();
            }

            const allCities = globeExplorer?.allCities || this.citiesData || [];
            
            // Filter cities for this US state
            const stateCities = allCities.filter(city => {
                return city.country === 'United States' && 
                       city.iso2 === 'US' && 
                       city.admin_name === stateName;
            });

            // Transform to our expected format
            const transformedCities = stateCities.map(city => ({
                name: city.city || city.city_ascii || city.name,
                cityId: city.id,
                lat: parseFloat(city.lat),
                lng: parseFloat(city.lng),
                population: city.population ? parseInt(city.population) : null,
                admin_name: city.admin_name
            })).filter(city => city.name && !isNaN(city.lat) && !isNaN(city.lng));

            // Sort by population desc, then alphabetically
            transformedCities.sort((a, b) => {
                if (a.population && b.population) {
                    return b.population - a.population;
                }
                if (a.population && !b.population) return -1;
                if (!a.population && b.population) return 1;
                return a.name.localeCompare(b.name);
            });

            console.log(`✅ Found ${transformedCities.length} cities for ${stateName}`);
            return transformedCities;

        } catch (error) {
            console.error('❌ Error in fetchCitiesByState:', error);
            return [];
        }
    }

    // Load cities data if not available
    async loadCitiesData() {
        try {
            console.log('🔄 Loading cities data from CSV...');
            const response = await fetch('./data/worldcities.csv');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const csvText = await response.text();
            this.citiesData = this.parseCSV(csvText);
            console.log(`✅ Loaded ${this.citiesData.length} cities from CSV`);
            
        } catch (error) {
            console.error('❌ Error loading cities data:', error);
            this.citiesData = [];
        }
    }

    // Simple CSV parser
    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
        const cities = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = this.parseCSVLine(line);
            if (values.length >= headers.length) {
                const city = {};
                headers.forEach((header, index) => {
                    city[header] = values[index] || '';
                });
                cities.push(city);
            }
        }

        return cities;
    }

    // Parse a single CSV line (handles quotes)
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"' && (i === 0 || line[i-1] === ',')) {
                inQuotes = true;
            } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
                inQuotes = false;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    // Render cities list in the modal
    renderCitiesList(cities, stateName) {
        const container = document.getElementById('cities-list-container');
        if (!container) return;

        // Store cities for search filtering
        if (this.currentSearchCallback) {
            this.currentSearchCallback(cities);
        }

        if (cities.length === 0) {
            container.innerHTML = `<div class="cities-empty">No cities found for ${stateName}.</div>`;
            return;
        }

        const citiesHTML = cities.map(city => `
            <div class="city-item" data-city-name="${city.name}" data-city-lat="${city.lat}" data-city-lng="${city.lng}">
                <div class="city-info">
                    <div class="city-name">${this.escapeHtml(city.name)}</div>
                    <div class="city-meta">
                        ${city.population ? `Pop: ${this.formatPopulation(city.population)} • ` : ''}
                        ${city.lat.toFixed(4)}, ${city.lng.toFixed(4)}
                    </div>
                </div>
                <button class="city-action" data-city="${city.name}" data-state="${stateName}">
                    Open Air Quality
                </button>
            </div>
        `).join('');

        container.innerHTML = `<div class="cities-list">${citiesHTML}</div>`;

        // Add click handlers
        container.addEventListener('click', (e) => {
            const cityItem = e.target.closest('.city-item');
            const actionBtn = e.target.closest('.city-action');
            
            if (actionBtn || cityItem) {
                const cityName = (actionBtn || cityItem).getAttribute('data-city') || 
                                cityItem?.getAttribute('data-city-name');
                const stateName = actionBtn?.getAttribute('data-state') || 
                                 cityItem?.getAttribute('data-state') || this.getCurrentStateName();
                
                if (cityName) {
                    this.openAirQualityTable(cityName, stateName);
                }
            }
        });

        // Enable keyboard navigation
        container.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const focused = document.activeElement;
                if (focused && focused.closest('.city-item')) {
                    e.preventDefault();
                    focused.click();
                }
            }
        });

        // Make city items focusable
        container.querySelectorAll('.city-item').forEach(item => {
            item.setAttribute('tabindex', '0');
            item.setAttribute('role', 'button');
        });
    }

    // Filter cities based on search query
    filterCities(cities, query, stateName) {
        if (!query.trim()) {
            this.renderCitiesList(cities, stateName);
            return;
        }

        const filtered = cities.filter(city => 
            city.name.toLowerCase().includes(query.toLowerCase())
        );

        this.renderCitiesList(filtered, stateName);
    }

    // Open air quality table for a city
    openAirQualityTable(cityName, stateName) {
        console.log(`🌬️ Opening air quality table for: ${cityName}, ${stateName}`);
        
        // Close the state modal first
        this.closeStateModal();
        
        // Open city-detail.html in a new window/tab with city parameters
        const params = new URLSearchParams({
            city: cityName,
            state: stateName,
            country: 'United States'
        });
        
        const url = `city-detail.html?${params.toString()}`;
        window.open(url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    }

    // Utility: Get current state name from modal
    getCurrentStateName() {
        const modal = document.getElementById('state-details-modal');
        const header = modal?.querySelector('.state-header h2');
        return header?.textContent || '';
    }

    // Utility: Show error state
    showStateError(stateName, message) {
        const container = document.getElementById('cities-list-container');
        if (container) {
            container.innerHTML = `
                <div class="cities-error">
                    <div>${message}</div>
                    <button onclick="this.openStateDetails('${stateName}', {})">Retry</button>
                </div>
            `;
        }
    }

    // Utility: Format population number
    formatPopulation(pop) {
        if (pop >= 1000000) {
            return `${(pop / 1000000).toFixed(1)}M`;
        } else if (pop >= 1000) {
            return `${(pop / 1000).toFixed(0)}K`;
        }
        return pop.toString();
    }

    // Utility: Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Check if enabled
    isSystemEnabled() {
        return this.isEnabled;
    }

    // Calculate polygon center (simple average of coordinates)
    calculatePolygonCenter(coordinates, stateName) {
        if (!coordinates || coordinates.length === 0) {
            return { lat: 39.8283, lng: -98.5795 }; // USA center fallback
        }

        // Alaska için özel merkez koordinatları (Alaska'nın geometrisi karmaşık olabilir)
        if (stateName && stateName.toLowerCase().includes('alaska')) {
            return { lat: 64.0685, lng: -152.2782 }; // Alaska merkezi
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
            return { lat: 39.8283, lng: -98.5795 }; // USA center fallback
        }

        return {
            lat: totalLat / validPoints,
            lng: totalLng / validPoints
        };
    }

    // Alaska'yı gerçek GeoJSON verisiyle ekle
    async addMissingStates() {
        console.log('🔧 Adding missing Alaska with real geometry...');
        
        try {
            // Alaska için özel US states veri kaynağı dene
            const alaskaResponse = await fetch('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json');
            
            if (alaskaResponse.ok) {
                const statesData = await alaskaResponse.json();
                
                // Alaska feature'ını bul
                const alaskaFeature = statesData.features.find(f => 
                    f.properties.NAME?.toLowerCase().includes('alaska') ||
                    f.properties.name?.toLowerCase().includes('alaska') ||
                    f.properties.state?.toLowerCase().includes('alaska')
                );
                
                if (alaskaFeature) {
                    // Alaska'yı adapt et
                    const processedAlaska = {
                        type: "Feature",
                        properties: {
                            NAME: "Alaska",
                            STATE_CODE: "AK", 
                            AQI: this.generateStateAQI("Alaska"),
                            centerLat: 64.0685,
                            centerLng: -152.2782,
                            COLOR: this.getColorFromAQI(15 + Math.random() * 15),
                            STROKE_COLOR: this.getStrokeColorFromAQI(15 + Math.random() * 15),
                            objectType: 'usa-state'
                        },
                        geometry: alaskaFeature.geometry
                    };
                    
                    this.statePolygons.push(processedAlaska);
                    console.log('✅ Added Alaska with real geometry from US states data');
                    return;
                }
            }
        } catch (error) {
            console.warn('⚠️ Could not load Alaska real geometry:', error);
        }
        
        // Fallback: Basit Alaska sınırları
        const alaskaFallback = {
            type: "Feature",
            properties: {
                NAME: "Alaska",
                STATE_CODE: "AK",
                AQI: this.generateStateAQI("Alaska"),
                centerLat: 64.0685,
                centerLng: -152.2782,
                COLOR: this.getColorFromAQI(15 + Math.random() * 15),
                STROKE_COLOR: this.getStrokeColorFromAQI(15 + Math.random() * 15),
                objectType: 'usa-state'
            },
            geometry: {
                type: "Polygon",
                coordinates: [[
                    [-179.0, 71.0], [-130.0, 71.0], [-130.0, 54.0], 
                    [-179.0, 54.0], [-179.0, 71.0]
                ]]
            }
        };
        
        this.statePolygons.push(alaskaFallback);
        console.log('✅ Added Alaska with fallback geometry');
    }

    // Get current data
    getCurrentData() {
        return {
            isEnabled: this.isEnabled,
            isDataLoaded: this.isDataLoaded,
            statesCount: this.statePolygons.length,
            originalData: this.originalData
        };
    }
}

// Create global instance
window.USAStatesBoundaries = USAStatesBoundaries;

console.log('🇺🇸 USA States Boundaries System loaded');