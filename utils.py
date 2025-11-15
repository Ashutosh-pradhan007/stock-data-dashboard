# utils.py
from pathlib import Path
import pandas as pd

# Folder that contains your CSVs
DATA_DIR = Path("data")

def list_symbols():
    """
    Return a sorted list of available symbols based on CSV filenames.
    Example: data/RELIANCE.csv -> "RELIANCE"
    """
    return sorted([p.stem for p in DATA_DIR.glob("*.csv")])

def _base_df(symbol: str) -> pd.DataFrame:
    """
    Load raw CSV, parse dates, and convert numeric columns.
    This avoids 'unsupported operand type(s) for -: str and str' errors.
    """
    fn = DATA_DIR / f"{symbol.upper()}.csv"
    if not fn.exists():
        raise FileNotFoundError(f"{fn} not found")

    # Read CSV and parse Date column
    df = pd.read_csv(fn)
    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")

    expected = ["Open", "High", "Low", "Close", "Volume"]
    for c in expected:
        if c not in df.columns:
            raise ValueError(f"Missing column {c} in {fn}")

    # Convert to numeric so we can do math
    df[expected] = df[expected].apply(pd.to_numeric, errors="coerce")

    # Clean data
    df = df.dropna(subset=["Date", "Close"])
    df = df.sort_values("Date")
    df = df.ffill().bfill()

    # Date as index for easier rolling calculations
    df.set_index("Date", inplace=True)
    return df

def load_df(symbol: str) -> pd.DataFrame:
    """
    Load cleaned dataframe and add extra columns:
    daily_return, MA7, volatility30.
    """
    df = _base_df(symbol)
    df["daily_return"] = (df["Close"] - df["Open"]) / df["Open"]
    df["MA7"] = df["Close"].rolling(window=7, min_periods=1).mean()
    df["volatility30"] = df["daily_return"].rolling(window=30, min_periods=1).std()
    return df

def last_n_records(symbol: str, n: int = 30) -> pd.DataFrame:
    """
    Return the last n rows (default 30) with Date as a normal column.
    Used by /data/{symbol}.
    """
    df = load_df(symbol)
    return df.tail(n).reset_index()  # Date becomes a column again

def summary_stats(symbol: str) -> dict:
    """
    Return summary statistics for a symbol:
    52-week high, low, and average close price.
    """
    df = load_df(symbol)
    stats = {
        "52_week_high": float(df["High"].max()),
        "52_week_low": float(df["Low"].min()),
        "avg_close": float(df["Close"].mean()),
    }
    return stats


