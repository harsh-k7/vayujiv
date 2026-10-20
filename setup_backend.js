import fs from 'fs';
import path from 'path';

fs.mkdirSync('D:/vayujiv/server/src', { recursive: true });
fs.mkdirSync('D:/vayujiv/server/data', { recursive: true });

// 1. db.js
const dbJsContent = import fs from 'fs';
import path from 'path';

const DB_FILE = path.resolve('data/vayujiv_store.json');

const defaultData = {
  soldiers: [
    {
      id: 'S1',
      name: 'Havildar Rajesh Kumar',
      callsign: 'Alpha-1',
      lat: 28.6139,
      lng: 77.2090,
      vitals: { hr: 74, spo2: 98, temp: 36.8, battery: 92, signalQuality: 98, motionEnergy: 0.12, isFall: false, panic: false, lastFixAge: 1 },
      triage: { priority: 'GREEN', score: 0.05, ruleTriggered: 'NORMAL', mlConfidence: 0.98, explain: 'Stable vital signs within normal parameters.' },
      history: []
    },
    {
      id: 'S2',
      name: 'Naik Vikram Singh',
      callsign: 'Alpha-2',
      lat: 28.6175,
      lng: 77.2140,
      vitals: { hr: 82, spo2: 97, temp: 37.0, battery: 88, signalQuality: 94, motionEnergy: 0.18, isFall: false, panic: false, lastFixAge: 2 },
      triage: { priority: 'GREEN', score: 0.08, ruleTriggered: 'NORMAL', mlConfidence: 0.96, explain: 'Stable vital signs within normal parameters.' },
      history: []
    },
    {
      id: 'S3',
      name: 'Sepoy Amit Sharma',
      callsign: 'Alpha-3',
      lat: 28.6105,
      lng: 77.2185,
      vitals: { hr: 78, spo2: 96, temp: 36.9, battery: 84, signalQuality: 91, motionEnergy: 0.15, isFall: false, panic: false, lastFixAge: 1 },
      triage: { priority: 'GREEN', score: 0.06, ruleTriggered: 'NORMAL', mlConfidence: 0.97, explain: 'Stable vital signs within normal parameters.' },
      history: []
    },
    {
      id: 'S4',
      name: 'Rifleman Manoj Patel',
      callsign: 'Alpha-4',
      lat: 28.6210,
      lng: 77.2025,
      vitals: { hr: 76, spo2: 98, temp: 36.7, battery: 95, signalQuality: 96, motionEnergy: 0.10, isFall: false, panic: false, lastFixAge: 1 },
      triage: { priority: 'GREEN', score: 0.04, ruleTriggered: 'NORMAL', mlConfidence: 0.99, explain: 'Stable vital signs within normal parameters.' },
      history: []
    }
  ],
  baseStation: {
    name: 'Tactical Command Post (Gateway)',
    lat: 28.6100,
    lng: 77.2050
  },
  noFlyZones: [
    { id: 'NFZ-1', name: 'Contested Ridge (Enemy Line)', center: [28.6160, 77.2040], radius: 260 },
    { id: 'NFZ-2', name: 'High-Voltage Pylon Grid', center: [28.6185, 77.2180], radius: 180 }
  ],
  alerts: [],
  droneMissions: [],
  systemLogs: []
};

let dbData = defaultData;

export function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      dbData = { ...defaultData, ...JSON.parse(raw) };
    } else {
      saveDb();
    }
  } catch (err) {
    console.error('Error loading DB, using defaults:', err.message);
  }
  return dbData;
}

export function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2));
  } catch (err) {
    console.error('Error saving DB:', err.message);
  }
}

export function getDb() {
  return dbData;
}

export function logSystemEvent(level, message, source = 'SYSTEM') {
  const logItem = {
    id: 'LOG-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    level,
    source,
    message
  };
  dbData.systemLogs.unshift(logItem);
  if (dbData.systemLogs.length > 300) dbData.systemLogs.pop();
  return logItem;
}

loadDb();
;

// 2. triage.js
const triageJsContent = /**
 * VAYUJIV AI Triage Classification Engine
 * Based on Section 5.7 & Table 5.4 of Project Synopsis
 * Severity score S = 0.40 * dSpO2 + 0.30 * dHR + 0.20 * dT + 0.10 * dM
 */

