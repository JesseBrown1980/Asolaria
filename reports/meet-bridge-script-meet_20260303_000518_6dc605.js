(() => {
  const ingestOrigin = "http://127.0.0.1:4781";
  const sessionId = "meet_20260303_000518_6dc605";
  const seen = new Set();
  const normalize = (v) => String(v || "").replace(/\s+/g, " ").trim();
  const isChatOrInput = (el) => {
    if (!el) return true;
    if (el.closest('input,textarea,[contenteditable="true"],[role="textbox"]')) return true;
    const meta = normalize(${el.getAttribute("aria-label") || ""}   ).toLowerCase();
    return meta.includes("chat") || meta.includes("message") || meta.includes("textbox") || meta.includes("composer");
  };
  const pushLine = (line) => {
    const text = normalize(line);
    if (text.length < 2) return;
    const url = ${ingestOrigin}/api/voice/bridge-caption/push
      + ?text=
      + &source=google_meet_caption
      + &sessionId=
      + &at=;
    try {
      const sent = typeof navigator.sendBeacon === "function" ? navigator.sendBeacon(url) : false;
      if (!sent && typeof fetch === "function") {
        fetch(url, { method: "GET", mode: "no-cors", keepalive: true, cache: "no-store" }).catch(() => {});
      }
    } catch {}
  };
  const collect = () => {
    const roots = Array.from(document.querySelectorAll('[aria-live], [role="log"], [role="status"]'));
    const out = [];
    for (const root of roots) {
      if (isChatOrInput(root)) continue;
      const txt = normalize(root.innerText || root.textContent);
      if (!txt) continue;
      for (const raw of txt.split(/\n+/)) {
        const line = normalize(raw);
        if (line.length < 2 || line.length > 260) continue;
        out.push(line);
      }
    }
    return out.slice(-20);
  };
  const push = () => {
    for (const line of collect()) {
      const key = line.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      if (seen.size > 900) {
        const first = seen.values().next().value;
        if (first) seen.delete(first);
      }
      pushLine(line);
    }
  };
  window.__asolariaCaptionBridgeStop?.();
  const observer = new MutationObserver(push);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  const timer = setInterval(push, 250);
  window.__asolariaCaptionBridgeStop = () => {
    clearInterval(timer);
    observer.disconnect();
    console.log("Asolaria caption bridge stopped.");
  };
  push();
  console.log("Asolaria caption bridge active (session: " + sessionId + ").");
})();
