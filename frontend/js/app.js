// ============================================================
// Finance Tracker — Frontend JS
// ============================================================
const API = 'http://localhost:3001/api';

// ── Category icon map (avoids emoji corruption in SQL Server) ─
const CAT_ICONS = {
  // Income
  'Salary':       '💼',
  'Bonus':        '🎯',
  'Interest':     '📈',
  'Other Income': '💰',
  // Expense
  'Rent':         '🏠',
  'Food':         '🍽',
  'Utilities':    '⚡',
  'Travel':       '✈',
  'Shopping':     '🛍',
  'Insurance':    '🛡',
  'Credit Card Bill': '💳',
  'Other':        '📌',
};
function catIcon(name) { return CAT_ICONS[name] || ''; }

// ── Helpers ──────────────────────────────────────────────────
const fmt     = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtNum  = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateInput = (d) => d ? new Date(d).toISOString().slice(0, 10) : '';

// ── Privacy mask ─────────────────────────────────────────────
let _valuesVisible = false;

function toggleVisibility() {
  _valuesVisible = !_valuesVisible;
  const btn = document.getElementById('visibility-btn');
  if (btn) {
    btn.title     = _valuesVisible ? 'Hide values' : 'Show values';
    btn.innerHTML = _valuesVisible
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  }
  // Re-render the current page with new visibility state
  const activePage = document.querySelector('.page.active');
  if (activePage) {
    const pageId = activePage.id.replace('page-', '');
    loadPage(pageId);
  }
}

// Returns masked value or real formatted value
function mfmt(n) {
  return _valuesVisible ? fmt(n) : '<span class="masked-value">₹••••••</span>';
}
// For plain numbers (e.g. gain/loss prefix)
function mfmtSigned(n) {
  if (!_valuesVisible) return '<span class="masked-value">₹••••••</span>';
  return (n >= 0 ? '+' : '') + fmt(n);
}
// Masks sensitive identity strings (account numbers, UAN, card digits)
function mmask(val, fallback = '—') {
  if (!val) return fallback;
  return _valuesVisible ? val : '<span class="masked-value">••••••</span>';
}

// Safe getElementById — never throws on null
function el(id)    { return document.getElementById(id); }
function setText(id, val) { const e = el(id); if (e) e.textContent = val; }
function setHTML(id, val) { const e = el(id); if (e) e.innerHTML   = val; }

async function apiFetch(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

function showToast(msg, isError = false) {
  const t = el('toast');
  t.textContent = msg;
  t.style.background = isError ? '#dc2626' : '#1e293b';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Navigation ────────────────────────────────────────────────
function navigate(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('#sidebar nav a').forEach(a => a.classList.remove('active'));
  const page = el('page-' + pageId);
  if (page) page.classList.add('active');
  const link = document.querySelector(`#sidebar nav a[data-page="${pageId}"]`);
  if (link) link.classList.add('active');
  setText('topbar-title', link?.dataset.label || 'Dashboard');
  loadPage(pageId);
}

function loadPage(pageId) {
  const loaders = {
    dashboard:    loadDashboard,
    accounts:     loadAccounts,
    cash:         loadCash,
    fd:           loadFD,
    rd:           loadRD,
    investments:  loadInvestments,
    creditcards:  loadCreditCards,
    loans:        loadLoans,
    transactions: loadTransactions,
    epfo:         loadEPFO,
    incometax:    loadIncomeTax,
    notes:        loadNotes,
  };
  if (loaders[pageId]) loaders[pageId]();
}

// ── MODAL helpers ─────────────────────────────────────────────
let _modalSubmitFn = null;
function openModal(title, bodyHtml, submitLabel, onSubmit) {
  setText('modal-title', title);
  setHTML('modal-body', bodyHtml);
  setText('modal-submit', submitLabel);
  _modalSubmitFn = onSubmit;
  el('modal-overlay').classList.add('open');
}
function closeModal() {
  el('modal-overlay').classList.remove('open');
  _modalSubmitFn = null;
}
function modalVal(id) { const e = el(id); return e ? e.value : ''; }

// ── DASHBOARD ─────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const d = await apiFetch('/dashboard');
    renderNetWorth(d);
    renderBankCards(d.bankAccounts);
    renderMonthlyChart(d.monthlyFlow);
    renderNWTrend(d);
    renderFDAlerts(d.fdAlerts);
    renderRDAlerts(d.rdAlerts);
    renderExpenseDonut(d.expenseBreakdown);
    renderRecentTx(d.recentTransactions);
    renderQuickStats(d);
    renderPendingActions(d.pendingActions || []);
  } catch (e) {
    showToast('Error loading dashboard: ' + e.message, true);
  }
}

