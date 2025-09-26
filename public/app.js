
// Cambia por TU dominio de Netlify:
const API_BASE = 'https://app-dinero.netlify.app/.netlify/functions';

const priceEl = document.getElementById('price');
const ccyEl = document.getElementById('ccy');
const ctx = document.getElementById('chart');
const msgEl = document.getElementById('msg');
const input = document.getElementById('sym');
const btn = document.getElementById('btn');
const helpBtn = document.getElementById('helpBtn');
const howto = document.getElementById('howto');

let chart;

function showMsg(t){ msgEl.textContent = t || ''; }
function clearMsg(){ showMsg(''); }

async function getQuote(symbol){
  const r = await fetch(`${API_BASE}/quote?symbol=${encodeURIComponent(symbol)}`);
  if(!r.ok) throw new Error('Error de red');
  return r.json();
}
async function getDaily(symbol){
  const r = await fetch(`${API_BASE}/history?symbol=${encodeURIComponent(symbol)}&size=compact`);
  if(!r.ok) throw new Error('Error de red');
  const j = await r.json();

  // 1) Límite o error del proveedor
  if (j['Note'] || j['Error Message']) {
    throw new Error(j['Note'] || 'Símbolo no válido o límite temporal alcanzado');
  }
  // 2) Serie diaria
  const ts = j['Time Series (Daily)'];
  if (!ts || typeof ts !== 'object') {
    throw new Error('Histórico no disponible ahora. Inténtalo en 1-2 min');
  }

  // 3) Normaliza: fechas ascendentes y cierre
  const days = Object.keys(ts).sort();               // más antiguo → más nuevo
  const points = days.map(d => {
    const row = ts[d] || {};
    const v = Number(row['5. adjusted close'] ?? row['4. close']);
    return Number.isFinite(v) ? v : null;
  });

  // 4) Filtra nulos
  const labels = [];
  const data = [];
  for (let i = 0; i < days.length; i++) {
    if (points[i] != null) { labels.push(days[i]); data.push(points[i]); }
  }
  if (data.length < 2) throw new Error('Sin suficientes puntos para graficar');

  return { labels, data };
}


async function loadSymbol(s){
  try{
    showMsg('Cargando…');
    // Precio
    const q = await getQuote(s);
    const qdata = q['Global Quote'] || {};
    const price = qdata['05. price'];
    if(!price) throw new Error('Símbolo no válido o límite temporal alcanzado');

    priceEl.textContent = price;
    ccyEl.textContent = 'USD'; // La API de GLOBAL_QUOTE responde en USD para acciones USA

    // Histórico
    const h = await getDaily(s);
    const ts = h['Time Series (Daily)'] || {};
    const labels = Object.keys(ts).sort();
    const close = labels.map(d => Number(ts[d]['5. adjusted close'] || ts[d]['4. close']));

    // Histórico normalizado
    const { labels, data } = await getDaily(s);
    
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label: s, data }] },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false } },
        parsing: false
      }
    });


    localStorage.setItem('lastSymbol', s);
    clearMsg();
  }catch(err){
    showMsg(err.message || 'Fallo al cargar datos');
  }
}

btn.onclick = () => {
  const s = input.value.trim().toUpperCase();
  if(!s) { showMsg('Introduce un símbolo.'); return; }
  loadSymbol(s);
};
input.addEventListener('keydown', e => {
  if(e.key === 'Enter') btn.click();
});

helpBtn.onclick = () => {
  const hidden = howto.classList.toggle('hidden');
  helpBtn.textContent = hidden ? '¿' : '?';
};

// Autocargar último símbolo o demo
window.addEventListener('DOMContentLoaded', () => {
  const last = localStorage.getItem('lastSymbol') || 'AAPL';
  input.value = last;
  loadSymbol(last);
});