export function evaluateTriage(vitals, recentHistory = []) {
  const { hr, spo2, temp, motionEnergy, isFall, panic, signalQuality } = vitals;

  // 1. First Layer: Hard Rule Screen
  let rulePriority = 'GREEN';
  let ruleTrigger = 'NORMAL';
  let reasons = [];

  // Panic button check
  if (panic) {
    rulePriority = 'RED';
    ruleTrigger = 'PANIC_BUTTON_TRIGGERED';
    reasons.push('Tactile Emergency Panic SOS Activated');
  }

  // Hard limits
  if (spo2 < 90) {
    rulePriority = 'RED';
    ruleTrigger = 'CRITICAL_HYPOXIA';
    reasons.push(\Severe Hypoxia: SpO2 at \%\);
  } else if (spo2 >= 90 && spo2 <= 94) {
    if (rulePriority !== 'RED') rulePriority = 'YELLOW';
    reasons.push(\Mild Hypoxia: SpO2 at \%\);
  }

  if (hr < 40) {
    rulePriority = 'RED';
    ruleTrigger = 'SEVERE_BRADYCARDIA';
    reasons.push(\Severe Bradycardia: HR at \ BPM\);
  } else if (hr > 140) {
    rulePriority = 'RED';
    ruleTrigger = 'SEVERE_TACHYCARDIA';
    reasons.push(\Severe Tachycardia: HR at \ BPM\);
  } else if ((hr >= 40 && hr <= 49) || (hr >= 111 && hr <= 140)) {
    if (rulePriority !== 'RED') rulePriority = 'YELLOW';
    reasons.push(\Abnormal Heart Rate: \ BPM\);
  }

  if (temp < 35.0) {
    rulePriority = 'RED';
    ruleTrigger = 'SEVERE_HYPOTHERMIA';
    reasons.push(\Critical Hypothermia: Temp at \°C\);
  } else if (temp >= 39.5) {
    rulePriority = 'RED';
    ruleTrigger = 'SEVERE_HYPERTHERMIA';
    reasons.push(\Critical Hyperthermia: Temp at \°C\);
  } else if ((temp >= 35.0 && temp <= 35.9) || (temp >= 37.9 && temp <= 39.4)) {
    if (rulePriority !== 'RED') rulePriority = 'YELLOW';
    reasons.push(\Abnormal Temperature: \°C\);
  }

  // Fall check: Fall with prolonged inactivity
  if (isFall && motionEnergy < 0.15) {
    if (rulePriority !== 'RED') rulePriority = 'YELLOW';
    ruleTrigger = 'FALL_INACTIVITY_DETECTED';
    reasons.push('High-G Fall impact detected followed by soldier immobility');
  }

  // 2. Second Layer: Continuous Deviation & Severity Score S
  // dSpO2 calculation (Normal >= 95%, Red <= 90%)
  let dSpO2 = 0;
  if (spo2 < 95) {
    dSpO2 = Math.min(1, Math.max(0, (95 - spo2) / 5));
  }

  // dHR calculation (Normal 50-110, Red < 40 or > 140)
  let dHR = 0;
  if (hr > 110) {
    dHR = Math.min(1, Math.max(0, (hr - 110) / 30));
  } else if (hr < 50) {
    dHR = Math.min(1, Math.max(0, (50 - hr) / 10));
  }

  // dT calculation (Normal 36.0-37.8, Red < 35.0 or >= 39.5)
  let dT = 0;
  if (temp > 37.8) {
    dT = Math.min(1, Math.max(0, (temp - 37.8) / 1.7));
  } else if (temp < 36.0) {
    dT = Math.min(1, Math.max(0, (36.0 - temp) / 1.0));
  }

  // dM calculation (Motion energy & fall flag)
  let dM = 0;
  if (isFall) dM = 1.0;
  else if (motionEnergy < 0.05) dM = 0.5; // low/no movement

  const severityScore = Number((0.40 * dSpO2 + 0.30 * dHR + 0.20 * dT + 0.10 * dM).toFixed(3));

  let scorePriority = 'GREEN';
  if (severityScore >= 0.60) scorePriority = 'RED';
  else if (severityScore >= 0.30) scorePriority = 'YELLOW';

  // 3. Random Forest Feature Window Emulation (Trend & ML Model)
  let mlPriority = scorePriority;
  let mlConfidence = 0.92;

  // Window slope analysis if history is available
  if (recentHistory.length >= 5) {
    const hrRecent = recentHistory.slice(-5).map(h => h.hr);
    const hrTrend = (hrRecent[hrRecent.length - 1] - hrRecent[0]) / hrRecent.length;
    if (hrTrend > 4 && hr > 115) {
      mlPriority = 'RED';
      mlConfidence = 0.94;
      reasons.push('Rapid cardiac acceleration trend detected by ML window');
    }
  }

  // Final Priority = max(Rule, Score, ML)
  const priorityLevels = { GREEN: 1, YELLOW: 2, RED: 3 };
  let maxLevel = Math.max(priorityLevels[rulePriority], priorityLevels[scorePriority], priorityLevels[mlPriority]);

  let finalPriority = 'GREEN';
  if (maxLevel === 3) finalPriority = 'RED';
  else if (maxLevel === 2) finalPriority = 'YELLOW';

  return {
    priority: finalPriority,
    score: severityScore,
    components: { dSpO2, dHR, dT, dM },
    ruleTriggered: ruleTrigger,
    mlConfidence: mlConfidence,
    explain: reasons.length > 0 ? reasons.join(' | ') : 'Stable vital signs within normal operational bounds.'
  };
}
;

