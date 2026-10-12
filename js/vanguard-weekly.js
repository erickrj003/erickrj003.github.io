/*! vanguard-weekly.js — weekly movers and CAPM reward-to-risk for Vanguard index ETFs. */

const DEFAULTS = {
    proxy: 'https://taiga-testing-1.erickrj003.workers.dev',          // e.g. 'https://YOUR-WORKER.workers.dev/?url='
    benchmark: 'VTI',   // CAPM market portfolio
    riskFree: '^IRX',   // 13-week T-bill yield, in percent
    lookbackDays: 7,
    capmRange: '1y',
    minHistory: 0.95,   // share of the CAPM window a fund must cover to be ranked
    minBeta: 0.25,      // Treynor is unstable near zero beta
    maxHoldings: 150,   // largest holdings priced per fund for attribution
    concurrency: 6,
  };
  
  // [ticker, name, class]. Class drives attribution: 'us' | 'intl' | 'bond'.
  // Check against Vanguard's current ETF list; index ETFs only, active ETFs excluded.
  const FUNDS = [
    ['VTI', 'Total Stock Market', 'us'], ['VOO', 'S&P 500', 'us'], ['VV', 'Large-Cap', 'us'],
    ['MGC', 'Mega Cap', 'us'], ['MGK', 'Mega Cap Growth', 'us'], ['MGV', 'Mega Cap Value', 'us'],
    ['VUG', 'Growth', 'us'], ['VTV', 'Value', 'us'], ['VO', 'Mid-Cap', 'us'],
    ['VOT', 'Mid-Cap Growth', 'us'], ['VOE', 'Mid-Cap Value', 'us'], ['VB', 'Small-Cap', 'us'],
    ['VBK', 'Small-Cap Growth', 'us'], ['VBR', 'Small-Cap Value', 'us'], ['VXF', 'Extended Market', 'us'],
    ['VIG', 'Dividend Appreciation', 'us'], ['VYM', 'High Dividend Yield', 'us'], ['ESGV', 'ESG U.S. Stock', 'us'],
    ['VOOG', 'S&P 500 Growth', 'us'], ['VOOV', 'S&P 500 Value', 'us'], ['IVOO', 'S&P Mid-Cap 400', 'us'],
    ['IVOG', 'S&P Mid-Cap 400 Growth', 'us'], ['IVOV', 'S&P Mid-Cap 400 Value', 'us'],
    ['VIOO', 'S&P Small-Cap 600', 'us'], ['VIOG', 'S&P Small-Cap 600 Growth', 'us'],
    ['VIOV', 'S&P Small-Cap 600 Value', 'us'], ['VONE', 'Russell 1000', 'us'],
    ['VONG', 'Russell 1000 Growth', 'us'], ['VONV', 'Russell 1000 Value', 'us'], ['VTWO', 'Russell 2000', 'us'],
    ['VTWG', 'Russell 2000 Growth', 'us'], ['VTWV', 'Russell 2000 Value', 'us'], ['VTHR', 'Russell 3000', 'us'],
    ['VOX', 'Communication Services', 'us'], ['VCR', 'Consumer Discretionary', 'us'],
    ['VDC', 'Consumer Staples', 'us'], ['VDE', 'Energy', 'us'], ['VFH', 'Financials', 'us'],
    ['VHT', 'Health Care', 'us'], ['VIS', 'Industrials', 'us'], ['VGT', 'Information Technology', 'us'],
    ['VAW', 'Materials', 'us'], ['VNQ', 'Real Estate', 'us'], ['VPU', 'Utilities', 'us'],
  
    ['VT', 'Total World Stock', 'intl'], ['VXUS', 'Total International Stock', 'intl'],
    ['VEU', 'FTSE All-World ex-US', 'intl'], ['VSS', 'FTSE All-World ex-US Small-Cap', 'intl'],
    ['VEA', 'FTSE Developed Markets', 'intl'], ['VWO', 'FTSE Emerging Markets', 'intl'],
    ['VGK', 'FTSE Europe', 'intl'], ['VPL', 'FTSE Pacific', 'intl'],
    ['VNQI', 'Global ex-U.S. Real Estate', 'intl'], ['VIGI', 'International Dividend Appreciation', 'intl'],
    ['VYMI', 'International High Dividend Yield', 'intl'], ['VSGX', 'ESG International Stock', 'intl'],
    ['VEXC', 'Emerging Markets ex-China', 'intl'],
  
    ['BND', 'Total Bond Market', 'bond'], ['BNDX', 'Total International Bond', 'bond'],
    ['BNDW', 'Total World Bond', 'bond'], ['BSV', 'Short-Term Bond', 'bond'],
    ['BIV', 'Intermediate-Term Bond', 'bond'], ['BLV', 'Long-Term Bond', 'bond'],
    ['VGSH', 'Short-Term Treasury', 'bond'], ['VGIT', 'Intermediate-Term Treasury', 'bond'],
    ['VGLT', 'Long-Term Treasury', 'bond'], ['EDV', 'Extended Duration Treasury', 'bond'],
    ['VTIP', 'Short-Term Inflation-Protected Securities', 'bond'], ['VMBS', 'Mortgage-Backed Securities', 'bond'],
    ['VCSH', 'Short-Term Corporate Bond', 'bond'], ['VCIT', 'Intermediate-Term Corporate Bond', 'bond'],
    ['VCLT', 'Long-Term Corporate Bond', 'bond'], ['VTC', 'Total Corporate Bond', 'bond'],
    ['VWOB', 'Emerging Markets Government Bond', 'bond'], ['VTEB', 'Tax-Exempt Bond', 'bond'],
    ['VTES', 'Short-Term Tax-Exempt Bond', 'bond'], ['VTEI', 'Intermediate-Term Tax-Exempt Bond', 'bond'],
    ['VTEL', 'Long-Term Tax-Exempt Bond', 'bond'], ['VTEC', 'California Tax-Exempt Bond', 'bond'],
    ['MUNY', 'New York Tax-Exempt Bond', 'bond'], ['VBIL', '0-3 Month Treasury Bill', 'bond'],
    ['VGUS', 'Ultra-Short Treasury', 'bond'], ['VTG', 'Total Treasury', 'bond'],
    ['VTP', 'Total Inflation-Protected Securities', 'bond'],
  ];
  
  const YAHOO_CHART = 'https://query1.finance.yahoo.com/v8/finance/chart/';
  const YAHOO_SEARCH = 'https://query2.finance.yahoo.com/v1/finance/search';
  const VANGUARD_API = 'https://investor.vanguard.com/investment-products/etfs/profile/api/';
  
  /* ---------- small helpers ---------- */
  
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sign = (x) => (x > 0 ? '+' : x < 0 ? '−' : '');
  const fmtPct = (x, d = 2) => (x == null || !isFinite(x) ? '—' : `${sign(x)}${Math.abs(x * 100).toFixed(d)}%`);
  const fmtPts = (x) => `${sign(x)}${Math.abs(x).toFixed(2)} pp`;
  const fmtNum = (x, d = 2) => (x == null || !isFinite(x) ? '—' : `${x < 0 ? '−' : ''}${Math.abs(x).toFixed(d)}`);
  const fmtDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const tone = (x) => (x > 0 ? 'text-emerald-600' : x < 0 ? 'text-rose-600' : 'text-slate-600');
  const shiftDate = (iso, days) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };
  const dayDiff = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
  
  async function pool(items, limit, worker, onProgress) {
    const results = new Array(items.length);
    let next = 0, done = 0;
    async function runner() {
      while (next < items.length) {
        const i = next++;
        try { results[i] = { ok: true, value: await worker(items[i], i) }; }
        catch (error) { results[i] = { ok: false, error }; }
        if (onProgress) onProgress(++done, items.length);
      }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runner));
    return results;
  }
  
  /* ---------- data access ---------- */
  
  function createClient(cfg) {
    const memo = new Map();
    const cached = (key, fn) => { if (!memo.has(key)) memo.set(key, fn()); return memo.get(key); };
  
    async function getJSON(url) {
      let lastError;
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt) await sleep(600 * 2 ** attempt);
        try {
          const res = await fetch(cfg.proxy + encodeURIComponent(url));
          if (res.ok) return await res.json();
          lastError = new Error(`HTTP ${res.status}`);
          if (res.status !== 429 && res.status < 500) break;
        } catch (err) { lastError = err; }
      }
      throw lastError;
    }
  
    return {
      series: (symbol, range) => cached(`s:${symbol}:${range}`, async () =>
        parseChart(symbol, await getJSON(`${YAHOO_CHART}${encodeURIComponent(symbol)}?range=${range}&interval=1d&includeAdjustedClose=true`))),
      holdings: (ticker) => cached(`h:${ticker}`, async () =>
        parseHoldings(await getJSON(`${VANGUARD_API}${encodeURIComponent(ticker)}/portfolio-holding/stock`))),
      isinSymbol: (isin) => cached(`i:${isin}`, async () => {
        const json = await getJSON(`${YAHOO_SEARCH}?q=${encodeURIComponent(isin)}&quotesCount=5&newsCount=0`);
        const hit = (json.quotes || []).find((q) => q && q.symbol && (!q.quoteType || q.quoteType === 'EQUITY'));
        return hit ? hit.symbol : null;
      }),
    };
  }
  
  // Yahoo chart JSON -> { name, currency, marketTime, points: [{ date: 'YYYY-MM-DD', value }] }
  function parseChart(symbol, json) {
    const r = json && json.chart && json.chart.result && json.chart.result[0];
    if (!r || !Array.isArray(r.timestamp)) throw new Error(`no price data for ${symbol}`);
    const meta = r.meta || {};
    const offset = meta.gmtoffset || 0;
    const close = (r.indicators.quote && r.indicators.quote[0] && r.indicators.quote[0].close) || [];
    const adj = r.indicators.adjclose && r.indicators.adjclose[0] && r.indicators.adjclose[0].adjclose;
    const last = r.timestamp.length - 1;
    const points = [];
    for (let i = 0; i <= last; i++) {
      let v = adj ? adj[i] : close[i];
      if (v == null && i === last) v = close[i]; // live bar: adjusted == raw
      if (v == null || !isFinite(v)) continue;
      const date = new Date((r.timestamp[i] + offset) * 1000).toISOString().slice(0, 10);
      if (points.length && points[points.length - 1].date === date) points[points.length - 1].value = v;
      else points.push({ date, value: v });
    }
    return { symbol, name: meta.longName || meta.shortName || '', currency: meta.currency || '', marketTime: meta.regularMarketTime || null, points };
  }
  
  // Vanguard holdings JSON -> { asOf, list: [{ name, ticker, isin, weight (percent) }] }
  // Locates the holdings array by shape rather than by a fixed path.
  function parseHoldings(json) {
    let rows = null;
    (function walk(node) {
      if (Array.isArray(node)) {
        const first = node[0];
        if (first && typeof first === 'object' && !Array.isArray(first) && ('percentWeight' in first || 'marketValue' in first)) {
          if (!rows || node.length > rows.length) rows = node;
        } else node.forEach(walk);
      } else if (node && typeof node === 'object') Object.values(node).forEach(walk);
    })(json);
    if (!rows) throw new Error('unrecognised holdings response');
  
    const num = (v) => { const x = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/[,%$\s]/g, '')); return isFinite(x) ? x : NaN; };
    const clean = (v) => String(v ?? '').trim();
    let list = rows.map((r) => ({
      name: clean(r.longName || r.shortName || r.ticker) || 'Unnamed holding',
      ticker: clean(r.ticker),
      isin: clean(r.isin).toUpperCase(),
      weight: num(r.percentWeight),
      value: num(r.marketValue),
    }));
  
    let total = list.reduce((s, h) => s + (h.weight > 0 ? h.weight : 0), 0);
    if (!(total > 0)) { // no weights supplied: derive from market value
      const mv = list.reduce((s, h) => s + (h.value > 0 ? h.value : 0), 0);
      if (!(mv > 0)) throw new Error('holdings have no weights');
      list.forEach((h) => { h.weight = (h.value / mv) * 100; });
      total = 100;
    }
    if (total < 2) list.forEach((h) => { h.weight *= 100; }); // fractions -> percent
  
    list = list.filter((h) => h.weight > 0).sort((a, b) => b.weight - a.weight);
    return { asOf: clean(json.asOfDate || rows[0].asOfDate).slice(0, 10), list };
  }
  
  /* ---------- calculations ---------- */
  
  function pointOnOrBefore(points, date) {
    for (let i = points.length - 1; i >= 0; i--) if (points[i].date <= date) return points[i];
    return null;
  }
  
  // Return between the last bars on/before `start` and `end`; null if either bar is too stale.
  function windowReturn(points, start, end, endSlack = 0, startSlack = 4) {
    const a = pointOnOrBefore(points, start), b = pointOnOrBefore(points, end);
    if (!a || !b || a.date >= b.date) return null;
    if (dayDiff(a.date, start) > startSlack || dayDiff(b.date, end) > endSlack) return null;
    if (!(a.value > 0) || !(b.value > 0)) return null;
    return b.value / a.value - 1;
  }
  
  function marketContext(bench, rf) {
    if (!rf.points.length) throw new Error('no risk-free data');
    const price = new Map(), rfDaily = new Map();
    let j = 0, last = rf.points[0].value;
    for (const p of bench.points) {
      while (j < rf.points.length && rf.points[j].date <= p.date) last = rf.points[j++].value;
      price.set(p.date, p.value);
      rfDaily.set(p.date, last / 100 / 252);
    }
    return { price, rfDaily, n: bench.points.length - 1 };
  }
  
  // CAPM on daily excess returns: beta, required return on the ex-post SML, alpha, Treynor.
  function capmStats(points, mkt, minHistory) {
    const common = points.filter((p) => mkt.price.has(p.date) && p.value > 0);
    const n = common.length - 1;
    if (n < 20 || n < minHistory * mkt.n) return null;
    const x = [], y = [];
    let rfSum = 0;
    for (let i = 1; i <= n; i++) {
      const d0 = common[i - 1].date, d1 = common[i].date;
      const rf = mkt.rfDaily.get(d1);
      x.push(mkt.price.get(d1) / mkt.price.get(d0) - 1 - rf);
      y.push(common[i].value / common[i - 1].value - 1 - rf);
      rfSum += rf;
    }
    const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
    const mx = mean(x), my = mean(y);
    let sxy = 0, sxx = 0;
    for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; }
    if (!(sxx > 0)) return null;
  
    const beta = sxy / sxx;
    const years = n / 252;
    const annualise = (total) => Math.pow(1 + total, 1 / years) - 1;
    const annual = annualise(common[n].value / common[0].value - 1);
    const market = annualise(mkt.price.get(common[n].date) / mkt.price.get(common[0].date) - 1);
    const riskFree = rfSum / years;
    const expected = riskFree + beta * (market - riskFree);
    return { n, beta, annual, market, riskFree, expected, alpha: annual - expected, treynor: (annual - riskFree) / beta };
  }
  
  const MINOR_UNITS = { GBp: 'GBP', GBX: 'GBP', ILA: 'ILS', ZAc: 'ZAR', ZAC: 'ZAR' };
  const majorCurrency = (c) => (!c ? 'USD' : MINOR_UNITS[c] || c.toUpperCase());
  
  async function resolveSymbol(api, h, cls) {
    const tickerOk = /^[A-Z][A-Z0-9]*([./-][A-Z0-9]+)?$/i.test(h.ticker);
    // Local tickers of foreign listings collide with unrelated US tickers, so only trust
    // the ticker for US funds / US ISINs and resolve everything else by ISIN.
    if (tickerOk && (cls === 'us' || h.isin.startsWith('US'))) return h.ticker.toUpperCase().replace(/[./]/g, '-');
    if (/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(h.isin)) return api.isinSymbol(h.isin);
    return null;
  }
  
  // Contribution of each holding = weight (%) x one-week USD return -> percentage points.
  async function attribute(api, cfg, fund, win, onProgress) {
    const { list, asOf } = await api.holdings(fund.ticker);
    const sample = list.slice(0, cfg.maxHoldings);
    const results = await pool(sample, cfg.concurrency, async (h) => {
      const symbol = await resolveSymbol(api, h, fund.cls);
      if (!symbol) return null;
      const s = await api.series(symbol, '1mo');
      let ret = windowReturn(s.points, win.start, win.end, 4);
      if (ret == null) return null;
      const currency = majorCurrency(s.currency);
      if (currency !== 'USD') {
        const fx = await api.series(`${currency}=X`, '1mo'); // units of currency per USD
        const move = windowReturn(fx.points, win.start, win.end, 4);
        if (move == null) return null;
        ret = (1 + ret) / (1 + move) - 1;
      }
      return { name: h.name, symbol, weight: h.weight, ret, contribution: h.weight * ret };
    }, onProgress);
  
    const priced = results.filter((r) => r.ok && r.value).map((r) => r.value);
    return {
      asOf,
      total: list.length,
      analysed: priced.length,
      coverage: priced.reduce((s, p) => s + p.weight, 0),
      explained: priced.reduce((s, p) => s + p.contribution, 0),
      gains: priced.filter((p) => p.contribution > 0).sort((a, b) => b.contribution - a.contribution).slice(0, 5),
      losses: priced.filter((p) => p.contribution < 0).sort((a, b) => a.contribution - b.contribution).slice(0, 5),
    };
  }
  
  /* ---------- rendering ---------- */
  
  function shell(root) {
    root.innerHTML = `
      <section class="mx-auto max-w-5xl space-y-6 p-4 text-slate-900">
        <header class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="text-2xl font-semibold tracking-tight">Vanguard index funds: the past week</h2>
            <p data-slot="subtitle" class="mt-1 text-sm text-slate-500"></p>
          </div>
          <button data-slot="refresh" type="button" class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Refresh</button>
        </header>
        <div data-slot="status" role="status" aria-live="polite"></div>
        <div data-slot="body" class="space-y-6"></div>
      </section>`;
    const slot = (name) => root.querySelector(`[data-slot="${name}"]`);
    return { subtitle: slot('subtitle'), refresh: slot('refresh'), status: slot('status'), body: slot('body') };
  }
  
  function showProgress(el, text, fraction) {
    el.innerHTML = `
      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <p class="text-sm text-slate-600">${esc(text)}</p>
        <div class="mt-2 h-1.5 overflow-hidden rounded bg-slate-100">
          <div class="h-full rounded bg-slate-500 transition-all" style="width:${Math.round(fraction * 100)}%"></div>
        </div>
      </div>`;
  }
  
  function showError(el, message) {
    el.innerHTML = `<div class="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">${esc(message)}</div>`;
  }
  
  const KINDS = {
    top: { label: 'Top performer', badge: 'bg-emerald-100 text-emerald-800' },
    worst: { label: 'Worst performer', badge: 'bg-rose-100 text-rose-800' },
  };
  
  function performerCard(kind, f) {
    const k = KINDS[kind];
    return `
      <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <span class="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${k.badge}">${k.label}</span>
        <div class="mt-3 flex items-baseline justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xl font-semibold">${esc(f.ticker)}</p>
            <p class="truncate text-sm text-slate-500">Vanguard ${esc(f.name)} ETF</p>
          </div>
          <p class="text-3xl font-semibold tabular-nums ${tone(f.week)}">${fmtPct(f.week)}</p>
        </div>
        <div data-attribution="${kind}" class="mt-4 space-y-4 border-t border-slate-100 pt-4">
          <p class="text-sm text-slate-500">Loading holdings…</p>
        </div>
      </article>`;
  }
  
  function contribTable(title, rows, emptyText) {
    const heading = `<h4 class="text-xs font-semibold uppercase tracking-wide text-slate-500">${title}</h4>`;
    if (!rows.length) return `<div>${heading}<p class="mt-1 text-sm text-slate-500">${emptyText}</p></div>`;
    return `
      <div>
        ${heading}
        <table class="mt-1 w-full text-sm">
          <thead>
            <tr class="text-left text-xs text-slate-400">
              <th class="py-1 font-medium">Holding</th>
              <th class="py-1 text-right font-medium">Weight</th>
              <th class="py-1 text-right font-medium">1 week</th>
              <th class="py-1 text-right font-medium">Contribution</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${rows.map((r) => `
              <tr>
                <td class="py-1.5 pr-2">${esc(r.name)} <span class="text-xs text-slate-400">${esc(r.symbol)}</span></td>
                <td class="py-1.5 text-right tabular-nums text-slate-600">${r.weight.toFixed(2)}%</td>
                <td class="py-1.5 text-right tabular-nums ${tone(r.ret)}">${fmtPct(r.ret, 1)}</td>
                <td class="py-1.5 text-right font-medium tabular-nums ${tone(r.contribution)}">${fmtPts(r.contribution)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }
  
  function attributionHTML(kind, f, a) {
    const gains = contribTable('Largest gains', a.gains, 'No holdings rose.');
    const losses = contribTable('Largest losses', a.losses, 'No holdings fell.');
    return `
      ${kind === 'top' ? gains + losses : losses + gains}
      <p class="text-xs text-slate-500">
        Based on ${a.analysed} of the fund's ${a.total} holdings (${a.coverage.toFixed(0)}% of assets${a.asOf ? `, weights as of ${esc(fmtDate(a.asOf))}` : ''}).
        They account for ${fmtPts(a.explained)} of the fund's ${fmtPct(f.week)} move.
        Contribution = weight × one-week return in USD.
      </p>`;
  }
  
  function capmCard(best, cfg) {
    const open = '<article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><span class="inline-block rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">Best reward for risk (CAPM)</span>';
    if (!best) return `${open}<p class="mt-3 text-sm text-slate-500">Unavailable: the risk-free rate or a full year of prices could not be loaded.</p></article>`;
    const c = best.capm;
    const stat = (label, value) => `<div><dt class="text-xs text-slate-500">${label}</dt><dd class="text-base font-semibold tabular-nums">${value}</dd></div>`;
    return `${open}
        <div class="mt-3 flex items-baseline justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xl font-semibold">${esc(best.ticker)}</p>
            <p class="truncate text-sm text-slate-500">Vanguard ${esc(best.name)} ETF</p>
          </div>
          <div class="text-right">
            <p class="text-3xl font-semibold tabular-nums">${fmtPct(c.treynor, 1)}</p>
            <p class="text-xs text-slate-500">excess return per unit of beta</p>
          </div>
        </div>
        <dl class="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3 lg:grid-cols-6">
          ${stat('Beta', fmtNum(c.beta))}
          ${stat('Annualised return', fmtPct(c.annual, 1))}
          ${stat('CAPM required return', fmtPct(c.expected, 1))}
          ${stat('Alpha', fmtPct(c.alpha, 1))}
          ${stat(`Market (${esc(cfg.benchmark)})`, fmtPct(c.market, 1))}
          ${stat('Risk-free', fmtPct(c.riskFree, 1))}
        </dl>
        <p class="mt-4 text-xs text-slate-500">
          Treynor ratio = (annualised return − risk-free rate) ÷ beta, from ${c.n} daily returns.
          Required return = risk-free + beta × (market − risk-free). Funds with beta below ${cfg.minBeta}
          or less than a full year of history are not ranked.
        </p>
      </article>`;
  }
  
  const COLUMNS = [
    { key: 'ticker', label: 'Fund' },
    { key: 'week', label: '1 week', fmt: (v) => fmtPct(v), tone: true },
    { key: 'beta', label: 'Beta', fmt: (v) => fmtNum(v) },
    { key: 'annual', label: 'Annualised', fmt: (v) => fmtPct(v, 1), tone: true },
    { key: 'expected', label: 'CAPM required', fmt: (v) => fmtPct(v, 1) },
    { key: 'alpha', label: 'Alpha', fmt: (v) => fmtPct(v, 1), tone: true },
    { key: 'treynor', label: 'Treynor', fmt: (v) => fmtPct(v, 1) },
  ];
  
  function tableSection(count) {
    return `
      <details class="rounded-xl border border-slate-200 bg-white shadow-sm">
        <summary class="cursor-pointer px-5 py-3 text-sm font-medium text-slate-700">All ${count} funds (click a column to sort)</summary>
        <div class="overflow-x-auto border-t border-slate-100">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-xs text-slate-500">
                ${COLUMNS.map((c, i) => `<th class="px-3 py-2 font-medium ${i ? 'text-right' : 'text-left'}"><button type="button" data-sort="${c.key}" class="hover:text-slate-900">${c.label}</button></th>`).join('')}
              </tr>
            </thead>
            <tbody data-slot="rows" class="divide-y divide-slate-100"></tbody>
          </table>
        </div>
      </details>`;
  }
  
  function renderRows(tbody, rows, sort) {
    const sorted = [...rows].sort((a, b) => {
      const x = a[sort.key], y = b[sort.key];
      if (x == null || y == null) return (x == null) - (y == null); // blanks last
      return (typeof x === 'string' ? x.localeCompare(y) : x - y) * sort.dir;
    });
    tbody.innerHTML = sorted.map((r) => `
      <tr class="hover:bg-slate-50">
        <td class="px-3 py-2"><span class="font-medium">${esc(r.ticker)}</span> <span class="text-slate-500">${esc(r.name)}</span></td>
        ${COLUMNS.slice(1).map((c) => `<td class="px-3 py-2 text-right tabular-nums ${c.tone ? tone(r[c.key]) : 'text-slate-700'}">${c.fmt(r[c.key])}</td>`).join('')}
      </tr>`).join('');
  }
  
  /* ---------- component ---------- */
  
  export function mountVanguardWeekly(root, options = {}) {
    const cfg = { ...DEFAULTS, ...options };
    const ui = shell(root);
    let running = false;
  
    async function load() {
      const api = createClient(cfg);
      showProgress(ui.status, 'Loading prices…', 0);
  
      const bench = await api.series(cfg.benchmark, cfg.capmRange);
      if (bench.points.length < 10) throw new Error(`Not enough price history for ${cfg.benchmark}.`);
      const end = bench.points[bench.points.length - 1].date;
      const start = shiftDate(end, -cfg.lookbackDays);
      const startBar = pointOnOrBefore(bench.points, start);
      if (!startBar) throw new Error('Price history does not reach back one week.');
      const win = { start, end };
  
      let market = null;
      try { market = marketContext(bench, await api.series(cfg.riskFree, cfg.capmRange)); } catch (_) { /* CAPM card reports it */ }
  
      const loaded = await pool(FUNDS, cfg.concurrency, ([ticker]) => api.series(ticker, cfg.capmRange),
        (done, total) => showProgress(ui.status, `Loading prices… ${done}/${total}`, done / total));
  
      const funds = [], skipped = [];
      loaded.forEach((res, i) => {
        const [ticker, name, cls] = FUNDS[i];
        if (!res.ok) { skipped.push(`${ticker} (${res.error.message})`); return; }
        const s = res.value;
        if (s.name && !/vanguard/i.test(s.name)) { skipped.push(`${ticker} (resolved to “${s.name}”)`); return; }
        const week = windowReturn(s.points, start, end, 0);
        if (week == null) { skipped.push(`${ticker} (no full week of prices)`); return; }
        const capm = market ? capmStats(s.points, market, cfg.minHistory) : null;
        funds.push({ ticker, name, cls, week, capm, treynor: capm && capm.beta >= cfg.minBeta ? capm.treynor : null });
      });
      if (funds.length < 2) throw new Error(`Fund prices could not be loaded${skipped.length ? `. First failure: ${skipped[0]}` : ''}.`);
  
      funds.sort((a, b) => b.week - a.week);
      const top = funds[0], worst = funds[funds.length - 1];
      const best = funds.filter((f) => f.treynor != null).sort((a, b) => b.treynor - a.treynor)[0] || null;
  
      const asOf = bench.marketTime ? new Date(bench.marketTime * 1000).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : fmtDate(end);
      ui.subtitle.textContent = `${fmtDate(startBar.date)} close to ${fmtDate(end)} · ${funds.length} funds · prices as of ${asOf}`;
      ui.status.innerHTML = '';
      ui.body.innerHTML = `
        <div class="grid gap-4 md:grid-cols-2">${performerCard('top', top)}${performerCard('worst', worst)}</div>
        ${capmCard(best, cfg)}
        ${tableSection(funds.length)}
        <p class="text-xs text-slate-500">
          Returns are total returns (distributions included). Prices: Yahoo Finance. Holdings: Vanguard. Informational only, not investment advice.
          ${skipped.length ? `<br>Not included: ${esc(skipped.join(', '))}.` : ''}
        </p>`;
  
      const rows = funds.map((f) => ({
        ticker: f.ticker, name: f.name, week: f.week, treynor: f.treynor,
        beta: f.capm ? f.capm.beta : null, annual: f.capm ? f.capm.annual : null,
        expected: f.capm ? f.capm.expected : null, alpha: f.capm ? f.capm.alpha : null,
      }));
      const tbody = ui.body.querySelector('[data-slot="rows"]');
      const sort = { key: 'week', dir: -1 };
      renderRows(tbody, rows, sort);
      ui.body.querySelectorAll('[data-sort]').forEach((btn) => btn.addEventListener('click', () => {
        const key = btn.dataset.sort;
        sort.dir = sort.key === key ? -sort.dir : key === 'ticker' ? 1 : -1;
        sort.key = key;
        renderRows(tbody, rows, sort);
      }));
  
      async function loadAttribution(kind, f) {
        const el = ui.body.querySelector(`[data-attribution="${kind}"]`);
        const note = (text) => { el.innerHTML = `<p class="text-sm text-slate-500">${esc(text)}</p>`; };
        if (f.cls === 'bond') { note('Holding-level attribution is not available for bond funds: individual bond prices are not published in any free data feed.'); return; }
        try {
          const a = await attribute(api, cfg, f, win, (done, total) => note(`Pricing holdings… ${done}/${total}`));
          if (!a.analysed) { note('None of this fund’s holdings could be priced.'); return; }
          el.innerHTML = attributionHTML(kind, f, a);
        } catch (err) {
          note(`Holdings could not be loaded (${err.message || err}).`);
        }
      }
      await Promise.all([loadAttribution('top', top), loadAttribution('worst', worst)]);
    }
  
    async function run() {
      if (running) return;
      running = true;
      ui.refresh.disabled = true;
      ui.body.innerHTML = '';
      try {
        if (!cfg.proxy) throw new Error('No proxy configured. Set data-proxy="https://YOUR-WORKER.workers.dev/?url=" on the mount element.');
        await load();
      } catch (err) {
        showError(ui.status, err.message || String(err));
      } finally {
        running = false;
        ui.refresh.disabled = false;
      }
    }
  
    ui.refresh.addEventListener('click', run);
    run();
  }
  
  document.querySelectorAll('[data-vanguard-weekly]').forEach((el) => {
    mountVanguardWeekly(el, el.dataset.proxy ? { proxy: el.dataset.proxy } : {});
  });