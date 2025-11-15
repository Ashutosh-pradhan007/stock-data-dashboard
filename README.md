🧠 Stock Data Dashboard
FastAPI • Bootstrap • Chart.js • CSV Market Data
<img width="1893" height="967" alt="image" src="https://github.com/user-attachments/assets/40e9ebb7-d326-4fa6-b70d-808a5ea9ab6a" />


🚀 Overview

A production-ready Stock Market Analytics Dashboard built using:

FastAPI (Backend API)

Bootstrap 5 (Frontend UI)

Chart.js + Zoom Plugin (Interactive Charts)

CSV Data (Local historical stock prices)

Fuse.js (Fast fuzzy search)

Flatpickr (Date Range picker)

This dashboard allows users to:

✔ Search stocks
✔ Load 30-day market data
✔ View interactive line charts
✔ Compare two stocks side-by-side
✔ Export data as CSV
✔ Filter data by date
✔ Toggle Light/Dark UI themes
✔ View daily metrics (MA7, Volatility, High/Low, Daily Return)

📂 Project Structure
stock-data-dashboard/
│── app.py                # FastAPI backend
│── utils.py              # CSV loading & metrics
│── requirements.txt      # Python dependencies
│── data/                 # Local CSV files (TCS.csv, RELIANCE.csv)
│── frontend/
│     ├── index.html
│     ├── style.css
│     └── app.js
│── README.md
│── LICENSE
│── .gitignore

🔧 Installation & Setup
1. Clone the repository
git clone https://github.com/Ashutosh-pradhan007/stock-data-dashboard.git
cd stock-data-dashboard

2. Create virtual environment
python -m venv venv


Activate:

Windows

venv\Scripts\activate


Linux/Mac

source venv/bin/activate

3. Install dependencies
pip install -r requirements.txt

4. Run FastAPI
uvicorn app:app --reload


App will start at:
👉 http://127.0.0.1:8000

Frontend served at:
👉 http://127.0.0.1:8000/ui/

📊 Features
⭐ Stock Search (Fuse.js)

Instant fuzzy matching (TCS, INFY, RELIANCE, etc.)

⭐ Metrics Dashboard

Last Close

7-day Moving Average

30-day Volatility

52-week High/Low

Daily Return %

⭐ Interactive Chart

Zoom in/out

Pan horizontally

Smooth line chart

Hover tooltips

⭐ Compare Two Stocks

Percentage change (30 days)

Last closing price

⭐ Export Data

One-click CSV export of displayed data

⭐ Light / Dark Mode

Persistent theme saved in localStorage

⭐ Date-Range Filtering

Filter graph & metrics to custom date range

📦 API Endpoints (FastAPI)
Endpoint	Description
/companies	List all available symbols
/data/{symbol}	Get latest 30-day data
/summary/{symbol}	Summary metrics
/compare?symbol1=A&symbol2=B	Compare two stocks
📸 Screenshots
🔹 Dashboard (Dark Mode)

(Add your screenshot here)

🔹 Dashboard (Light Mode)

(Add your screenshot here)

📜 License

This project is open-source and available under the MIT License.

🙌 Author

Ashutosh Pradhan
GitHub: https://github.com/Ashutosh-pradhan007
