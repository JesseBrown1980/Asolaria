const {
  PHONE_AGENTS,
  initializePhoneWorkers,
  getPhoneWorker,
  resetPhoneWorkers,
  getPhoneBridgeStatus
} = require("../../src/phoneConstructionBridge");

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`FAIL  ${label}`);
  }
}

function run() {
  resetPhoneWorkers();
  initializePhoneWorkers();

  const falconSpec = PHONE_AGENTS.falcon || {};
  const worker = getPhoneWorker("phone:falcon");

  assert(Array.isArray(falconSpec.capabilities), "falcon capabilities defined");
  assert(falconSpec.capabilities.includes("edge_compute"), "falcon carries edge_compute capability");
  assert(falconSpec.capabilities.includes("termux"), "falcon carries termux capability");
  assert(Boolean(worker), "falcon worker initialized");

  const dispatch = worker.dispatchToConstruction("qdd-ez-protect", "hash the latest packet");
  assert(dispatch.ok === true, "falcon dispatch succeeds");
  assert(worker.status === "dispatched", "falcon status becomes dispatched");

  const result = worker.reportResults({
    summary: "sha256 batch completed",
    data: { exitCode: 0, stdout: "ok" },
    success: true
  });
  const status = getPhoneBridgeStatus();
  const row = Array.isArray(status.phoneWorkers)
    ? status.phoneWorkers.find((item) => item.id === "phone:falcon")
    : null;

  assert(result.constructionId === "qdd-ez-protect", "result keeps current construction id");
  assert(worker.status === "returning", "falcon status becomes returning after result");
  assert(row?.latestEdgeComputeSummary === "sha256 batch completed", "bridge status exposes latest result summary");
  assert(row?.latestEdgeComputeSuccess === true, "bridge status exposes latest result success");

  worker.returnToIdle();
  assert(worker.status === "idle", "falcon returns to idle");
  assert(worker.currentConstructionId === null, "falcon clears construction on idle");

  console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
