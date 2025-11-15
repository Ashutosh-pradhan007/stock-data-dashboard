/* app.js — production-focused frontend
 - Uses axios, fuse.js, flatpickr, Chart.js(+zoom)
 - Caching + TTL in localStorage for companies & symbol data
*/

const API_BASE = ''; // empty = same origin
const TTL_MS = 1000 * 60 * 10; // cache 10 minutes

// DOM refs
const searchInput = document.getElementById('searchInput');
const suggestions = document.getElementById('suggestions');
const symbolSelect = document.getElementById('symbolSelect');
const loadBtn = document.getElementById('loadBtn');
const openCompare = document.getElementById('openCompare');
const compareModalEl = document.getElementById('compareModal');
const compareModal = compareModalEl ? new bootstrap.Modal(compareModalEl) : null;
const compareSelect = document.getElementById('compareSelect');
const compareGo = document.getElementById('compareGo');
const rangePicker = document.getElementById('rangePicker');
const chartTitle = document.getElementById('chartTitle');
const chartCanvas = document.getElementById('mainChart');
const chartLoading = document.getElementById('chartLoading');
const chartError = document.getElementById('chartError');
const mLast = document.getElementById('m-last'),
  mMA7 = document.getElementById('m-ma7'),
  mVol = document.getElementById('m-vol'),
  m52 = document.getElementById('m-52'),
  // NEW: Daily Return ID
  mDaily = document.getElementById('m-daily');

let companies = [];
let fuse = null;
let mainChart = null;

// BUG FIX: Store lastData globally for correct export and metric calculation
let lastData = null;
let lastSymbol = null;

// --- Utility Functions ---

function cacheGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (Date.now() - obj.t > TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return obj.v;
  } catch (e) {
    return null;
  }
}

function cacheSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify({ t: Date.now(), v: value }));
  } catch (e) {
    console.error("Cache set failed", e);
  }
}

async function apiGET(path) {
  try {
    const res = await axios.get(API_BASE + path);
    return res.data;
  } catch (err) {
    const msg = err?.response?.data?.detail || err.message || 'Network error';
    throw new Error(msg);
  }
}

function showChartError(msg) {
  if (!msg) {
    chartError.textContent = '';
    chartError.classList.add('d-none');
    return;
  }
  chartError.textContent = msg;
  chartError.classList.remove('d-none');
}

// --- Init Functions ---

document.addEventListener('DOMContentLoaded', async () => {
  if (!chartCanvas) {
    console.error('Fatal: Chart canvas not found. Script cannot run.');
    return;
  }
  initTheme();
  initDatepicker();
  await loadCompanies();
  attachHandlers();
  
  // Preload first company in list
  if (symbolSelect.options.length) {
    const first = symbolSelect.value;
    await loadFor(first);
  }
});

async function loadCompanies() {
  const c = cacheGet('companies');
  if (c) {
    companies = c;
    buildSymbolOptions();
    setupFuse();
    return;
  }
  try {
    const j = await apiGET('/companies');
    companies = Array.isArray(j.companies) ? j.companies : j;
    cacheSet('companies', companies);
    buildSymbolOptions();
    setupFuse();
  } catch (e) {
    console.error('Companies load failed', e);
    showChartError('Failed to load company list: ' + e.message);
  }
}

function buildSymbolOptions() {
  symbolSelect.innerHTML = '';
  compareSelect.innerHTML = '';
  companies.forEach(s => {
    const opt = new Option(s, s);
    symbolSelect.appendChild(opt);

    const opt2 = new Option(s, s);
    compareSelect.appendChild(opt2);
  });
}

function setupFuse() {
  fuse = new Fuse(companies.map(c => ({ sym: c })), { keys: ['sym'], threshold: 0.3, ignoreLocation: true });
}

function initDatepicker() {
  if (!window.flatpickr) return;
  flatpickr(rangePicker, {
    mode: 'range',
    dateFormat: 'Y-m-d',
    maxDate: 'today',
    onChange: function(selectedDates, dateStr, instance) {
      // Re-filter chart when date changes
      if (lastData) {
        filterAndRedrawChart();
      }
    }
  });
}

// --- Event Handlers ---

function attachHandlers() {
  let typingTimeout = null;
  searchInput.addEventListener('input', (e) => {
    const v = e.target.value.trim();
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => showSuggestions(v), 150);
  });

  document.addEventListener('click', (ev) => {
    if (!suggestions.contains(ev.target) && ev.target !== searchInput) {
      suggestions.classList.add('d-none');
    }
  });

  suggestions.addEventListener('click', (ev) => {
    const li = ev.target.closest('.list-group-item');
    if (!li) return;
    const sym = li.dataset.sym;
    searchInput.value = sym;
    suggestions.classList.add('d-none');
    symbolSelect.value = sym;
    // Automatically load when suggestion is clicked
    loadFor(sym);
  });

  loadBtn.addEventListener('click', () => {
    const s = symbolSelect.value || searchInput.value;
    if (!s) return showChartError('Select a symbol first');
    loadFor(s);
  });

  if (openCompare && compareModal) {
    openCompare.addEventListener('click', () => compareModal.show());
  }

  if (compareGo && compareModal) {
    compareGo.addEventListener('click', () => {
      const s1 = symbolSelect.value;
      const s2 = compareSelect.value;
      if (!s1 || !s2) return;
      doCompare(s1, s2);
      compareModal.hide();
    });
  }

  exportBtn.addEventListener('click', exportCSV);
}

