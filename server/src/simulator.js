/**
 * VAYUJIV Battlefield Soldier Simulator & LoRa Packet Generator
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
      if (!soldier.isLiveHardware && soldier.id !== 'S1') {
        if (!soldier.vitals.panic && !soldier.vitals.isFall) {
          soldier.vitals.hr = Math.max(55, Math.min(105, soldier.vitals.hr + (Math.random() - 0.5) * 2));
          soldier.vitals.spo2 = Math.max(95, Math.min(99, soldier.vitals.spo2 + (Math.random() - 0.5) * 0.4));
          soldier.vitals.temp = Math.max(36.4, Math.min(37.4, soldier.vitals.temp + (Math.random() - 0.5) * 0.04));
          soldier.vitals.motionEnergy = Math.max(0.05, Math.min(0.8, soldier.vitals.motionEnergy + (Math.random() - 0.5) * 0.05));
        }
      }

      soldier.vitals.battery = Math.max(5, Number((soldier.vitals.battery - 0.002).toFixed(2)));

      if (soldier.vitals.motionEnergy > 0.65) {
        soldier.vitals.signalQuality = Math.max(45, Math.round(85 - soldier.vitals.motionEnergy * 40));
      } else {
        soldier.vitals.signalQuality = Math.min(99, Math.round(93 + Math.random() * 6));
      }

      soldier.history.push({
        time: new Date().toLocaleTimeString(),
        hr: Math.round(soldier.vitals.hr),
        spo2: Math.round(soldier.vitals.spo2),
        temp: Number(soldier.vitals.temp.toFixed(1)),
        motion: Number(soldier.vitals.motionEnergy.toFixed(2))
      });
      if (soldier.history.length > 30) soldier.history.shift();

      const triageResult = evaluateTriage(soldier.vitals, soldier.history);
      const prevPriority = soldier.triage.priority;
      soldier.triage = triageResult;

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
    logSystemEvent(priority === 'RED' ? 'CRITICAL' : 'WARNING', 'Priority ' + priority + ' Alert for ' + soldier.callsign + ': ' + message, 'TRIAGE_ENGINE');

    if (priority === 'RED' && this.autoDroneDispatch) {
      const droneStatus = droneController.getState().status;
      if (droneStatus === 'IDLE') {
        const dispatchRes = droneController.dispatchMission(soldier, db.noFlyZones);
        if (dispatchRes.success) {
          alertItem.droneDispatched = true;
          logSystemEvent('INFO', 'Autonomous Drone UAV-VAYU-01 launched for casualty ' + soldier.callsign, 'DRONE_SITL');
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

    logSystemEvent('SCENARIO', 'Battlefield scenario injected: ' + scenarioName, 'TACTICAL_INJECTOR');

    switch (scenarioName) {
      case 'SOLDIER_2_TRAUMA_CRITICAL': {
        const s2 = db.soldiers.find(s => s.id === 'S2');
        if (s2) {
          s2.vitals.spo2 = 82;
          s2.vitals.hr = 152;
          s2.vitals.isFall = true;
          s2.vitals.motionEnergy = 0.02;
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

  ingestTelemetry(telemetry) {
    const db = getDb();
    const soldierId = telemetry.soldierId || 'S1';
    let soldier = db.soldiers.find(s => s.id === soldierId);
    if (!soldier) {
      soldier = db.soldiers[0];
    }

    soldier.isLiveHardware = true;
    soldier.packetCount = (soldier.packetCount || 0) + 1;
    soldier.lastPacketTimestamp = new Date().toISOString();
    soldier.dataSource = 'ESP32 (DS18B20 + NEO-6M)';
    if (!soldier.name.includes('(ESP32 Live)')) {
      soldier.name = soldier.name + ' (ESP32 Live)';
    }

    if (telemetry.lat !== undefined && !isNaN(Number(telemetry.lat))) {
      soldier.lat = Number(telemetry.lat);
    }
    if (telemetry.lng !== undefined && !isNaN(Number(telemetry.lng))) {
      soldier.lng = Number(telemetry.lng);
    }
    if (telemetry.temp !== undefined && !isNaN(Number(telemetry.temp))) {
      soldier.vitals.temp = Number(telemetry.temp);
    }
    if (telemetry.hr !== undefined && !isNaN(Number(telemetry.hr))) {
      soldier.vitals.hr = Number(telemetry.hr);
    }
    if (telemetry.spo2 !== undefined && !isNaN(Number(telemetry.spo2))) {
      soldier.vitals.spo2 = Number(telemetry.spo2);
    }
    if (telemetry.satellites !== undefined) {
      soldier.vitals.satellites = Number(telemetry.satellites);
    }
    if (telemetry.fixAge !== undefined) {
      soldier.vitals.lastFixAge = Number(telemetry.fixAge);
    }

    // Check for RED signal / Emergency Panic
    const isRed = telemetry.panic === true || telemetry.panic === 'true' || telemetry.panic === 1 || telemetry.panic === '1'
      || telemetry.redSignal === true || telemetry.redSignal === 'true' || telemetry.redSignal === 1 || telemetry.redSignal === '1'
      || telemetry.emergency === true || telemetry.emergency === 'true' || telemetry.emergency === 1 || telemetry.emergency === '1';

    if (isRed) {
      soldier.vitals.panic = true;
    } else if (telemetry.panic === false || telemetry.redSignal === false) {
      soldier.vitals.panic = false;
    }

    // Auto-relocate base station and drone base near the soldier if soldier coordinates are outside current operational map
    const distToBase = droneController.getDistance(soldier.lat, soldier.lng, db.baseStation.lat, db.baseStation.lng);
    if (distToBase > 2500) {
      // Re-anchor base station ~450m southwest of the soldier
      db.baseStation.lat = soldier.lat - 0.0035;
      db.baseStation.lng = soldier.lng - 0.0038;
      droneController.state.baseLat = db.baseStation.lat;
      droneController.state.baseLng = db.baseStation.lng;
      if (droneController.state.status === 'IDLE') {
        droneController.state.currentLat = db.baseStation.lat;
        droneController.state.currentLng = db.baseStation.lng;
      }
      // Position NoFlyZone between base station and soldier so A* detour can be visually showcased
      if (db.noFlyZones && db.noFlyZones.length > 0) {
        db.noFlyZones[0].center = [
          (db.baseStation.lat + soldier.lat) / 2 + 0.0006,
          (db.baseStation.lng + soldier.lng) / 2 - 0.0004
        ];
        db.noFlyZones[0].radius = 120;
      }
    }

    soldier.history.push({
      time: new Date().toLocaleTimeString(),
      hr: Math.round(soldier.vitals.hr),
      spo2: Math.round(soldier.vitals.spo2),
      temp: Number(soldier.vitals.temp.toFixed(1)),
      motion: Number(soldier.vitals.motionEnergy.toFixed(2))
    });
    if (soldier.history.length > 30) soldier.history.shift();

    const triageResult = evaluateTriage(soldier.vitals, soldier.history);
    const prevPriority = soldier.triage.priority;
    soldier.triage = triageResult;

    if (triageResult.priority === 'RED' && (prevPriority !== 'RED' || droneController.getState().status === 'IDLE')) {
      this.raiseAlert(soldier, 'RED', 'CRITICAL RED SIGNAL: Emergency distress beacon received from Soldier ' + soldier.callsign);
    } else if (triageResult.priority === 'YELLOW' && prevPriority === 'GREEN') {
      this.raiseAlert(soldier, 'YELLOW', triageResult.explain);
    }

    if (this.broadcastCallback) {
      this.broadcastCallback({
        type: 'SOLDIERS_UPDATE',
        soldiers: db.soldiers,
        drone: droneController.getState()
      });
    }

    logSystemEvent('TELEMETRY', 'ESP32 Telemetry synced for ' + soldier.callsign + ' (Lat: ' + soldier.lat.toFixed(5) + ', Lng: ' + soldier.lng.toFixed(5) + ', Temp: ' + soldier.vitals.temp + '°C, Red: ' + isRed + ')', 'IOT_INGEST');

    return {
      success: true,
      soldier,
      drone: droneController.getState(),
      triage: soldier.triage
    };
  }
}

export const simulator = new SimulatorEngine();
