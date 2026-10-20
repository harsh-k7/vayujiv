/**
 * VAYUJIV Command Gateway & Backend Server
 */

import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import mqtt from 'mqtt';
import { getDb, logSystemEvent } from './db.js';
import { droneController } from './drone.js';
import { simulator } from './simulator.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

simulator.setBroadcastCallback(broadcast);
simulator.start();

app.get('/api/soldiers', (req, res) => {
  const db = getDb();
  res.json({ success: true, soldiers: db.soldiers, baseStation: db.baseStation, noFlyZones: db.noFlyZones });
});

app.get('/api/alerts', (req, res) => {
  const db = getDb();
  res.json({ success: true, alerts: db.alerts });
});

app.post('/api/alerts/:id/ack', (req, res) => {
  const db = getDb();
  const alert = db.alerts.find(a => a.id === req.params.id);
  if (alert) {
    alert.acknowledged = true;
    alert.ackedAt = new Date().toISOString();
    logSystemEvent('INFO', 'Alert ' + alert.id + ' acknowledged by operator', 'OPERATOR');
    broadcast({ type: 'ALERT_ACKNOWLEDGED', alertId: alert.id });
    return res.json({ success: true, alert });
  }
  res.status(404).json({ success: false, message: 'Alert not found' });
});

app.get('/api/drone', (req, res) => {
  res.json({ success: true, drone: droneController.getState() });
});

app.post('/api/drone/dispatch', (req, res) => {
  const db = getDb();
  const { soldierId } = req.body;
  const soldier = db.soldiers.find(s => s.id === soldierId);
  if (!soldier) {
    return res.status(400).json({ success: false, message: 'Soldier not found' });
  }
  const result = droneController.dispatchMission(soldier, db.noFlyZones);
  broadcast({ type: 'DRONE_UPDATE', drone: droneController.getState() });
  res.json(result);
});

app.post('/api/drone/recall', (req, res) => {
  const { reason } = req.body;
  const result = droneController.recallMission(reason || 'Operator Manual Command');
  broadcast({ type: 'DRONE_UPDATE', drone: droneController.getState() });
  res.json(result);
});

app.post('/api/scenarios/trigger', (req, res) => {
  const { scenario } = req.body;
  simulator.injectScenario(scenario);
  res.json({ success: true, scenario });
});

// Real Hardware ESP32 & IoT Telemetry Ingestion Endpoints
function parseSerialLog(rawText) {
  const result = {};
  const lines = (rawText || '').split(/\r?\n/);
  for (const line of lines) {
    const tempMatch = line.match(/Temperature:\s*([0-9.]+)/i);
    if (tempMatch) result.temp = parseFloat(tempMatch[1]);

    const latMatch = line.match(/Latitude:\s*([0-9.]+)/i);
    if (latMatch) result.lat = parseFloat(latMatch[1]);

    const lngMatch = line.match(/Longitude:\s*([0-9.]+)/i);
    if (lngMatch) result.lng = parseFloat(lngMatch[1]);

    const satMatch = line.match(/GPS satellites:\s*([0-9]+)/i);
    if (satMatch) result.satellites = parseInt(satMatch[1]);

    const fixMatch = line.match(/GPS fix age\s*\(ms\):\s*([0-9]+)/i);
    if (fixMatch) result.fixAge = parseInt(fixMatch[1]);
  }
  return result;
}

app.post('/api/telemetry', (req, res) => {
  const data = req.body || {};
  console.log('📡 [LIVE ESP32 TELEMETRY RECEIVED]:', JSON.stringify(data));
  const result = simulator.ingestTelemetry(data);
  res.json(result);
});

app.get('/api/telemetry', (req, res) => {
  const data = req.query || {};
  console.log('📡 [LIVE ESP32 TELEMETRY RECEIVED (GET)]:', JSON.stringify(data));
  const result = simulator.ingestTelemetry(data);
  res.json(result);
});

app.post('/api/telemetry/raw', (req, res) => {
  const rawText = typeof req.body === 'string' ? req.body : (req.body?.raw || '');
  const parsed = parseSerialLog(rawText);
  if (req.body?.panic || req.query?.panic) parsed.panic = true;
  if (req.body?.redSignal || req.query?.redSignal) parsed.redSignal = true;
  const result = simulator.ingestTelemetry(parsed);
  res.json({ success: true, parsed, ...result });
});

app.get('/api/logs', (req, res) => {
  const db = getDb();
  res.json({ success: true, logs: db.systemLogs });
});

