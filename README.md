📊 StockDash — Stock Data Intelligence Platform

A complete end-to-end stock analysis dashboard built using FastAPI, Pandas, HTML/CSS/JS, and Chart.js.
Created as part of the Software Intern Assignment for Jarnox Software.

🚀 Features
✅ Backend (FastAPI + Pandas)

Loads and cleans CSV datasets

Computes:

7-day Moving Average

Daily Return

30-day Volatility

52-week High / Low

API Endpoints:

/companies — list companies

/data/{symbol} — 30-day stock dataset

/summary/{symbol} — summary metrics

/compare?symbol1=A&symbol2=B — compare stocks

Optimized JSON output

Ready for production deployment

🌐 Frontend (Production UI)

Sleek, stock-market inspired UI

Dark / Light theme toggle

Search with fuzzy matching (Fuse.js)

Date range filter (Flatpickr)

Interactive Chart.js graph

Zoom

Pan

Tooltips

Metrics dashboard

Last Close

7-day MA

Volatility

52-week High / Low

Daily Return

Compare two symbols side-by-side

CSV Export

Fully responsive

User-friendly design

🛠 Tech Stack
Backend

Python

FastAPI

Pandas

NumPy

Uvicorn

Frontend

HTML5

CSS3

JavaScript

Bootstrap 5

Chart.js (+ Zoom Plugin)

Flatpickr

Fuse.js

📂 Project Structure
stock-dashboard/
│── app.py
│── utils.py
│── requirements.txt
│── README.md
│── data/
│     ├── RELIANCE.csv
│     └── TCS.csv
│── frontend/
      ├── index.html
      ├── app.js
      ├── style.css
      └── logo.png (optional)

▶️ How to Run
1️⃣ Create virtual environment
python -m venv venv

2️⃣ Activate environment

Windows

venv\Scripts\activate

3️⃣ Install dependencies
pip install -r requirements.txt

4️⃣ Start FastAPI backend
uvicorn app:app --reload

5️⃣ Open Dashboard

Visit:

👉 http://127.0.0.1:8000/ui/

📡 API Endpoints
List Companies
GET /companies

Stock Data (last 30 days)
GET /data/{symbol}

Summary
GET /summary/{symbol}

Compare
GET /compare?symbol1=A&symbol2=B

API Docs (Swagger)

👉 http://127.0.0.1:8000/docs

📈 Technical Indicators
Metric	Purpose
7-day Moving Average	Trend smoothing
Daily Return (%)	Short-term price movement
Volatility (30d)	Market risk estimation
52-week High / Low	Range identification
30-day % Change	Relative performance
📦 CSV Export

Click Export CSV → downloads the filtered dataset.

🌙 Dark Mode

Stored in localStorage

Automatically applied on refresh

🧪 Possible Future Enhancements

Database integration

Live WebSocket market updates

User profiles

Deploy on AWS / Render

👨‍💻 Author

Ashutosh Pradhan
Software Intern Candidate