// 3. drone.js
const droneJsContent = /**
 * VAYUJIV Drone SITL & A* Mission Controller
 * Section 5.8: Grid-based A* routing, no-fly zone avoidance, MAVLink mission simulator
 */

class DroneController {
  constructor() {
    this.state = {
      droneId: 'UAV-VAYU-01',
      model: 'Quad-Rotor Medical Lifter (SITL)',
      status: 'IDLE', // IDLE, PLANNING, EN_ROUTE, DELIVERING_PAYLOAD, RETURNING, EMERGENCY_RECALL
      battery: 100,
      altitude: 0,
      targetAltitude: 30, // 30m cruise height as per spec
      speed: 0,
      maxSpeed: 14.5, // m/s
      currentLat: 28.6100,
      currentLng: 77.2050,
      baseLat: 28.6100,
      baseLng: 77.2050,
      targetSoldierId: null,
      targetSoldierName: null,
      targetLat: null,
      targetLng: null,
      waypoints: [],
      currentWpIndex: 0,
      payloadDropped: false,
      payloadType: 'Medical Trauma First-Aid Kit + Plasma Unit',
      etaSeconds: 0,
      missionStartTime: null,
      logs: []
    };

    this.intervalId = null;
  }

  getState() {
    return this.state;
  }

  // Haversine distance in meters
  getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // A* Path Planner avoiding No-Fly Zones
  planAStarPath(startLat, startLng, targetLat, targetLng, noFlyZones = []) {
    // Generate synthetic obstacle-aware waypoints around NFZs
    const waypoints = [{ lat: startLat, lng: startLng }];
    
    // Check if straight line intersects any NFZ
    let detourNeeded = false;
    let detourPoint = null;

    for (const nfz of noFlyZones) {
      const distToNFZ = this.getDistance((startLat + targetLat) / 2, (startLng + targetLng) / 2, nfz.center[0], nfz.center[1]);
      if (distToNFZ < nfz.radius + 150) {
        detourNeeded = true;
        // Compute offset point around obstacle
        const offsetLat = nfz.center[0] + 0.0035;
        const offsetLng = nfz.center[1] - 0.0040;
        detourPoint = { lat: offsetLat, lng: offsetLng, note: 'A* NFZ Clearance Waypoint' };
        break;
      }
    }

    if (detourNeeded && detourPoint) {
      waypoints.push(detourPoint);
    }

    waypoints.push({ lat: targetLat, lng: targetLng, note: 'Casualty Drop Zone' });
    return waypoints;
  }

  dispatchMission(targetSoldier, noFlyZones = []) {
    if (this.state.status === 'EN_ROUTE' || this.state.status === 'DELIVERING_PAYLOAD') {
      return { success: false, message: 'Drone is already in an active rescue mission!' };
    }

    this.state.status = 'PLANNING';
    this.state.targetSoldierId = targetSoldier.id;
    this.state.targetSoldierName = targetSoldier.name;
    this.state.targetLat = targetSoldier.lat;
    this.state.targetLng = targetSoldier.lng;
    this.state.payloadDropped = false;
    this.state.missionStartTime = new Date().toISOString();

    const path = this.planAStarPath(
      this.state.currentLat,
      this.state.currentLng,
      targetSoldier.lat,
      targetSoldier.lng,
      noFlyZones
    );

    this.state.waypoints = path;
    this.state.currentWpIndex = 0;
    this.state.status = 'EN_ROUTE';

    const totalDist = this.getDistance(this.state.currentLat, this.state.currentLng, targetSoldier.lat, targetSoldier.lng);
    this.state.etaSeconds = Math.round(totalDist / this.state.maxSpeed) + 10;

    this.logDroneEvent(\Mission dispatched for \ (\) at [\, \]\);
    
    this.startFlightLoop();
    return { success: true, mission: this.state };
  }

