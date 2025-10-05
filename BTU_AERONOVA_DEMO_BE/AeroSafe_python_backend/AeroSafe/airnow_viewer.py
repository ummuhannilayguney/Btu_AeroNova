#!/usr/bin/env python3
"""
AirNow Real-Time Air Quality Data Viewer (Enhanced Version)
=========================================================

A robust Tkinter-based GUI application that fetches real-time air quality data
from the AirNow API for multiple U.S. cities with enhanced networking reliability.

Enhanced Features:
- Multi-city selection via listbox
- Real-time AQI data from AirNow API with HTTPS
- Robust networking with retry strategies and rate limiting
- Threading for non-blocking UI during API calls
- Comprehensive error handling and user feedback
- Formatted output with AQI values, categories, and colors
- Scrollable results display with progress indicators

Technical Improvements:
- HTTPS API requests with 30-second timeout
- Session-based requests with retry strategy (5 retries, exponential backoff)
- Rate limiting between requests (0.3-0.6 second delays)
- Background threading to prevent UI freezing
- Enhanced error messages for better user experience

Author: Enhanced for AeroSafe Project
Date: September 21, 2025
"""

import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox, filedialog
import json
import threading
import time
import random
import os
import csv
import math
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Union

# Try to import requests, provide helpful error if not available
try:
    import requests
    from requests.adapters import HTTPAdapter
    # Try different import paths for urllib3 Retry
    try:
        from urllib3.util.retry import Retry
    except ImportError:
        try:
            pass  # Removed invalid fallback import for Retry
        except ImportError:
            # Fallback: create a simple retry mechanism
            Retry = None
except ImportError:
    print("ERROR: The 'requests' library is required but not installed.")
    print("Please install it using: pip install requests")
    exit(1)


