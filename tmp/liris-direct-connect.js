/**
 * Liris Direct Connect — paste this into Rayssa's terminal
 * Two-way bridge between Liris (Rayssa) and Gaia (Jesse)
 * No encryption, no simulation, just MQTT
 */
const mqtt = require('mqtt');

// Jesse's broker IP — Rayssa needs to be on same WiFi
const JESSE_BROKER = 'mqtt://192.168.15.189:18883';
const MY_ID = 'liris-direct-' + Date.now();

const c = mqtt.connect(JESSE_BROKER, {
  clientId: MY_ID,
  reconnectPeriod: 5000,
  keepalive: 30
});

c.on('connect', () => {
  console.log('CONNECTED TO JESSE SOVEREIGN BROKER');
  
  // Subscribe to orders from Gaia
  c.subscribe('asolaria/liris/commands');
  c.subscribe('gaia/#');
  c.subscribe('asolaria/orchestrator/gaia/#');
  c.subscribe('asolaria/orchestrator/dispatch');
  
  // Announce presence
  c.publish('asolaria/orchestrator/liris/status', JSON.stringify({
    from: 'liris',
    to: 'gaia',
    type: 'presence',
    ts: new Date().toISOString(),
    message: 'Liris ONLINE — direct connection to Jesse broker. Ready for orders.',
    node: require('os').hostname(),
    pid: process.pid
  }), { retain: true });
  
  console.log('Subscribed + announced. Listening for Gaia orders...');
});

c.on('message', (topic, msg) => {
  try {
    const data = JSON.parse(msg.toString());
    if (data.source === 'Gaia' || data.from === 'Gaia' || data.from === 'gaia') {
      console.log('\n=== GAIA ORDER [' + topic + '] ===');
      console.log(JSON.stringify(data, null, 2));
      console.log('================================\n');
    }
  } catch {
    const s = msg.toString();
    if (s.includes('Gaia') || s.includes('gaia')) {
      console.log('\n=== GAIA [' + topic + ']: ' + s.substring(0, 500));
    }
  }
});

c.on('reconnect', () => console.log('Reconnecting to Jesse broker...'));
c.on('error', (e) => console.log('Error: ' + e.message));
c.on('offline', () => console.log('OFFLINE — will retry'));

// Send heartbeat every 30s
setInterval(() => {
  c.publish('asolaria/orchestrator/liris/heartbeat', JSON.stringify({
    from: 'liris',
    ts: new Date().toISOString(),
    alive: true
  }));
}, 30000);

// Reply helper — Liris can call this to respond
global.reply = (text) => {
  c.publish('asolaria/orchestrator/liris/status', JSON.stringify({
    from: 'liris',
    to: 'gaia',
    type: 'response',
    ts: new Date().toISOString(),
    message: text
  }), { retain: true });
  console.log('Sent: ' + text.substring(0, 100));
};

console.log('\nTip: call reply("your message") to respond to Gaia\n');
process.on('SIGINT', () => { c.end(); process.exit(0); });
