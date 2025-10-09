import { NextResponse } from 'next/server';



export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const type = searchParams.get('type');
  const query = searchParams.get('q');
  const webKey = process.env.FMCAS_WEBKEY;

  if (!type || !query) {
    return NextResponse.json({ error: 'Missing required query parameters: type and q' }, 400);
  }

  if (!webKey) {
    return NextResponse.json({ error: 'Missing FMCAS_WEBKEY environment variable' }, 500);
  }

  let url;
  switch (type.toLowerCase()) {
    case 'docket':
      url = `https://mobile.fmcsa.dot.gov/qc/services/carriers/docket-number/${encodeURIComponent(query)}?webKey=${encodeURIComponent(webKey)}`;
      break;
    case 'usdot':
      url = `https://mobile.fmcsa.dot.gov/qc/services/carriers/${encodeURIComponent(query)}/authority?webKey=${encodeURIComponent(webKey)}`;
      break;
    case 'name':
      url = `https://mobile.fmcsa.dot.gov/qc/services/carriers/name/${encodeURIComponent(query)}?webKey=${encodeURIComponent(webKey)}`;
      break;
    default:
      return NextResponse.json({ error: `Invalid type parameter: ${type}` }, 400);
  }

  try {
    const res = await fetch(url);

    if (!res.ok) {
      return NextResponse.json({ error: `External API error: ${res.status}` }, res.status);
    }

    const data = await res.json();

    // For 'name' type, filter results for allowedToOperate === 'Y'
    if (type.toLowerCase() === 'name' && Array.isArray(data.content)) {
      const filtered = data.content.filter(item => item.carrier.allowedToOperate === 'Y');
      const carriers = filtered.map(item => item.carrier);
      return NextResponse.json({ carriers });
    }

    // For 'docket' and 'usdot', try to safely return carrier data
    if (type.toLowerCase() === 'docket' && Array.isArray(data.content) && data.content.length > 0) {
      return NextResponse.json(data.content[0].carrier);
    }

    if ((type.toLowerCase() === 'usdot' || type.toLowerCase() === 'name') && data.content && data.content.carrier) {
      return NextResponse.json(data);
    }

    // Fallback: just return full data if none of the above match
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, 500);
  }
}
