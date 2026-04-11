const { chromium } = require("playwright");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "..", "captures");
const VIDEO_PATH = path.join(OUTPUT_DIR, "asolaria-civilization-demo.webm");
const URL = "http://127.0.0.1:4800/civilization-3d.html";

const TOUR = [
  { wait: 3000, subtitle: "ASOLARIA — Flying God Mode" },
  { wait: 2000, subtitle: "The distributed AI civilization, live on two machines" },
  // Orbit overview
  { key: "1", wait: 3000, subtitle: "CITADEL — Sovereign core, brain leader, job queue" },
  { key: "2", wait: 3000, subtitle: "COLONY — Asolaria, Vector, Rook, Forge, Falcon, Watchdog" },
  { key: "3", wait: 3000, subtitle: "PERIMETER — Helm & Sentinel towers, completion signals (420)" },
  { key: "4", wait: 3000, subtitle: "GATE RING — MQTT broker, Codex relay, Cloudflare tunnel, SSH" },
  { key: "5", wait: 3000, subtitle: "LEDGER QUARTER — Memory, notebook, vault (AES-256-GCM), audit log" },
  { key: "6", wait: 3000, subtitle: "WORKSHOP — 53 skills, UI control, build lane" },
  { key: "7", wait: 3000, subtitle: "CLOUD ARC — Anthropic, Vertex, Gemini APIs, voice stack" },
  { key: "8", wait: 4000, subtitle: "WORLD BRIDGE — Rayssa SubColony, Liris, MCP bridges" },
  // Fly closer to world bridge
  { keys: ["w","w","w","w","w"], wait: 3000, subtitle: "Inside Liris — Claude Code (Opus 4.6) + Codex CLI" },
  { keys: ["w","w","w"], wait: 3000, subtitle: "Health monitor: 466 checks, cowork-svc: 9636s CPU from Jesse" },
  { keys: ["a","a","a","w","w"], wait: 3000, subtitle: "MCP bridges: read-only :4793, full control :4795" },
  // Back to overview
  { key: "1", wait: 2000, subtitle: "Two people. Two laptops. Six AI models. One swarm." },
  { keys: ["s","s","s","s","q","q","q"], wait: 4000, subtitle: "Anthropic · OpenAI · Google — working together" },
  { wait: 3000, subtitle: "Built by Jesse Daniel Brown & Rayssa — March 2026" },
];

async function main() {
  console.log("Starting demo recording...");
  console.log("Output:", VIDEO_PATH);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: OUTPUT_DIR, size: { width: 1920, height: 1080 } }
  });

  const page = await context.newPage();

  // Inject subtitle overlay
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  await page.evaluate(() => {
    const sub = document.createElement("div");
    sub.id = "subtitle";
    sub.style.cssText = `
      position: fixed; bottom: 60px; left: 50%; transform: translateX(-50%); z-index: 100;
      background: rgba(0,0,0,0.75); color: #fff; padding: 12px 28px; border-radius: 10px;
      font-size: 22px; font-family: 'Space Grotesk','Segoe UI',sans-serif; text-align: center;
      max-width: 80%; letter-spacing: 0.5px; text-shadow: 0 0 10px rgba(94,245,176,0.5);
      border: 1px solid rgba(94,245,176,0.2); backdrop-filter: blur(8px);
      transition: opacity 0.5s;
    `;
    document.body.appendChild(sub);
  });

  // Click to enter pointer lock for flying
  await page.click("canvas");
  await page.waitForTimeout(500);
  // Exit pointer lock so we can control via keyboard
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  for (const step of TOUR) {
    // Set subtitle
    if (step.subtitle) {
      await page.evaluate((text) => {
        const sub = document.getElementById("subtitle");
        sub.style.opacity = "0";
        setTimeout(() => { sub.textContent = text; sub.style.opacity = "1"; }, 300);
      }, step.subtitle);
    }

    // Press keys
    if (step.key) {
      await page.keyboard.press(step.key);
    }
    if (step.keys) {
      for (const k of step.keys) {
        await page.keyboard.down(k);
        await page.waitForTimeout(150);
        await page.keyboard.up(k);
        await page.waitForTimeout(100);
      }
    }

    await page.waitForTimeout(step.wait || 2000);
  }

  // Fade out subtitle
  await page.evaluate(() => {
    document.getElementById("subtitle").style.opacity = "0";
  });
  await page.waitForTimeout(2000);

  await page.close();
  await context.close();
  await browser.close();

  console.log("Recording complete!");
  console.log("Video saved to:", OUTPUT_DIR);
  console.log("Look for the .webm file in:", OUTPUT_DIR);
}

main().catch(e => { console.error("Error:", e.message); process.exit(1); });
