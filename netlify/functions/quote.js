export default async (req) => {
  // CORS
  const origin = req.headers.get('origin') || '*';
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin'
      }
    });
  }

  const key = process.env.ALPHAVANTAGE_KEY;
  const url = new URL(req.url);
  const symbol = (url.searchParams.get('symbol') || '').toUpperCase();
  if (!symbol) {
    return new Response(JSON.stringify({ error: 'symbol required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' }
    });
  }

  const upstream = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${key}`);
  const body = await upstream.text();

  return new Response(body, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
      'Access-Control-Allow-Origin': origin,
      'Vary': 'Origin'
    }
  });
}