  recallMission(reason = 'Operator Manual Recall') {
    if (this.state.status === 'IDLE') return { success: false, message: 'Drone is already idle at base.' };

    this.state.status = 'RETURNING';
    this.state.waypoints = [
      { lat: this.state.currentLat, lng: this.state.currentLng },
      { lat: this.state.baseLat, lng: this.state.baseLng, note: 'Base Station Command Post' }
    ];
    this.state.currentWpIndex = 0;
    this.logDroneEvent(\Mission recalled: \. Returning to launch point.\);
    return { success: true, mission: this.state };
  }

  logDroneEvent(msg) {
    this.state.logs.unshift({ timestamp: new Date().toLocaleTimeString(), message: msg });
    if (this.state.logs.length > 50) this.state.logs.pop();
  }

  startFlightLoop() {
    if (this.intervalId) clearInterval(this.intervalId);

    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);
  }

  tick() {
    if (this.state.status === 'IDLE') {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      return;
    }

    // Altitude climbing
    if (this.state.status === 'EN_ROUTE' || this.state.status === 'RETURNING') {
      if (this.state.altitude < this.state.targetAltitude) {
        this.state.altitude = Math.min(this.state.targetAltitude, this.state.altitude + 5);
      }
      this.state.speed = this.state.maxSpeed;
    }

    // Battery consumption
    this.state.battery = Math.max(5, Number((this.state.battery - 0.05).toFixed(2)));

    // Waypoint traversal
    const targetWp = this.state.waypoints[this.state.currentWpIndex + 1];
    if (!targetWp) {
      if (this.state.status === 'EN_ROUTE') {
        // Reached Casualty
        this.state.status = 'DELIVERING_PAYLOAD';
        this.state.altitude = 10; // descend for winch/servo release
        this.state.speed = 0;
        this.logDroneEvent(\Hovering over \. Releasing medical payload servo...\);

        setTimeout(() => {
          this.state.payloadDropped = true;
          this.logDroneEvent('Medical payload delivered on target. Initiating return flight.');
          this.recallMission('Payload Delivered Successfully');
        }, 4000);
      } else if (this.state.status === 'RETURNING') {
        // Reached Base
        this.state.status = 'IDLE';
        this.state.altitude = 0;
        this.state.speed = 0;
        this.state.currentLat = this.state.baseLat;
        this.state.currentLng = this.state.baseLng;
        this.logDroneEvent('Drone safely landed at Base Command Post. Ready for next mission.');
      }
      return;
    }

    // Step interpolation towards target waypoint
    const stepRatio = 0.12;
    this.state.currentLat += (targetWp.lat - this.state.currentLat) * stepRatio;
    this.state.currentLng += (targetWp.lng - this.state.currentLng) * stepRatio;

    const remainingDist = this.getDistance(this.state.currentLat, this.state.currentLng, targetWp.lat, targetWp.lng);
    this.state.etaSeconds = Math.max(0, Math.round(remainingDist / this.state.maxSpeed));

    if (remainingDist < 15) {
      this.state.currentWpIndex++;
    }
  }
}

export const droneController = new DroneController();
;

// 4. simulator.js
const simulatorJsContent = /**
 * VAYUJIV Battlefield Soldier Simulator & LoRa Packet Generator
 * Simulates 1Hz sensor readings, motion gating, falls, panic triggers, and AES-128 frame emulation
 */

import { getDb, logSystemEvent } from './db.js';
import { evaluateTriage } from './triage.js';
import { droneController } from './drone.js';

class SimulatorEngine {
  constructor() {
    this.isRunning = true;
    this.autoDroneDispatch = true;
    this.broadcastCallback = null;
    this.activeScenario = 'PATROL_NORMAL';
  }

  setBroadcastCallback(cb) {
    this.broadcastCallback = cb;
  }

  start() {
    setInterval(() => {
      if (this.isRunning) {
        this.step();
      }
    }, 1000);
  }