function renderPendingActions(items) {
  const container = el('dash-pending-actions');
  const card      = el('dash-actions-card');
  if (!container) return;

  // Hide the whole card if nothing pending
  if (!items.length) {
    if (card) card.style.display = 'none';
    return;
  }
  if (card) card.style.display = '';

  const TYPE_ICON = { Reminder: '🔔', Todo: '✅' };
  const PRI_COLOR = { High: 'var(--red)', Medium: 'var(--amber)', Low: 'var(--green)' };

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">
      ${items.map(n => {
        const isOverdue  = n.DueDate && new Date(n.DueDate) < new Date();
        const dueLine    = n.DueDate
          ? `<span style="font-size:11px;color:${isOverdue ? 'var(--red)' : 'var(--muted)'}">
               📅 ${fmtDate(n.DueDate)}${isOverdue ? ' — Overdue' : ''}
             </span>`
          : '';
        const amtLine    = n.Amount
          ? `<span style="font-size:11px;color:var(--muted)">💰 ${mfmt(n.Amount)}</span>`
          : '';
        const priDot     = `<span style="width:8px;height:8px;border-radius:50%;background:${PRI_COLOR[n.Priority] || 'var(--muted)'};display:inline-block;flex-shrink:0;margin-top:3px"></span>`;
        const borderTop  = n.Priority === 'High' ? '3px solid var(--red)' : '3px solid var(--border)';
        return `
          <div style="background:var(--surface);border:1px solid var(--border);border-top:${borderTop};border-radius:var(--radius);padding:14px 16px;display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;align-items:flex-start;gap:8px">
              <span style="font-size:16px;line-height:1.3">${TYPE_ICON[n.NoteType] || '📝'}</span>
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;font-size:13.5px;line-height:1.4">${n.Title}</div>
                ${n.Body ? `<div style="font-size:12px;color:var(--muted);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n.Body}</div>` : ''}
              </div>
              <div style="display:flex;align-items:center;gap:4px;flex-shrink:0">
                ${priDot}
                <span style="font-size:10px;font-weight:600;color:${PRI_COLOR[n.Priority] || 'var(--muted)'}">${n.Priority}</span>
              </div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
              <span class="badge ${n.NoteType === 'Reminder' ? 'badge-blue' : 'badge-purple'}">${n.NoteType}</span>
              ${dueLine}
              ${amtLine}
            </div>
            <div style="display:flex;gap:6px;margin-top:2px">
              <button class="btn btn-ghost btn-sm" style="flex:1" onclick="dashMarkDone(${n.NoteID})">✔ Mark Done</button>
              <button class="btn btn-ghost btn-sm" onclick="navigate('notes')">View →</button>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

async function dashMarkDone(id) {
  const n = await apiFetch('/notes/' + id);
  await apiFetch('/notes/' + id, { method: 'PUT', body: JSON.stringify({ ...n, Status: 'Done' }) });
  showToast('Marked as done! ✔');
  loadDashboard();   // refresh dashboard so card updates / hides
}

function renderNetWorth(d) {
  const totalExpense = parseFloat(d.totalExpense || 0);
  const totalIncome  = parseFloat(d.totalIncome  || 0);
  const netFlow      = totalIncome - totalExpense; // positive = net saved overall
  setHTML('dash-total-nw', mfmt(d.totalNetWorth));

  // Show expense impact line in hero sub-text
  const heroSub = document.querySelector('#page-dashboard .dash-hero-card.blue .dash-hero-sub');
  if (heroSub) {
    heroSub.innerHTML = `All assets combined &nbsp;·&nbsp;
      <span style="color:${netFlow >= 0 ? 'rgba(255,255,255,.85)' : 'rgba(255,200,200,.9)'}">
        ${netFlow >= 0 ? '▲' : '▼'} ${_valuesVisible ? fmt(Math.abs(netFlow)) : '••••••'} net ${netFlow >= 0 ? 'saved' : 'spent'} all-time
      </span>`;
  }

  const colors = ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2'];
  const list = el('dash-nw-bars');
  if (!list) return;
  list.innerHTML = '';
  d.netWorthBreakdown.forEach((r, i) => {
    const pct = d.totalNetWorth > 0 ? (r.TotalValue / d.totalNetWorth * 100).toFixed(1) : 0;
    list.innerHTML += `
      <div class="nw-bar-item">
        <div class="nw-bar-label">
          <span>${r.Category}</span>
          <span style="font-weight:600">${mfmt(r.TotalValue)}</span>
        </div>
        <div class="nw-bar-track">
          <div class="nw-bar-fill" style="width:${pct}%;background:${colors[i % colors.length]}"></div>
        </div>
      </div>`;
  });
  // Expense impact row in breakdown card
  const expRow = el('dash-nw-expense-row');
  if (expRow) {
    expRow.innerHTML = `
      <div class="nw-bar-item" style="margin-bottom:6px">
        <div class="nw-bar-label">
          <span style="color:var(--red)">▼ Total Expenses (all-time)</span>
          <span style="font-weight:600;color:var(--red)">${mfmt(totalExpense)}</span>
        </div>
      </div>
      <div class="nw-bar-item" style="margin-bottom:6px">
        <div class="nw-bar-label">
          <span style="color:var(--green)">▲ Total Income (all-time)</span>
          <span style="font-weight:600;color:var(--green)">${mfmt(totalIncome)}</span>
        </div>
      </div>`;
  }
  // Hero breakdown chips (asset categories)
  const heroBreak = el('dash-nw-hero-breakdown');
  if (heroBreak) {
    heroBreak.innerHTML = d.netWorthBreakdown.map((r, i) => `
      <span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;opacity:.85;margin-right:8px;margin-top:6px">
        <span style="width:8px;height:8px;border-radius:50%;background:${colors[i%colors.length]};display:inline-block"></span>
        ${r.Category}: ${mfmt(r.TotalValue)}
      </span>`).join('');
  }
}

function renderNWTrend(d) {
  const container = el('dash-nw-trend-chart');
  const meta      = el('dash-nw-trend-meta');
  if (!container) return;

  const trend = d.netWorthTrend || [];
  if (!trend.length) {
    container.innerHTML = '<p style="color:var(--muted);font-size:13px;text-align:center;padding:24px 0">Not enough transaction data yet to show a trend.</p>';
    return;
  }

  const values   = trend.map(t => parseFloat(t.EstimatedNetWorth));
  const labels   = trend.map(t => t.MonthLabel);
  const minVal   = Math.min(...values);
  const maxVal   = Math.max(...values);
  const range    = maxVal - minVal || 1;
  const first    = values[0];
  const last     = values[values.length - 1];
  const change   = last - first;
  const changePct = first !== 0 ? ((change / Math.abs(first)) * 100).toFixed(1) : 0;
  const trending  = change >= 0;

  // Meta chips
  if (meta) {
    meta.innerHTML = `
      <span>Start: <strong>${_valuesVisible ? fmt(first) : '••••••'}</strong></span>
      <span>Now: <strong>${_valuesVisible ? fmt(last) : '••••••'}</strong></span>
      <span style="color:${trending ? 'var(--green)' : 'var(--red)'};font-weight:600">
        ${trending ? '▲' : '▼'} ${_valuesVisible ? fmt(Math.abs(change)) : '••••'} (${Math.abs(changePct)}%)
      </span>`;
  }

  // SVG line chart
  const W = 780, H = 160, PAD = { top: 20, right: 20, bottom: 36, left: 80 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top  - PAD.bottom;
  const n = values.length;

  const xPos = (i) => PAD.left + (i / (n - 1)) * chartW;
  const yPos = (v) => PAD.top  + chartH - ((v - minVal) / range) * chartH;

  // Build polyline points
  const points = values.map((v, i) => `${xPos(i)},${yPos(v)}`).join(' ');

  // Build filled area path
  const areaPath = [
    `M ${xPos(0)},${yPos(values[0])}`,
    ...values.map((v, i) => `L ${xPos(i)},${yPos(v)}`),
    `L ${xPos(n-1)},${PAD.top + chartH}`,
    `L ${xPos(0)},${PAD.top + chartH}`,
    'Z'
  ].join(' ');

  // Y-axis guide lines & labels
  const ySteps = 4;
  const yGuides = Array.from({ length: ySteps + 1 }, (_, i) => {
    const v = minVal + (range / ySteps) * i;
    const y = yPos(v);
    const label = _valuesVisible ? (v >= 1e6 ? '₹' + (v/1e6).toFixed(1) + 'L' : v >= 1000 ? '₹' + (v/1000).toFixed(0) + 'K' : '₹' + v.toFixed(0)) : '••••';
    return `
      <line x1="${PAD.left}" y1="${y}" x2="${PAD.left + chartW}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>
      <text x="${PAD.left - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="#57606a">${label}</text>`;
  }).join('');

  // X-axis labels + dots + value tooltips
  const xLabels = labels.map((lbl, i) => {
    const x = xPos(i), y = yPos(values[i]);
    const valLabel = _valuesVisible ? (values[i] >= 1e6 ? '₹' + (values[i]/1e6).toFixed(2) + 'L' : fmt(values[i])) : '••••••';
    const isLast = i === n - 1;
    return `
      <circle cx="${x}" cy="${y}" r="5" fill="${trending ? '#16a34a' : '#dc2626'}" stroke="white" stroke-width="2"/>
      <text x="${x}" y="${y - 10}" text-anchor="middle" font-size="9" fill="#57606a" font-weight="600">${valLabel}</text>
      <text x="${x}" y="${H - 8}" text-anchor="middle" font-size="10" fill="#57606a">${lbl}</text>`;
  }).join('');

  const lineColor = trending ? '#16a34a' : '#dc2626';
  const areaColor = trending ? 'rgba(22,163,74,.08)' : 'rgba(220,38,38,.08)';

  container.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">
      <defs>
        <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${lineColor}" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="${lineColor}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${yGuides}
      <path d="${areaPath}" fill="url(#nwGrad)"/>
      <polyline points="${points}" fill="none" stroke="${lineColor}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${xLabels}
    </svg>`;
}

function renderBankCards(accounts) {
  const container = el('dash-bank-accounts');
  if (!container) return;
  if (!accounts.length) { container.innerHTML = '<p class="empty">No bank accounts added yet.</p>'; return; }
  container.innerHTML = accounts.map(a => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);">
      <div>
        <div style="font-weight:600">${a.Nickname}</div>
        <div style="font-size:12px;color:var(--muted)">${a.BankName} · <span class="badge badge-blue">${a.AccountType}</span></div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:700;color:var(--accent)">${mfmt(a.Balance)}</div>
        ${a.InterestRate ? `<div style="font-size:11px;color:var(--muted)">${a.InterestRate}% p.a.</div>` : ''}
      </div>
    </div>`).join('');
}

function renderMonthlyChart(flow) {
  const container = el('dash-monthly-chart');
  const lbl = el('dash-monthly-labels');
  if (!container || !lbl) return;
  if (!flow.length) { container.innerHTML = ''; return; }
  const maxVal = Math.max(...flow.map(f => Math.max(f.TotalIncome, f.TotalExpense)), 1);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  container.innerHTML = flow.map(f => {
    const ih = Math.round((f.TotalIncome  / maxVal) * 56);
    const eh = Math.round((f.TotalExpense / maxVal) * 56);
    const incLabel = _valuesVisible ? fmt(f.TotalIncome)  : '••••••';
    const expLabel = _valuesVisible ? fmt(f.TotalExpense) : '••••••';
    return `<div class="mini-bar-group">
      <div class="mini-bar income"  style="height:${ih}px" title="Income: ${incLabel}"></div>
      <div class="mini-bar expense" style="height:${eh}px" title="Expense: ${expLabel}"></div>
    </div>`;
  }).join('');
  lbl.innerHTML = flow.map(f => `<span>${months[f.Mo - 1]}</span>`).join('');
}

function renderFDAlerts(alerts) {
  const container = el('dash-fd-alerts');
  if (!container) return;
  if (!alerts.length) { container.innerHTML = '<p style="color:var(--muted);font-size:13px">No FDs maturing in the next 90 days.</p>'; return; }
  container.innerHTML = alerts.map(a => `
    <div class="alert ${a.DaysToMaturity <= 30 ? 'alert-red' : 'alert-amber'}">
      🔔 <div><strong>${a.BankName}</strong> FD of ${mfmt(a.Principal)} matures on ${fmtDate(a.MaturityDate)}
      (<strong>${a.DaysToMaturity} days</strong> away) — maturity: ${mfmt(a.MaturityAmount)}</div>
    </div>`).join('');
}

function renderRDAlerts(alerts) {
  const container = el('dash-rd-alerts');
  if (!container) return;
  if (!alerts.length) { container.innerHTML = '<p style="color:var(--muted);font-size:13px">No RDs maturing in the next 90 days.</p>'; return; }
  container.innerHTML = alerts.map(a => `
    <div class="alert ${a.DaysToMaturity <= 30 ? 'alert-red' : 'alert-amber'}">
      🔔 <div>
        <strong>${a.BankName}</strong>${a.AccountRef ? ' · ' + a.AccountRef : ''} RD
        (${mfmt(a.MonthlyInstallment)}/mo) matures on ${fmtDate(a.MaturityDate)}
        (<strong>${a.DaysToMaturity} days</strong> away) —
        ${a.InstallmentsPaid}/${a.TotalInstallments} installments paid,
        maturity: ${mfmt(a.ExpectedMaturityAmount)}
      </div>
    </div>`).join('');
}

function renderExpenseDonut(breakdown) {
  const container = el('dash-expense-donut');
  if (!container) return;
  if (!breakdown.length) { container.innerHTML = '<p class="empty">No expenses this month.</p>'; return; }
  const colors = ['#2563eb','#dc2626','#16a34a','#d97706','#7c3aed','#0891b2','#db2777','#ea580c'];
  const total = breakdown.reduce((s, b) => s + parseFloat(b.TotalAmount), 0);
  // cx/cy/r: keep circle centred with enough margin so strokeW/2 never reaches the viewBox edge
  // viewBox = 140×140, centre = 70,70, r = 52, strokeW = 22 → outer edge = 52+11 = 63 < 70 ✓
  const r = 52, cx = 70, cy = 70, strokeW = 22;
  const circum = 2 * Math.PI * r;
  let offset = 0;
  const segments = breakdown.map((b, i) => {
    const pct  = parseFloat(b.TotalAmount) / total;
    const dash = pct * circum;
    const seg  = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
      stroke="${colors[i % colors.length]}" stroke-width="${strokeW}"
      stroke-dasharray="${dash} ${circum - dash}"
      stroke-dashoffset="${-offset}"
      transform="rotate(-90 ${cx} ${cy})"/>`;
    offset += dash;
    return seg;
  });
  const totalLabel = _valuesVisible ? fmt(total) : '••••••';
  // width/height set to 100% so the SVG scales with the card — no fixed-pixel clipping
  const svg = `<svg width="140" height="140" viewBox="0 0 140 140" style="flex-shrink:0">${segments.join('')}
    <text x="70" y="65" text-anchor="middle" font-size="10" fill="#57606a">Total</text>
    <text x="70" y="79" text-anchor="middle" font-size="9" font-weight="700" fill="#1f2328">${totalLabel}</text>
  </svg>`;
  const legend = breakdown.map((b, i) => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${colors[i%colors.length]}"></div>
      <div style="flex:1">${catIcon(b.Category)} ${b.Category}</div>
      <div style="font-weight:600">${mfmt(b.TotalAmount)}</div>
    </div>`).join('');
  container.innerHTML = `<div class="donut-wrap">${svg}<div class="donut-legend">${legend}</div></div>`;
}

function renderRecentTx(txs) {
  const container = el('dash-recent-tx');
  if (!container) return;
  if (!txs.length) { container.innerHTML = '<p class="empty">No transactions yet.</p>'; return; }
  container.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>${txs.map(t => `
      <tr>
        <td>${fmtDate(t.TransactionDate)}</td>
        <td><span class="badge ${t.Type==='Income'?'badge-green':'badge-red'}">${t.Type}</span></td>
        <td>${catIcon(t.Category)} ${t.Category}</td>
        <td style="color:var(--muted)">${t.Description || '—'}</td>
        <td style="text-align:right;font-weight:600;color:${t.Type==='Income'?'var(--green)':'var(--red)'}">${mfmt(t.Amount)}</td>
      </tr>`).join('')}
    </tbody></table></div>`;
}

function renderQuickStats(d) {
  setText('dash-fd-count',    d.fdSummary.Count);
  setHTML('dash-fd-total',    mfmt(d.fdSummary.TotalPrincipal) + ' <span style="color:var(--muted);font-weight:400">invested</span>');
  setText('dash-rd-count',    d.rdSummary.Count);
  setHTML('dash-rd-total',    mfmt(d.rdSummary.TotalDeposited) + ' <span style="color:var(--muted);font-weight:400">deposited</span>');
  setHTML('dash-inv-invested', mfmt(d.investmentSummary.TotalInvested));
  const gain   = d.investmentSummary.TotalCurrentValue - d.investmentSummary.TotalInvested;
  const gainEl = el('dash-inv-gain');
  if (gainEl) {
    gainEl.innerHTML  = mfmtSigned(gain);
    gainEl.className  = gain >= 0 ? 'num-positive' : 'num-negative';
  }
  const totalCash = d.cash.reduce((s, c) => s + parseFloat(c.Amount || 0), 0);
  setHTML('dash-total-cash', mfmt(totalCash));

  // Credit card — hero card + stats grid
  if (d.ccSummary) {
    setHTML('dash-cc-outstanding', mfmt(d.ccSummary.TotalOutstanding));
    const avail = parseFloat(d.ccSummary.TotalLimit) - parseFloat(d.ccSummary.TotalOutstanding);
    setHTML('dash-cc-available-stat', mfmt(avail));
  }
  // Loans — hero card + stats grid
  if (d.loanSummary) {
    setHTML('dash-loan-borrowed', mfmt(d.loanSummary.TotalBorrowed));
    setHTML('dash-loan-lent', mfmt(d.loanSummary.TotalLent));
  }
  // EPFO dashboard widget
  if (d.epfoSummary) {
    setHTML('dash-epfo-balance', mfmt(d.epfoSummary.TotalBalance));
  }
  // Liabilities hero card
  const liabilities = parseFloat(d.totalLiabilities || 0);
  setHTML('dash-total-liabilities', mfmt(liabilities));
  // Liabilities bar in net worth breakdown card
  setHTML('dash-nw-liabilities-bar', mfmt(liabilities));
  const netPos = parseFloat(d.totalNetWorth || 0) - liabilities;
  setHTML('dash-nw-net-position', mfmt(netPos));
  // Income tax dashboard widget
  if (d.taxSummary) {
    setHTML('dash-tax-paid', mfmt(d.taxSummary.TotalTaxPaid));
    setText('dash-tax-years', d.taxSummary.TotalYears + ' year' + (d.taxSummary.TotalYears !== 1 ? 's' : '') + ' filed');
  }
}

// ── BANK ACCOUNTS ─────────────────────────────────────────────
async function loadAccounts() {
  try {
    const data = await apiFetch('/accounts');
    renderAccountsTable(data);
  } catch (e) { showToast(e.message, true); }
}

function renderAccountsTable(accounts) {
  const tbody = el('accounts-table-body');
  if (!tbody) return;
  if (!accounts.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty"><span class="empty-icon">🏦</span><br>No bank accounts yet. Add your first account.</td></tr>';
    return;
  }
  tbody.innerHTML = accounts.map(a => `
    <tr>
      <td><strong>${a.Nickname}</strong></td>
      <td>${a.BankName}</td>
      <td><span class="badge badge-blue">${a.AccountType}</span></td>
      <td style="font-family:monospace;font-size:12px">${mmask(a.AccountNumber)}</td>
      <td style="font-weight:700;color:var(--accent)">${mfmt(a.Balance)}</td>
      <td>${a.InterestRate ? a.InterestRate + '%' : '—'}</td>
      <td>${fmtDate(a.LastUpdated)}</td>
      <td><span class="badge ${a.IsActive?'badge-green':'badge-red'}">${a.IsActive?'Active':'Inactive'}</span></td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="editAccount(${a.AccountID})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteAccount(${a.AccountID})">Del</button>
      </td>
    </tr>`).join('');
}

function accountForm(a = {}) {
  return `
    <div class="form-row">
      <div class="form-group">
        <label>Nickname *</label>
        <input class="form-control" id="f-nickname" value="${a.Nickname||''}" placeholder="e.g. HDFC Savings" required/>
      </div>
      <div class="form-group">
        <label>Bank Name *</label>
        <input class="form-control" id="f-bank" value="${a.BankName||''}" placeholder="e.g. HDFC Bank" required/>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Account Type *</label>
        <select class="form-control" id="f-type">
          <option ${a.AccountType==='Savings'?'selected':''}>Savings</option>
          <option ${a.AccountType==='Current'?'selected':''}>Current</option>
        </select>
      </div>
      <div class="form-group">
        <label>Account Number</label>
        <input class="form-control" id="f-accno" value="${a.AccountNumber||''}" placeholder="Last 4 digits or full"/>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Balance (₹) *</label>
        <input class="form-control" id="f-balance" type="number" step="0.01" value="${a.Balance||0}" required/>
      </div>
      <div class="form-group">
        <label>Interest Rate (%)</label>
        <input class="form-control" id="f-rate" type="number" step="0.01" value="${a.InterestRate||''}" placeholder="e.g. 3.5"/>
      </div>
    </div>
    <div class="form-group">
      <label>Notes</label>
      <textarea class="form-control" id="f-notes" rows="2">${a.Notes||''}</textarea>
    </div>`;
}

function addAccount() {
  openModal('Add Bank Account', accountForm(), 'Save Account', async () => {
    const body = { Nickname: modalVal('f-nickname'), BankName: modalVal('f-bank'),
      AccountType: modalVal('f-type'), AccountNumber: modalVal('f-accno'),
      Balance: modalVal('f-balance'), InterestRate: modalVal('f-rate') || null,
      Notes: modalVal('f-notes') };
    await apiFetch('/accounts', { method: 'POST', body: JSON.stringify(body) });
    showToast('Account added!'); closeModal(); loadAccounts();
  });
}

async function editAccount(id) {
  const a = await apiFetch('/accounts/' + id);
  openModal('Edit Account', accountForm(a), 'Update Account', async () => {
    const body = { Nickname: modalVal('f-nickname'), BankName: modalVal('f-bank'),
      AccountType: modalVal('f-type'), AccountNumber: modalVal('f-accno'),
      Balance: modalVal('f-balance'), InterestRate: modalVal('f-rate') || null,
      Notes: modalVal('f-notes'), IsActive: 1 };
    await apiFetch('/accounts/' + id, { method: 'PUT', body: JSON.stringify(body) });
    showToast('Account updated!'); closeModal(); loadAccounts();
  });
}

async function deleteAccount(id) {
  if (!confirm('Delete this account?')) return;
  await apiFetch('/accounts/' + id, { method: 'DELETE' });
  showToast('Account deleted!'); loadAccounts();
}

// ── CASH ──────────────────────────────────────────────────────
async function loadCash() {
  try {
    const data = await apiFetch('/cash');
    renderCashTable(data);
  } catch (e) { showToast(e.message, true); }
}

function renderCashTable(items) {
  const tbody = el('cash-table-body');
  if (!tbody) return;
  const total = items.reduce((s, c) => s + parseFloat(c.Amount || 0), 0);
  setHTML('cash-total', mfmt(total));
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty"><span class="empty-icon">💵</span><br>No cash entries yet.</td></tr>';
    return;
  }
  tbody.innerHTML = items.map(c => `
    <tr>
      <td><strong>${c.Category}</strong></td>
      <td style="font-weight:700;color:var(--green)">${mfmt(c.Amount)}</td>
      <td style="color:var(--muted)">${c.Notes || '—'}</td>
      <td>${fmtDate(c.LastUpdated)}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="editCash(${c.CashID})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteCash(${c.CashID})">Del</button>
      </td>
    </tr>`).join('');
}

function cashForm(c = {}) {
  return `
    <div class="form-row">
      <div class="form-group">
        <label>Category *</label>
        <select class="form-control" id="f-cat">
          <option ${c.Category==='Cash in Hand'?'selected':''}>Cash in Hand</option>
          <option ${c.Category==='Wallet'?'selected':''}>Wallet</option>
          <option ${c.Category==='Emergency Cash'?'selected':''}>Emergency Cash</option>
          <option ${c.Category==='Other'?'selected':''}>Other</option>
        </select>
      </div>
      <div class="form-group">
        <label>Amount (₹) *</label>
        <input class="form-control" id="f-amount" type="number" step="0.01" value="${c.Amount||0}" required/>
      </div>
    </div>
    <div class="form-group">
      <label>Notes</label>
      <textarea class="form-control" id="f-notes" rows="2">${c.Notes||''}</textarea>
    </div>`;
}

function addCash() {
  openModal('Add Cash Holding', cashForm(), 'Save', async () => {
    await apiFetch('/cash', { method: 'POST', body: JSON.stringify({
      Category: modalVal('f-cat'), Amount: modalVal('f-amount'), Notes: modalVal('f-notes') }) });
    showToast('Cash entry added!'); closeModal(); loadCash();
  });
}

async function editCash(id) {
  const c = await apiFetch('/cash/' + id);
  openModal('Edit Cash Holding', cashForm(c), 'Update', async () => {
    await apiFetch('/cash/' + id, { method: 'PUT', body: JSON.stringify({
      Category: modalVal('f-cat'), Amount: modalVal('f-amount'), Notes: modalVal('f-notes') }) });
    showToast('Updated!'); closeModal(); loadCash();
  });
}

async function deleteCash(id) {
  if (!confirm('Delete this cash entry?')) return;
  await apiFetch('/cash/' + id, { method: 'DELETE' });
  showToast('Deleted!'); loadCash();
}

// ── FIXED DEPOSITS ────────────────────────────────────────────
async function loadFD() {
  try {
    const data = await apiFetch('/fd');
    renderFDTable(data);
  } catch (e) { showToast(e.message, true); }
}

function renderFDTable(fds) {
  const tbody = el('fd-table-body');
  if (!tbody) return;
  const totalPrincipal = fds.filter(f => f.Status === 'Active').reduce((s, f) => s + parseFloat(f.Principal || 0), 0);
  const totalMaturity  = fds.filter(f => f.Status === 'Active').reduce((s, f) => s + parseFloat(f.MaturityAmount || 0), 0);
  setHTML('fd-total-principal', mfmt(totalPrincipal));
  setHTML('fd-total-maturity',  mfmt(totalMaturity));
  if (!fds.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty"><span class="empty-icon">🏛️</span><br>No Fixed Deposits added yet.</td></tr>';
    return;
  }
  tbody.innerHTML = fds.map(f => {
    const daysLeft = Math.ceil((new Date(f.MaturityDate) - new Date()) / 86400000);
    return `<tr>
      <td><strong>${f.BankName}</strong>${f.AccountRef ? '<br><span style="font-size:11px;color:var(--muted)">'+f.AccountRef+'</span>' : ''}</td>
      <td style="font-weight:600">${mfmt(f.Principal)}</td>
      <td>${f.InterestRate}%</td>
      <td>${fmtDate(f.StartDate)}</td>
      <td>${fmtDate(f.MaturityDate)}${f.Status==='Active' ? '<br><span style="font-size:11px;color:'+(daysLeft<30?'var(--red)':'var(--muted)')+'">'+daysLeft+' days</span>' : ''}</td>
      <td style="color:var(--green);font-weight:600">${mfmt(f.MaturityAmount)}</td>
      <td style="color:var(--amber)">${mfmt(f.InterestEarned)}</td>
      <td><span class="badge ${f.Status==='Active'?'badge-green':f.Status==='Matured'?'badge-blue':'badge-red'}">${f.Status}</span></td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="editFD(${f.FDID})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteFD(${f.FDID})">Del</button>
      </td>
    </tr>`;
  }).join('');
}

function fdForm(f = {}) {
  return `
    <div class="form-row">
      <div class="form-group">
        <label>Bank Name *</label>
        <input class="form-control" id="f-bank" value="${f.BankName||''}" required/>
      </div>
      <div class="form-group">
        <label>FD Number / Reference</label>
        <input class="form-control" id="f-ref" value="${f.AccountRef||''}"/>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Principal (₹) *</label>
        <input class="form-control" id="f-principal" type="number" step="0.01" value="${f.Principal||''}" required/>
      </div>
      <div class="form-group">
        <label>Interest Rate (% p.a.) *</label>
        <input class="form-control" id="f-rate" type="number" step="0.01" value="${f.InterestRate||''}" required/>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Start Date *</label>
        <input class="form-control" id="f-start" type="date" value="${fmtDateInput(f.StartDate)}" required/>
      </div>
      <div class="form-group">
        <label>Maturity Date *</label>
        <input class="form-control" id="f-matdate" type="date" value="${fmtDateInput(f.MaturityDate)}" required/>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Maturity Amount (₹) *</label>
        <input class="form-control" id="f-matamt" type="number" step="0.01" value="${f.MaturityAmount||''}" required/>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select class="form-control" id="f-status">
          <option ${(!f.Status||f.Status==='Active')?'selected':''}>Active</option>
          <option ${f.Status==='Matured'?'selected':''}>Matured</option>
          <option ${f.Status==='Broken'?'selected':''}>Broken</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Notes</label>
      <textarea class="form-control" id="f-notes" rows="2">${f.Notes||''}</textarea>
    </div>`;
}

function addFD() {
  openModal('Add Fixed Deposit', fdForm(), 'Save FD', async () => {
    const body = { BankName: modalVal('f-bank'), AccountRef: modalVal('f-ref'),
      Principal: modalVal('f-principal'), InterestRate: modalVal('f-rate'),
      StartDate: modalVal('f-start'), MaturityDate: modalVal('f-matdate'),
      MaturityAmount: modalVal('f-matamt'), Status: modalVal('f-status'), Notes: modalVal('f-notes') };
    await apiFetch('/fd', { method: 'POST', body: JSON.stringify(body) });
    showToast('FD added!'); closeModal(); loadFD();
  });
}

async function editFD(id) {
  const f = await apiFetch('/fd/' + id);
  openModal('Edit Fixed Deposit', fdForm(f), 'Update FD', async () => {
    const body = { BankName: modalVal('f-bank'), AccountRef: modalVal('f-ref'),
      Principal: modalVal('f-principal'), InterestRate: modalVal('f-rate'),
      StartDate: modalVal('f-start'), MaturityDate: modalVal('f-matdate'),
      MaturityAmount: modalVal('f-matamt'), Status: modalVal('f-status'), Notes: modalVal('f-notes') };
    await apiFetch('/fd/' + id, { method: 'PUT', body: JSON.stringify(body) });
    showToast('FD updated!'); closeModal(); loadFD();
  });
}

async function deleteFD(id) {
  if (!confirm('Delete this FD?')) return;
  await apiFetch('/fd/' + id, { method: 'DELETE' });
  showToast('Deleted!'); loadFD();
}

// ── RECURRING DEPOSITS ────────────────────────────────────────
async function loadRD() {
  try {
    const data = await apiFetch('/rd');
    renderRDTable(data);
  } catch (e) { showToast(e.message, true); }
}

function renderRDTable(rds) {
  const tbody = el('rd-table-body');
  if (!tbody) return;
  const totalDep = rds.filter(r => r.Status === 'Active').reduce((s, r) => s + parseFloat(r.AmountDeposited || 0), 0);
  const totalMat = rds.filter(r => r.Status === 'Active').reduce((s, r) => s + parseFloat(r.ExpectedMaturityAmount || 0), 0);
  setHTML('rd-total-deposited', mfmt(totalDep));
  setHTML('rd-total-maturity',  mfmt(totalMat));
  if (!rds.length) {
    tbody.innerHTML = '<tr><td colspan="10" class="empty"><span class="empty-icon">📅</span><br>No Recurring Deposits added yet.</td></tr>';
    return;
  }
  tbody.innerHTML = rds.map(r => {
    const pct = r.TotalInstallments > 0 ? Math.round(r.InstallmentsPaid / r.TotalInstallments * 100) : 0;
    return `<tr>
      <td><strong>${r.BankName}</strong>${r.AccountRef ? '<br><span style="font-size:11px;color:var(--muted)">'+r.AccountRef+'</span>' : ''}</td>
      <td style="font-weight:600">${mfmt(r.MonthlyInstallment)}</td>
      <td>${r.InterestRate}%</td>
      <td>${fmtDate(r.StartDate)}</td>
      <td>${fmtDate(r.MaturityDate)}</td>
      <td>
        ${r.InstallmentsPaid}/${r.TotalInstallments}
        <div class="progress" style="margin-top:4px;width:80px">
          <div class="progress-bar" style="width:${pct}%;background:${pct>=100?'var(--green)':'var(--accent)'}"></div>
        </div>
      </td>
      <td style="color:var(--green);font-weight:600">${mfmt(r.AmountDeposited)}</td>
      <td style="color:var(--purple)">${mfmt(r.ExpectedMaturityAmount)}</td>
      <td><span class="badge ${r.Status==='Active'?'badge-green':r.Status==='Matured'?'badge-blue':'badge-red'}">${r.Status}</span></td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="editRD(${r.RDID})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteRD(${r.RDID})">Del</button>
      </td>
    </tr>`;
  }).join('');
}

function rdForm(r = {}) {
  return `
    <div class="form-row">
      <div class="form-group">
        <label>Bank Name *</label>
        <input class="form-control" id="f-bank" value="${r.BankName||''}" required/>
      </div>
      <div class="form-group">
        <label>RD Number / Reference</label>
        <input class="form-control" id="f-ref" value="${r.AccountRef||''}"/>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Monthly Installment (₹) *</label>
        <input class="form-control" id="f-inst" type="number" step="0.01" value="${r.MonthlyInstallment||''}" required/>
      </div>
      <div class="form-group">
        <label>Interest Rate (% p.a.) *</label>
        <input class="form-control" id="f-rate" type="number" step="0.01" value="${r.InterestRate||''}" required/>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Start Date *</label>
        <input class="form-control" id="f-start" type="date" value="${fmtDateInput(r.StartDate)}" required/>
      </div>
      <div class="form-group">
        <label>Maturity Date *</label>
        <input class="form-control" id="f-matdate" type="date" value="${fmtDateInput(r.MaturityDate)}" required/>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Total Installments *</label>
        <input class="form-control" id="f-total" type="number" value="${r.TotalInstallments||''}" required/>
      </div>
      <div class="form-group">
        <label>Installments Paid</label>
        <input class="form-control" id="f-paid" type="number" value="${r.InstallmentsPaid||0}"/>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Expected Maturity Amount (₹) *</label>
        <input class="form-control" id="f-matamt" type="number" step="0.01" value="${r.ExpectedMaturityAmount||''}" required/>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select class="form-control" id="f-status">
          <option ${(!r.Status||r.Status==='Active')?'selected':''}>Active</option>
          <option ${r.Status==='Matured'?'selected':''}>Matured</option>
          <option ${r.Status==='Closed'?'selected':''}>Closed</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Notes</label>
      <textarea class="form-control" id="f-notes" rows="2">${r.Notes||''}</textarea>
    </div>`;
}

function addRD() {
  openModal('Add Recurring Deposit', rdForm(), 'Save RD', async () => {
    const body = { BankName: modalVal('f-bank'), AccountRef: modalVal('f-ref'),
      MonthlyInstallment: modalVal('f-inst'), InterestRate: modalVal('f-rate'),
      StartDate: modalVal('f-start'), MaturityDate: modalVal('f-matdate'),
      TotalInstallments: modalVal('f-total'), InstallmentsPaid: modalVal('f-paid'),
      ExpectedMaturityAmount: modalVal('f-matamt'), Status: modalVal('f-status'), Notes: modalVal('f-notes') };
    await apiFetch('/rd', { method: 'POST', body: JSON.stringify(body) });
    showToast('RD added!'); closeModal(); loadRD();
  });
}

async function editRD(id) {
  const r = await apiFetch('/rd/' + id);
  openModal('Edit Recurring Deposit', rdForm(r), 'Update RD', async () => {
    const body = { BankName: modalVal('f-bank'), AccountRef: modalVal('f-ref'),
      MonthlyInstallment: modalVal('f-inst'), InterestRate: modalVal('f-rate'),
      StartDate: modalVal('f-start'), MaturityDate: modalVal('f-matdate'),
      TotalInstallments: modalVal('f-total'), InstallmentsPaid: modalVal('f-paid'),
      ExpectedMaturityAmount: modalVal('f-matamt'), Status: modalVal('f-status'), Notes: modalVal('f-notes') };
    await apiFetch('/rd/' + id, { method: 'PUT', body: JSON.stringify(body) });
    showToast('RD updated!'); closeModal(); loadRD();
  });
}

async function deleteRD(id) {
  if (!confirm('Delete this RD?')) return;
  await apiFetch('/rd/' + id, { method: 'DELETE' });
  showToast('Deleted!'); loadRD();
}

// ── INVESTMENTS ───────────────────────────────────────────────
async function loadInvestments() {
  try {
    const data = await apiFetch('/investments');
    renderInvestmentsTable(data);
  } catch (e) { showToast(e.message, true); }
}

function renderInvestmentsTable(invs) {
  const tbody = el('inv-table-body');
  if (!tbody) return;
  const totalInvested = invs.reduce((s, i) => s + parseFloat(i.InvestedAmount || 0), 0);
  const totalCurrent  = invs.reduce((s, i) => s + parseFloat(i.CurrentValue   || 0), 0);
  const gain = totalCurrent - totalInvested;
  setHTML('inv-total-invested', mfmt(totalInvested));
  setHTML('inv-total-current',  mfmt(totalCurrent));
  const gainEl = el('inv-total-gain');
  if (gainEl) {
    gainEl.innerHTML = mfmtSigned(gain);
    gainEl.className = 'value ' + (gain >= 0 ? 'green' : 'red');
  }
  if (!invs.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty"><span class="empty-icon">📈</span><br>No investments added yet.</td></tr>';
    return;
  }
  tbody.innerHTML = invs.map(i => {
    const g    = parseFloat(i.CurrentValue || 0) - parseFloat(i.InvestedAmount || 0);
    const gPct = parseFloat(i.InvestedAmount || 0) > 0 ? (g / parseFloat(i.InvestedAmount) * 100).toFixed(1) : 0;
    const gLabel = _valuesVisible
      ? `${g>=0?'+':''}${fmt(g)} <span style="font-size:11px">(${gPct}%)</span>`
      : '<span class="masked-value">₹••••••</span>';
    return `<tr>
      <td><span class="badge badge-purple">${i.Category}</span></td>
      <td><strong>${i.Name}</strong></td>
      <td>${mfmt(i.InvestedAmount)}</td>
      <td style="font-weight:600">${mfmt(i.CurrentValue)}</td>
      <td style="color:${g>=0?'var(--green)':'var(--red)'};font-weight:600">${gLabel}</td>
      <td>${i.Units ? fmtNum(i.Units) : '—'}</td>
      <td>${fmtDate(i.StartDate)}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="editInv(${i.InvestmentID})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteInv(${i.InvestmentID})">Del</button>
      </td>
    </tr>`;
  }).join('');
}

function invForm(i = {}) {
  const cats = ['Mutual Fund','Stocks','PPF','NPS','Gold','Bonds','ETF','Other'];
  return `
    <div class="form-row">
      <div class="form-group">
        <label>Category *</label>
        <select class="form-control" id="f-cat">
          ${cats.map(c => `<option ${i.Category===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Name *</label>
        <input class="form-control" id="f-name" value="${i.Name||''}" placeholder="e.g. Nifty 50 Index Fund" required/>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Invested Amount (₹) *</label>
        <input class="form-control" id="f-invested" type="number" step="0.01" value="${i.InvestedAmount||''}" required/>
      </div>
      <div class="form-group">
        <label>Current Value (₹) *</label>
        <input class="form-control" id="f-current" type="number" step="0.01" value="${i.CurrentValue||''}" required/>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Units / Quantity</label>
        <input class="form-control" id="f-units" type="number" step="0.0001" value="${i.Units||''}"/>
      </div>
      <div class="form-group">
        <label>Start Date</label>
        <input class="form-control" id="f-start" type="date" value="${fmtDateInput(i.StartDate)}"/>
      </div>
    </div>
    <div class="form-group">
      <label>Notes</label>
      <textarea class="form-control" id="f-notes" rows="2">${i.Notes||''}</textarea>
    </div>`;
}

function addInvestment() {
  openModal('Add Investment', invForm(), 'Save Investment', async () => {
    const body = { Category: modalVal('f-cat'), Name: modalVal('f-name'),
      InvestedAmount: modalVal('f-invested'), CurrentValue: modalVal('f-current'),
      Units: modalVal('f-units') || null, StartDate: modalVal('f-start') || null,
      Notes: modalVal('f-notes') };
    await apiFetch('/investments', { method: 'POST', body: JSON.stringify(body) });
    showToast('Investment added!'); closeModal(); loadInvestments();
  });
}

async function editInv(id) {
  const i = await apiFetch('/investments/' + id);
  openModal('Edit Investment', invForm(i), 'Update', async () => {
    const body = { Category: modalVal('f-cat'), Name: modalVal('f-name'),
      InvestedAmount: modalVal('f-invested'), CurrentValue: modalVal('f-current'),
      Units: modalVal('f-units') || null, StartDate: modalVal('f-start') || null,
      Notes: modalVal('f-notes') };
    await apiFetch('/investments/' + id, { method: 'PUT', body: JSON.stringify(body) });
    showToast('Updated!'); closeModal(); loadInvestments();
  });
}

async function deleteInv(id) {
  if (!confirm('Delete this investment?')) return;
  await apiFetch('/investments/' + id, { method: 'DELETE' });
  showToast('Deleted!'); loadInvestments();
}

// ── TRANSACTIONS ──────────────────────────────────────────────
let _categories = [];

async function loadTransactions() {
  try {
    _categories = await apiFetch('/categories');
    const month = el('tx-month-filter')?.value || '';
    const type  = el('tx-type-filter')?.value  || '';
    let url = '/transactions?';
    if (type)  url += `type=${type}&`;
    if (month) url += `month=${month}`;
    const data = await apiFetch(url);
    renderTransactionsTable(data);
  } catch (e) { showToast(e.message, true); }
}

function renderTransactionsTable(txs) {
  const tbody = el('tx-table-body');
  if (!tbody) return;
  const totalIncome  = txs.filter(t => t.Type === 'Income' ).reduce((s, t) => s + parseFloat(t.Amount || 0), 0);
  const totalExpense = txs.filter(t => t.Type === 'Expense').reduce((s, t) => s + parseFloat(t.Amount || 0), 0);
  setHTML('tx-total-income',  mfmt(totalIncome));
  setHTML('tx-total-expense', mfmt(totalExpense));
  const net   = totalIncome - totalExpense;
  const netEl = el('tx-net');
  if (netEl) {
    netEl.innerHTML  = mfmtSigned(net);
    netEl.className  = 'value ' + (net >= 0 ? 'green' : 'red');
  }
  if (!txs.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty"><span class="empty-icon">💳</span><br>No transactions found.</td></tr>';
    return;
  }
  tbody.innerHTML = txs.map(t => {
    const src = t.PaymentSource || '—';
    const srcBadge = t.PaymentSource === 'Credit Card'
      ? `<span class="badge badge-red">${t.LinkedCardName || 'Credit Card'}</span>`
      : t.PaymentSource === 'Bank Account'
      ? `<span class="badge badge-blue">${t.LinkedAccountName || 'Bank'}</span>`
      : t.PaymentSource
      ? `<span class="badge badge-purple">${src}</span>`
      : `<span style="color:var(--muted)">—</span>`;
    return `<tr>
      <td>${fmtDate(t.TransactionDate)}</td>
      <td><span class="badge ${t.Type==='Income'?'badge-green':'badge-red'}">${t.Type}</span></td>
      <td>${catIcon(t.Category)} ${t.Category}</td>
      <td>${srcBadge}</td>
      <td style="color:var(--muted)">${t.Description || '—'}</td>
      <td style="font-weight:700;color:${t.Type==='Income'?'var(--green)':'var(--red)'}">${mfmt(t.Amount)}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="editTx(${t.TransactionID})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteTx(${t.TransactionID})">Del</button>
      </td>
    </tr>`;
  }).join('');
}

async function txForm(t = {}, type = 'Expense') {
  const activeType = t.Type || type;
  const cats = _categories.filter(c => c.Type === activeType);
  // Load accounts and credit cards for the paid-via dropdown
  let accounts = [], cards = [];
  try { accounts = await apiFetch('/accounts'); } catch(_) {}
  try { cards    = await apiFetch('/creditcards'); } catch(_) {}

  const srcOptions = `
    <option value="">— Select source —</option>
    <option value="Cash"         ${t.PaymentSource==='Cash'?'selected':''}>Cash</option>
    <option value="Salary"       ${t.PaymentSource==='Salary'?'selected':''}>Salary</option>
    <option value="Bank Account" ${t.PaymentSource==='Bank Account'?'selected':''}>Bank Account</option>
    <option value="Credit Card"  ${t.PaymentSource==='Credit Card'?'selected':''}>Credit Card</option>
    <option value="Other"        ${t.PaymentSource==='Other'?'selected':''}>Other</option>`;

  const accountOptions = accounts.map(a =>
    `<option value="${a.AccountID}" ${t.LinkedAccountID==a.AccountID?'selected':''}>${a.Nickname} (${a.BankName})</option>`).join('');
  const cardOptions = cards.map(c =>
    `<option value="${c.CardID}" ${t.LinkedCardID==c.CardID?'selected':''}>${c.Nickname} (${c.BankName})</option>`).join('');

  return `
    <div class="form-row">
      <div class="form-group">
        <label>Type *</label>
        <select class="form-control" id="f-type" onchange="refreshTxCategories(this.value)">
          <option ${activeType==='Income'?'selected':''}>Income</option>
          <option ${activeType==='Expense'?'selected':''}>Expense</option>
        </select>
      </div>
      <div class="form-group">
        <label>Category *</label>
        <select class="form-control" id="f-cat">
          ${cats.map(c => `<option value="${c.CategoryID}" ${t.CategoryID==c.CategoryID?'selected':''}>${catIcon(c.Name)} ${c.Name}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Amount (₹) *</label>
        <input class="form-control" id="f-amount" type="number" step="0.01" value="${t.Amount||''}" required/>
      </div>
      <div class="form-group">
        <label>Date *</label>
        <input class="form-control" id="f-date" type="date" value="${t.TransactionDate ? t.TransactionDate.slice(0,10) : new Date().toISOString().slice(0,10)}" required/>
      </div>
    </div>
    <div class="form-group">
      <label>Paid Via / Source</label>
      <select class="form-control" id="f-source" onchange="toggleTxSource(this.value)">
        ${srcOptions}
      </select>
    </div>
    <div id="f-account-row" class="form-group" style="display:${t.PaymentSource==='Bank Account'?'block':'none'}">
      <label>Bank Account</label>
      <select class="form-control" id="f-account">
        <option value="">— Select account —</option>
        ${accountOptions}
      </select>
    </div>
    <div id="f-card-row" class="form-group" style="display:${t.PaymentSource==='Credit Card'?'block':'none'}">
      <label>Credit Card</label>
      <select class="form-control" id="f-card">
        <option value="">— Select card —</option>
        ${cardOptions}
      </select>
    </div>
    <div class="form-group">
      <label>Description</label>
      <input class="form-control" id="f-desc" value="${t.Description||''}" placeholder="Optional note"/>
    </div>`;
}

function toggleTxSource(val) {
  const aRow = el('f-account-row');
  const cRow = el('f-card-row');
  if (aRow) aRow.style.display = val === 'Bank Account' ? 'block' : 'none';
  if (cRow) cRow.style.display = val === 'Credit Card'  ? 'block' : 'none';
}

function refreshTxCategories(type) {
  const sel  = el('f-cat');
  if (!sel) return;
  const cats = _categories.filter(c => c.Type === type);
  sel.innerHTML = cats.map(c => `<option value="${c.CategoryID}">${catIcon(c.Name)} ${c.Name}</option>`).join('');
}

function txBody() {
  const src = modalVal('f-source');
  return {
    Type:            modalVal('f-type'),
    CategoryID:      modalVal('f-cat'),
    Amount:          modalVal('f-amount'),
    TransactionDate: modalVal('f-date'),
    Description:     modalVal('f-desc'),
    PaymentSource:   src || null,
    LinkedAccountID: src === 'Bank Account' ? (modalVal('f-account') || null) : null,
    LinkedCardID:    src === 'Credit Card'  ? (modalVal('f-card')    || null) : null,
  };
}

function addTransaction(defaultType = 'Expense') {
  txForm({}, defaultType).then(html => {
    openModal('Add Transaction', html, 'Save', async () => {
      await apiFetch('/transactions', { method: 'POST', body: JSON.stringify(txBody()) });
      showToast('Transaction saved!'); closeModal(); loadTransactions();
    });
  });
}

// editTx fetches the full record so all fields (incl. PaymentSource) are pre-filled
async function editTx(id) {
  const allTx = await apiFetch('/transactions');
  const t     = allTx.find(x => x.TransactionID == id);
  if (!t) return;
  const html = await txForm(t, t.Type);
  openModal('Edit Transaction', html, 'Update', async () => {
    await apiFetch('/transactions/' + id, { method: 'PUT', body: JSON.stringify(txBody()) });
    showToast('Updated!'); closeModal(); loadTransactions();
  });
}

async function deleteTx(id) {
  if (!confirm('Delete this transaction?')) return;
  await apiFetch('/transactions/' + id, { method: 'DELETE' });
  showToast('Deleted!'); loadTransactions();
}

// ── CREDIT CARDS ──────────────────────────────────────────────
const CC_GRADIENTS = [
  'linear-gradient(135deg,#1e3a8a,#2563eb)',
  'linear-gradient(135deg,#065f46,#059669)',
  'linear-gradient(135deg,#7c2d12,#ea580c)',
  'linear-gradient(135deg,#4c1d95,#7c3aed)',
  'linear-gradient(135deg,#831843,#db2777)',
  'linear-gradient(135deg,#164e63,#0891b2)',
];

async function loadCreditCards() {
  try {
    const data = await apiFetch('/creditcards');
    renderCreditCards(data);
  } catch (e) { showToast(e.message, true); }
}

function renderCreditCards(cards) {
  const tbody   = el('cc-table-body');
  const cardRow = el('cc-cards-row');
  if (!tbody) return;

  // Summary stats
  const totalLimit       = cards.reduce((s, c) => s + parseFloat(c.CreditLimit    || 0), 0);
  const totalOutstanding = cards.reduce((s, c) => s + parseFloat(c.OutstandingAmt || 0), 0);
  const totalAvailable   = cards.reduce((s, c) => s + parseFloat(c.AvailableLimit || 0), 0);
  const totalPoints      = cards.reduce((s, c) => s + parseInt(c.RewardPoints     || 0), 0);
  setHTML('cc-total-limit',       mfmt(totalLimit));
  setHTML('cc-total-outstanding', mfmt(totalOutstanding));
  setHTML('cc-total-available',   mfmt(totalAvailable));
  setText('cc-total-points',      totalPoints.toLocaleString('en-IN'));

  // Visual card tiles
  if (cardRow) {
    if (!cards.length) {
      cardRow.innerHTML = '';
    } else {
      cardRow.innerHTML = cards.map((c, i) => {
        const pct = parseFloat(c.UtilisationPct || 0);
        const barW = Math.min(pct, 100);
        return `
          <div class="cc-card" style="background:${CC_GRADIENTS[i % CC_GRADIENTS.length]}">
            <div class="cc-bank">${c.BankName}</div>
            <div class="cc-name">${c.Nickname}</div>
            <div class="cc-digits">${c.LastFourDigits ? '**** **** **** ' + c.LastFourDigits : '**** **** **** ****'}</div>
            <div class="cc-limit-row">
              <span>Outstanding: <strong>${mfmt(c.OutstandingAmt)}</strong></span>
              <span>${pct}% used</span>
            </div>
            <div class="cc-bar-track"><div class="cc-bar-fill" style="width:${barW}%"></div></div>
            <div class="cc-due">
              Min Due: <strong>${mfmt(c.MinimumDue)}</strong>
              ${c.DueDate ? ' &nbsp;·&nbsp; Due on <strong>' + c.DueDate + '</strong> of each month' : ''}
            </div>
            <div class="cc-network">${c.CardNetwork}</div>
          </div>`;
      }).join('');
    }
  }

  // Table
  if (!cards.length) {
    tbody.innerHTML = '<tr><td colspan="13" class="empty"><span class="empty-icon">💳</span><br>No credit cards added yet.</td></tr>';
    return;
  }
  tbody.innerHTML = cards.map(c => {
    const pct   = parseFloat(c.UtilisationPct || 0);
    const color = pct >= 80 ? 'var(--red)' : pct >= 50 ? 'var(--amber)' : 'var(--green)';
    return `<tr>
      <td><strong>${c.Nickname}</strong>${c.LastFourDigits ? '<br><span style="font-size:11px;color:var(--muted)">**** '+mmask(c.LastFourDigits)+'</span>' : ''}</td>
      <td>${c.BankName}</td>
      <td><span class="badge badge-blue">${c.CardNetwork}</span></td>
      <td style="font-weight:600">${mfmt(c.CreditLimit)}</td>
      <td style="font-weight:700;color:var(--red)">${mfmt(c.OutstandingAmt)}</td>
      <td style="color:var(--amber)">${mfmt(c.MinimumDue)}</td>
      <td style="color:var(--green)">${mfmt(c.AvailableLimit)}</td>
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          <div style="flex:1;height:6px;background:var(--bg);border-radius:3px;min-width:60px">
            <div style="width:${Math.min(pct,100)}%;height:100%;border-radius:3px;background:${color}"></div>
          </div>
          <span style="font-size:12px;color:${color};font-weight:600">${pct}%</span>
        </div>
      </td>
      <td style="text-align:center">${c.BillingDate ? c.BillingDate : '—'}</td>
      <td style="text-align:center">${c.DueDate     ? c.DueDate     : '—'}</td>
      <td>${c.InterestRate ? c.InterestRate + '%' : '—'}</td>
      <td style="color:var(--purple)">${parseInt(c.RewardPoints||0).toLocaleString('en-IN')}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="editCreditCard(${c.CardID})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteCreditCard(${c.CardID})">Del</button>
      </td>
    </tr>`;
  }).join('');
}

function ccForm(c = {}) {
  const networks = ['Visa','Mastercard','Rupay','Amex','Diners'];
  return `
    <div class="form-row">
      <div class="form-group">
        <label>Card Nickname *</label>
        <input class="form-control" id="f-nickname" value="${c.Nickname||''}" placeholder="e.g. HDFC Regalia" required/>
      </div>
      <div class="form-group">
        <label>Bank Name *</label>
        <input class="form-control" id="f-bank" value="${c.BankName||''}" placeholder="e.g. HDFC Bank" required/>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Card Network</label>
        <select class="form-control" id="f-network">
          ${networks.map(n => `<option ${c.CardNetwork===n?'selected':''}>${n}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Last 4 Digits</label>
        <input class="form-control" id="f-digits" maxlength="4" value="${c.LastFourDigits||''}" placeholder="1234"/>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Credit Limit (₹) *</label>
        <input class="form-control" id="f-limit" type="number" step="0.01" value="${c.CreditLimit||''}" required/>
      </div>
      <div class="form-group">
        <label>Outstanding Amount (₹)</label>
        <input class="form-control" id="f-outstanding" type="number" step="0.01" value="${c.OutstandingAmt||0}"/>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Minimum Due (₹)</label>
        <input class="form-control" id="f-mindue" type="number" step="0.01" value="${c.MinimumDue||0}"/>
      </div>
      <div class="form-group">
        <label>Annual Fee (₹)</label>
        <input class="form-control" id="f-annualfee" type="number" step="0.01" value="${c.AnnualFee||0}"/>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Billing Date (day of month)</label>
        <input class="form-control" id="f-billing" type="number" min="1" max="31" value="${c.BillingDate||''}" placeholder="e.g. 15"/>
      </div>
      <div class="form-group">
        <label>Due Date (day of month)</label>
        <input class="form-control" id="f-duedate" type="number" min="1" max="31" value="${c.DueDate||''}" placeholder="e.g. 5"/>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Interest Rate / APR (%)</label>
        <input class="form-control" id="f-rate" type="number" step="0.01" value="${c.InterestRate||''}" placeholder="e.g. 42"/>
      </div>
      <div class="form-group">
        <label>Reward Points</label>
        <input class="form-control" id="f-points" type="number" value="${c.RewardPoints||0}"/>
      </div>
    </div>
    <div class="form-group">
      <label>Notes</label>
      <textarea class="form-control" id="f-notes" rows="2">${c.Notes||''}</textarea>
    </div>`;
}

function addCreditCard() {
  openModal('Add Credit Card', ccForm(), 'Save Card', async () => {
    const body = {
      Nickname: modalVal('f-nickname'), BankName: modalVal('f-bank'),
      CardNetwork: modalVal('f-network'), LastFourDigits: modalVal('f-digits') || null,
      CreditLimit: modalVal('f-limit'), OutstandingAmt: modalVal('f-outstanding'),
      MinimumDue: modalVal('f-mindue'), AnnualFee: modalVal('f-annualfee'),
      BillingDate: modalVal('f-billing') || null, DueDate: modalVal('f-duedate') || null,
      InterestRate: modalVal('f-rate') || null, RewardPoints: modalVal('f-points') || 0,
      Notes: modalVal('f-notes'),
    };
    await apiFetch('/creditcards', { method: 'POST', body: JSON.stringify(body) });
    showToast('Credit card added!'); closeModal(); loadCreditCards();
  });
}

async function editCreditCard(id) {
  const c = await apiFetch('/creditcards/' + id);
  openModal('Edit Credit Card', ccForm(c), 'Update Card', async () => {
    const body = {
      Nickname: modalVal('f-nickname'), BankName: modalVal('f-bank'),
      CardNetwork: modalVal('f-network'), LastFourDigits: modalVal('f-digits') || null,
      CreditLimit: modalVal('f-limit'), OutstandingAmt: modalVal('f-outstanding'),
      MinimumDue: modalVal('f-mindue'), AnnualFee: modalVal('f-annualfee'),
      BillingDate: modalVal('f-billing') || null, DueDate: modalVal('f-duedate') || null,
      InterestRate: modalVal('f-rate') || null, RewardPoints: modalVal('f-points') || 0,
      IsActive: 1, Notes: modalVal('f-notes'),
    };
    await apiFetch('/creditcards/' + id, { method: 'PUT', body: JSON.stringify(body) });
    showToast('Card updated!'); closeModal(); loadCreditCards();
  });
}

async function deleteCreditCard(id) {
  if (!confirm('Delete this credit card?')) return;
  await apiFetch('/creditcards/' + id, { method: 'DELETE' });
  showToast('Deleted!'); loadCreditCards();
}

// ── LOANS ─────────────────────────────────────────────────────
async function loadLoans() {
  try {
    const data = await apiFetch('/loans');
    renderLoans(data);
  } catch (e) { showToast(e.message, true); }
}

function renderLoans(loans) {
  const borrowed = loans.filter(l => l.LoanType === 'Borrowed');
  const lent     = loans.filter(l => l.LoanType === 'Lent');

  const totalBorrowed = borrowed.reduce((s, l) => s + parseFloat(l.OutstandingAmount || 0), 0);
  const totalLent     = lent.reduce((s, l) => s + parseFloat(l.OutstandingAmount || 0), 0);
  const net           = totalLent - totalBorrowed;

  setHTML('loan-total-borrowed', mfmt(totalBorrowed));
  setHTML('loan-total-lent',     mfmt(totalLent));
  const netEl = el('loan-net');
  if (netEl) {
    netEl.innerHTML  = mfmtSigned(net);
    netEl.className  = 'value ' + (net >= 0 ? 'green' : 'red');
  }

  renderLoanTable('loan-borrowed-body', borrowed, 9);
  renderLoanTable('loan-lent-body',     lent,     9);
}

function renderLoanTable(tbodyId, loans, cols) {
  const tbody = el(tbodyId);
  if (!tbody) return;
  if (!loans.length) {
    tbody.innerHTML = `<tr><td colspan="${cols}" class="empty">No records yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = loans.map(l => {
    const isOverdue = l.DueDate && new Date(l.DueDate) < new Date() && l.Status === 'Active';
    const statusBadge = l.Status === 'Settled' ? 'badge-green'
                      : l.Status === 'Partial'  ? 'badge-amber'
                      : isOverdue               ? 'badge-red'
                      : 'badge-blue';
    const paidPct = parseFloat(l.PrincipalAmount) > 0
      ? Math.round((1 - parseFloat(l.OutstandingAmount) / parseFloat(l.PrincipalAmount)) * 100)
      : 0;
    return `<tr>
      <td><strong>${l.PersonName}</strong></td>
      <td style="color:var(--muted)">${l.Description || '—'}</td>
      <td>${mfmt(l.PrincipalAmount)}</td>
      <td>
        <strong style="color:${l.LoanType==='Borrowed'?'var(--red)':'var(--green)'}">${mfmt(l.OutstandingAmount)}</strong>
        ${paidPct > 0 ? `<div class="progress" style="margin-top:3px;width:80px"><div class="progress-bar" style="width:${paidPct}%;background:var(--green)"></div></div>` : ''}
      </td>
      <td>${l.InterestRate ? l.InterestRate + '%' : '—'}</td>
      <td>${fmtDate(l.LoanDate)}</td>
      <td style="color:${isOverdue?'var(--red)':'inherit'}">${l.DueDate ? fmtDate(l.DueDate) : '—'}${isOverdue?' <span style="font-size:10px;color:var(--red)">(overdue)</span>':''}</td>
      <td><span class="badge ${statusBadge}">${l.Status}</span></td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="editLoan(${l.LoanID})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteLoan(${l.LoanID})">Del</button>
      </td>
    </tr>`;
  }).join('');
}

function loanForm(l = {}, defaultType = 'Borrowed') {
  const loanType = l.LoanType || defaultType;
  return `
    <div class="form-row">
      <div class="form-group">
        <label>Loan Type *</label>
        <select class="form-control" id="f-ltype">
          <option value="Borrowed" ${loanType==='Borrowed'?'selected':''}>Borrowed (I owe)</option>
          <option value="Lent"     ${loanType==='Lent'    ?'selected':''}>Lent (They owe me)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Person / Organisation *</label>
        <input class="form-control" id="f-person" value="${l.PersonName||''}" placeholder="e.g. Rahul, SBI Bank" required/>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Principal Amount (₹) *</label>
        <input class="form-control" id="f-principal" type="number" step="0.01" value="${l.PrincipalAmount||''}" required/>
      </div>
      <div class="form-group">
        <label>Outstanding Amount (₹) *</label>
        <input class="form-control" id="f-outstanding" type="number" step="0.01" value="${l.OutstandingAmount||''}" placeholder="Remaining to pay/receive" required/>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Interest Rate (% p.a.)</label>
        <input class="form-control" id="f-rate" type="number" step="0.01" value="${l.InterestRate||''}" placeholder="0 for interest-free"/>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select class="form-control" id="f-status">
          <option ${(!l.Status||l.Status==='Active') ?'selected':''}>Active</option>
          <option ${l.Status==='Partial' ?'selected':''}>Partial</option>
          <option ${l.Status==='Settled' ?'selected':''}>Settled</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Loan Date *</label>
        <input class="form-control" id="f-ldate" type="date" value="${fmtDateInput(l.LoanDate)||new Date().toISOString().slice(0,10)}" required/>
      </div>
      <div class="form-group">
        <label>Due / Repayment Date</label>
        <input class="form-control" id="f-duedate" type="date" value="${fmtDateInput(l.DueDate)}"/>
      </div>
    </div>
    <div class="form-group">
      <label>Purpose / Description</label>
      <input class="form-control" id="f-desc" value="${l.Description||''}" placeholder="e.g. Home renovation, personal"/>
    </div>
    <div class="form-group">
      <label>Notes</label>
      <textarea class="form-control" id="f-notes" rows="2">${l.Notes||''}</textarea>
    </div>`;
}

function addLoan(defaultType = 'Borrowed') {
  openModal(
    defaultType === 'Borrowed' ? 'Add Borrowed Loan' : 'Add Money Lent',
    loanForm({}, defaultType), 'Save', async () => {
      const body = {
        LoanType:          modalVal('f-ltype'),
        PersonName:        modalVal('f-person'),
        PrincipalAmount:   modalVal('f-principal'),
        OutstandingAmount: modalVal('f-outstanding') || modalVal('f-principal'),
        InterestRate:      modalVal('f-rate') || null,
        Status:            modalVal('f-status'),
        LoanDate:          modalVal('f-ldate'),
        DueDate:           modalVal('f-duedate') || null,
        Description:       modalVal('f-desc'),
        Notes:             modalVal('f-notes'),
      };
      await apiFetch('/loans', { method: 'POST', body: JSON.stringify(body) });
      showToast('Loan saved!'); closeModal(); loadLoans();
    });
}

async function editLoan(id) {
  const l = await apiFetch('/loans/' + id);
  openModal('Edit Loan', loanForm(l, l.LoanType), 'Update', async () => {
    const body = {
      LoanType:          modalVal('f-ltype'),
      PersonName:        modalVal('f-person'),
      PrincipalAmount:   modalVal('f-principal'),
      OutstandingAmount: modalVal('f-outstanding'),
      InterestRate:      modalVal('f-rate') || null,
      Status:            modalVal('f-status'),
      LoanDate:          modalVal('f-ldate'),
      DueDate:           modalVal('f-duedate') || null,
      Description:       modalVal('f-desc'),
      Notes:             modalVal('f-notes'),
    };
    await apiFetch('/loans/' + id, { method: 'PUT', body: JSON.stringify(body) });
    showToast('Updated!'); closeModal(); loadLoans();
  });
}

async function deleteLoan(id) {
  if (!confirm('Delete this loan record?')) return;
  await apiFetch('/loans/' + id, { method: 'DELETE' });
  showToast('Deleted!'); loadLoans();
}

// ── EPFO ──────────────────────────────────────────────────────
async function loadEPFO() {
  try {
    const data = await apiFetch('/epfo');
    renderEPFOTable(data);
  } catch (e) { showToast(e.message, true); }
}

function renderEPFOTable(items) {
  const tbody = el('epfo-table-body');
  if (!tbody) return;
  const total = items.reduce((s, i) => s + parseFloat(i.Balance || 0), 0);
  setHTML('epfo-total-balance', mfmt(total));
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty"><span class="empty-icon">🏢</span><br>No EPFO accounts added yet.</td></tr>';
    return;
  }
  tbody.innerHTML = items.map(e => `
    <tr>
      <td><strong>${e.MemberName}</strong></td>
      <td style="font-family:monospace;font-size:12px">${mmask(e.UAN)}</td>
      <td style="color:var(--muted)">${e.EmployerName || '—'}</td>
      <td style="font-weight:700;color:var(--green)">${mfmt(e.Balance)}</td>
      <td>${fmtDate(e.LastUpdated)}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="editEPFO(${e.EPFOID})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteEPFO(${e.EPFOID})">Del</button>
      </td>
    </tr>`).join('');
}

function epfoForm(e = {}) {
  return `
    <div class="form-row">
      <div class="form-group">
        <label>Member Name *</label>
        <input class="form-control" id="f-name" value="${e.MemberName||''}" placeholder="Your full name" required/>
      </div>
      <div class="form-group">
        <label>UAN (Universal Account Number)</label>
        <input class="form-control" id="f-uan" value="${e.UAN||''}" placeholder="12-digit UAN"/>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Employer Name</label>
        <input class="form-control" id="f-employer" value="${e.EmployerName||''}" placeholder="Company name"/>
      </div>
      <div class="form-group">
        <label>Balance (₹) *</label>
        <input class="form-control" id="f-balance" type="number" step="0.01" value="${e.Balance||0}" required/>
      </div>
    </div>
    <div class="form-group">
      <label>Notes</label>
      <textarea class="form-control" id="f-notes" rows="2">${e.Notes||''}</textarea>
    </div>`;
}

function addEPFO() {
  openModal('Add EPFO Account', epfoForm(), 'Save', async () => {
    const body = {
      MemberName: modalVal('f-name'), UAN: modalVal('f-uan') || null,
      EmployerName: modalVal('f-employer') || null,
      Balance: modalVal('f-balance'), Notes: modalVal('f-notes')
    };
    await apiFetch('/epfo', { method: 'POST', body: JSON.stringify(body) });
    showToast('EPFO account added!'); closeModal(); loadEPFO();
  });
}

async function editEPFO(id) {
  const e = await apiFetch('/epfo/' + id);
  openModal('Edit EPFO Account', epfoForm(e), 'Update', async () => {
    const body = {
      MemberName: modalVal('f-name'), UAN: modalVal('f-uan') || null,
      EmployerName: modalVal('f-employer') || null,
      Balance: modalVal('f-balance'), Notes: modalVal('f-notes')
    };
    await apiFetch('/epfo/' + id, { method: 'PUT', body: JSON.stringify(body) });
    showToast('Updated!'); closeModal(); loadEPFO();
  });
}

async function deleteEPFO(id) {
  if (!confirm('Delete this EPFO account?')) return;
  await apiFetch('/epfo/' + id, { method: 'DELETE' });
  showToast('Deleted!'); loadEPFO();
}

// ── INCOME TAX ────────────────────────────────────────────────
async function loadIncomeTax() {
  try {
    const data = await apiFetch('/incometax');
    renderIncomeTaxTable(data);
  } catch (e) { showToast(e.message, true); }
}

function renderIncomeTaxTable(items) {
  const tbody = el('it-table-body');
  if (!tbody) return;

  const totalPaid     = items.reduce((s, r) => s + parseFloat(r.TaxPaid        || 0), 0);
  const totalRefund   = items.reduce((s, r) => s + parseFloat(r.Refund         || 0), 0);
  const totalInterest = items.reduce((s, r) => s + parseFloat(r.InterestAndFee || 0), 0);
  const netPaid       = totalPaid - totalRefund;

  setHTML('it-total-paid',     mfmt(totalPaid));
  setHTML('it-total-refund',   mfmt(totalRefund));
  setHTML('it-net-paid',       mfmt(netPaid));
  setHTML('it-total-interest', mfmt(totalInterest));
  setText('it-years-count',    items.length);

  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="14" class="empty"><span class="empty-icon">🧾</span><br>No income tax records added yet.</td></tr>';
    return;
  }

  tbody.innerHTML = items.map(r => {
    const statusClass = r.FilingStatus === 'Filed' ? 'badge-green' : r.FilingStatus === 'Pending' ? 'badge-amber' : 'badge-blue';
    const regimeClass = r.TaxRegime === 'New' ? 'badge-blue' : 'badge-purple';
    return `<tr>
      <td><strong>${r.FinancialYear}</strong></td>
      <td style="color:var(--muted)">${r.AssessmentYear}</td>
      <td><span class="badge ${regimeClass}">${r.TaxRegime}</span></td>
      <td>${mfmt(r.GrossIncome)}</td>
      <td>${mfmt(r.TaxableIncome)}</td>
      <td style="color:var(--muted)">${mfmt(r.TDSDeducted)}</td>
      <td style="color:var(--muted)">${mfmt(r.AdvanceTax)}</td>
      <td style="color:var(--muted)">${mfmt(r.SelfAssessTax)}</td>
      <td style="font-weight:700;color:var(--red)">${mfmt(r.TaxPaid)}</td>
      <td style="font-weight:600;color:var(--amber)">${parseFloat(r.InterestAndFee||0) > 0 ? mfmt(r.InterestAndFee) : '—'}</td>
      <td style="font-weight:600;color:var(--green)">${parseFloat(r.Refund||0) > 0 ? mfmt(r.Refund) : '—'}</td>
      <td><span class="badge ${statusClass}">${r.FilingStatus}</span></td>
      <td style="font-size:12px;color:var(--muted)">${fmtDate(r.FilingDate)}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="editIncomeTax(${r.TaxID})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteIncomeTax(${r.TaxID})">Del</button>
      </td>
    </tr>`;
  }).join('');
}

function incomeTaxForm(r = {}) {
  // Auto-fill AY from FY if possible
  return `
    <div class="form-row">
      <div class="form-group">
        <label>Financial Year *</label>
        <input class="form-control" id="it-fy" value="${r.FinancialYear||''}" placeholder="e.g. 2023-24"
          oninput="autoFillAY(this.value)" required/>
      </div>
      <div class="form-group">
        <label>Assessment Year *</label>
        <input class="form-control" id="it-ay" value="${r.AssessmentYear||''}" placeholder="e.g. 2024-25" required/>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Tax Regime</label>
        <select class="form-control" id="it-regime">
          <option value="New" ${(r.TaxRegime||'New')==='New'?'selected':''}>New</option>
          <option value="Old" ${r.TaxRegime==='Old'?'selected':''}>Old</option>
        </select>
      </div>
      <div class="form-group">
        <label>Filing Status</label>
        <select class="form-control" id="it-status">
          <option value="Filed"           ${(r.FilingStatus||'Filed')==='Filed'?'selected':''}>Filed</option>
          <option value="Pending"         ${r.FilingStatus==='Pending'?'selected':''}>Pending</option>
          <option value="Not Applicable"  ${r.FilingStatus==='Not Applicable'?'selected':''}>Not Applicable</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Gross Income (₹)</label>
        <input class="form-control" id="it-gross" type="number" step="0.01" value="${r.GrossIncome||0}"/>
      </div>
      <div class="form-group">
        <label>Taxable Income (₹)</label>
        <input class="form-control" id="it-taxable" type="number" step="0.01" value="${r.TaxableIncome||0}"/>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>TDS Deducted (₹)</label>
        <input class="form-control" id="it-tds" type="number" step="0.01" value="${r.TDSDeducted||0}"/>
      </div>
      <div class="form-group">
        <label>Advance Tax (₹)</label>
        <input class="form-control" id="it-advance" type="number" step="0.01" value="${r.AdvanceTax||0}"/>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Self-Assessment Tax (₹)</label>
        <input class="form-control" id="it-self" type="number" step="0.01" value="${r.SelfAssessTax||0}"/>
      </div>
      <div class="form-group">
        <label>Total Tax Paid (₹) *</label>
        <input class="form-control" id="it-paid" type="number" step="0.01" value="${r.TaxPaid||0}" required/>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Refund Received (₹)</label>
        <input class="form-control" id="it-refund" type="number" step="0.01" value="${r.Refund||0}"/>
      </div>
      <div class="form-group">
        <label>Interest &amp; Fee Payable (₹)</label>
        <input class="form-control" id="it-interest" type="number" step="0.01" value="${r.InterestAndFee||0}"
          placeholder="Late fee, 234A/B/C interest"/>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Filing Date</label>
        <input class="form-control" id="it-date" type="date" value="${fmtDateInput(r.FilingDate)}"/>
      </div>
      <div class="form-group">
        <label>Acknowledgment No.</label>
        <input class="form-control" id="it-ack" value="${r.AcknowledgmentNo||''}" placeholder="ITR acknowledgment number"/>
      </div>
    </div>
    <div class="form-group">
      <label>Notes</label>
      <textarea class="form-control" id="it-notes" rows="2">${r.Notes||''}</textarea>
    </div>`;
}

function autoFillAY(fy) {
  const ayEl = el('it-ay');
  if (!ayEl) return;
  // e.g. "2023-24" → "2024-25"
  const m = fy.match(/^(\d{4})-(\d{2})$/);
  if (m) {
    const y1 = parseInt(m[1]) + 1;
    const y2 = y1 + 1;
    ayEl.value = `${y1}-${String(y2).slice(-2)}`;
  }
}

function _itBody() {
  return {
    FinancialYear:    modalVal('it-fy'),
    AssessmentYear:   modalVal('it-ay'),
    TaxRegime:        modalVal('it-regime'),
    FilingStatus:     modalVal('it-status'),
    GrossIncome:      modalVal('it-gross'),
    TaxableIncome:    modalVal('it-taxable'),
    TDSDeducted:      modalVal('it-tds'),
    AdvanceTax:       modalVal('it-advance'),
    SelfAssessTax:    modalVal('it-self'),
    TaxPaid:          modalVal('it-paid'),
    Refund:           modalVal('it-refund'),
    InterestAndFee:   modalVal('it-interest'),
    FilingDate:       modalVal('it-date')  || null,
    AcknowledgmentNo: modalVal('it-ack')   || null,
    Notes:            modalVal('it-notes') || null,
  };
}

function addIncomeTax() {
  openModal('Add Income Tax Record', incomeTaxForm(), 'Save', async () => {
    await apiFetch('/incometax', { method: 'POST', body: JSON.stringify(_itBody()) });
    showToast('Tax record added!'); closeModal(); loadIncomeTax();
  });
}

async function editIncomeTax(id) {
  const r = await apiFetch('/incometax/' + id);
  openModal('Edit Income Tax Record', incomeTaxForm(r), 'Update', async () => {
    await apiFetch('/incometax/' + id, { method: 'PUT', body: JSON.stringify(_itBody()) });
    showToast('Updated!'); closeModal(); loadIncomeTax();
  });
}

async function deleteIncomeTax(id) {
  if (!confirm('Delete this tax record?')) return;
  await apiFetch('/incometax/' + id, { method: 'DELETE' });
  showToast('Deleted!'); loadIncomeTax();
}

// ── PAYMENTS & NOTES ──────────────────────────────────────────
const NOTE_TYPE_ICONS = { Payment: '💸', Todo: '✅', Reminder: '🔔', Note: '📝' };

async function loadNotes() {
  const filterType   = (el('notes-filter-type')   || {}).value || '';
  const filterStatus = (el('notes-filter-status') || {}).value || '';
  const items = await apiFetch('/notes');

  const filtered = items.filter(n =>
    (!filterType   || n.NoteType === filterType) &&
    (!filterStatus || n.Status   === filterStatus)
  );

  // Summary stats (always from full list)
  const pending   = items.filter(n => n.Status === 'Pending').length;
  const highPri   = items.filter(n => n.Priority === 'High' && n.Status !== 'Done').length;
  const totalAmt  = items.filter(n => n.Status === 'Pending' && n.Amount)
                         .reduce((s, n) => s + parseFloat(n.Amount || 0), 0);
  setText('notes-count',   items.length);
  setText('notes-pending', pending);
  setText('notes-high',    highPri);
  setHTML('notes-amount',  mfmt(totalAmt));

  const grid = el('notes-grid');
  if (!filtered.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--muted)">
      <div style="font-size:40px;margin-bottom:12px">📝</div>
      <div style="font-size:14px">No items yet. Click <strong>+ Add Item</strong> to get started.</div>
    </div>`;
    return;
  }

  grid.innerHTML = filtered.map(n => {
    const isOverdue = n.DueDate && n.Status === 'Pending' && new Date(n.DueDate) < new Date();
    const priColor  = n.Priority === 'High' ? 'var(--red)' : n.Priority === 'Low' ? 'var(--green)' : 'var(--amber)';
    const statusBadge = n.Status === 'Done'    ? 'badge-green'
                      : n.Status === 'Snoozed' ? 'badge-blue'
                      : 'badge-amber';
    const tags = n.Tags ? n.Tags.split(',').map(t => t.trim()).filter(Boolean)
                           .map(t => `<span class="note-tag">${t}</span>`).join('') : '';
    const borderColor = n.Priority === 'High' && n.Status === 'Pending' ? 'var(--red)'
                      : n.Status === 'Done' ? 'var(--border)' : 'var(--border)';
    return `
    <div class="note-card${n.Status === 'Done' ? ' note-done' : ''}" style="border-top:3px solid ${borderColor}">
      <div class="note-card-header">
        <span class="note-type-icon">${NOTE_TYPE_ICONS[n.NoteType] || '📝'}</span>
        <span class="note-title">${n.Title}</span>
        <span class="badge ${statusBadge}" style="margin-left:auto;flex-shrink:0">${n.Status}</span>
      </div>
      ${n.Body ? `<div class="note-body">${n.Body}</div>` : ''}
      <div class="note-meta">
        ${n.Amount ? `<span>💰 ${mfmt(n.Amount)}</span>` : ''}
        ${n.DueDate ? `<span style="color:${isOverdue ? 'var(--red)' : 'var(--muted)'}">
          📅 ${fmtDate(n.DueDate)}${isOverdue ? ' ⚠️ Overdue' : ''}
        </span>` : ''}
        <span style="color:${priColor};font-weight:600">${n.Priority} Priority</span>
      </div>
      ${tags ? `<div class="note-tags">${tags}</div>` : ''}
      <div class="note-actions">
        ${n.Status !== 'Done' ? `<button class="btn btn-ghost btn-sm" onclick="markNoteDone(${n.NoteID})">✔ Done</button>` : ''}
        <button class="btn btn-ghost btn-sm" onclick="editNote(${n.NoteID})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteNote(${n.NoteID})">Del</button>
      </div>
    </div>`;
  }).join('');
}

function noteForm(n = {}) {
  return `
    <div class="form-row">
      <div class="form-group" style="flex:2">
        <label>Title *</label>
        <input class="form-control" id="n-title" value="${n.Title || ''}" placeholder="e.g. Pay electricity bill" required/>
      </div>
      <div class="form-group">
        <label>Type</label>
        <select class="form-control" id="n-type">
          <option value="Payment"  ${n.NoteType==='Payment'  ?'selected':''}>💸 Payment</option>
          <option value="Todo"     ${n.NoteType==='Todo'     ?'selected':''}>✅ Todo</option>
          <option value="Reminder" ${n.NoteType==='Reminder' ?'selected':''}>🔔 Reminder</option>
          <option value="Note"     ${n.NoteType==='Note'||!n.NoteType?'selected':''}>📝 Note</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Priority</label>
        <select class="form-control" id="n-priority">
          <option value="High"   ${n.Priority==='High'  ?'selected':''}>🔴 High</option>
          <option value="Medium" ${n.Priority==='Medium'||!n.Priority?'selected':''}>🟡 Medium</option>
          <option value="Low"    ${n.Priority==='Low'   ?'selected':''}>🟢 Low</option>
        </select>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select class="form-control" id="n-status">
          <option value="Pending" ${n.Status==='Pending'||!n.Status?'selected':''}>Pending</option>
          <option value="Done"    ${n.Status==='Done'   ?'selected':''}>Done</option>
          <option value="Snoozed" ${n.Status==='Snoozed'?'selected':''}>Snoozed</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Amount (₹)</label>
        <input class="form-control" id="n-amount" type="number" step="0.01" value="${n.Amount || ''}" placeholder="Optional"/>
      </div>
      <div class="form-group">
        <label>Due Date</label>
        <input class="form-control" id="n-duedate" type="date" value="${fmtDateInput(n.DueDate)}"/>
      </div>
    </div>
    <div class="form-group">
      <label>Tags <span style="color:var(--muted);font-weight:400">(comma-separated, e.g. utilities, monthly)</span></label>
      <input class="form-control" id="n-tags" value="${n.Tags || ''}" placeholder="e.g. bills, credit card, personal"/>
    </div>
    <div class="form-group">
      <label>Notes / Details</label>
      <textarea class="form-control" id="n-body" rows="3" placeholder="Any extra details...">${n.Body || ''}</textarea>
    </div>`;
}

function _noteBody() {
  return {
    Title:    modalVal('n-title'),
    NoteType: modalVal('n-type'),
    Priority: modalVal('n-priority'),
    Status:   modalVal('n-status'),
    Amount:   modalVal('n-amount')   || null,
    DueDate:  modalVal('n-duedate')  || null,
    Tags:     modalVal('n-tags')     || null,
    Body:     modalVal('n-body')     || null,
  };
}

function addNote() {
  openModal('Add Payment / Note', noteForm(), 'Save', async () => {
    await apiFetch('/notes', { method: 'POST', body: JSON.stringify(_noteBody()) });
    showToast('Item added!'); closeModal(); loadNotes();
  });
}

async function editNote(id) {
  const n = await apiFetch('/notes/' + id);
  openModal('Edit Item', noteForm(n), 'Update', async () => {
    await apiFetch('/notes/' + id, { method: 'PUT', body: JSON.stringify(_noteBody()) });
    showToast('Updated!'); closeModal(); loadNotes();
  });
}

async function markNoteDone(id) {
  const n = await apiFetch('/notes/' + id);
  await apiFetch('/notes/' + id, { method: 'PUT', body: JSON.stringify({ ...n, Status: 'Done' }) });
  showToast('Marked as done! ✔'); loadNotes();
}

async function deleteNote(id) {
  if (!confirm('Delete this item?')) return;
  await apiFetch('/notes/' + id, { method: 'DELETE' });
  showToast('Deleted!'); loadNotes();
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Sidebar nav
  document.querySelectorAll('#sidebar nav a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      navigate(a.dataset.page);
    });
  });

  // Modal close
  el('modal-close-btn').addEventListener('click', closeModal);
  el('modal-cancel-btn').addEventListener('click', closeModal);
  el('modal-overlay').addEventListener('click', e => {
    if (e.target === el('modal-overlay')) closeModal();
  });

  // Modal submit
  el('modal-submit').addEventListener('click', async () => {
    if (_modalSubmitFn) {
      try { await _modalSubmitFn(); }
      catch (e) { showToast('Error: ' + e.message, true); }
    }
  });

  // Start on dashboard
  navigate('dashboard');
});
