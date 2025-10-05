# Btu_AeroNova
AeroNova — AI-driven air quality monitoring and forecasting system combining real-time AirNow data, meteorological inputs, and ML-based AQI predictions with uncertainty quantification.
> **AeroNova** is an AI-driven platform for **real-time air quality monitoring** and **multi-horizon AQI forecasting**.  
> It integrates **AirNow API data**, **meteorological features**, and **machine learning models** to predict future air quality with **uncertainty quantification (P10–P90 intervals)**.

---

## 🚀 Features

### 🌐 Real-Time Monitoring
- Live air quality data from [AirNow API](https://www.airnow.gov/)
- Automatic detection of the **main pollutant (PM2.5, PM10, O₃, etc.)**
- City-aware updates synchronized with current weather

### 🔮 Intelligent Forecasting
- Multi-horizon predictions: **24h → 168h (1–7 days)**
- ML models with **quantile regression** for P10/P50/P90 intervals
- **Uncertainty calibration** using conformal prediction
- **Risk color-badging system** based on P90 thresholds

### 🤖 Advanced Modeling
- LightGBM / CatBoost with time-series aware cross-validation
- Anti-leakage feature engineering (rolling lags, cyclical encodings)
- Weather-driven exogenous variables (temperature, humidity, wind)
- Automated fallback strategies for missing data

### 🧠 Backtesting & Evaluation
- Rolling-origin backtests with coverage & probabilistic metrics
- Built-in **MAE, RMSE, MAPE, CRPS** performance analysis
- Coverage calibration for probabilistic intervals

### 🪟 Interactive GUI
- Tkinter-based dashboard for forecast visualization
- P10–P90 bands and risk indicators
- In-app training monitor and model diagnostics

---

## 🏗️ Architecture Overview

AirNow API ─┐
│
▼
Data Processing (build_features)
│
▼
ML Forecast Engine (train_multi_horizon)
│
▼
Quantile Models (P10 / P50 / P90)
│
▼
GUI Visualization (model.py GUI Mode)

yaml
Kodu kopyala

---

## ⚙️ Installation

### Prerequisites
- Python 3.9+
- API key from [AirNow.gov](https://docs.airnowapi.org/)

### Setup
```bash
git clone https://github.com/<your-username>/AeroNova.git
cd AeroNova
pip install -r requirements.txt
If you’re missing the requirements file, install manually:

bash
Kodu kopyala
pip install pandas numpy scikit-learn requests lightgbm catboost
🧩 Usage
1️⃣ Launch GUI Mode
bash
Kodu kopyala
python model.py --gui
2️⃣ Run Forecast via CLI
bash
Kodu kopyala
python model.py --real-time --city "Los Angeles, CA" --parameter PM25 --horizon 24
3️⃣ Execute Backtests
bash
Kodu kopyala
python model.py --backtest --city "Seattle, WA" --parameter PM25
📊 Output Example
Horizon	P10	P50	P90	Main Pollutant	Risk
24h	62	80	106	PM2.5	🟡 Medium
48h	58	76	120	PM2.5	🔴 High

Interpretation:

P50: Median forecast

P10–P90: 80% confidence interval

P90 ≥ 151: “Unhealthy” threshold → triggers high-risk badge

🧠 Key Functions (from model.py)
Function	Purpose
build_features()	Prepares temporal, cyclical, and weather-based features
train_multi_horizon()	Trains LightGBM/CatBoost quantile models for multiple horizons
forecast_multi_horizon()	Generates predictions + P10–P90 uncertainty intervals
rolling_backtest()	Performs time-series cross-validation and coverage analysis

🛡️ Risk Badge Logic
Risk Level	P90 Range	Interpretation
🟢 Low	≤ 100 AQI	Good to Moderate
🟡 Medium	101–150 AQI	Sensitive Groups at Risk
🔴 High	≥ 151 AQI	Unhealthy Conditions

🧬 Project Highlights
Built for NASA Space Apps Challenge 2025

Designed for scalable city-wide AQI forecasting

Implements probabilistic ML & production-grade validation

Combines AirNow data + meteorological context for precision

📁 Project Structure
graphql
Kodu kopyala
AeroNova/
│
├── model.py              # Core ML model, GUI, and forecasting logic
├── airnow_viewer.py      # AirNow API integration & data retrieval
├── test_fixes.py         # Automated validation and regression tests
├── LICENSE               # MIT License
└── README.md             # Documentation
📜 License
This project is licensed under the MIT License — see the LICENSE file for details.

🌟 Future Roadmap
 Integration with TEMPO satellite data

 Web-based dashboard with Leaflet and Mapbox

 LSTM/Transformer model extension for temporal prediction

 Global multi-city AQI forecast visualization

✨ Credits
Developed by Yusuf
Department of Artificial Intelligence Engineering, Bursa Technical University (BTÜ)

“Empowering environmental intelligence through data-driven innovation.”
— AeroNova Team