function showSuggestions(q) {
  if (!q) {
    suggestions.classList.add('d-none');
    return;
  }
  const items = (fuse ? fuse.search(q).slice(0, 10).map(r => r.item.sym) : companies.filter(s => s.includes(q)).slice(0, 10));
  suggestions.innerHTML = '';
  items.forEach(sym => {
    const li = document.createElement('button');
    li.type = 'button';
    li.className = 'list-group-item list-group-item-action';
    li.textContent = sym;
    li.dataset.sym = sym;
    suggestions.appendChild(li);
  });
  suggestions.classList.toggle('d-none', items.length === 0);
}

// --- Core Data & Charting Logic ---

async function loadFor(symbol) {
  showChartError('');
  chartLoading.classList.remove('d-none');
  chartTitle.textContent = `Price — ${symbol.toUpperCase()}`;
  try {
    const cacheKey = `sym:${symbol}`;
    let j = cacheGet(cacheKey);
    if (!j) {
      j = await apiGET(`/data/${encodeURIComponent(symbol)}`);
      cacheSet(cacheKey, j);
    }
    
    // BUG FIX: Store full dataset globally
    lastData = j.data;
    lastSymbol = j.symbol;

    // BUG FIX: Render metrics from the FULL dataset, not filtered
    renderMetrics(j.symbol, j.data);
    
    // Now, filter and render the chart
    filterAndRedrawChart();

  } catch (e) {
    showChartError('Load error: ' + e.message);
    console.error(e);
  } finally {
    chartLoading.classList.add('d-none');
  }
}

/**
 * UPDATED: Renders all 5 metrics from the full dataset
 */
function renderMetrics(symbol, data) {
  // Reset all metrics
  mLast.textContent = '—';
  mMA7.textContent = '—';
  mVol.textContent = '—';
  m52.textContent = '— / —';
  mDaily.textContent = '—';
  
  // Reset daily return color
  mDaily.classList.remove('text-success', 'text-danger');
  const dailyIcon = mDaily.parentElement.querySelector('.metric-icon');
  if (dailyIcon) {
    dailyIcon.classList.remove('text-success', 'text-danger');
  }


  if (!Array.isArray(data) || data.length === 0) {
    return; // Exit if no data
  }
  
  const closes = data.map(r => Number(r.Close)).filter(v => !Number.isNaN(v));
  if (closes.length === 0) {
     return; // Exit if no valid close prices
  }

  // 1. Last Close
  const last = closes[closes.length - 1];
  mLast.textContent = Number.isFinite(last) ? last.toFixed(2) : '—';

  // 2. 7-day MA
  const ma7 = movingAverage(closes, 7).filter(v => Number.isFinite(v));
  mMA7.textContent = ma7.length ? ma7[ma7.length - 1].toFixed(2) : '—';

  // 3. Volatility
  const vol30 = computeVolatility(data, 30);
  mVol.textContent = vol30 !== null ? vol30.toFixed(4) : '—';

  // 4. 52-week High/Low
  const hi = Math.max(...closes),
    lo = Math.min(...closes);
  m52.textContent = `${hi.toFixed(2)} / ${lo.toFixed(2)}`;
  
  // 5. NEW: Daily Return
  const lastEntry = data[data.length - 1];
  if (lastEntry && lastEntry.Open !== undefined && lastEntry.Close !== undefined) {
    const lastOpen = Number(lastEntry.Open);
    const lastClose = Number(lastEntry.Close);
    
    if (!Number.isNaN(lastOpen) && !Number.isNaN(lastClose) && lastOpen !== 0) {
      const dailyReturn = ((lastClose - lastOpen) / lastOpen);
      const pct = (dailyReturn * 100).toFixed(2);
      const colorClass = dailyReturn >= 0 ? 'text-success' : 'text-danger';
      
      mDaily.textContent = `${pct}%`;
      mDaily.classList.add(colorClass);
      // Also color the icon
      if (dailyIcon) {
        dailyIcon.classList.add(colorClass);
      }

    } else {
      mDaily.textContent = '—';
    }
  } else {
    mDaily.textContent = '—';
  }
  
  // Update chart title (in case it wasn't set)
  chartTitle.textContent = `${symbol} — Price`;
}

/**
 * Applies date range filter to the global lastData
 */
