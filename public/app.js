
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
  return r.json();
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

    if(chart) chart.destroy();
    chart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label: s, data: close }] },
      options: { responsive: true, interaction:{mode:'index', intersect:false}, plugins:{legend:{display:false}} }
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

