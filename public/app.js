
// Cambia por TU dominio de Netlify:
const API_BASE = 'https://app-dinero.netlify.app/.netlify/functions';

async function getQuote(symbol){
  const r = await fetch(`${API_BASE}/quote?symbol=${encodeURIComponent(symbol)}`);
  return r.json();
}
async function getDaily(symbol){
  const r = await fetch(`${API_BASE}/history?symbol=${encodeURIComponent(symbol)}&size=compact`);
  return r.json();
}

const priceEl = document.getElementById('price');
const ccyEl = document.getElementById('ccy');
const ctx = document.getElementById('chart');
let chart;

document.getElementById('btn').onclick = async () => {
  const s = document.getElementById('sym').value.trim().toUpperCase();
  if(!s) return;

  // 1) Precio actual
  const q = await getQuote(s);
  const qdata = q['Global Quote'] || {};
  priceEl.textContent = qdata['05. price'] || '—';
  ccyEl.textContent = (qdata['08. previous close'] ? 'USD' : '—');

  // 2) Histórico
  const h = await getDaily(s);
  const ts = h['Time Series (Daily)'] || {};
  const labels = Object.keys(ts).sort(); // ascendente
  const close = labels.map(d => Number(ts[d]['5. adjusted close'] || ts[d]['4. close']));

  if(chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ label: s, data: close }] },
    options: { responsive: true, interaction: { mode: 'index', intersect: false }, plugins:{legend:{display:false}} }
  });
};
