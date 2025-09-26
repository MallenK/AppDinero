
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
  const url = `${API_BASE}/history?symbol=${encodeURIComponent(symbol)}&size=compact`;
  console.debug('[history] GET', url);
  const r = await fetch(url);
  const text = await r.text();
  console.debug('[history] raw', text.slice(0, 400));
  let j;
  try { j = JSON.parse(text); } catch (e) {
    console.error('[history] JSON parse error', e);
    throw new Error('Respuesta inválida del proveedor');
  }

  // Mensajes de proveedor
  if (j['Note']) { console.warn('[history] Note', j['Note']); throw new Error('Límite de peticiones. Prueba en 60–90 s'); }
  if (j['Information']) { console.warn('[history] Information', j['Information']); throw new Error('Proveedor congestionado. Reintenta luego'); }
  if (j['Error Message']) { console.warn('[history] Error Message', j['Error Message']); throw new Error('Símbolo no válido'); }

  // Claves posibles
  const ts = j['Time Series (Daily)'] || j['Time Series (Daily) '] || j['Daily Time Series'];
  if (!ts || typeof ts !== 'object' || !Object.keys(ts).length) {
    console.error('[history] serie vacía. Claves disponibles:', Object.keys(j));
    throw new Error('Histórico no disponible ahora. Inténtalo en 1–2 min');
  }

  const days = Object.keys(ts).sort(); // asc
  const labels = [];
  const data = [];
  for (const d of days) {
    const row = ts[d] || {};
    const v = Number(row['5. adjusted close'] ?? row['4. close']);
    if (Number.isFinite(v)) { labels.push(d); data.push(v); }
  }
  if (data.length < 2) {
    console.warn('[history] pocos puntos', { points: data.length });
    throw new Error('Sin suficientes puntos para graficar');
  }
  console.debug('[history] points', data.length);
  return { labels, data };
}

// En loadSymbol, dibuja así:
const { labels, data } = await getDaily(s);
if (chart) chart.destroy();
chart = new Chart(ctx, {
  type: 'line',
  data: { labels, datasets: [{ label: s, data }] },
  options: { responsive: true, interaction:{mode:'index', intersect:false}, plugins:{legend:{display:false}}, parsing:false }
});



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