class AirNowViewer:
    """Enhanced main application class for the AirNow Air Quality Data Viewer."""
    
    def __init__(self):
        """Initialize the enhanced AirNow Viewer application."""
        # API Configuration - Enhanced with HTTPS and better settings
        self.api_key = "F61C7D0A-FFD3-41DB-9FEF-895F39E29ECC"
        self.base_url = "https://www.airnowapi.org/aq/observation/latLong/current/"  # Changed to HTTPS
        
        # Enhanced Network Configuration
        self.session = None
        self.setup_session()
        
        # Rate limiting configuration
        self.min_delay = 0.3  # Minimum delay between requests (seconds)
        self.max_delay = 0.6  # Maximum delay between requests (seconds)
        
        # Threading control
        self.is_fetching = False
        self.fetch_thread = None
        
        # U.S. Cities with their coordinates (latitude, longitude) - Expanded to 54+ entries
        self.cities = {
            # Original 16 cities (preserved for backward compatibility)
            "New York, NY": (40.7128, -74.0060),
            "Los Angeles, CA": (34.0522, -118.2437),
            "Chicago, IL": (41.8781, -87.6298),
            "Houston, TX": (29.7604, -95.3698),
            "Phoenix, AZ": (33.4484, -112.0740),
            "Denver, CO": (39.7392, -104.9903),
            "Seattle, WA": (47.6062, -122.3321),
            "Washington, DC": (38.9072, -77.0369),
            "Miami, FL": (25.7617, -80.1918),
            "Atlanta, GA": (33.7490, -84.3880),
            "Boston, MA": (42.3601, -71.0589),
            "San Francisco, CA": (37.7749, -122.4194),
            "Philadelphia, PA": (39.9526, -75.1652),
            "Detroit, MI": (42.3314, -83.0458),
            "Dallas, TX": (32.7767, -96.7970),
            "Las Vegas, NV": (36.1699, -115.1398),
            
            # Additional 40+ cities to reach 54+ total
            "San Diego, CA": (32.7157, -117.1611),
            "San Jose, CA": (37.3382, -121.8863),
            "Austin, TX": (30.2672, -97.7431),
            "Jacksonville, FL": (30.3322, -81.6557),
            "Fort Worth, TX": (32.7555, -97.3308),
            "Columbus, OH": (39.9612, -82.9988),
            "Charlotte, NC": (35.2271, -80.8431),
            "Indianapolis, IN": (39.7684, -86.1581),
            "San Antonio, TX": (29.4241, -98.4936),
            "Portland, OR": (45.5152, -122.6784),
            "Nashville, TN": (36.1627, -86.7816),
            "Baltimore, MD": (39.2904, -76.6122),
            "Memphis, TN": (35.1495, -90.0490),
            "Oklahoma City, OK": (35.4676, -97.5164),
            "Louisville, KY": (38.2527, -85.7585),
            "Milwaukee, WI": (43.0389, -87.9065),
            "Albuquerque, NM": (35.0844, -106.6504),
            "Tucson, AZ": (32.2226, -110.9747),
            "Fresno, CA": (36.7378, -119.7871),
            "Sacramento, CA": (38.5816, -121.4944),
            "Kansas City, MO": (39.0997, -94.5786),
            "Mesa, AZ": (33.4152, -111.8315),
            "Virginia Beach, VA": (36.8529, -75.9780),
            "Omaha, NE": (41.2565, -95.9345),
            "Colorado Springs, CO": (38.8339, -104.8214),
            "Raleigh, NC": (35.7796, -78.6382),
            "Long Beach, CA": (33.7701, -118.1937),
            "Miami Beach, FL": (25.7907, -80.1300),
            "Cleveland, OH": (41.4993, -81.6944),
            "New Orleans, LA": (29.9511, -90.0715),
            "Minneapolis, MN": (44.9778, -93.2650),
            "St. Paul, MN": (44.9537, -93.0900),
            "St. Louis, MO": (38.6270, -90.1994),
            "Pittsburgh, PA": (40.4406, -79.9959),
            "Cincinnati, OH": (39.1031, -84.5120),
            "Orlando, FL": (28.5383, -81.3792),
            "Tampa, FL": (27.9506, -82.4572),
            "Honolulu, HI": (21.3069, -157.8583),
            "Anchorage, AK": (61.2181, -149.9003),
            "Boise, ID": (43.6150, -116.2023),
            "Salt Lake City, UT": (40.7608, -111.8910),
            "Richmond, VA": (37.5407, -77.4360),
            "Buffalo, NY": (42.8864, -78.8784),
            "Rochester, NY": (43.1566, -77.6088),
            "Providence, RI": (41.8240, -71.4128),
            "Hartford, CT": (41.7658, -72.6734),
            "New Haven, CT": (41.3083, -72.9279),
            "Albany, NY": (42.6526, -73.7562),
            "Birmingham, AL": (33.5186, -86.8104),
            "Charleston, SC": (32.7765, -79.9311),
            "Madison, WI": (43.0731, -89.4012),
            "Spokane, WA": (47.6587, -117.4260),
            "Norfolk, VA": (36.8468, -76.2852),
            "Shreveport, LA": (32.5252, -93.7502),
            "Bakersfield, CA": (35.3733, -119.0187),
            "Little Rock, AR": (34.7465, -92.2896),
            "Des Moines, IA": (41.5868, -93.6250)
        }
        
        # Initialize the main window
        self.root = tk.Tk()
        self.root.title("AirNow Air Quality Data Viewer v2.3 (Scaled Edition)")
        self.root.geometry("900x700")
        self.root.minsize(700, 500)
        
        # Create menu bar
        self.create_menu()
        
        # Setup GUI components
        self.setup_gui()
        
        # Populate the city listbox
        self.populate_cities()
    
    def setup_session(self):
        """
        Setup enhanced requests session with retry strategy and proper headers.
        This improves reliability and handles temporary network issues gracefully.
        """
        self.session = requests.Session()
        
        # Set a polite User-Agent header
        self.session.headers.update({
            'User-Agent': 'AirNow-Viewer/1.0 (AeroSafe-Project; Educational-Use)',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate'
        })
        
        # Setup retry strategy if Retry class is available
        if Retry is not None:
            try:
                # Configure retry strategy with modern parameters (urllib3 >= 1.26.0):
                # - 5 total retries
                # - Exponential backoff starting at 1 second
                # - Retry on connection errors, timeouts, and HTTP 5xx/429 errors
                # Note: 'allowed_methods' replaced 'method_whitelist' in newer versions
                retry_strategy = Retry(
                    total=5,
                    status_forcelist=[429, 500, 502, 503, 504],
                    allowed_methods=["HEAD", "GET", "OPTIONS"],  # Updated parameter name
                    backoff_factor=1,  # Exponential backoff: 1s, 2s, 4s, 8s, 16s
                    raise_on_status=False
                )
            except TypeError:
                # Fallback for older urllib3 versions (< 1.26.0) that use method_whitelist
                try:
                    retry_strategy = Retry(
                        total=5,
                        status_forcelist=[429, 500, 502, 503, 504],
                        method_whitelist=["HEAD", "GET", "OPTIONS"],  # Legacy parameter name
                        backoff_factor=1,
                        raise_on_status=False
                    )
                except TypeError:
                    # If both fail, use minimal retry strategy without method restrictions
                    retry_strategy = Retry(
                        total=3,
                        status_forcelist=[500, 502, 503, 504],
                        backoff_factor=1
                    )
            
            # Mount the adapter with retry strategy
            adapter = HTTPAdapter(max_retries=retry_strategy)
            self.session.mount("http://", adapter)
            self.session.mount("https://", adapter)
        else:
            # Fallback: basic adapter without advanced retry
            adapter = HTTPAdapter(max_retries=3)
            self.session.mount("http://", adapter)
            self.session.mount("https://", adapter)
    
    def create_menu(self):
        """Create the enhanced application menu bar."""
        menubar = tk.Menu(self.root)
        self.root.config(menu=menubar)
        
        # File menu
        file_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="File", menu=file_menu)
        file_menu.add_command(label="Clear Results", command=self.clear_results)
        file_menu.add_separator()
        file_menu.add_command(label="Load Cities…", command=self.load_cities_from_file)
        file_menu.add_command(label="Save Cities…", command=self.save_cities_to_file)
        file_menu.add_separator()
        file_menu.add_command(label="Stop Fetch Operation", command=self.stop_fetch_operation)
        file_menu.add_separator()
        file_menu.add_command(label="Exit", command=self.root.quit)
        
        # Tools menu
        tools_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Tools", menu=tools_menu)
        tools_menu.add_command(label="Discover Cities (AirNow)…", command=self.open_discovery_dialog)
        tools_menu.add_separator()
        tools_menu.add_command(label="Select All (Filtered)", command=self.select_all_cities)
        tools_menu.add_command(label="Deselect All", command=self.deselect_all_cities)
        
        # Help menu
        help_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Help", menu=help_menu)
        help_menu.add_command(label="About Enhanced Viewer", command=self.show_about)
        
    def setup_gui(self):
        """Set up the main GUI components."""
        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Configure grid weights for responsive design
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(1, weight=1)
        
        # Title label with enhanced styling
        title_label = ttk.Label(main_frame, text="🌍 AirNow Real-Time Air Quality Data (Enhanced)", 
                               font=("Arial", 16, "bold"))
        title_label.grid(row=0, column=0, columnspan=2, pady=(0, 20))
        
        # Left panel for city selection
        city_frame = ttk.LabelFrame(main_frame, text="Select Cities", padding="10")
        city_frame.grid(row=1, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), padx=(0, 10))
        
        # Right panel for results
        results_frame = ttk.LabelFrame(main_frame, text="Air Quality Data", padding="10")
        results_frame.grid(row=1, column=1, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Configure frame weights
        city_frame.columnconfigure(0, weight=1)
        city_frame.rowconfigure(1, weight=1)  # Updated: search is row 0, listbox is row 1
        results_frame.columnconfigure(0, weight=1)
        results_frame.rowconfigure(2, weight=1)  # Updated for weather panel (results_text is now row 2)
        
        # Add search box above the listbox
        self._attach_city_search(city_frame)
        
        # City listbox with scrollbar
        self.city_listbox = tk.Listbox(city_frame, selectmode=tk.MULTIPLE, height=15)
        scrollbar = ttk.Scrollbar(city_frame, orient=tk.VERTICAL, command=self.city_listbox.yview)
        self.city_listbox.configure(yscrollcommand=scrollbar.set)
        
        self.city_listbox.grid(row=1, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        scrollbar.grid(row=1, column=1, sticky=(tk.N, tk.S))
        
        # Fetch button
        fetch_button = ttk.Button(city_frame, text="Fetch Air Quality Data", 
                                 command=self.fetch_data)
        fetch_button.grid(row=2, column=0, columnspan=2, pady=(10, 0), sticky=(tk.W, tk.E))
        
        # Select/Deselect All buttons
        button_frame = ttk.Frame(city_frame)
        button_frame.grid(row=3, column=0, columnspan=2, pady=(5, 0), sticky=(tk.W, tk.E))
        button_frame.columnconfigure(0, weight=1)
        button_frame.columnconfigure(1, weight=1)
        
        select_all_button = ttk.Button(button_frame, text="Select All", 
                                      command=self.select_all_cities)
        select_all_button.grid(row=0, column=0, padx=(0, 5), sticky=(tk.W, tk.E))
        
        deselect_all_button = ttk.Button(button_frame, text="Deselect All", 
                                        command=self.deselect_all_cities)
        deselect_all_button.grid(row=0, column=1, padx=(5, 0), sticky=(tk.W, tk.E))
        
        # AQI Overview Panel
        self.aqi_overview_frame = ttk.Frame(results_frame)
        self.aqi_overview_frame.grid(row=0, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        self.aqi_overview_frame.columnconfigure(0, weight=1)
        
        self.aqi_title = ttk.Label(self.aqi_overview_frame, text="AQI Overview", 
                                  font=("Arial", 12, "bold"))
        self.aqi_title.grid(row=0, column=0, sticky=tk.W)
        
        self.aqi_value_label = ttk.Label(self.aqi_overview_frame, text="—", 
                                        font=("Arial", 11))
        self.aqi_value_label.grid(row=1, column=0, sticky=tk.W, pady=(2, 6))
        
        # Canvas-based AQI bar for reliable cross-platform colors
        self.aqi_canvas = tk.Canvas(self.aqi_overview_frame, width=480, height=24, 
                                   highlightthickness=1, highlightbackground="#ccc")
        self.aqi_canvas.grid(row=2, column=0, sticky=tk.W)
        
        # Sub-label for metadata
        self.aqi_meta_label = ttk.Label(self.aqi_overview_frame, text="", 
                                       font=("Arial", 9))
        self.aqi_meta_label.grid(row=3, column=0, sticky=tk.W, pady=(6, 0))
        
        # Initialize with empty overview
        self._clear_aqi_overview()
        
        # Weather Panel (below AQI Overview)
        self._setup_weather_panel(results_frame)
        
        # Results text area (moved down to row 2)
        self.results_text = scrolledtext.ScrolledText(results_frame, wrap=tk.WORD, 
                                                     font=("Consolas", 10))
        self.results_text.grid(row=2, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Clear results button (moved down to row 3)
        clear_button = ttk.Button(results_frame, text="Clear Results", 
                                 command=self.clear_results)
        clear_button.grid(row=3, column=0, pady=(10, 0), sticky=(tk.W, tk.E))
        
        # Enhanced status bar
        self.status_var = tk.StringVar()
        self.status_var.set("🚀 Ready - Enhanced networking enabled. Select cities and click 'Fetch Air Quality Data'")
        status_bar = ttk.Label(main_frame, textvariable=self.status_var, 
                              relief=tk.SUNKEN, anchor=tk.W)
        status_bar.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(10, 0))
    
    def populate_cities(self):
        """Populate the city listbox with available cities (respects search filter if active)."""
        if hasattr(self, 'city_search_var') and self.city_search_var.get():
            # If search is active, use the filter
            self._filter_city_list()
        else:
            # Otherwise, show all cities
            self.city_listbox.delete(0, tk.END)
            for city in sorted(self.cities.keys()):
                self.city_listbox.insert(tk.END, city)
    
    def select_all_cities(self):
        """Select all cities in the listbox."""
        self.city_listbox.selection_set(0, tk.END)
    
    def deselect_all_cities(self):
        """Deselect all cities in the listbox."""
        self.city_listbox.selection_clear(0, tk.END)
    
    def clear_results(self):
        """Clear the results text area and reset status."""
        self.results_text.delete(1.0, tk.END)
        self._clear_aqi_overview()
        self._clear_weather_panel()
        self.status_var.set("📄 Results cleared - Ready for new enhanced search")
    
    def _merge_city_entry(self, name, lat, lon):
        """
        Merge a single city entry into self.cities with validation.
        
        Args:
            name: City name (should be string)
            lat: Latitude (will be converted to float)
            lon: Longitude (will be converted to float)
        """
        try:
            if not name or not isinstance(name, str):
                return
            lat = float(lat)
            lon = float(lon)
            if not (math.isfinite(lat) and math.isfinite(lon)):
                return
            self.cities[name.strip()] = (lat, lon)
        except Exception:
            pass
    
    def _reload_city_listbox(self):
        """Reload the city listbox with current cities from self.cities."""
        self.city_listbox.delete(0, tk.END)
        for city in sorted(self.cities.keys()):
            self.city_listbox.insert(tk.END, city)
    
    def load_cities_from_file(self):
        """
        Load cities from JSON or CSV file and merge into self.cities.
        
        JSON format: [{"name": "City, ST", "lat": 12.34, "lon": -56.78}, ...]
        CSV format: name,lat,lon (with header)
        """
        path = filedialog.askopenfilename(
            title="Load Cities (JSON/CSV)",
            filetypes=[("JSON files", "*.json"), ("CSV files", "*.csv"), ("All files", "*.*")]
        )
        if not path:
            return
        
        try:
            initial_count = len(self.cities)
            
            if path.lower().endswith(".json"):
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                for row in data:
                    self._merge_city_entry(row.get("name"), row.get("lat"), row.get("lon"))
            else:
                with open(path, "r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        self._merge_city_entry(row.get("name"), row.get("lat"), row.get("lon"))
            
            # Reload the listbox and update search filter if it exists
            if hasattr(self, 'city_search_var'):
                self._filter_city_list()
            else:
                self._reload_city_listbox()
            
            added_count = len(self.cities) - initial_count
            self.status_var.set(f"📥 Loaded cities from {path} (added: {added_count}, total: {len(self.cities)})")
            
        except json.JSONDecodeError:
            self.status_var.set(f"⚠️ Failed to load cities: Invalid JSON format")
        except Exception as e:
            self.status_var.set(f"⚠️ Failed to load cities: {str(e)[:50]}")
    
    def save_cities_to_file(self):
        """
        Save current cities catalog to JSON or CSV file.
        
        JSON format: [{"name": "City, ST", "lat": 12.34, "lon": -56.78}, ...]
        CSV format: name,lat,lon (with header)
        """
        path = filedialog.asksaveasfilename(
            title="Save Cities",
            defaultextension=".json",
            filetypes=[("JSON files", "*.json"), ("CSV files", "*.csv"), ("All files", "*.*")]
        )
        if not path:
            return
        
        try:
            if path.lower().endswith(".json"):
                # Export as JSON array
                data = [{"name": name, "lat": lat, "lon": lon} 
                       for name, (lat, lon) in self.cities.items()]
                with open(path, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
            else:
                # Export as CSV
                with open(path, "w", encoding="utf-8", newline="") as f:
                    writer = csv.writer(f)
                    writer.writerow(["name", "lat", "lon"])
                    for name, (lat, lon) in self.cities.items():
                        writer.writerow([name, lat, lon])
            
            self.status_var.set(f"💾 Saved {len(self.cities)} cities to {path}")
            
        except Exception as e:
            self.status_var.set(f"⚠️ Save failed: {str(e)[:80]}")
    
    def open_discovery_dialog(self):
        """
        Open the AirNow Discovery dialog for automated city discovery.
        """
        # Create dialog window
        dialog = tk.Toplevel(self.root)
        dialog.title("Discover Cities (AirNow)")
        dialog.geometry("400x500")
        dialog.resizable(False, False)
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Center the dialog
        dialog.update_idletasks()
        x = (dialog.winfo_screenwidth() // 2) - (dialog.winfo_width() // 2)
        y = (dialog.winfo_screenheight() // 2) - (dialog.winfo_height() // 2)
        dialog.geometry(f"+{x}+{y}")
        
        # Main frame
        main_frame = ttk.Frame(dialog, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Title
        ttk.Label(main_frame, text="AirNow City Discovery", 
                 font=("Arial", 12, "bold")).pack(pady=(0, 10))
        
        # Configuration frame
        config_frame = ttk.LabelFrame(main_frame, text="Discovery Parameters", padding="10")
        config_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Bounding box (US defaults)
        bbox_frame = ttk.Frame(config_frame)
        bbox_frame.pack(fill=tk.X, pady=(0, 5))
        ttk.Label(bbox_frame, text="Bounding Box (US):").pack(anchor=tk.W)
        
        coords_frame = ttk.Frame(bbox_frame)
        coords_frame.pack(fill=tk.X, pady=(2, 0))
        
        ttk.Label(coords_frame, text="Lon Min:").grid(row=0, column=0, sticky=tk.W)
        lon_min_var = tk.StringVar(value="-125.0")
        ttk.Entry(coords_frame, textvariable=lon_min_var, width=8).grid(row=0, column=1, padx=(5, 10))
        
        ttk.Label(coords_frame, text="Lon Max:").grid(row=0, column=2, sticky=tk.W)
        lon_max_var = tk.StringVar(value="-66.0")
        ttk.Entry(coords_frame, textvariable=lon_max_var, width=8).grid(row=0, column=3, padx=(5, 0))
        
        ttk.Label(coords_frame, text="Lat Min:").grid(row=1, column=0, sticky=tk.W, pady=(5, 0))
        lat_min_var = tk.StringVar(value="24.0")
        ttk.Entry(coords_frame, textvariable=lat_min_var, width=8).grid(row=1, column=1, padx=(5, 10), pady=(5, 0))
        
        ttk.Label(coords_frame, text="Lat Max:").grid(row=1, column=2, sticky=tk.W, pady=(5, 0))
        lat_max_var = tk.StringVar(value="49.0")
        ttk.Entry(coords_frame, textvariable=lat_max_var, width=8).grid(row=1, column=3, padx=(5, 0), pady=(5, 0))
        
        # Step and distance
        params_frame = ttk.Frame(config_frame)
        params_frame.pack(fill=tk.X, pady=(10, 0))
        
        ttk.Label(params_frame, text="Step (degrees):").grid(row=0, column=0, sticky=tk.W)
        step_var = tk.StringVar(value="1.0")
        ttk.Entry(params_frame, textvariable=step_var, width=8).grid(row=0, column=1, padx=(5, 20))
        
        ttk.Label(params_frame, text="Distance (miles):").grid(row=0, column=2, sticky=tk.W)
        distance_var = tk.StringVar(value="25")
        ttk.Entry(params_frame, textvariable=distance_var, width=8).grid(row=0, column=3, padx=(5, 0))
        
        # Limits
        limits_frame = ttk.Frame(config_frame)
        limits_frame.pack(fill=tk.X, pady=(10, 0))
        
        ttk.Label(limits_frame, text="Max Requests:").grid(row=0, column=0, sticky=tk.W)
        max_requests_var = tk.StringVar(value="1500")
        ttk.Entry(limits_frame, textvariable=max_requests_var, width=8).grid(row=0, column=1, padx=(5, 20))
        
        ttk.Label(limits_frame, text="Batch Size:").grid(row=0, column=2, sticky=tk.W)
        batch_size_var = tk.StringVar(value="50")
        ttk.Entry(limits_frame, textvariable=batch_size_var, width=8).grid(row=0, column=3, padx=(5, 0))
        
        # Resume checkbox
        resume_var = tk.BooleanVar()
        ttk.Checkbutton(config_frame, text="Resume from checkpoint", 
                       variable=resume_var).pack(anchor=tk.W, pady=(10, 0))
        
        # Progress frame
        progress_frame = ttk.LabelFrame(main_frame, text="Progress", padding="10")
        progress_frame.pack(fill=tk.X, pady=(0, 10))
        
        progress_var = tk.StringVar(value="Ready to start discovery...")
        progress_label = ttk.Label(progress_frame, textvariable=progress_var, wraplength=350)
        progress_label.pack(anchor=tk.W)
        
        # Progress bar
        progress_bar = ttk.Progressbar(progress_frame, mode='indeterminate')
        progress_bar.pack(fill=tk.X, pady=(5, 0))
        
        # Results frame
        results_frame = ttk.LabelFrame(main_frame, text="Discovered Cities", padding="10")
        results_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        
        # Listbox for discovered cities
        results_listbox = tk.Listbox(results_frame, height=8)
        results_scrollbar = ttk.Scrollbar(results_frame, orient=tk.VERTICAL, command=results_listbox.yview)
        results_listbox.configure(yscrollcommand=results_scrollbar.set)
        results_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        results_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Buttons frame
        buttons_frame = ttk.Frame(main_frame)
        buttons_frame.pack(fill=tk.X)
        
        # Control variables for the worker
        self.is_discovering = False
        self.discovery_worker = None
        
        def start_discovery():
            if self.is_discovering:
                return
                
            try:
                # Validate and collect configuration
                config = {
                    'lon_min': float(lon_min_var.get()),
                    'lon_max': float(lon_max_var.get()),
                    'lat_min': float(lat_min_var.get()),
                    'lat_max': float(lat_max_var.get()),
                    'step': float(step_var.get()),
                    'distance': int(distance_var.get()),
                    'max_requests': int(max_requests_var.get()),
                    'batch_size': int(batch_size_var.get()),
                    'resume': resume_var.get()
                }
                
                # Validate ranges
                if config['lon_min'] >= config['lon_max'] or config['lat_min'] >= config['lat_max']:
                    messagebox.showerror("Invalid Range", "Min values must be less than max values")
                    return
                
                if config['step'] <= 0:
                    messagebox.showerror("Invalid Step", "Step must be positive")
                    return
                
                # Estimate total requests
                lat_steps = int((config['lat_max'] - config['lat_min']) / config['step']) + 1
                lon_steps = int((config['lon_max'] - config['lon_min']) / config['step']) + 1
                estimated_requests = lat_steps * lon_steps
                
                if estimated_requests > config['max_requests']:
                    result = messagebox.askyesno(
                        "Large Discovery", 
                        f"Estimated {estimated_requests} requests (limit: {config['max_requests']}).\n"
                        f"This will be capped at {config['max_requests']} requests.\n"
                        f"Continue?"
                    )
                    if not result:
                        return
                
                # Start discovery
                self.is_discovering = True
                start_button.config(state='disabled')
                stop_button.config(state='normal')
                progress_bar.start()
                
                # Start worker thread
                self.discovery_worker = threading.Thread(
                    target=self._discovery_worker,
                    args=(config, progress_var, results_listbox),
                    daemon=True
                )
                self.discovery_worker.start()
                
            except ValueError:
                messagebox.showerror("Invalid Input", "Please check all numeric values")
        
        def stop_discovery():
            if self.is_discovering:
                self.is_discovering = False
                progress_var.set("Stopping discovery...")
        
        def export_discovered():
            if results_listbox.size() == 0:
                messagebox.showinfo("No Data", "No cities discovered yet")
                return
            
            # Get discovered cities from listbox
            discovered_cities = []
            for i in range(results_listbox.size()):
                city_info = results_listbox.get(i)
                # Parse city info (assuming format: "City, ST (lat, lon)")
                if " (" in city_info and city_info.endswith(")"):
                    name = city_info.split(" (")[0]
                    coords_str = city_info.split(" (")[1][:-1]
                    try:
                        lat_str, lon_str = coords_str.split(", ")
                        lat, lon = float(lat_str), float(lon_str)
                        discovered_cities.append({"name": name, "lat": lat, "lon": lon})
                    except:
                        continue
            
            if discovered_cities:
                # Save to file
                path = filedialog.asksaveasfilename(
                    title="Export Discovered Cities",
                    defaultextension=".json",
                    filetypes=[("JSON files", "*.json"), ("CSV files", "*.csv")]
                )
                if path:
                    try:
                        if path.lower().endswith(".json"):
                            with open(path, "w", encoding="utf-8") as f:
                                json.dump(discovered_cities, f, ensure_ascii=False, indent=2)
                        else:
                            with open(path, "w", encoding="utf-8", newline="") as f:
                                writer = csv.writer(f)
                                writer.writerow(["name", "lat", "lon"])
                                for city in discovered_cities:
                                    writer.writerow([city["name"], city["lat"], city["lon"]])
                        messagebox.showinfo("Export Complete", f"Exported {len(discovered_cities)} cities to {path}")
                    except Exception as e:
                        messagebox.showerror("Export Failed", f"Error: {str(e)}")
        
        def merge_discovered():
            if results_listbox.size() == 0:
                messagebox.showinfo("No Data", "No cities discovered yet")
                return
            
            initial_count = len(self.cities)
            added_count = 0
            
            for i in range(results_listbox.size()):
                city_info = results_listbox.get(i)
                if " (" in city_info and city_info.endswith(")"):
                    name = city_info.split(" (")[0]
                    coords_str = city_info.split(" (")[1][:-1]
                    try:
                        lat_str, lon_str = coords_str.split(", ")
                        lat, lon = float(lat_str), float(lon_str)
                        if name not in self.cities:
                            added_count += 1
                        self._merge_city_entry(name, lat, lon)
                    except:
                        continue
            
            # Refresh listbox
            if hasattr(self, 'city_search_var'):
                self._filter_city_list()
            else:
                self._reload_city_listbox()
            
            final_count = len(self.cities)
            messagebox.showinfo("Merge Complete", 
                              f"Merged discovered cities\nAdded: {added_count}\nTotal cities: {final_count}")
            self.status_var.set(f"📍 Merged {added_count} discovered cities (total: {final_count})")
        
        start_button = ttk.Button(buttons_frame, text="Start Discovery", command=start_discovery)
        start_button.pack(side=tk.LEFT, padx=(0, 5))
        
        stop_button = ttk.Button(buttons_frame, text="Stop", command=stop_discovery, state='disabled')
        stop_button.pack(side=tk.LEFT, padx=(0, 10))
        
        export_button = ttk.Button(buttons_frame, text="Export", command=export_discovered)
        export_button.pack(side=tk.LEFT, padx=(0, 5))
        
        merge_button = ttk.Button(buttons_frame, text="Merge", command=merge_discovered)
        merge_button.pack(side=tk.LEFT, padx=(0, 10))
        
        close_button = ttk.Button(buttons_frame, text="Close", command=dialog.destroy)
        close_button.pack(side=tk.RIGHT)
        
        # Store references for cleanup
        def on_dialog_close():
            if self.is_discovering:
                self.is_discovering = False
            dialog.destroy()
        
        dialog.protocol("WM_DELETE_WINDOW", on_dialog_close)
    
    def _discovery_worker(self, config, progress_var, results_listbox):
        """
        Worker thread for AirNow city discovery via grid tiling.
        """
        discovered_areas = {}  # ReportingArea -> info
        total_requests = 0
        checkpoint_file = "discovery_checkpoint.json"
        
        try:
            # Load checkpoint if resuming
            start_lat, start_lon = config['lat_min'], config['lon_min']
            if config['resume'] and os.path.exists(checkpoint_file):
                try:
                    with open(checkpoint_file, 'r') as f:
                        checkpoint = json.load(f)
                        start_lat = checkpoint.get('current_lat', config['lat_min'])
                        start_lon = checkpoint.get('current_lon', config['lon_min'])
                        discovered_areas = checkpoint.get('discovered_areas', {})
                        total_requests = checkpoint.get('total_requests', 0)
                    
                    def update_resume_status():
                        progress_var.set(f"Resuming from ({start_lat:.2f}, {start_lon:.2f}) - "
                                       f"{len(discovered_areas)} areas found, {total_requests} requests")
                    
                    self.root.after(0, update_resume_status)
                    time.sleep(1)
                except Exception as e:
                    print(f"Checkpoint load error: {e}")
            
            # Grid iteration
            current_lat = start_lat
            batch_requests = []
            batch_count = 0
            
            while current_lat <= config['lat_max'] and self.is_discovering:
                current_lon = start_lon if current_lat == start_lat else config['lon_min']
                
                while current_lon <= config['lon_max'] and self.is_discovering:
                    if total_requests >= config['max_requests']:
                        break
                    
                    # Add to batch
                    batch_requests.append((current_lat, current_lon))
                    current_lon += config['step']
                    
                    # Process batch when full
                    if len(batch_requests) >= config['batch_size']:
                        self._process_discovery_batch(
                            batch_requests, config, discovered_areas, 
                            progress_var, results_listbox, total_requests
                        )
                        total_requests += len(batch_requests)
                        batch_requests = []
                        batch_count += 1
                        
                        # Save checkpoint
                        checkpoint_data = {
                            'current_lat': current_lat,
                            'current_lon': current_lon,
                            'discovered_areas': discovered_areas,
                            'total_requests': total_requests,
                            'timestamp': time.time()
                        }
                        try:
                            with open(checkpoint_file, 'w') as f:
                                json.dump(checkpoint_data, f, indent=2)
                        except Exception as e:
                            print(f"Checkpoint save error: {e}")
                        
                        # Rate limiting between batches
                        if self.is_discovering:
                            time.sleep(2)
                
                if total_requests >= config['max_requests']:
                    break
                
                current_lat += config['step']
            
            # Process remaining batch
            if batch_requests and self.is_discovering:
                self._process_discovery_batch(
                    batch_requests, config, discovered_areas, 
                    progress_var, results_listbox, total_requests
                )
                total_requests += len(batch_requests)
            
            # Final update
            if self.is_discovering:
                def final_update():
                    progress_var.set(f"✅ Discovery complete! Found {len(discovered_areas)} unique areas "
                                   f"({total_requests} requests)")
                self.root.after(0, final_update)
            else:
                def stopped_update():
                    progress_var.set(f"⏹️ Discovery stopped. Found {len(discovered_areas)} areas "
                                   f"({total_requests} requests)")
                self.root.after(0, stopped_update)
            
            # Clean up checkpoint on successful completion
            if self.is_discovering and os.path.exists(checkpoint_file):
                try:
                    os.remove(checkpoint_file)
                except:
                    pass
        
        except Exception as e:
            def error_update():
                progress_var.set(f"❌ Discovery error: {str(e)[:60]}")
            self.root.after(0, error_update)
        
        finally:
            self.is_discovering = False
            
            def cleanup_ui():
                # Re-enable start button, stop progress bar
                try:
                    from tkinter import ttk
                    for widget in self.root.winfo_children():
                        if isinstance(widget, tk.Toplevel):
                            for frame in widget.winfo_children():
                                for button_frame in frame.winfo_children():
                                    if hasattr(button_frame, 'winfo_children'):
                                        for button in button_frame.winfo_children():
                                            if isinstance(button, ttk.Button):
                                                if "Start" in button.cget('text'):
                                                    button.config(state='normal')
                                                elif "Stop" in button.cget('text'):
                                                    button.config(state='disabled')
                                            elif isinstance(button, ttk.Progressbar):
                                                button.stop()
                except:
                    pass
            
            self.root.after(0, cleanup_ui)
    
    def _process_discovery_batch(self, batch_requests, config, discovered_areas, 
                               progress_var, results_listbox, current_total):
        """
        Process a batch of discovery requests to the AirNow API.
        """
        for i, (lat, lon) in enumerate(batch_requests):
            if not self.is_discovering:
                break
            
            try:
                # Update progress
                def update_progress():
                    progress_var.set(f"Scanning ({lat:.2f}, {lon:.2f}) - "
                                   f"{len(discovered_areas)} areas found, "
                                   f"{current_total + i + 1} requests")
                self.root.after(0, update_progress)
                
                # Make API request
                data = self.fetch_air_quality_data(lat, lon, distance=config['distance'])
                
                if data and len(data) > 0:
                    for item in data:
                        reporting_area = item.get('ReportingArea', '')
                        state_code = item.get('StateCode', '')
                        
                        if reporting_area and state_code:
                            area_key = f"{reporting_area}, {state_code}"
                            
                            if area_key not in discovered_areas:
                                # New area discovered
                                area_lat = item.get('Latitude', lat)
                                area_lon = item.get('Longitude', lon)
                                
                                discovered_areas[area_key] = {
                                    'name': area_key,
                                    'lat': area_lat,
                                    'lon': area_lon,
                                    'discovered_at': (lat, lon)
                                }
                                
                                # Add to results listbox
                                def add_to_results():
                                    results_listbox.insert(tk.END, 
                                        f"{area_key} ({area_lat:.4f}, {area_lon:.4f})")
                                    results_listbox.see(tk.END)
                                
                                self.root.after(0, add_to_results)
                
                # Rate limiting within batch
                time.sleep(0.2)
                
            except Exception as e:
                # Continue on individual request errors
                print(f"Discovery request error at ({lat}, {lon}): {e}")
                continue
    
    def _merge_city_entry(self, name, lat, lon):
        """
        Helper method to merge a discovered city into the main city list.
        """
        # Store coordinates as tuple
        self.cities[name] = (lat, lon)
        
        # If we have a search interface, trigger a refresh
        if hasattr(self, 'city_search_var'):
            self.root.after_idle(self._filter_city_list)
    
    
    
    def _attach_city_search(self, parent):
        """
        Add search Entry widget above the listbox for filtering cities.
        
        Args:
            parent: Parent frame to attach the search widget to
        """
        search_row = ttk.Frame(parent)
        search_row.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 5))
        ttk.Label(search_row, text="Search:").grid(row=0, column=0, sticky=tk.W)
        self.city_search_var = tk.StringVar()
        entry = ttk.Entry(search_row, textvariable=self.city_search_var, width=24)
        entry.grid(row=0, column=1, sticky=(tk.W, tk.E))
        search_row.columnconfigure(1, weight=1)
        entry.bind("<KeyRelease>", lambda e: self._filter_city_list())
    
    def _filter_city_list(self):
        """Filter the city listbox based on search query (case-insensitive)."""
        query = (self.city_search_var.get() or "").lower()
        self.city_listbox.delete(0, tk.END)
        for city in sorted(self.cities.keys()):
            if query in city.lower():
                self.city_listbox.insert(tk.END, city)
    
    
    
    def _clear_aqi_overview(self):
        """Clear the AQI overview panel."""
        self.aqi_title.config(text="AQI Overview")
        self.aqi_value_label.config(text="—")
        self.aqi_meta_label.config(text="")
        self.aqi_canvas.delete('all')
        # Draw empty background
        W, H = 480, 24
        self.aqi_canvas.create_rectangle(0, 0, W, H, fill="#EEEEEE", outline="#CCCCCC")
    
    def _setup_weather_panel(self, parent):
        """Setup the weather panel UI components."""
        self.weather_frame = ttk.Frame(parent)
        self.weather_frame.grid(row=1, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        self.weather_frame.columnconfigure(0, weight=1)
        
        self.weather_title = ttk.Label(self.weather_frame, text="Weather", 
                                      font=("Arial", 12, "bold"))
        self.weather_title.grid(row=0, column=0, sticky=tk.W)
        
        self.weather_temp_label = ttk.Label(self.weather_frame, text="Temperature: —", 
                                           font=("Arial", 11))
        self.weather_temp_label.grid(row=1, column=0, sticky=tk.W, pady=(2, 0))
        
        self.weather_hum_label = ttk.Label(self.weather_frame, text="Humidity: —", 
                                          font=("Arial", 11))
        self.weather_hum_label.grid(row=2, column=0, sticky=tk.W)
        
        self.weather_time_label = ttk.Label(self.weather_frame, text="", 
                                           font=("Arial", 9))
        self.weather_time_label.grid(row=3, column=0, sticky=tk.W, pady=(4, 0))
        
        # Initially hidden until first data arrives
        self.weather_frame.grid_remove()
    
    def _update_aqi_overview(self, city: str, obs: dict):
        """
        Update the AQI overview panel with data from the dominant observation.
        
        Args:
            city (str): City name
            obs (dict): Observation data with AQI, ParameterName, etc.
        """
        # Guard: if obs is None or invalid -> clear overview and return
        if not obs:
            self._clear_aqi_overview()
            return
        
        try:
            aqi = int(obs.get('AQI', 0))
        except (ValueError, TypeError):
            self._clear_aqi_overview()
            return
        
        category, _ = self.get_aqi_category_info(aqi)
        color = self.get_aqi_color(aqi)
        
        # 1) Update text labels
        self.aqi_title.config(text=f"AQI Overview — {city}")
        self.aqi_value_label.config(text=f"AQI: {aqi} — {category}")
        
        # Build metadata string
        meta_parts = []
        reporting_area = obs.get('ReportingArea', '')
        state_code = obs.get('StateCode', '')
        if reporting_area:
            location = reporting_area
            if state_code:
                location += f", {state_code}"
            meta_parts.append(location)
        
        date_obs = obs.get('DateObserved', '')
        hour_obs = obs.get('HourObserved', '')
        if date_obs and hour_obs:
            meta_parts.append(f"{date_obs} {hour_obs}:00")
        
        param = obs.get('ParameterName', '')
        if param:
            # Format parameter name with special characters
            if param == 'PM2.5':
                param = 'PM₂.₅'
            elif param == 'O3':
                param = 'O₃'
            meta_parts.append(f"Parameter: {param}")
        
        meta_text = " • ".join(meta_parts)
        self.aqi_meta_label.config(text=meta_text)
        
        # 2) Draw the AQI bar
        self.aqi_canvas.delete('all')
        W, H = 480, 24
        
        # Calculate fill percentage (0 to 500 scale, clamped)
        aqi_clamped = max(0, min(aqi, 500))
        pct = aqi_clamped / 500.0
        fill_w = int(W * pct)
        
        # Background track
        self.aqi_canvas.create_rectangle(0, 0, W, H, fill="#EEEEEE", outline="#CCCCCC")
        
        # Filled portion
        if fill_w > 0:
            self.aqi_canvas.create_rectangle(0, 0, fill_w, H, fill=color, outline="")
        
        # Optional: tick marks at major AQI breakpoints
        for tick_aqi in [50, 100, 150, 200, 300, 500]:
            xpos = int(W * (tick_aqi / 500.0))
            if xpos < W:
                self.aqi_canvas.create_line(xpos, 0, xpos, H, fill="#DDDDDD", width=1)
    
    def _update_weather_panel(self, city: str, w: Optional[Dict]):
        """
        Update or clear the Weather panel on the main thread.
        
        Args:
            city (str): City name
            w (Optional[Dict]): Weather data with temp_c, humidity, ts or None
        """
        if not w or 'temp_c' not in w or 'humidity' not in w:
            self._clear_weather_panel()
            return
        
        try:
            self.weather_title.config(text=f"Weather — {city}")
            self.weather_temp_label.config(text=f"Temperature: {w['temp_c']:.1f} °C")
            self.weather_hum_label.config(text=f"Humidity: {int(w['humidity'])} %")
            
            # Format timestamp
            ts = w.get('ts')
            if ts and isinstance(ts, datetime):
                ts_str = ts.strftime("%Y-%m-%d %H:%M")
                self.weather_time_label.config(text=f"Updated: {ts_str}")
            else:
                self.weather_time_label.config(text="")
            
            # Reveal panel if hidden
            self.weather_frame.grid()
            
        except (ValueError, TypeError, KeyError):
            # Handle any formatting errors by clearing the panel
            self._clear_weather_panel()
    
    def _clear_weather_panel(self):
        """Clear the weather panel and hide it."""
        self.weather_title.config(text="Weather")
        self.weather_temp_label.config(text="Temperature: —")
        self.weather_hum_label.config(text="Humidity: —")
        self.weather_time_label.config(text="")
        # Hide the frame to reduce visual noise when no data
        self.weather_frame.grid_remove()
    
    def stop_fetch_operation(self):
        """Attempt to stop an ongoing fetch operation (best effort)."""
        if self.is_fetching:
            self.is_fetching = False
            self.status_var.set("🛑 Fetch operation stopped by user")
            messagebox.showinfo("Operation Stopped", "Fetch operation has been requested to stop.")
        else:
            messagebox.showinfo("No Operation", "No fetch operation is currently in progress.")
    
    def show_about(self):
        """Show the enhanced about dialog."""
        about_text = """🌍 AirNow Air Quality Data Viewer v2.2 (Enhanced with Weather)

A robust, real-time air quality and weather monitoring application that fetches data 
from the EPA AirNow API and OpenWeather API with enhanced networking capabilities.

✨ Enhanced Features:
• Real-time AQI data for 16 major U.S. cities
• Current weather data (temperature & humidity) from OpenWeather
• Multi-city selection and comparison
• Visual AQI Overview Panel with color-coded progress bar
• Compact Weather Panel with temperature and humidity display
• HTTPS API requests with 30-second timeout
• Advanced retry strategy (5 retries, exponential backoff)
• Rate limiting between requests (0.3-0.6s delays)
• Background threading for responsive UI
• Comprehensive error handling and user feedback
• Enhanced data formatting with icons and progress
• Session-based requests with proper headers

🎨 Visual Panels:
• AQI Overview: Horizontal progress bar (0-500 AQI scale)
• Color-coded by category: Green, Yellow, Orange, Red, Purple, Maroon
• Weather Display: Temperature (°C) and Humidity (%) with timestamps
• Canvas-based rendering for consistent cross-platform colors
• Automatically updates with each fetch operation
• Shows data for the last valid city when multiple cities selected

🔧 Technical Improvements:
• Switched from HTTP to HTTPS for security
• Implemented robust networking with retry strategies
• Added rate limiting to respect API guidelines
• Background threading prevents UI freezing
• Enhanced error messages with specific diagnostics
• User-Agent headers for polite API requests
• Dominant observation selection for multi-parameter data
• Dual API integration (AirNow + OpenWeather)

📊 Data Sources:
• Air Quality: EPA AirNow API (O₃, PM₂.₅, etc.)
• Weather: OpenWeather Current Weather API
• AQI categories and health recommendations
• Real-time observation data with timestamps

🔗 APIs Used:
• AirNow: https://www.airnow.gov/
• OpenWeather: https://openweathermap.org/
🛠️ Enhanced for: AeroSafe Project
📅 Version Date: September 22, 2025

For more information about air quality and health effects,
visit: https://www.airnow.gov/"""
        
        messagebox.showinfo("About Enhanced AirNow Viewer", about_text)
    
    def fetch_air_quality_data(self, lat: float, lon: float, distance: Optional[float] = None) -> Union[List[Dict], str]:
        """
        Enhanced fetch air quality data for a specific location from AirNow API.
        Now uses HTTPS, longer timeout, and proper session management.
        
        Args:
            lat (float): Latitude of the location
            lon (float): Longitude of the location
            distance (Optional[float]): Search distance in miles (default: 25)
            
        Returns:
            Union[List[Dict], str]: List of air quality observations or error string
        """
        try:
            # Construct API request parameters
            params = {
                'format': 'application/json',
                'latitude': lat,
                'longitude': lon,
                'distance': distance or 25,  # Search within specified miles (default 25)
                'API_KEY': self.api_key
            }
            
            # Make the API request with enhanced settings
            # - HTTPS endpoint for security
            # - 30-second timeout for reliability
            # - Session with retry strategy
            response = self.session.get(
                self.base_url, 
                params=params, 
                timeout=30  # Increased from 10 to 30 seconds
            )
            
            # Check for successful response
            response.raise_for_status()
            
            # Parse JSON response
            data = response.json()
            return data if data else []
            
        except requests.exceptions.Timeout:
            return "TIMEOUT_ERROR"
        except requests.exceptions.ConnectionError:
            return "CONNECTION_ERROR"
        except requests.exceptions.HTTPError as e:
            status_code = response.status_code if 'response' in locals() else 'Unknown'
            return f"HTTP_ERROR_{status_code}"
        except requests.exceptions.RequestException as e:
            return f"REQUEST_ERROR_{str(e)}"
        except json.JSONDecodeError:
            return "JSON_ERROR"
        except Exception as e:
            return f"UNKNOWN_ERROR_{str(e)}"
    
    def rate_limited_delay(self):
        """
        Implement rate limiting between API requests to avoid hitting limits.
        Uses random delay between 0.3-0.6 seconds for politeness.
        """
        delay = random.uniform(self.min_delay, self.max_delay)
        time.sleep(delay)
    
    def fetch_weather_current(self, lat: float, lon: float) -> Optional[Dict]:
        """
        Fetch current weather data from OpenWeather API.
        
        Args:
            lat (float): Latitude of the location
            lon (float): Longitude of the location
            
        Returns:
            Optional[Dict]: Weather data with temp_c, humidity, ts or None on failure
        """
        try:
            api_key = self._get_ow_api_key()
            if not api_key:
                return None
            
            # OpenWeather Current Weather API endpoint
            url = "https://api.openweathermap.org/data/2.5/weather"
            params = {
                'lat': lat,
                'lon': lon,
                'units': 'metric',  # Celsius
                'appid': api_key
            }
            
            # Make the API request with shorter timeout for weather (5s connect, 15s read)
            response = self.session.get(url, params=params, timeout=(5, 15))
            response.raise_for_status()
            
            # Parse JSON response
            data = response.json()
            
            # Extract temperature and humidity
            main_data = data.get('main', {})
            temp_c = main_data.get('temp')
            humidity = main_data.get('humidity')
            
            # Parse OpenWeather timestamp with timezone adjustment
            from datetime import datetime, timezone, timedelta
            
            ow_dt = data.get("dt")                 # seconds since epoch (UTC)
            ow_tz = data.get("timezone", 0)        # offset in seconds from UTC
            ts = None
            if isinstance(ow_dt, int):
                ts = datetime.fromtimestamp(ow_dt, tz=timezone.utc) + timedelta(seconds=int(ow_tz or 0))
            
            if temp_c is not None and humidity is not None:
                return {
                    'temp_c': float(temp_c),
                    'humidity': int(humidity),
                    'ts': ts  # may be None if dt missing; UI handles empty nicely
                }
            
            return None
            
        except requests.exceptions.HTTPError as e:
            # Handle specific HTTP errors with user feedback
            status_code = getattr(e.response, 'status_code', None)
            if status_code == 401:
                self.root.after(0, lambda: self.status_var.set("🌡️ OpenWeather API key invalid (401 error)"))
            elif status_code == 429:
                self.root.after(0, lambda: self.status_var.set("🌡️ OpenWeather rate limit reached (429) - waiting..."))
                time.sleep(1.0)  # Brief pause on rate limit
            elif status_code and status_code >= 500:
                self.root.after(0, lambda: self.status_var.set(f"🌡️ OpenWeather server error ({status_code})"))
            else:
                self.root.after(0, lambda: self.status_var.set(f"🌡️ OpenWeather HTTP error: {status_code}"))
            return None
        except requests.exceptions.ConnectionError:
            self.root.after(0, lambda: self.status_var.set("🌡️ OpenWeather connection failed - check internet"))
            return None
        except requests.exceptions.Timeout:
            self.root.after(0, lambda: self.status_var.set("🌡️ OpenWeather request timed out"))
            return None
        except (requests.exceptions.RequestException, json.JSONDecodeError):
            self.root.after(0, lambda: self.status_var.set("🌡️ OpenWeather network/parse error"))
            return None
        except (ValueError, TypeError, KeyError):
            self.root.after(0, lambda: self.status_var.set("🌡️ OpenWeather data format error"))
            return None
        except Exception as e:
            self.root.after(0, lambda: self.status_var.set(f"🌡️ OpenWeather unexpected error: {str(e)[:50]}"))
            return None
    
    def get_aqi_category_info(self, aqi: int) -> Tuple[str, str]:
        """
        Get AQI category and color based on AQI value.
        
        Args:
            aqi (int): AQI value
            
        Returns:
            Tuple[str, str]: (category, color)
        """
        if aqi <= 50:
            return "Good", "Green"
        elif aqi <= 100:
            return "Moderate", "Yellow"
        elif aqi <= 150:
            return "Unhealthy for Sensitive Groups", "Orange"
        elif aqi <= 200:
            return "Unhealthy", "Red"
        elif aqi <= 300:
            return "Very Unhealthy", "Purple"
        else:
            return "Hazardous", "Maroon"
    
    def get_aqi_color(self, aqi: int) -> str:
        """
        Get hex color for AQI value for visual display.
        
        Args:
            aqi (int): AQI value
            
        Returns:
            str: Hex color code
        """
        if aqi <= 50:
            return "#00A65A"      # Green
        elif aqi <= 100:
            return "#FFCC00"      # Yellow
        elif aqi <= 150:
            return "#FF7E00"      # Orange
        elif aqi <= 200:
            return "#FF0000"      # Red
        elif aqi <= 300:
            return "#8F3F97"      # Purple
        else:
            return "#7E0023"      # Maroon
    
    def _get_ow_api_key(self) -> str:
        """
        Get OpenWeather API key from environment or fallback to default.
        
        Returns:
            str: OpenWeather API key
        """
        return os.getenv("OW_API_KEY", "520059fd38a1833f1d89e6016736c1d4")
    
    def format_air_quality_data(self, city_name: str, data: Union[List[Dict], str]) -> str:
        """
        Enhanced format air quality data for display with better error handling.
        
        Args:
            city_name (str): Name of the city
            data: Air quality data from API or error message
            
        Returns:
            str: Formatted string for display
        """
        formatted_text = f"\n{'='*70}\n{city_name.upper()}\n{'='*70}\n"
        
        # Handle error cases with more descriptive messages
        if isinstance(data, str):
            if data == "TIMEOUT_ERROR":
                error_msg = "⏱️ Request timed out (30s limit exceeded). The AirNow API may be slow or unavailable."
            elif data == "CONNECTION_ERROR":
                error_msg = "🌐 Could not connect to AirNow API. Please check your internet connection."
            elif data.startswith("HTTP_ERROR_"):
                status_code = data.split("_")[-1]
                if status_code == "429":
                    error_msg = f"⚠️ Rate limit exceeded (HTTP {status_code}). Please wait before making more requests."
                elif status_code.startswith("5"):
                    error_msg = f"🔧 Server error (HTTP {status_code}). AirNow API is temporarily unavailable."
                else:
                    error_msg = f"❌ HTTP Error {status_code}. API request failed."
            elif data == "JSON_ERROR":
                error_msg = "📄 Error parsing response from AirNow API. Data format may be invalid."
            elif data.startswith("REQUEST_ERROR_"):
                error_msg = f"🔌 Network error: {data.replace('REQUEST_ERROR_', '')}"
            elif data.startswith("UNKNOWN_ERROR_"):
                error_msg = f"⚡ Unexpected error: {data.replace('UNKNOWN_ERROR_', '')}"
            else:
                error_msg = f"❓ Unknown error: {data}"
            
            return formatted_text + f"ERROR: {error_msg}\n\n"
        
        # Handle empty data
        if not data:
            return formatted_text + "📭 No air quality data available for this city.\n" + \
                   "Possible reasons:\n" + \
                   "• No monitoring stations within 25 miles\n" + \
                   "• Data temporarily unavailable\n" + \
                   "• Location coordinates may need adjustment\n\n"
        
        # Format valid data with enhanced presentation
        formatted_text += f"📊 Found {len(data)} air quality measurement(s):\n\n"
        
        for i, observation in enumerate(data, 1):
            try:
                # Extract data fields
                parameter = observation.get('ParameterName', 'Unknown')
                aqi = observation.get('AQI', 0)
                category, color = self.get_aqi_category_info(aqi)
                date_observed = observation.get('DateObserved', 'Unknown')
                hour_observed = observation.get('HourObserved', 'Unknown')
                location = observation.get('ReportingArea', 'Unknown')
                state = observation.get('StateCode', '')
                
                # Format parameter name with special characters
                if parameter == 'PM2.5':
                    parameter = 'PM₂.₅'
                elif parameter == 'O3':
                    parameter = 'O₃'
                
                # Enhanced formatting with icons and better structure
                formatted_text += f"📏 Measurement #{i}:\n"
                formatted_text += f"   Parameter: {parameter}\n"
                formatted_text += f"   AQI Value: {aqi}\n"
                formatted_text += f"   Category: {category}\n"
                formatted_text += f"   Color Code: {color}\n"
                formatted_text += f"   Date: {date_observed}\n"
                formatted_text += f"   Time: {hour_observed}:00\n"
                formatted_text += f"   Location: {location}"
                if state:
                    formatted_text += f", {state}"
                formatted_text += f"\n{'-'*50}\n"
                
            except (KeyError, TypeError, ValueError) as e:
                formatted_text += f"⚠️ Error parsing measurement #{i}: {e}\n"
        
        return formatted_text
    
    def fetch_data(self):
        """
        Enhanced main function to fetch and display air quality data for selected cities.
        Now uses background threading to prevent UI freezing and provides real-time progress updates.
        """
        # Prevent multiple concurrent fetch operations
        if self.is_fetching:
            messagebox.showwarning("Operation in Progress", 
                                 "Data fetching is already in progress. Please wait for it to complete.")
            return
        
        # Get selected cities
        selected_indices = self.city_listbox.curselection()
        if not selected_indices:
            messagebox.showwarning("No Selection", "Please select at least one city.")
            return
        
        selected_cities = [self.city_listbox.get(i) for i in selected_indices]
        
        # Start the fetch operation in a background thread
        self.is_fetching = True
        self.fetch_thread = threading.Thread(
            target=self._fetch_data_background,
            args=(selected_cities,),
            daemon=True
        )
        self.fetch_thread.start()
    
    def _fetch_data_background(self, selected_cities: List[str]):
        """
        Background thread function that performs the actual data fetching.
        This prevents the UI from freezing during network operations.
        
        Args:
            selected_cities (List[str]): List of city names to fetch data for
        """
        try:
            # Update UI from background thread (thread-safe)
            self.root.after(0, self._update_ui_start, selected_cities)
            
            # Clear previous results and AQI overview
            self.root.after(0, lambda: self.results_text.delete(1.0, tk.END))
            self.root.after(0, self._clear_aqi_overview)
            self.root.after(0, self._clear_weather_panel)
            
            # Add header with timestamp
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            header = f"🌍 Air Quality Data Fetched on: {current_time}\n"
            header += f"📍 Cities: {', '.join(selected_cities)}\n"
            header += f"🔄 Enhanced networking with HTTPS and retry strategy\n"
            header += f"{'='*90}\n\n"
            self.root.after(0, lambda: self.results_text.insert(tk.END, header))
            
            successful_fetches = 0
            total_cities = len(selected_cities)
            last_city_overview = None             # Track dominant observation for overview panel
            last_city_overview_coords = None      # Track coordinates for overview city
            last_city_weather = None              # Track weather data for weather panel
            
            # Batch processing configuration for rate-limit awareness
            batch_size = 15
            
            # Process cities in batches to avoid overwhelming APIs
            for batch_start in range(0, total_cities, batch_size):
                batch_end = min(batch_start + batch_size, total_cities)
                batch_cities = selected_cities[batch_start:batch_end]
                
                # Update batch progress status
                if total_cities > batch_size:
                    batch_msg = f"⏳ Processing batch {batch_start//batch_size + 1} (cities {batch_start+1}-{batch_end} of {total_cities})..."
                    self.root.after(0, lambda msg=batch_msg: self.status_var.set(msg))
                
                # Process each city in the current batch
                for i, city in enumerate(batch_cities, batch_start + 1):
                    if not self.is_fetching:  # Check if user requested stop
                        break
                        
                    if city in self.cities:
                        lat, lon = self.cities[city]
                        
                        # Update individual city progress status
                        progress_msg = f"🔍 Fetching data for {city} ({i}/{total_cities})..."
                        self.root.after(0, lambda msg=progress_msg: self.status_var.set(msg))
                        
                        # Fetch the AQI data with enhanced networking
                        data = self.fetch_air_quality_data(lat, lon)
                        
                        # Handle HTTP 429 (rate limit) by adjusting delays
                        if isinstance(data, str) and "429" in data:
                            # Increase delays for subsequent requests
                            self.min_delay = min(self.min_delay + 0.2, 1.0)
                            self.max_delay = min(self.max_delay + 0.2, 1.5)
                            self.root.after(0, lambda: self.status_var.set("⚠️ Rate limit detected - adjusting delays"))
                        
                        # Fetch weather data for the same location
                        weather_data = self.fetch_weather_current(lat, lon)
                        
                        # Format and display the AQI data
                        formatted_data = self.format_air_quality_data(city, data)
                        self.root.after(0, lambda text=formatted_data: self.results_text.insert(tk.END, text))
                        
                        # Count successful fetches and track dominant observation for overview
                        if data and not isinstance(data, str) and len(data) > 0:
                            successful_fetches += 1
                            
                            # Find dominant observation (highest AQI) for this city
                            dominant_obs = None
                            max_aqi = -1
                            
                            for obs in data:
                                try:
                                    aqi = int(obs.get('AQI', 0))
                                    if aqi > max_aqi:
                                        max_aqi = aqi
                                        dominant_obs = obs
                                except (ValueError, TypeError):
                                    continue
                            
                            if dominant_obs:
                                last_city_overview = (city, dominant_obs)
                                last_city_overview_coords = (lat, lon)
                        
                        # Track weather data for the weather panel (will be synced later)
                        if weather_data:
                            last_city_weather = (city, weather_data)
                        
                        # Rate limiting: delay between requests (except for last request)
                        if i < total_cities:
                            self.rate_limited_delay()
                
                # Inter-batch pause (only if more batches remain)
                if batch_end < total_cities and self.is_fetching:
                    self.root.after(0, lambda: self.status_var.set("💤 Pausing between batches (rate limit protection)..."))
                    time.sleep(random.uniform(1.5, 2.5))
                
                # Break if user requested stop
                if not self.is_fetching:
                    break
            
            # Update AQI overview with the last city that had valid data
            if last_city_overview:
                city_name, observation = last_city_overview
                # Add note if multiple cities were processed
                if total_cities > 1:
                    city_display = f"{city_name} (last of {total_cities})"
                else:
                    city_display = city_name
                self.root.after(0, self._update_aqi_overview, city_display, observation)
            
            # Ensure weather aligns with the AQI overview city
            if last_city_overview:
                ov_city, _ = last_city_overview
                need_refetch = True
                
                # Check if weather data is for the same city as AQI overview
                if last_city_weather:
                    w_city, _ = last_city_weather
                    need_refetch = (w_city != ov_city)
                
                # Refetch weather for the overview city if needed
                if need_refetch and last_city_overview_coords:
                    lat, lon = last_city_overview_coords
                    self.root.after(0, lambda: self.status_var.set(f"🌡️ Fetching weather for overview city: {ov_city}..."))
                    aligned_weather = self.fetch_weather_current(lat, lon)
                    if aligned_weather:
                        last_city_weather = (ov_city, aligned_weather)
                        self.root.after(0, lambda: self.status_var.set(f"✅ Weather data aligned with AQI overview for {ov_city}"))
                    else:
                        self.root.after(0, lambda: self.status_var.set(f"⚠️ No weather data available for {ov_city} (OpenWeather error)"))
            
            # Update weather panel with aligned data
            if last_city_weather:
                weather_city_name, weather_data = last_city_weather
                # Use consistent city display format
                if total_cities > 1:
                    weather_city_display = f"{weather_city_name} (synced with AQI)"
                else:
                    weather_city_display = weather_city_name
                self.root.after(0, self._update_weather_panel, weather_city_display, weather_data)
            else:
                # Clear weather panel if no data available
                self.root.after(0, self._clear_weather_panel)
            
            # Final status update
            self.root.after(0, self._update_ui_complete, successful_fetches, total_cities)
            
        except Exception as e:
            # Handle any unexpected errors in the background thread
            error_msg = f"❌ Unexpected error during data fetching: {str(e)}"
            self.root.after(0, lambda: self.status_var.set(error_msg))
            self.root.after(0, lambda: messagebox.showerror("Fetch Error", error_msg))
        
        finally:
            # Reset fetching state
            self.is_fetching = False
    
    def _update_ui_start(self, selected_cities: List[str]):
        """Update UI elements when fetch operation starts."""
        self.status_var.set(f"🚀 Starting enhanced data fetch for {len(selected_cities)} cities...")
        self.root.update()
    
    def _update_ui_complete(self, successful_fetches: int, total_cities: int):
        """Update UI elements when fetch operation completes."""
        if successful_fetches == total_cities:
            status_msg = f"✅ Successfully fetched data for all {successful_fetches} cities"
        elif successful_fetches > 0:
            status_msg = f"⚠️ Fetched data for {successful_fetches} out of {total_cities} cities"
        else:
            status_msg = f"❌ Failed to fetch data for any of the {total_cities} cities"
        
        self.status_var.set(status_msg)
        
        # Scroll to top of results for better user experience
        self.results_text.see(1.0)
        
    def run(self):
        """Start the enhanced application main loop with proper cleanup."""
        try:
            # Set up window close protocol
            self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
            self.root.mainloop()
        finally:
            # Cleanup: close session if it exists
            if self.session:
                self.session.close()
    
    def on_closing(self):
        """Handle application closing with cleanup."""
        # Stop any ongoing fetch operations
        if self.is_fetching:
            result = messagebox.askyesno("Fetch in Progress", 
                                       "A fetch operation is in progress. Close anyway?")
            if not result:
                return
        
        # Cleanup and close
        if self.session:
            self.session.close()
        self.root.destroy()


if __name__ == "__main__":
    # Create and run the enhanced application
    try:
        print("🌍 Starting AirNow Air Quality Data Viewer (Enhanced Version)...")
        print("✨ Features: HTTPS, 30s timeout, retry strategy, threading, rate limiting")
        app = AirNowViewer()
        app.run()
    except KeyboardInterrupt:
        print("\n🛑 Application interrupted by user.")
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")
        print("🔧 Please ensure you have an active internet connection and try again.")

"""
ENHANCED USAGE INSTRUCTIONS:
===========================

🚀 Quick Start:
1. Run the script: python airnow_viewer.py
2. Select one or more cities from the list on the left
3. Click "Fetch Air Quality Data" to retrieve current AQI information
4. View detailed results in the scrollable text area on the right

✨ ENHANCED FEATURES:
===================

🔒 Network Security & Reliability:
• HTTPS API requests for secure communication
• 30-second timeout (increased from 10s) for slow connections
• Advanced retry strategy: 5 retries with exponential backoff
• Handles HTTP 429 (rate limit) and 5xx (server error) responses
• Session-based requests with proper connection pooling
• Polite User-Agent headers for API compliance

⚡ Performance & User Experience:
• Background threading prevents UI freezing during API calls
• Rate limiting (0.3-0.6s delays) between requests to respect API limits
• Real-time progress updates showing current city being processed
• Enhanced error messages with specific diagnostics and emojis
• Ability to stop ongoing fetch operations
• Responsive UI that remains interactive during data fetching

📊 Data Display Enhancements:
• Multi-parameter support with numbered measurements
• Enhanced formatting with icons and visual separators
• Detailed error categorization and troubleshooting hints
• Progress indicators and operation status
• Improved AQI information presentation

🔧 TECHNICAL IMPROVEMENTS:
=========================

Network Stack:
• Switched from requests.get() to session-based requests
• Implemented urllib3 retry strategy with exponential backoff
• Added connection pooling for better performance
• Proper timeout handling (30s instead of 10s)
• Rate limiting to prevent API abuse

Threading Architecture:
• Main UI thread remains responsive during network operations
• Background fetch thread handles all API communications
• Thread-safe UI updates using root.after() method
• Proper thread cleanup and exception handling

Error Handling:
• Granular error categorization (timeout, connection, HTTP, JSON)
• User-friendly error messages with actionable advice
• Graceful degradation when some cities fail to fetch
• Recovery mechanisms for temporary network issues

🛠️ REQUIREMENTS:
===============

• Python 3.6+ (enhanced threading features)
• tkinter (usually included with Python)
• requests library (install with: pip install requests)
• Active internet connection for HTTPS API access

🔍 API INFORMATION:
==================

Enhanced API Configuration:
• Endpoint: https://www.airnowapi.org/aq/observation/latLong/current/
• Protocol: HTTPS (upgraded from HTTP for security)
• Timeout: 30 seconds (increased for reliability)
• Retry Strategy: 5 attempts with exponential backoff
• Rate Limiting: 0.3-0.6 second delays between requests
• Search Radius: 25 miles from city coordinates
• User-Agent: AirNow-Viewer/1.0 (polite identification)

🆘 ENHANCED TROUBLESHOOTING:
===========================

Network Issues:
• Timeout errors: Check internet speed, try fewer cities at once
• Connection errors: Verify internet connection and firewall settings
• HTTP 429 errors: Rate limited - wait before making more requests
• HTTP 5xx errors: AirNow API temporary issues - try again later

Data Issues:
• No data for a city: No monitoring stations within 25 miles
• Empty responses: Temporary data unavailability at monitoring stations
• JSON errors: API response format issues - report if persistent

Performance:
• UI freezing: This version uses threading to prevent freezing
• Slow responses: Enhanced timeout (30s) accommodates slow networks
• Multiple failures: Rate limiting prevents overwhelming the API

🎯 BEST PRACTICES:
=================

• Select 3-5 cities at once for optimal performance
• Allow 30+ seconds for large multi-city requests
• Wait between rapid successive requests to respect API limits
• Use "Stop Fetch Operation" if needed to cancel long operations
• Clear results periodically to maintain performance

📈 VERSION HISTORY:
==================

v2.2 (Weather Integration) - September 22, 2025:
• Added OpenWeather API integration for temperature and humidity
• Compact Weather Panel below AQI Overview with metric units
• Dual API fetching in background thread with proper error handling
• Environment variable support for OpenWeather API key (OW_API_KEY)
• Thread-safe weather data updates using root.after()
• Consistent city display policy for both AQI and weather panels

v2.1 (AQI Overview) - September 22, 2025:
• Added visual AQI Overview Panel with color-coded progress bar
• Canvas-based AQI bar for consistent cross-platform colors
• Dominant observation selection for multi-parameter data
• Real-time AQI display with category, location, and timestamp
• Enhanced UI layout with proper grid management
• Improved user experience with visual feedback

v2.0 (Enhanced) - September 21, 2025:
• HTTPS support with enhanced security
• Advanced retry strategy with exponential backoff
• Background threading for responsive UI
• Rate limiting and polite API usage
• Enhanced error handling and user feedback
• Improved data formatting and progress indicators

v1.0 - Initial Release:
• Basic HTTP API requests
• Simple error handling
• Synchronous operations
"""