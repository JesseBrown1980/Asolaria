/**
 * Seed 200 EzProtect alert history entries into ezprotectalerthistories collection.
 * Run: node tmp/seed-alert-history-200.js
 */
const mongoose = require('D:/projects/QDD/ebacmap-master/node_modules/.pnpm/mongoose@8.15.2_socks@2.8.7/node_modules/mongoose');
const { Schema, Types } = mongoose;

const EzProtectAlertHistorySchema = new Schema(
  {
    alertRuleId: { type: Schema.Types.ObjectId, ref: 'EzProtectAlertRule', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location' },
    eventId: { type: Schema.Types.ObjectId, ref: 'EzProtectEvent' },
    alertName: { type: String, required: true },
    triggerType: { type: String, required: true },
    channel: { type: String, required: true },
    recipients: [{ type: String }],
    message: { type: String, required: true },
    sentAt: { type: Date, required: true },
    acknowledged: { type: Boolean, default: false },
    acknowledgedAt: { type: Date },
    acknowledgedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

const MODEL_NAME = 'EzProtectAlertHistory';
const COLLECTION = 'ezprotectalerthistories';

const clientId = new Types.ObjectId('69c41938d84980e337ac77cd');
const locationId = new Types.ObjectId('69c41938d84980e337ac77cf');

// 7 alert rules with realistic names and trigger types
const alertRules = [
  { id: new Types.ObjectId(), name: 'MSA Result — Positive Detection',    triggerType: 'result_state' },
  { id: new Types.ObjectId(), name: 'MSA Result — Presumptive Positive',  triggerType: 'result_state' },
  { id: new Types.ObjectId(), name: 'Device Offline > 30 min',            triggerType: 'device_offline' },
  { id: new Types.ObjectId(), name: 'Temperature Threshold Exceeded',     triggerType: 'threshold' },
  { id: new Types.ObjectId(), name: 'Control Failure — Positive Control', triggerType: 'control_failure' },
  { id: new Types.ObjectId(), name: 'PM Schedule Overdue',                triggerType: 'pm_failure' },
  { id: new Types.ObjectId(), name: 'Calibration Drift Detected',         triggerType: 'calibration_failure' },
];

const channels = ['email', 'dashboard', 'sms', 'both'];

const deviceSerials = [
  'MSA-4100-A01', 'MSA-4100-A02', 'MSA-4100-B01', 'MSA-4200-C01',
  'MSA-4200-C02', 'ENV-MON-T01', 'ENV-MON-T02', 'ENV-MON-H01',
  'CTL-BAT-001', 'CTL-BAT-002', 'CAL-STD-01', 'CAL-STD-02'
];

const recipientSets = [
  ['lab-manager@company.com'],
  ['qa-team@company.com'],
  ['lab-manager@company.com', 'qa-team@company.com'],
  ['ops-lead@company.com'],
  ['safety@company.com', 'lab-manager@company.com'],
  ['maintenance@company.com'],
  ['+15551234567'],
  ['lab-manager@company.com', '+15559876543'],
];

const sampleNames = [
  'BF-2026-0401', 'BF-2026-0402', 'BF-2026-0415', 'CHK-2026-0501',
  'CHK-2026-0510', 'PT-2026-0220', 'PT-2026-0305', 'RTE-2026-0118',
  'RTE-2026-0201', 'ENV-2026-0315', 'SWB-2026-0422', 'SWB-2026-0430'
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function buildMessage(rule, serial, sampleId) {
  switch (rule.triggerType) {
    case 'result_state':
      return `${rule.name}: Sample ${sampleId} on device ${serial} returned a positive result. Immediate review required.`;
    case 'device_offline':
      return `Device ${serial} has been offline for ${randInt(31, 180)} minutes. Last heartbeat lost. Check network and power.`;
    case 'threshold': {
      const temp = (37 + Math.random() * 8).toFixed(1);
      return `Temperature on ${serial} reached ${temp}\u00B0C, exceeding the 40\u00B0C threshold. Inspect incubator immediately.`;
    }
    case 'control_failure':
      return `Positive control on device ${serial} failed for batch ${sampleId}. Run invalidated \u2014 retest required.`;
    case 'pm_failure': {
      const days = randInt(3, 30);
      return `Preventive maintenance for ${serial} is ${days} days overdue. Schedule service to maintain compliance.`;
    }
    case 'calibration_failure': {
      const drift = (Math.random() * 2.5 + 0.3).toFixed(2);
      return `Calibration drift of ${drift}% detected on ${serial}. Recalibrate before next production run.`;
    }
    default:
      return `Alert triggered on ${serial}.`;
  }
}

async function main() {
  await mongoose.connect('mongodb://localhost:27017/ebacmap-local-test');
  console.log('Connected to MongoDB');

  const Model = mongoose.model(MODEL_NAME, EzProtectAlertHistorySchema, COLLECTION);

  // Spread over 3 months: 2025-12-25 to 2026-03-25
  const startDate = new Date('2025-12-25T00:00:00Z');
  const endDate   = new Date('2026-03-25T23:59:59Z');
  const rangeMs   = endDate.getTime() - startDate.getTime();

  const docs = [];
  for (let i = 0; i < 200; i++) {
    const rule = pick(alertRules);
    const serial = pick(deviceSerials);
    const sampleId = pick(sampleNames);
    const channel = pick(channels);
    const recipients = pick(recipientSets);
    const sentAt = new Date(startDate.getTime() + Math.random() * rangeMs);

    const acked = Math.random() < 0.6;

    const doc = {
      alertRuleId: rule.id,
      clientId,
      locationId,
      eventId: new Types.ObjectId(),
      alertName: rule.name,
      triggerType: rule.triggerType,
      channel,
      recipients,
      message: buildMessage(rule, serial, sampleId),
      sentAt,
      acknowledged: acked,
    };

    if (acked) {
      const ackDelay = randInt(5 * 60000, 48 * 3600000); // 5 min to 48 hours
      doc.acknowledgedAt = new Date(sentAt.getTime() + ackDelay);
      doc.acknowledgedBy = new Types.ObjectId();
    }

    docs.push(doc);
  }

  // Sort by sentAt
  docs.sort((a, b) => a.sentAt - b.sentAt);

  const result = await Model.insertMany(docs);
  console.log(`Inserted ${result.length} alert history entries into ${COLLECTION}`);

  // Stats
  const byTrigger = {};
  const byChannel = {};
  for (const d of docs) {
    byTrigger[d.triggerType] = (byTrigger[d.triggerType] || 0) + 1;
    byChannel[d.channel] = (byChannel[d.channel] || 0) + 1;
  }
  console.log('By trigger type:', byTrigger);
  console.log('By channel:', byChannel);
  console.log(`Date range: ${docs[0].sentAt.toISOString()} -> ${docs[docs.length - 1].sentAt.toISOString()}`);
  console.log(`Acknowledged: ${docs.filter(d => d.acknowledged).length} / ${docs.length}`);

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