// Mobile Remote Page for Friend's Phone (Accessible over Tunnel or Network)
app.get('/remote', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>VAYUJIV Mobile Tactical Link</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #020617; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 16px; }
    .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin-bottom: 14px; }
    h1 { font-size: 18px; color: #38bdf8; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .badge { display: inline-block; background: #0369a1; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
    .btn-red { width: 100%; background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); color: #fff; font-size: 16px; font-weight: bold; padding: 16px; border: none; border-radius: 10px; cursor: pointer; box-shadow: 0 0 20px rgba(239,68,68,0.5); margin-top: 8px; }
    .btn-blue { width: 100%; background: #0284c7; color: #fff; font-size: 14px; font-weight: bold; padding: 12px; border: none; border-radius: 8px; cursor: pointer; margin-top: 8px; }
    .btn-dark { background: #1e293b; color: #38bdf8; border: 1px solid #38bdf8; padding: 10px; border-radius: 6px; font-size: 13px; font-weight: bold; width: 100%; margin-top: 6px; cursor: pointer; }
    textarea { width: 100%; background: #020617; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0; padding: 10px; font-family: monospace; font-size: 12px; resize: vertical; }
    .status { padding: 10px; border-radius: 6px; font-size: 12px; font-family: monospace; margin-top: 10px; display: none; }
    .status.ok { background: rgba(16,185,129,0.2); border: 1px solid #10b981; color: #34d399; display: block; }
    .status.err { background: rgba(239,68,68,0.2); border: 1px solid #ef4444; color: #f87171; display: block; }
  </style>
</head>
<body>
  <div style="margin-bottom: 14px; text-align: center;">
    <h1>🛰️ VAYUJIV MOBILE LINK</h1>
    <p style="font-size: 11px; color: #94a3b8;">Soldier Field Telemetry & Distress Transmitter</p>
  </div>

  <div class="card" style="border-color: #ef4444;">
    <div style="font-size: 12px; color: #f87171; font-weight: bold; margin-bottom: 4px;">EMERGENCY DISTRESS BEACON</div>
    <p style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">Triggers instant casualty alert & autonomous drone dispatch</p>
    <button class="btn-red" onclick="triggerDistress()">🚨 TRANSMIT RED SIGNAL (SOS)</button>
  </div>

  <div class="card">
    <div style="font-size: 12px; color: #38bdf8; font-weight: bold; margin-bottom: 6px;">QUICK SYNC HARDWARE SENSORS</div>
    <button class="btn-blue" onclick="sendQuickData()">📍 Send GPS (28.7065, 77.6802) & Temp (26.8°C)</button>
  </div>

  <div class="card">
    <div style="font-size: 12px; color: #cbd5e1; font-weight: bold; margin-bottom: 6px;">PASTE SERIAL MONITOR OUTPUT</div>
    <textarea id="serialBox" rows="5">Temperature: 26.81 C\nLatitude: 28.706578\nLongitude: 77.680298\nGPS satellites: 12\nGPS fix age (ms): 35</textarea>
    <button class="btn-dark" onclick="sendRawSerial()">⬆️ Parse & Upload Serial Data</button>
  </div>

  <div id="statusBox" class="status"></div>

  <script>
    async function postData(url, body) {
      const status = document.getElementById('statusBox');
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const json = await res.json();
        status.className = 'status ok';
        status.innerText = '✅ Transmission Delivered! Node: ' + (json.soldier?.callsign || 'S1') + ' @ ' + (json.soldier?.lat?.toFixed(4) || '') + ',' + (json.soldier?.lng?.toFixed(4) || '');
      } catch (err) {
        status.className = 'status err';
        status.innerText = '❌ Failed to reach dashboard: ' + err.message;
      }
    }

    function triggerDistress() {
      postData('/api/telemetry', {
        soldierId: 'S1',
        lat: 28.706578,
        lng: 77.680298,
        temp: 26.81,
        panic: true,
        redSignal: true
      });
    }

    function sendQuickData() {
      postData('/api/telemetry', {
        soldierId: 'S1',
        lat: 28.706578,
        lng: 77.680298,
        temp: 26.81,
        satellites: 12,
        fixAge: 35,
        panic: false
      });
    }

    function sendRawSerial() {
      const raw = document.getElementById('serialBox').value;
      postData('/api/telemetry/raw', { raw, redSignal: false });
    }
  </script>
</body>
</html>`);
});

// Cloud MQTT Broker Client for Long-Distance / Multi-Network Telemetry
const mqttBroker = 'mqtt://broker.hivemq.com:1883';
const mqttTopic = 'vayujiv/telemetry';
const mqttClient = mqtt.connect(mqttBroker);

mqttClient.on('connect', () => {
  console.log('[MQTT] Connected to Public Cloud Broker: ' + mqttBroker);
  mqttClient.subscribe(mqttTopic, (err) => {
    if (!err) {
      console.log('[MQTT] Subscribed to cloud topic: ' + mqttTopic);
      logSystemEvent('INFO', 'Connected to Global Cloud Broker HiveMQ on topic ' + mqttTopic, 'MQTT_CLOUD');
    }
  });
});

mqttClient.on('message', (topic, message) => {
  try {
    const raw = message.toString();
    console.log('[MQTT] Inbound message on ' + topic + ':', raw);
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = parseSerialLog(raw);
    }
    simulator.ingestTelemetry(payload);
  } catch (err) {
    console.error('[MQTT Error]', err.message);
  }
});

wss.on('connection', ws => {
  const db = getDb();
  ws.send(JSON.stringify({
    type: 'INITIAL_STATE',
    soldiers: db.soldiers,
    drone: droneController.getState(),
    alerts: db.alerts,
    noFlyZones: db.noFlyZones,
    baseStation: db.baseStation,
    logs: db.systemLogs
  }));

  ws.on('message', message => {
    try {
      const parsed = JSON.parse(message);
      if (parsed.action === 'ACK_ALERT') {
        const alert = db.alerts.find(a => a.id === parsed.alertId);
        if (alert) {
          alert.acknowledged = true;
          broadcast({ type: 'ALERT_ACKNOWLEDGED', alertId: alert.id });
        }
      }
    } catch (e) {
      console.error('WS error:', e.message);
    }
  });
});

server.listen(PORT, () => {
  console.log('[VAYUJIV-SERVER] Command Gateway running on port ' + PORT);
  console.log('[VAYUJIV-SERVER] REST: http://localhost:' + PORT + ' | WS: ws://localhost:' + PORT);
});