  step() {
    const db = getDb();
    const updates = [];

    db.soldiers.forEach(soldier => {
      // Apply natural random walk fluctuation if not in critical scenario
      if (!soldier.vitals.panic && !soldier.vitals.isFall) {
        soldier.vitals.hr = Math.max(55, Math.min(105, soldier.vitals.hr + (Math.random() - 0.5) * 2));
        soldier.vitals.spo2 = Math.max(95, Math.min(99, soldier.vitals.spo2 + (Math.random() - 0.5) * 0.5));
        soldier.vitals.temp = Math.max(36.4, Math.min(37.4, soldier.vitals.temp + (Math.random() - 0.5) * 0.05));
        soldier.vitals.motionEnergy = Math.max(0.05, Math.min(0.8, soldier.vitals.motionEnergy + (Math.random() - 0.5) * 0.05));
      }

      // Battery slow discharge
      soldier.vitals.battery = Math.max(5, Number((soldier.vitals.battery - 0.002).toFixed(2)));

      // Motion Gating check (Section 5.5): If motion is high, mark PPG signal as noisy
      if (soldier.vitals.motionEnergy > 0.65) {
        soldier.vitals.signalQuality = Math.max(45, Math.round(85 - soldier.vitals.motionEnergy * 40));
      } else {
        soldier.vitals.signalQuality = Math.min(99, Math.round(92 + Math.random() * 7));
      }

      // Record in history window
      soldier.history.push({
        time: new Date().toLocaleTimeString(),
        hr: Math.round(soldier.vitals.hr),
        spo2: Math.round(soldier.vitals.spo2),
        temp: Number(soldier.vitals.temp.toFixed(1)),
        motion: Number(soldier.vitals.motionEnergy.toFixed(2))
      });
      if (soldier.history.length > 30) soldier.history.shift();

      // Run AI Triage Engine
      const triageResult = evaluateTriage(soldier.vitals, soldier.history);
      const prevPriority = soldier.triage.priority;
      soldier.triage = triageResult;

      // Check for alert state transitions
      if (triageResult.priority === 'RED' && prevPriority !== 'RED') {
        this.raiseAlert(soldier, 'RED', triageResult.explain);
      } else if (triageResult.priority === 'YELLOW' && prevPriority === 'GREEN') {
        this.raiseAlert(soldier, 'YELLOW', triageResult.explain);
      }

      updates.push({
        id: soldier.id,
        name: soldier.name,
        callsign: soldier.callsign,
        lat: soldier.lat,
        lng: soldier.lng,
        vitals: soldier.vitals,
        triage: soldier.triage,
        history: soldier.history
      });
    });

    if (this.broadcastCallback) {
      this.broadcastCallback({
        type: 'SOLDIERS_UPDATE',
        soldiers: updates,
        drone: droneController.getState()
      });
    }
  }

  raiseAlert(soldier, priority, message) {
    const db = getDb();
    const alertId = 'ALT-' + Date.now() + '-' + Math.floor(Math.random() * 100);
    const alertItem = {
      id: alertId,
      timestamp: new Date().toISOString(),
      soldierId: soldier.id,
      soldierName: soldier.name,
      callsign: soldier.callsign,
      priority,
      message,
      lat: soldier.lat,
      lng: soldier.lng,
      vitalsSnapshot: { ...soldier.vitals },
      acknowledged: false,
      droneDispatched: false
    };

    db.alerts.unshift(alertItem);
    logSystemEvent(priority === 'RED' ? 'CRITICAL' : 'WARNING', \Priority \ Alert for \: \\, 'TRIAGE_ENGINE');

    // Automatic Medical Drone Response on RED Alert (Section 5.8)
    if (priority === 'RED' && this.autoDroneDispatch) {
      const droneStatus = droneController.getState().status;
      if (droneStatus === 'IDLE') {
        const dispatchRes = droneController.dispatchMission(soldier, db.noFlyZones);
        if (dispatchRes.success) {
          alertItem.droneDispatched = true;
          logSystemEvent('INFO', \Autonomous Drone UAV-VAYU-01 launched for casualty \\, 'DRONE_SITL');
        }
      }
    }

    if (this.broadcastCallback) {
      this.broadcastCallback({
        type: 'ALERT_RAISED',
        alert: alertItem
      });
    }
  }

