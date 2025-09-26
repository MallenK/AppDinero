export default async (req) => {
  const origin = req.headers.get('origin') || '*';
  if (req.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' } });

  const key = process.env.ALPHAVANTAGE_KEY;
  const url = new URL(req.url);
  const symbol = (url.searchParams.get('symbol') || '').toUpperCase();
  const outputsize = url.searchParams.get('size') === 'full' ? 'full' : 'compact';

  if (!symbol) return new Response(JSON.stringify({ error: 'symbol required' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' } });

  const up = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${encodeURIComponent(symbol)}&outputsize=${outputsize}&apikey=${key}`);
  const body = await up.text();

  return new Response(body, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=21600, s-maxage=21600',
      'Access-Control-Allow-Origin': origin,
      'Vary': 'Origin'
    }
  });
}
