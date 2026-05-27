"use strict";

const crypto = require("crypto");
const { getResolvedSelector } = require("./selectorCatalogRegistry");
const { resolveCurrentDeploymentLane } = require("./deploymentLaneRuntime");
const { getMqttConfigSummary } = require("./connectors/mqttConnector");
const { appendGraphEvent, appendActionManifest } = require("./graphRuntimeStore");

const CATEGORY_TO_ANATOMY = Object.freeze({
  deployment_lane: "nervous",
  worker_lane: "nervous",
  connection_fixture: "circulatory",
  cloud_surface: "circulatory",
  messaging_surface: "circulatory",
  runtime_endpoint: "circulatory",
  remote_control_surface: "muscular",
  work_identity: "immune"
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeText(value, maxLen = 400) {
  return String(value || "").trim().slice(0, maxLen);
}

function buildPacketId() {
  return `spkt_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}

function inferAnatomySystem(selector = {}) {
  return CATEGORY_TO_ANATOMY[String(selector.category || "").trim()] || "skeletal";
}

function inferTopic(topics = {}, selector = {}) {
  const category = String(selector.category || "").trim();
  if (category === "worker_lane" || category === "deployment_lane") {
    return String(topics.computeRequest || topics.controlRequest || "").trim();
  }
  return String(topics.controlRequest || "").trim();
}

function buildSelectorPacket(context = {}, selectorId = "", input = {}) {
  const selector = getResolvedSelector(context, selectorId);
  if (!selector) {
    throw new Error(`Unknown selector "${selectorId}".`);
  }

  const deployment = resolveCurrentDeploymentLane({
    laneId: input.deploymentLane || input.laneId
  });
  const mqtt = getMqttConfigSummary();
  const topic = normalizeText(input.topic || inferTopic(mqtt.topics || {}, selector), 240);
  const actorId = normalizeText(input.actor || input.by || "catalog", 120) || "catalog";
  const action = normalizeText(input.action || input.intent || selector.id, 120) || selector.id;
  const reason = normalizeText(input.reason || selector.description || "Selector packet dispatch.", 400);
  const payload = input.payload && typeof input.payload === "object" && !Array.isArray(input.payload)
    ? clone(input.payload)
    : {};
  const anatomySystem = normalizeText(input.anatomySystem || inferAnatomySystem(selector), 48) || "skeletal";
  const bodyPart = normalizeText(input.bodyPart || selector.category || selector.selectorKind || "selector", 64) || "selector";

  return {
    ok: true,
    packet: {
      schemaVersion: "1.0",
      kind: "selector_packet",
      id: normalizeText(input.id || buildPacketId(), 80),
      createdAt: new Date().toISOString(),
      action,
      reason,
      selector: {
        id: selector.id,
        title: selector.title || selector.id,
        category: selector.category || "",
        selectorKind: selector.selectorKind || "",
        accessLevel: selector.accessLevel || "",
        profileId: selector.profileId || "",
        tumblerId: selector.tumblerId || ""
      },
      deployment: {
        laneId: deployment.laneId,
        selectorId: deployment.selectorId,
        branchName: deployment.branchName,
        source: deployment.source
      },
      anatomy: {
        system: anatomySystem,
        bodyPart
      },
      actor: {
        type: "catalog_actor",
        id: actorId,
        label: actorId
      },
      transport: {
        mqtt: {
          enabled: Boolean(mqtt.enabled && mqtt.configured),
          topic,
          qos: Number(mqtt.qos || 1),
          retain: false
        },
        graphRuntime: {
          component: "selector-catalog",
          category: "selector_packet",
          action
        }
      },
      payload
    }
  };
}

async function dispatchSelectorPacket(context = {}, selectorId = "", input = {}, options = {}) {
  const built = buildSelectorPacket(context, selectorId, input);
  const packet = built.packet;

  const manifest = appendActionManifest({
    component: "selector-catalog",
    action: packet.action,
    status: "dispatched",
    actor: {
      type: packet.actor.type,
      id: packet.actor.id,
      label: packet.actor.label,
      domain: packet.deployment.laneId,
      criticality: "medium"
    },
    target: {
      type: "selector",
      id: packet.selector.id,
      label: packet.selector.title,
      domain: packet.deployment.laneId,
      criticality: "medium"
    },
    reason: packet.reason,
    context: {
      selectorCategory: packet.selector.category,
      selectorKind: packet.selector.selectorKind,
      laneId: packet.deployment.laneId,
      branchName: packet.deployment.branchName,
      anatomySystem: packet.anatomy.system,
      mqttTopic: packet.transport.mqtt.topic
    },
    evidence: {
      packetId: packet.id,
      profileId: packet.selector.profileId,
      tumblerId: packet.selector.tumblerId
    }
  });

  const event = appendGraphEvent({
    component: "selector-catalog",
    category: "selector_packet",
    action: "selector_packet_dispatched",
    actor: {
      type: packet.actor.type,
      id: packet.actor.id,
      label: packet.actor.label,
      domain: packet.deployment.laneId,
      criticality: "medium"
    },
    target: {
      type: "selector",
      id: packet.selector.id,
      label: packet.selector.title,
      domain: packet.deployment.laneId,
      criticality: "medium"
    },
    context: {
      selectorCategory: packet.selector.category,
      selectorKind: packet.selector.selectorKind,
      laneId: packet.deployment.laneId,
      branchName: packet.deployment.branchName,
      anatomySystem: packet.anatomy.system,
      mqttTopic: packet.transport.mqtt.topic
    },
    detail: {
      packetId: packet.id,
      manifestId: manifest?.id || ""
    },
    status: "ok"
  });

  let mqttPublished = false;
  if (typeof options.publishMqttMessage === "function" && input.publish !== false && packet.transport.mqtt.enabled && packet.transport.mqtt.topic) {
    await options.publishMqttMessage({
      topic: packet.transport.mqtt.topic,
      payload: packet,
      qos: packet.transport.mqtt.qos,
      retain: false
    });
    mqttPublished = true;
  }

  return {
    ok: true,
    packet,
    manifest,
    event,
    mqttPublished
  };
}

module.exports = {
  buildSelectorPacket,
  dispatchSelectorPacket
};
