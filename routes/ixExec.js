// IX execution route | PID: asolaria | Profile: asolaria
// POST /exec — run single IX module   POST /chain — run sequence
// GET  /list — all modules             GET  /status — resolver status
const router = require("express").Router();
const path = require("path");
const sovRoot = process.env.ASOLARIA_SOVEREIGNTY_ROOT || path.join(__dirname, "..", "..", "sovereignty");
const resolver = require(path.join(sovRoot, "kernel", "ix-resolver"));

router.post("/exec", async (req, res) => {
  try {
    const ix = req.body?.ix;
    if (!ix) return res.status(400).json({ ok: false, error: "missing ix field" });
    const result = await Promise.resolve(resolver.exec(ix));
    res.json({ ok: true, ix, result });
  } catch (e) {
    res.status(500).json({ ok: false, ix: req.body?.ix, error: e.message });
  }
});

router.post("/chain", async (req, res) => {
  try {
    const chain = req.body?.chain;
    if (!Array.isArray(chain) || !chain.length) return res.status(400).json({ ok: false, error: "chain must be non-empty array" });
    const results = [];
    for (const ix of chain) {
      try {
        const result = await Promise.resolve(resolver.exec(ix));
        results.push({ ix, ok: true, result });
      } catch (e) {
        results.push({ ix, ok: false, error: e.message });
      }
    }
    res.json({ ok: true, results });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get("/list", (_req, res) => {
  try {
    const modules = resolver.list();
    res.json({ ok: true, count: modules.length, modules });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get("/status", (_req, res) => {
  try {
    const reg = resolver.build();
    const total = Object.keys(reg).length;
    const executable = Object.values(reg).filter(v => v.executable).length;
    res.json({ ok: true, total, executable, ready: total > 0 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
