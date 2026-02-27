// Cloudflare Worker — relay for 888starz.bet API
// Deploy: wrangler deploy  OR  via Cloudflare dashboard

const ALLOWED_HOST = "888starz.bet";

const UA_POOL = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1",
];

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const target = url.searchParams.get("url");
    if (!target) {
      return new Response(JSON.stringify({ error: "Missing ?url= param" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let targetUrl;
    try {
      targetUrl = new URL(decodeURIComponent(target));
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL" }), { status: 400 });
    }

    // Security: only allow 888starz.bet
    if (targetUrl.hostname !== ALLOWED_HOST) {
      return new Response(JSON.stringify({ error: "Forbidden host" }), { status: 403 });
    }

    // Pick random UA
    const ua = UA_POOL[Math.floor(Math.random() * UA_POOL.length)];

    try {
      const resp = await fetch(targetUrl.toString(), {
        headers: {
          "x-app-n": "__BETTING_APP__",
          "x-svc-source": "__BETTING_APP__",
          "x-requested-with": "XMLHttpRequest",
          "referer": "https://888starz.bet/en",
          "user-agent": ua,
          "accept": "application/json, text/plain, */*",
          "accept-encoding": "gzip, deflate, br",
        },
        cf: { cacheTtl: 0 },
      });

      const body = await resp.arrayBuffer();
      const headers = new Headers();
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("Content-Type", resp.headers.get("Content-Type") || "application/json");

      // Forward encoding so Python can decompress
      const enc = resp.headers.get("Content-Encoding");
      if (enc) headers.set("Content-Encoding", enc);

      return new Response(body, { status: resp.status, headers });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
