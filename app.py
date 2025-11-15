# app.py
from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from utils import list_symbols, last_n_records, summary_stats, load_df
# from fastapi import FastAPI, HTTPException, Query
# from fastapi.staticfiles import StaticFiles
# and your utils imports


app = FastAPI(title="Stock Data Intelligence API")

# Serve frontend at /ui/
app.mount("/ui", StaticFiles(directory="frontend", html=True), name="frontend")


@app.get("/companies")
def companies():
    """Return list of available symbols based on CSV files in data/."""
    return {"companies": list_symbols()}


@app.get("/data/{symbol}")
def data_last_30(symbol: str):
    """
    Return last 30 records for a symbol, including OHLCV and
    computed metrics like daily_return, MA7, volatility30.
    """
    try:
        recs = last_n_records(symbol, 30)  # returns a DataFrame
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Symbol not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    data_records = recs.to_dict(orient="records")
    stats = summary_stats(symbol)  # dict with summary stats

    return {
        "symbol": symbol.upper(),
        "data": data_records,
        "summary": stats,
    }


@app.get("/summary/{symbol}")
def summary(symbol: str):
    """Return summary statistics for a symbol (52-week high/low, avg, etc.)."""
    try:
        stats = summary_stats(symbol)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Symbol not found")
    return {"symbol": symbol.upper(), **stats}


@app.get("/compare")
def compare(symbol1: str = Query(...), symbol2: str = Query(...)):
    """
    Compare two symbols: last_close and 30-day % change for each.
    """
    try:
        df1 = load_df(symbol1)
        df2 = load_df(symbol2)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="One of the symbols not found")

    def s(df):
        last = float(df["Close"].iloc[-1])
        pct_30 = None
        if len(df) >= 30:
            pct_30 = float(
                (df["Close"].iloc[-1] - df["Close"].iloc[-30]) / df["Close"].iloc[-30]
            )
        return {"last_close": last, "pct_30": pct_30}

    return {symbol1.upper(): s(df1), symbol2.upper(): s(df2)}

