import fs from 'fs';
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
