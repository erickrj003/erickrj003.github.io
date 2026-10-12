// Usage: <vanguard-weekly src="data/market-data.json"></vanguard-weekly>
// Light DOM (no Shadow DOM) so your site's Tailwind styles apply.

const CFG = {
    topN: 5,            // contributors shown per performer
    betaWindow: 252,    // ~1 trading year of daily returns for beta
    minBeta: 0.3,       // Treynor is meaningless for near-zero beta (e.g. short Treasuries)
    staleHours: 96,     // amber badge if data is older than this (covers weekends)
  };
  
  /* ---------- formatting ---------- */
  const isNum = (x) => typeof x === 'number' && Number.isFinite(x);
  const signedPct = (x, d = 2) => (isNum(x) ? `${x > 0 ? '+' : ''}${(x * 100).toFixed(d)}%` : '—');
  const plainPct = (x, d = 1) => (isNum(x) ? `${(x * 100).toFixed(d)}%` : '—');
  const bp = (x) => (isNum(x) ? `${x > 0 ? '+' : ''}${(x * 1e4).toFixed(1)} bp` : '—');
  const fix = (x, d = 2) => (isNum(x) ? x.toFixed(d) : '—');
  const tone = (x) => (!isNum(x) || x === 0 ? 'text-slate-600' : x > 0 ? 'text-emerald-600' : 'text-rose-600');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const fmtDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  
  /* ---------- time-series helpers ---------- */
  const shiftDays = (iso, n) => {
    const t = new Date(`${iso}T00:00:00Z`);
    t.setUTCDate(t.getUTCDate() + n);
    return t.toISOString().slice(0, 10);
  };
  
  function lastOnOrBefore(s, date) {
    if (!s) return null;
    for (let i = s.d.length - 1; i >= 0; i--) if (s.d[i] <= date) return { date: s.d[i], price: s.c[i] };
    return null;
  }
  
  function periodReturn(s, from, to) {
    const a = lastOnOrBefore(s, from);
    const b = lastOnOrBefore(s, to);
    return a && b && b.date > a.date ? b.price / a.price - 1 : null;
  }
  
  /* ---------- CAPM: beta via OLS on daily excess returns ---------- */
  function capm(fund, market, rfYieldOn, window) {
    const m = new Map(market.d.map((d, i) => [d, market.c[i]]));
    const pts = [];
    fund.d.forEach((d, i) => { if (m.has(d)) pts.push([d, fund.c[i], m.get(d)]); });
    const p = pts.slice(-(window + 1));
    if (p.length < 61) return null; // need ~3 months minimum
  
    const x = [], y = [];
    let gF = 1, gM = 1, rfSum = 0;
    for (let i = 1; i < p.length; i++) {
      const rf = rfYieldOn(p[i][0]) / 252;
      const rF = p[i][1] / p[i - 1][1] - 1;
      const rM = p[i][2] / p[i - 1][2] - 1;
      y.push(rF - rf);
      x.push(rM - rf);
      gF *= 1 + rF; gM *= 1 + rM; rfSum += rf;
    }
    const n = x.length;
    const mx = x.reduce((a, b) => a + b, 0) / n;
    const my = y.reduce((a, b) => a + b, 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - mx, dy = y[i] - my;
      sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
    }
    const beta = sxy / sxx;
    const annualize = (g) => g ** (252 / n) - 1;
    const R = annualize(gF), Rm = annualize(gM), rf = (rfSum / n) * 252;
    const expected = rf + beta * (Rm - rf); // CAPM required return
    return { beta, r2: (sxy * sxy) / (sxx * syy), R, Rm, rf, expected, alpha: R - expected, treynor: (R - rf) / beta, n };
  }
  
  /* ---------- attribution: weight x weekly return ---------- */
  function drivers(fund, data, from, to, sign) {
    const h = data.holdings?.[fund.ticker];
    if (!h?.items?.length) {
      return {
        items: [],
        note: fund.assetClass === 'bond'
          ? 'Holding-level attribution isn’t available for bond funds (individual bonds have no free daily prices).'
          : 'Holdings for this fund haven’t been cached yet (they refresh on a rolling basis).',
      };
    }
    const priced = h.items
      .map((x) => {
        const r = x.y ? periodReturn(data.holdingSeries?.[x.y], from, to) : null;
        return r == null ? null : { ...x, r, c: x.w * r };
      })
      .filter(Boolean);
    const base = { analyzed: h.items.length, priced: priced.length, holdingsDate: h.fetchedAt,
                   coverage: priced.reduce((s, x) => s + x.w, 0) };
    if (!priced.length) {
      return { ...base, items: [], note: 'Holdings couldn’t be matched to price data (typical for non-U.S. listings).' };
    }
    const items = priced
      .filter((x) => sign * x.c > 0)
      .sort((a, b) => sign * (b.c - a.c))
      .slice(0, CFG.topN);
    return { ...base, items, note: items.length ? '' : 'None of the priced holdings moved in this direction.' };
  }
  
  /* ---------- analysis ---------- */
  function analyze(data) {
    const market = data.series?.[data.marketProxy];
    if (!market?.d?.length) throw new Error('Market proxy series missing from data file.');
    const irx = data.series[data.riskFree];
    const rfYieldOn = (date) => { const p = lastOnOrBefore(irx, date); return p ? p.price / 100 : 0; };
  
    const asOf = market.d.at(-1);
    const from = shiftDays(asOf, -7);
    const weekStart = lastOnOrBefore(market, from)?.date;
    const Rm_w = periodReturn(market, from, asOf);
    const rf_w = rfYieldOn(asOf) * (7 / 365);
  
    const rows = [], skipped = [];
    for (const f of data.funds) {
      const s = data.series[f.ticker];
      const week = s && s.d.at(-1) === asOf ? periodReturn(s, from, asOf) : null;
      if (week == null) { skipped.push(f.ticker); continue; }
      const c = capm(s, market, rfYieldOn, CFG.betaWindow);
      const weekExpected = c ? rf_w + c.beta * (Rm_w - rf_w) : null;
      rows.push({ ...f, week, capm: c, weekAlpha: c ? week - weekExpected : null });
    }
    if (rows.length < 2) throw new Error('Not enough fresh fund data to compare.');
    rows.sort((a, b) => b.week - a.week);
  
    const best = rows[0];
    const worst = rows.at(-1);
    const eligible = rows.filter((r) => r.capm && r.capm.beta >= CFG.minBeta && isNum(r.capm.treynor));
    const capmBest = eligible.reduce((a, b) => (!a || b.capm.treynor > a.capm.treynor ? b : a), null);
  
    return {
      asOf, weekStart, Rm_w, rows, skipped, best, worst, capmBest,
      eligibleCount: eligible.length,
      marketProxy: data.marketProxy,
      bestDrivers: drivers(best, data, from, asOf, +1),
      worstDrivers: drivers(worst, data, from, asOf, -1),
    };
  }
  
  /* ---------- rendering ---------- */
  const stat = (label, value, cls = 'text-slate-900') =>
    `<div><dt class="text-xs text-slate-500">${label}</dt><dd class="mt-0.5 font-semibold tabular-nums ${cls}">${value}</dd></div>`;
  
  function performerCard(label, f, d, subtitle) {
    const list = d.items.length
      ? `<ul class="mt-3 divide-y divide-slate-100">${d.items.map((x) => `
          <li class="flex items-center justify-between gap-3 py-2">
            <div class="min-w-0">
              <span class="font-mono text-sm font-semibold text-slate-900">${esc(x.s)}</span>
              <p class="truncate text-xs text-slate-500">${esc(x.n)}</p>
            </div>
            <div class="shrink-0 text-right tabular-nums">
              <div class="text-sm font-medium ${tone(x.c)}">${bp(x.c)}</div>
              <div class="text-xs text-slate-400">${plainPct(x.w, 2)} wt · ${signedPct(x.r)}</div>
            </div>
          </li>`).join('')}</ul>`
      : `<p class="mt-3 text-sm text-slate-500">${esc(d.note)}</p>`;
  
    const foot = d.analyzed
      ? `<p class="mt-3 text-xs text-slate-400">Contribution ≈ weight × weekly return, from the top ${d.analyzed} holdings
         (${d.priced} priced, ${plainPct(d.coverage)} of assets). Weights as of ${fmtDate(d.holdingsDate.slice(0, 10))}.</p>`
      : '';
  
    return `
      <article class="rounded-xl border border-slate-200 p-5">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${label}</p>
        <div class="mt-1 flex items-start justify-between gap-3">
          <div class="min-w-0">
            <span class="font-mono text-2xl font-bold text-slate-900">${esc(f.ticker)}</span>
            <p class="truncate text-sm text-slate-600">Vanguard ${esc(f.name)}</p>
          </div>
          <span class="text-2xl font-semibold tabular-nums ${tone(f.week)}">${signedPct(f.week)}</span>
        </div>
        <h3 class="mt-4 text-sm font-medium text-slate-700">${subtitle}</h3>
        ${list}${foot}
      </article>`;
  }
  
  function capmCard(m) {
    const w = m.capmBest;
    if (!w) return `<div class="rounded-xl border border-slate-200 p-5 text-sm text-slate-500">Not enough price history to estimate CAPM betas.</div>`;
    const c = w.capm;
    return `
      <div class="rounded-xl border border-indigo-200 bg-indigo-50/60 p-5">
        <p class="text-xs font-semibold uppercase tracking-wide text-indigo-700">Best reward-to-risk · CAPM Treynor ratio</p>
        <div class="mt-2 flex flex-wrap items-baseline gap-x-3">
          <span class="font-mono text-2xl font-bold text-slate-900">${esc(w.ticker)}</span>
          <span class="text-slate-600">Vanguard ${esc(w.name)}</span>
        </div>
        <dl class="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-6">
          ${stat('Treynor ratio', fix(c.treynor, 3))}
          ${stat('Beta (β)', fix(c.beta))}
          ${stat('R²', fix(c.r2))}
          ${stat('Realized return (ann.)', signedPct(c.R), tone(c.R))}
          ${stat('CAPM required return', signedPct(c.expected))}
          ${stat('Jensen’s α', signedPct(c.alpha), tone(c.alpha))}
        </dl>
        <p class="mt-4 text-xs leading-relaxed text-slate-500">
          β estimated from ${c.n} daily excess returns vs. ${esc(m.marketProxy)}; risk-free rate = 13-week T-bill
          (avg ${plainPct(c.rf, 2)}). CAPM required return = r<sub>f</sub> + β(R<sub>m</sub> − r<sub>f</sub>).
          Treynor = (R − r<sub>f</sub>) / β, ranked across ${m.eligibleCount} funds with β ≥ ${CFG.minBeta}.
          Under CAPM every fund’s <em>expected</em> excess return per unit of β is identical (the market premium),
          so the ranking uses realized returns.
        </p>
      </div>`;
  }
  
  function rankingTable(m) {
    const rows = m.rows.map((r, i) => `
      <tr class="border-t border-slate-100 ${r === m.capmBest ? 'bg-indigo-50/50' : ''}">
        <td class="py-1.5 pr-3 tabular-nums text-slate-400">${i + 1}</td>
        <td class="py-1.5 pr-3 font-mono font-semibold text-slate-900">${esc(r.ticker)}</td>
        <td class="py-1.5 pr-3 text-slate-600">${esc(r.name)}</td>
        <td class="py-1.5 pr-3 text-right tabular-nums ${tone(r.week)}">${signedPct(r.week)}</td>
        <td class="py-1.5 pr-3 text-right tabular-nums">${fix(r.capm?.beta)}</td>
        <td class="py-1.5 pr-3 text-right tabular-nums ${tone(r.weekAlpha)}">${signedPct(r.weekAlpha)}</td>
        <td class="py-1.5 text-right tabular-nums">${r.capm && r.capm.beta >= CFG.minBeta ? fix(r.capm.treynor, 3) : '—'}</td>
      </tr>`).join('');
  
    return `
      <details class="rounded-xl border border-slate-200">
        <summary class="cursor-pointer select-none px-5 py-3 text-sm font-medium text-slate-700">
          All ${m.rows.length} funds ranked by weekly return
        </summary>
        <div class="overflow-x-auto px-5 pb-4">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs uppercase tracking-wide text-slate-400">
                <th class="py-2 pr-3">#</th><th class="py-2 pr-3">Fund</th><th class="py-2 pr-3">Name</th>
                <th class="py-2 pr-3 text-right">1W</th><th class="py-2 pr-3 text-right">β</th>
                <th class="py-2 pr-3 text-right">1W α</th><th class="py-2 text-right">Treynor</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          ${m.skipped.length ? `<p class="mt-3 text-xs text-slate-400">Skipped (no fresh price data): ${m.skipped.map(esc).join(', ')}</p>` : ''}
        </div>
      </details>`;
  }
  
  function render(m, data) {
    const ageH = (Date.now() - Date.parse(data.generatedAt)) / 36e5;
    const badge = ageH > CFG.staleHours
      ? `<span class="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">Data is ${Math.round(ageH / 24)} days old</span>`
      : `<span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">Updated ${new Date(data.generatedAt).toLocaleString()}</span>`;
  
    return `
      <section class="mx-auto max-w-5xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-xl font-semibold text-slate-900">Vanguard index funds: last week</h2>
            <p class="text-sm text-slate-500">
              ${fmtDate(m.weekStart)} → ${fmtDate(m.asOf)} close · ${m.rows.length} funds ·
              market (${esc(m.marketProxy)}) <span class="${tone(m.Rm_w)}">${signedPct(m.Rm_w)}</span>
            </p>
          </div>
          ${badge}
        </header>
        <div class="grid gap-6 md:grid-cols-2">
          ${performerCard('Top performer', m.best, m.bestDrivers, 'Largest contributing gains')}
          ${performerCard('Worst performer', m.worst, m.worstDrivers, 'Largest contributing losses')}
        </div>
        ${capmCard(m)}
        ${rankingTable(m)}
        <p class="text-xs text-slate-400">
          Total returns from adjusted closing prices (${esc(data.sources?.prices ?? '')}); holdings from ${esc(data.sources?.holdings ?? '')}.
          For information only, not investment advice.
        </p>
      </section>`;
  }
  
  const skeleton = `
    <div class="mx-auto max-w-5xl animate-pulse space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <div class="h-6 w-1/3 rounded bg-slate-200"></div>
      <div class="grid gap-6 md:grid-cols-2"><div class="h-56 rounded-xl bg-slate-100"></div><div class="h-56 rounded-xl bg-slate-100"></div></div>
      <div class="h-32 rounded-xl bg-slate-100"></div>
    </div>`;
  
  class VanguardWeekly extends HTMLElement {
    connectedCallback() {
      if (this._initialized) return;
      this._initialized = true;
      this.innerHTML = skeleton;
      this.load();
    }
  
    async load() {
      const src = this.getAttribute('src') || 'data/market-data.json';
      try {
        const res = await fetch(src, { cache: 'no-cache' }); // revalidate so new daily data shows up
        if (!res.ok) throw new Error(`HTTP ${res.status} loading ${src}`);
        const data = await res.json();
        this.innerHTML = render(analyze(data), data);
      } catch (err) {
        console.error(err);
        this.innerHTML = `<div class="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Couldn’t load fund data: ${esc(err.message)}</div>`;
      }
    }
  }
  
  if (!customElements.get('vanguard-weekly')) customElements.define('vanguard-weekly', VanguardWeekly);