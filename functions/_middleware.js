// Läuft vor JEDER Anfrage an die Lernwelt.
// Aufgabe: Pauls gespeicherten Fortschritt aus dem Cloud-Speicher (KV) holen
// und so in jede HTML-Seite schreiben, dass die Spiele ihn beim Start schon kennen –
// ganz OHNE die Spiel-Dateien selbst zu verändern.

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // API-Aufrufe (z. B. /api/progress) nicht anfassen – die machen ihr eigenes Ding.
  if (url.pathname.startsWith("/api/")) {
    return next();
  }

  // Die eigentliche Seite/Datei holen.
  const response = await next();

  // Nur echte HTML-Seiten bearbeiten (Bilder, JS, CSS bleiben unberührt).
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  // Pauls Fortschritt aus dem Cloud-Speicher holen (defensiv – bei Fehler: nichts seeden).
  let blobJson = "null";
  try {
    if (env.PAUL_KV) {
      const stored = await env.PAUL_KV.get("paul-blob");
      if (stored) blobJson = stored;
    }
  } catch (e) {
    blobJson = "null";
  }

  // Seed-Skript: schreibt die Cloud-Werte in localStorage, BEVOR die Spiel-Skripte laufen.
  // Wird ganz vorne in den <head> gesetzt, läuft also als Erstes.
  const seedScript =
    "<script>(function(){try{var d=" +
    blobJson +
    ';if(d&&typeof d==="object"){for(var k in d){if(Object.prototype.hasOwnProperty.call(d,k)){try{localStorage.setItem(k,d[k]);}catch(e){}}}}}catch(e){}})();<\/script>';

  // Sync-Skript: schiebt spätere Änderungen zurück in die Cloud. Timing unkritisch.
  const syncScript = '<script src="/paul-sync.js" defer><\/script>';

  return new HTMLRewriter()
    .on("head", {
      element(el) {
        el.prepend(seedScript, { html: true });
        el.append(syncScript, { html: true });
      },
    })
    .transform(response);
}
