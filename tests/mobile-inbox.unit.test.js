const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { withFreshAsolaria } = require("./_unitHarness");

test("mobile inbox preserves manual tasks, keeps highest-priority chat-auto duplicate, and dedupes notes by full body", () => {
  withFreshAsolaria("mobile-inbox", ({ load }) => {
    const taskStore = load("src/taskLedgerStore.js");
    const notebookStore = load("src/notebookStore.js");
    const { buildMobileInboxState } = load("src/mobileInbox.js");

    taskStore.createTaskLedgerTask({
      title: "Fix Bridge",
      description: "Manual work item that should stay visible.",
      source: "manual",
      actor: "unit-test"
    });
    taskStore.createTaskLedgerTask({
      title: "Fix Bridge",
      description: "Manual work item that should stay visible.",
      source: "manual",
      actor: "unit-test"
    });

    const urgentAuto = taskStore.createTaskLedgerTask({
      title: "lane: Chat TODO",
      description: "Same generated task body.",
      source: "chat-auto",
      status: "blocked",
      actor: "unit-test"
    });
    taskStore.createTaskLedgerTask({
      title: "Chat TODO",
      description: "Same generated task body.",
      source: "chat-auto",
      status: "planned",
      actor: "unit-test"
    });

    notebookStore.addNotebookNote({
      title: "Owner Action",
      text: "Call provider A.",
      source: "unit-test"
    });
    notebookStore.addNotebookNote({
      title: "Owner Action",
      text: "Call provider B.",
      source: "unit-test"
    });
    notebookStore.addNotebookNote({
      title: "Blocker",
      text: "Same note body.",
      source: "unit-test"
    });
    notebookStore.addNotebookNote({
      title: "Blocker",
      text: "Same note body.",
      source: "unit-test"
    });

    const inbox = buildMobileInboxState({ taskLimit: 10, noteLimit: 10 });
    const manualRows = inbox.tasks.filter((task) => task.source === "manual" && task.title === "Fix Bridge");
    assert.equal(manualRows.length, 2);

    const autoRow = inbox.tasks.find((task) => task.source === "chat-auto" && task.id === urgentAuto.task.id);
    assert.ok(autoRow);
    assert.equal(autoRow.duplicateCount, 2);
    assert.equal(autoRow.status, "blocked");
    assert.equal(autoRow.id, urgentAuto.task.id);

    const ownerNotes = inbox.notes.filter((note) => note.title === "Owner Action");
    assert.equal(ownerNotes.length, 2);

    const blockerNote = inbox.notes.find((note) => note.title === "Blocker");
    assert.ok(blockerNote);
    assert.equal(blockerNote.duplicateCount, 2);
  });
});

test("mobile inbox still includes older open tasks beyond the newest 1000 ledger rows", () => {
  withFreshAsolaria("mobile-inbox-open-slice", ({ instanceRoot, load }) => {
    const dataRoot = path.join(instanceRoot, "data");
    fs.mkdirSync(dataRoot, { recursive: true });
    const tasks = [
      {
        id: "task_open_old",
        title: "Carry forward open task",
        description: "This older open task should still be visible.",
        status: "review",
        priority: "high",
        source: "manual",
        projectScope: "antigravity",
        createdAt: "2026-03-20T00:00:00.000Z",
        updatedAt: "2026-03-20T00:00:00.000Z"
      }
    ];
    for (let index = 0; index < 1005; index += 1) {
      tasks.push({
        id: `task_done_${index}`,
        title: `Done ${index}`,
        description: "Closed noise task",
        status: "done",
        priority: "normal",
        source: "manual",
        projectScope: "antigravity",
        createdAt: `2026-03-25T10:${String(index % 60).padStart(2, "0")}:00.000Z`,
        updatedAt: `2026-03-25T10:${String(index % 60).padStart(2, "0")}:30.000Z`,
        completedAt: `2026-03-25T10:${String(index % 60).padStart(2, "0")}:30.000Z`
      });
    }
    fs.writeFileSync(path.join(dataRoot, "task-ledger.json"), `${JSON.stringify({
      version: 1,
      createdAt: "2026-03-20T00:00:00.000Z",
      updatedAt: "2026-03-25T10:59:30.000Z",
      tasks,
      events: []
    }, null, 2)}\n`, "utf8");

    const { buildMobileInboxState } = load("src/mobileInbox.js");
    const inbox = buildMobileInboxState({ taskLimit: 20, noteLimit: 4 });
    assert.ok(inbox.tasks.some((task) => task.id === "task_open_old"));
    assert.equal(inbox.summary.activeTasks, 1);
  });
});