function applyRangeFilter(records) {
  const v = rangePicker.value;
  if (!v) return records; // No filter, return all
  
  const parts = v.split(' to ');
  if (parts.length !== 2) return records; // Invalid range, return all
  
  try {
    const start = new Date(parts[0] + "T00:00:00");
    const end = new Date(parts[1] + "T23:59:59");
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return records;

    return records.filter(r => {
      const d = new Date(r.Date);
      return d >= start && d <= end;
    });
  } catch(e) {
    console.warn("Date filter error", e);
    return records;
  }
}

/**
 * Filters global data and redraws the chart
 */
function filterAndRedrawChart() {
  if (!lastData) return;
  
  const filteredData = applyRangeFilter(lastData);
  
  if (filteredData.length === 0) {
    showChartError('No data available for the selected date range.');
    drawChart(lastSymbol, [], []); // Draw an empty chart
    return;
  }
  
  showChartError(''); // Clear error
  const labels = filteredData.map(r => (r.Date || '').split('T')[0]);
  const closes = filteredData.map(r => Number(r.Close));
  drawChart(lastSymbol, labels, closes);
}


function drawChart(symbol, labels, data) {
  if (!chartCanvas) return;
  const ctx = chartCanvas.getContext('2d');
  if (mainChart) {
    mainChart.destroy();
  }
  
  // Ensure zoom plugin is registered
  if (window.ChartZoomPlugin) {
      Chart.register(window.ChartZoomPlugin);
  }

  mainChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: `${symbol} Close`,
        data,
        fill: true,
        backgroundColor: 'rgba(33,150,243,0.08)',
        borderColor: 'rgba(33,150,243,0.92)',
        pointRadius: 2,
        pointHoverRadius: 5,
        tension: 0.1
      }]
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: { display: true, position: 'top', align: 'end' },
        zoom: {
          zoom: { wheel: { enabled: true }, pinch: { enabled:true }, mode: 'x' },
          pan: { enabled: true, mode: 'x' }
        },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        x: { ticks: { maxRotation: 45, autoSkip: true, maxTicksLimit: 12 } },
        y: { beginAtZero: false }
      },
      interaction: {
        intersect: false,
        mode: 'index',
      }
    }
  });
}

// --- Compare & Export ---

async function doCompare(s1, s2) {
  compareCards.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
  compareArea.classList.remove('d-none');
  try {
    const j = await apiGET(`/compare?symbol1=${encodeURIComponent(s1)}&symbol2=${encodeURIComponent(s2)}`);
    compareCards.innerHTML = ''; // Clear spinner
    Object.keys(j).forEach(key => {
      const o = j[key];
      const col = document.createElement('div');
      col.className = 'col-md-6';
      const pct = o.pct_30 === null ? '—' : (o.pct_30 * 100).toFixed(2) + '%';
      const colorClass = o.pct_30 === null ? '' : (o.pct_30 >= 0 ? 'text-success' : 'text-danger');
      
      col.innerHTML = `
        <div class="card shadow-sm">
          <div class="card-body">
            <h6 class="card-title">${key}</h6>
            <small class="text-muted">Last close</small>
            <div class="h4">${Number(o.last_close || 0).toFixed(2)}</div>
            <small class="text-muted">30d Change</small>
            <div class="h5 ${colorClass}">${pct}</div>
          </div>
        </div>`;
      compareCards.appendChild(col);
    });
  } catch (e) {
    compareCards.innerHTML = '';
    showChartError('Compare failed: ' + e.message);
  }
}

/**
 * BUG FIX: Exports the full lastData, not the filtered chart data.
 */
function exportCSV() {
  if (!lastData || !lastData.length || !lastSymbol) {
    showChartError('Load a symbol first before exporting.');
    return;
  }
  try {
    const cols = Object.keys(lastData[0]);
    const lines = [
      cols.join(','), // Header row
      ...lastData.map(row => 
        cols.map(c => String(row[c]).replace(/,/g, '')) // Remove commas from values
            .join(',')
      )
    ];
    
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lastSymbol}_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    showChartError('Export failed: ' + e.message);
    console.error(e);
  }
}

// --- Helpers ---

function movingAverage(arr, n) {
  const res = [];
  for (let i = 0; i < arr.length; i++) {
    if (i < n - 1) res.push(NaN);
    else {
      const s = arr.slice(i - n + 1, i + 1).reduce((a, b) => a + b, 0) / n;
      res.push(s);
    }
  }
  return res;
}

function computeVolatility(records, window) {
  const closes = records.map(r => Number(r.Close)).filter(v => Number.isFinite(v));
  if (closes.length < window) return null;
  const last = closes.slice(-window);
  const returns = [];
  for (let i = 1; i < last.length; i++) {
    returns.push((last[i] - last[i - 1]) / last[i - 1]);
  }
  if(returns.length === 0) return null;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance);
}

/**
 * ENHANCEMENT: Uses Bootstrap 5.3 native dark mode
 */
function initTheme() {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  const storedTheme = localStorage.getItem('theme');
  const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const theme = storedTheme || preferredTheme;

  document.documentElement.setAttribute('data-bs-theme', theme);
  toggle.checked = (theme === 'dark');

  toggle.addEventListener('change', () => {
    const newTheme = toggle.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });
}

