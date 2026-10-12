// Collects RAW data only; all analysis happens in the browser.
// Prices: Yahoo Finance chart endpoint (unofficial, no key).
// Holdings: Alpha Vantage ETF_PROFILE (free key, 25 req/day), refreshed on a rolling basis.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { FUNDS, MARKET_PROXY, RISK_FREE } from './vanguard-funds.mjs';

const OUT_FILE = 'data/market-data.json';
const AV_KEY = process.env.ALPHAVANTAGE_KEY;
const HOLDINGS_PER_FUND = 25;
const HOLDINGS_MAX_AGE_DAYS = 7;
const AV_CALLS_PER_RUN = 20;      // stay under the free tier's 25/day
const AV_DELAY_MS = 15_000;
const YAHOO_DELAY_MS = 350;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

async function fetchJson(url, retries = 4) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (vanguard-weekly data job)' } });
    if (res.ok) return res.json();
    if (attempt >= retries || ![429, 500, 502, 503, 504].includes(res.status)) {
      throw new Error(`HTTP ${res.status} for ${url.replace(/apikey=[^&]+/, 'apikey=***')}`);
    }
    await sleep(1000 * 2 ** attempt);
  }
}

// Daily adjusted closes -> { d: ['YYYY-MM-DD', ...], c: [price, ...] }
async function yahooDaily(symbol, range) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
              `?range=${range}&interval=1d&events=div%2Csplit&includeAdjustedClose=true`;
  const json = await fetchJson(url);
  const r = json?.chart?.result?.[0];
  if (!r?.timestamp?.length) throw new Error(`No data for ${symbol}`);
  const px = r.indicators?.adjclose?.[0]?.adjclose ?? r.indicators?.quote?.[0]?.close;
  const offset = r.meta?.gmtoffset ?? 0;
  const byDate = new Map();
  r.timestamp.forEach((ts, i) => {
    const v = px?.[i];
    if (typeof v !== 'number' || !Number.isFinite(v)) return;
    byDate.set(new Date((ts + offset) * 1000).toISOString().slice(0, 10), +v.toFixed(4));
  });
  const d = [...byDate.keys()].sort();
  return { d, c: d.map((k) => byDate.get(k)) };
}

// US tickers only (BRK.B -> BRK-B). Foreign listings like "2330" can't be mapped and are skipped.
const toYahooSymbol = (s) => (/^[A-Z]{1,5}([./][A-Z]{1,2})?$/.test(s) ? s.replace(/[./]/, '-') : null);

async function fetchHoldings(ticker) {
  const url = `https://www.alphavantage.co/query?function=ETF_PROFILE&symbol=${ticker}&apikey=${AV_KEY}`;
  const json = await fetchJson(url);
  if (!Array.isArray(json.holdings)) {
    const msg = json.Information || json.Note || json['Error Message'] || 'no holdings returned';
    const err = new Error(msg);
    err.rateLimited = /rate limit|requests per day|premium/i.test(msg);
    throw err;
  }
  let items = json.holdings
    .map((h) => ({ s: String(h.symbol ?? '').trim(), n: String(h.description ?? '').trim(), w: Number(h.weight) }))
    .filter((h) => h.s && h.s.toLowerCase() !== 'n/a' && Number.isFinite(h.w) && h.w > 0);
  if (items.reduce((sum, h) => sum + h.w, 0) > 1.5) items = items.map((h) => ({ ...h, w: h.w / 100 })); // % -> fraction
  return items
    .sort((a, b) => b.w - a.w)
    .slice(0, HOLDINGS_PER_FUND)
    .map((h) => ({ ...h, w: +h.w.toFixed(6), y: toYahooSymbol(h.s) }));
}

async function main() {
  const prev = await readFile(OUT_FILE, 'utf8').then(JSON.parse).catch(() => null);

  // 1) 1-year price histories: funds + market proxy + risk-free
  const series = {};
  const failures = [];
  for (const sym of new Set([...FUNDS.map((f) => f.ticker), MARKET_PROXY, RISK_FREE])) {
    try {
      series[sym] = await yahooDaily(sym, '1y');
    } catch (e) {
      failures.push({ symbol: sym, error: e.message });
      log('WARN', sym, e.message);
      if (prev?.series?.[sym]) series[sym] = prev.series[sym]; // browser drops stale series automatically
    }
    await sleep(YAHOO_DELAY_MS);
  }
  const failed = new Set(failures.map((f) => f.symbol));
  const freshFunds = FUNDS.filter((f) => !failed.has(f.ticker)).length;
  if (failed.has(MARKET_PROXY) || failed.has(RISK_FREE) || freshFunds < FUNDS.length * 0.8) {
    console.error('Too many price failures; keeping the previous data file.');
    process.exit(1);
  }

  // 2) Holdings for equity funds, rolling refresh of the stalest entries
  const equity = FUNDS.filter((f) => f.assetClass === 'equity');
  const holdings = {};
  for (const f of equity) if (prev?.holdings?.[f.ticker]) holdings[f.ticker] = prev.holdings[f.ticker];
  const fetchedAt = (t) => (holdings[t]?.fetchedAt ? Date.parse(holdings[t].fetchedAt) : 0);

  if (!AV_KEY) {
    log('ALPHAVANTAGE_KEY not set; skipping holdings refresh');
  } else {
    const stale = equity
      .filter((f) => Date.now() - fetchedAt(f.ticker) > HOLDINGS_MAX_AGE_DAYS * 864e5)
      .sort((a, b) => fetchedAt(a.ticker) - fetchedAt(b.ticker))
      .slice(0, AV_CALLS_PER_RUN);
    for (const [i, f] of stale.entries()) {
      if (i) await sleep(AV_DELAY_MS);
      try {
        holdings[f.ticker] = { fetchedAt: new Date().toISOString(), items: await fetchHoldings(f.ticker) };
        log('holdings', f.ticker, holdings[f.ticker].items.length);
      } catch (e) {
        log('WARN holdings', f.ticker, e.message);
        if (e.rateLimited) break;
      }
    }
  }

  // 3) Recent prices for every mappable holding (union across funds)
  const holdingSymbols = new Set(Object.values(holdings).flatMap((h) => h.items.map((x) => x.y).filter(Boolean)));
  const holdingSeries = {};
  for (const y of holdingSymbols) {
    try { holdingSeries[y] = await yahooDaily(y, '1mo'); } catch (e) { log('WARN', y, e.message); }
    await sleep(YAHOO_DELAY_MS);
  }

  await mkdir('data', { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify({
    generatedAt: new Date().toISOString(),
    sources: { prices: 'Yahoo Finance (adjusted close)', holdings: 'Alpha Vantage ETF_PROFILE' },
    marketProxy: MARKET_PROXY,
    riskFree: RISK_FREE,
    funds: FUNDS,
    series,
    holdings,
    holdingSeries,
    failures,
  }));
  log(`Wrote ${OUT_FILE}: ${Object.keys(series).length} series, ${holdingSymbols.size} holding symbols`);
}

main().catch((e) => { console.error(e); process.exit(1); });