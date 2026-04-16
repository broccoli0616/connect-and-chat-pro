import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.METERED_API_KEY;
  const meteredDomain = process.env.METERED_DOMAIN;

  if (!apiKey || !meteredDomain) {
    return res.status(500).json({ error: "TURN server not configured" });
  }

  try {
    const credentialsUrl = new URL(`https://${meteredDomain}/api/v1/turn/credentials`);
    credentialsUrl.searchParams.set("apiKey", apiKey);

    const response = await fetch(credentialsUrl.toString());
    if (!response.ok) {
      return res.status(502).json({ error: "Failed to fetch TURN credentials" });
    }

    const iceServers = await response.json();
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    return res.status(200).json(iceServers);
  } catch {
    return res.status(502).json({ error: "Failed to fetch TURN credentials" });
  }
}
