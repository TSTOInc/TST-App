import { NextResponse } from "next/server"



// normalize to only return important fields
function normalizeCarrier(c) {
  if (!c) return null
  return {
    legalName: c.legalName || null,
    dbaName: c.dbaName || null,
    dotNumber: c.dotNumber || null,
    docketNumber: [], // always return array (populate later if available)
    allowedToOperate: c.allowedToOperate || null,
    statusCode: c.statusCode || null,
    phyCity: c.phyCity || null,
    phyCountry: c.phyCountry || null,
    phyState: c.phyState || null,
    phyStreet: c.phyStreet || null,
    phyZipcode: c.phyZipcode || null,
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  const query = searchParams.get("q")
  const webKey = process.env.FMCAS_WEBKEY

  if (!type || !query) {
    return NextResponse.json(
      { error: "Missing required query parameters: type and q" },
      400
    )
  }

  if (!webKey) {
    return NextResponse.json(
      { error: "Missing FMCAS_WEBKEY environment variable" },
      500
    )
  }

  let url
  switch (type.toLowerCase()) {
    case "docket":
      url = `https://mobile.fmcsa.dot.gov/qc/services/carriers/docket-number/${encodeURIComponent(
        query
      )}?webKey=${encodeURIComponent(webKey)}`
      break
    case "usdot":
      url = `https://mobile.fmcsa.dot.gov/qc/services/carriers/${encodeURIComponent(
        query
      )}?webKey=${encodeURIComponent(webKey)}`
      break
    case "name":
      url = `https://mobile.fmcsa.dot.gov/qc/services/carriers/name/${encodeURIComponent(
        query
      )}?webKey=${encodeURIComponent(webKey)}`
      break
    default:
      return NextResponse.json(
        { error: `Invalid type parameter: ${type}` },
        400
      )
  }

  try {
    const res = await fetch(url)
    if (!res.ok) {
      return NextResponse.json(
        { error: `External API error: ${res.status}` },
        res.status
      )
    }

    const data = await res.json()

    // Handle USDOT / Docket lookup
    if (
      (type.toLowerCase() === "usdot" || type.toLowerCase() === "docket") &&
      data.content?.carrier
    ) {
      const carrier = normalizeCarrier(data.content.carrier)

      // Enrich with docket numbers if link available
      const docketUrl = data.content._links?.["docket numbers"]?.href
      if (docketUrl) {
        try {
          const docketRes = await fetch(
            `${docketUrl}?webKey=${encodeURIComponent(webKey)}`
          )
          if (docketRes.ok) {
            const docketData = await docketRes.json()
            carrier.docketNumber =
              docketData.content?.map(
                (d) => `${d.prefix}-${d.docketNumber}`
              ) || []
          }
        } catch {
          carrier.docketNumber = []
        }
      }

      return NextResponse.json({ carriers: carrier ? [carrier] : [] })
    }

    // Handle Name search
    if (type.toLowerCase() === "name" && Array.isArray(data.content)) {
      const carriers = data.content
        .map((item) => normalizeCarrier(item.carrier))
        .filter(Boolean) // remove nulls
      return NextResponse.json({ carriers })
    }

    return NextResponse.json({ carriers: [] })
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      500
    )
  }
}
