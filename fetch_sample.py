# fetch_sample.py
import yfinance as yf
import pandas as pd
symbols = ["RELIANCE.NS","TCS.NS"]  # change or add others
for s in symbols:
    print("Downloading", s)
    df = yf.download(s, period="2y", interval="1d")
    if df.empty:
        print("No data for", s)
        continue
    df.reset_index(inplace=True)
    df = df[["Date","Open","High","Low","Close","Volume"]]
    fname = s.split(".")[0].upper() + ".csv"
    df.to_csv("data/" + fname, index=False)
    print("Saved", fname)
