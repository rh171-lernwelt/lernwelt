// Pauls Fortschritt-Sync (Client-Seite).
// Das LADEN aus der Cloud erledigt schon der Server (Seed im <head>) –
// hier geht es nur darum, spätere Änderungen am localStorage zurück in die Cloud zu SPEICHERN.
// Pauls Speicher-Schlüssel werden dabei NICHT verändert, nur 1:1 mitgesichert.
(function () {
  "use strict";

  // Aktuellen Stand des gesamten localStorage als Objekt einsammeln.
  function snapshot() {
    var out = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k !== null) out[k] = localStorage.getItem(k);
      }
    } catch (e) {}
    return out;
  }

  var timer = null;

  function push() {
    try {
      var data = JSON.stringify(snapshot());
      fetch("/api/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: data,
        keepalive: true,
      }).catch(function () {});
    } catch (e) {}
  }

  // Mehrere schnelle Änderungen zu einem Speichervorgang bündeln.
  function schedulePush() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(push, 1500);
  }

  // Schreibzugriffe auf localStorage abfangen und Speichern auslösen.
  try {
    var _set = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (k, v) {
      _set(k, v);
      schedulePush();
    };
    var _rem = localStorage.removeItem.bind(localStorage);
    localStorage.removeItem = function (k) {
      _rem(k);
      schedulePush();
    };
  } catch (e) {}

  // Beim Verlassen/Wegklicken der Seite den Stand sicher wegschreiben.
  function flush() {
    try {
      var data = JSON.stringify(snapshot());
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/progress",
          new Blob([data], { type: "application/json" })
        );
      } else {
        push();
      }
    } catch (e) {}
  }

  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flush();
  });
})();