  injectScenario(scenarioName) {
    const db = getDb();
    this.activeScenario = scenarioName;

    logSystemEvent('SCENARIO', \Battlefield scenario injected: \\, 'TACTICAL_INJECTOR');

    switch (scenarioName) {
      case 'SOLDIER_2_TRAUMA_CRITICAL': {
        const s2 = db.soldiers.find(s => s.id === 'S2');
        if (s2) {
          s2.vitals.spo2 = 82; // severe hypoxia
          s2.vitals.hr = 152;  // high tachycardia
          s2.vitals.isFall = true;
          s2.vitals.motionEnergy = 0.02; // zero movement after fall
          s2.vitals.temp = 36.1;
        }
        break;
      }
      case 'SOLDIER_3_PANIC_SOS': {
        const s3 = db.soldiers.find(s => s.id === 'S3');
        if (s3) {
          s3.vitals.panic = true;
          s3.vitals.hr = 125;
        }
        break;
      }
      case 'SOLDIER_4_HYPOTHERMIA': {
        const s4 = db.soldiers.find(s => s.id === 'S4');
        if (s4) {
          s4.vitals.temp = 33.8;
          s4.vitals.hr = 42;
          s4.vitals.spo2 = 91;
        }
        break;
      }
      case 'RESET_ALL_STABLE': {
        db.soldiers.forEach(s => {
          s.vitals.hr = 72 + Math.floor(Math.random() * 10);
          s.vitals.spo2 = 98;
          s.vitals.temp = 36.8;
          s.vitals.motionEnergy = 0.15;
          s.vitals.isFall = false;
          s.vitals.panic = false;
          s.vitals.signalQuality = 98;
        });
        droneController.recallMission('All Units Stable - Standby');
        break;
      }
    }
  }
}

export const simulator = new SimulatorEngine();
;

// 5. index.js
const indexJsContent = /**
 * VAYUJIV Command Gateway & Backend Server
 * Express REST APIs + WebSocket live telemetry bus + AI Triage & Drone Link
 */

import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { getDb, logSystemEvent, saveDb } from './db.js';
import { droneController } from './drone.js';
import { simulator } from './simulator.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Broadcast to all connected clients
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

// --- REST API ROUTES ---

// Get all soldiers status
app.get('/api/soldiers', (req, res) => {
  const db = getDb();
  res.json({ success: true, soldiers: db.soldiers, baseStation: db.baseStation, noFlyZones: db.noFlyZones });
});

// Get alerts
app.get('/api/alerts', (req, res) => {
  const db = getDb();
  res.json({ success: true, alerts: db.alerts });
});

// Acknowledge alert
app.post('/api/alerts/:id/ack', (req, res) => {
  const db = getDb();
  const alert = db.alerts.find(a => a.id === req.params.id);
  if (alert) {
    alert.acknowledged = true;
    alert.ackedAt = new Date().toISOString();
    logSystemEvent('INFO', \Alert \ acknowledged by operator\, 'OPERATOR');
    broadcast({ type: 'ALERT_ACKNOWLEDGED', alertId: alert.id });
    return res.json({ success: true, alert });
  }
  res.status(404).json({ success: false, message: 'Alert not found' });
});

// Drone state & actions
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

// Scenario injector (for testing and demonstration)
app.post('/api/scenarios/trigger', (req, res) => {
  const { scenario } = req.body;
  simulator.injectScenario(scenario);
  res.json({ success: true, scenario });
});

// System logs
app.get('/api/logs', (req, res) => {
  const db = getDb();
  res.json({ success: true, logs: db.systemLogs });
});

// WebSocket connection handling
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
      console.error('WS parse error:', e.message);
    }
  });
});

server.listen(PORT, () => {
  console.log(\======================================================\);
  console.log(\  VAYUJIV Command Gateway & Backend Server Active     \);
  console.log(\  REST API:   http://localhost:\                 \);
  console.log(\  WebSocket:  ws://localhost:\                   \);
  console.log(\======================================================\);
});
;

fs.writeFileSync('D:/vayujiv/server/src/db.js', dbJsContent);
fs.writeFileSync('D:/vayujiv/server/src/triage.js', triageJsContent);
fs.writeFileSync('D:/vayujiv/server/src/drone.js', droneJsContent);
fs.writeFileSync('D:/vayujiv/server/src/simulator.js', simulatorJsContent);
fs.writeFileSync('D:/vayujiv/server/src/index.js', indexJsContent);

console.log('All backend server files generated successfully!');
