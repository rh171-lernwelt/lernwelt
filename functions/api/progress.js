// Cloud-Speicher für Pauls Fortschritt.
// POST  /api/progress  -> speichert den übergebenen Fortschritt
// GET   /api/progress  -> liefert den gespeicherten Fortschritt (Fallback/Debug)

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const data = (env.PAUL_KV && (await env.PAUL_KV.get("paul-blob"))) || "null";
    return new Response(data, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    return new Response("null", {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.text();
    const parsed = JSON.parse(body); // muss gültiges JSON-Objekt sein
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      if (env.PAUL_KV) {
        await env.PAUL_KV.put("paul-blob", JSON.stringify(parsed));
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: false, error: "kein Objekt" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "ungueltig" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
}
