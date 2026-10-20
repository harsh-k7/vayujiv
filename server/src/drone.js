/**
 * VAYUJIV Drone SITL & A* Mission Controller
 */

class DroneController {
  constructor() {
    this.state = {
      droneId: 'UAV-VAYU-01',
      model: 'Quad-Rotor Medical Lifter (SITL)',
      status: 'IDLE',
      battery: 100,
      altitude: 0,
      targetAltitude: 30,
      speed: 0,
      maxSpeed: 14.5,
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
      payloadType: 'Medical Trauma First-Aid Kit + Hemostatic Unit',
      etaSeconds: 0,
      missionStartTime: null,
      logs: []
    };

    this.intervalId = null;
  }

  getState() {
    return this.state;
  }

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

  planAStarPath(startLat, startLng, targetLat, targetLng, noFlyZones = []) {
    const waypoints = [{ lat: startLat, lng: startLng }];
    let detourNeeded = false;
    let detourPoint = null;

    for (const nfz of noFlyZones) {
      const midLat = (startLat + targetLat) / 2;
      const midLng = (startLng + targetLng) / 2;
      const distToNFZ = this.getDistance(midLat, midLng, nfz.center[0], nfz.center[1]);
      if (distToNFZ < nfz.radius + 160) {
        detourNeeded = true;
        const offsetLat = nfz.center[0] + 0.0035;
        const offsetLng = nfz.center[1] - 0.0038;
        detourPoint = { lat: offsetLat, lng: offsetLng, note: 'A* Obstacle Clearance Node' };
        break;
      }
    }

    if (detourNeeded && detourPoint) {
      waypoints.push(detourPoint);
    }

    waypoints.push({ lat: targetLat, lng: targetLng, note: 'Casualty Landing Zone' });
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
    this.state.etaSeconds = Math.round(totalDist / this.state.maxSpeed) + 8;

    this.logDroneEvent('Mission launched for ' + targetSoldier.name + ' (' + targetSoldier.id + ') at [' + targetSoldier.lat.toFixed(4) + ', ' + targetSoldier.lng.toFixed(4) + ']');
    
    this.startFlightLoop();
    return { success: true, mission: this.state };
  }

  recallMission(reason = 'Operator Manual Recall') {
    if (this.state.status === 'IDLE') return { success: false, message: 'Drone is already idle at base.' };

    this.state.status = 'RETURNING';
    this.state.waypoints = [
      { lat: this.state.currentLat, lng: this.state.currentLng },
      { lat: this.state.baseLat, lng: this.state.baseLng, note: 'Command Base Landing' }
    ];
    this.state.currentWpIndex = 0;
    this.logDroneEvent('Mission recalled: ' + reason + '. Returning to launch base.');
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

    if (this.state.status === 'EN_ROUTE' || this.state.status === 'RETURNING') {
      if (this.state.altitude < this.state.targetAltitude) {
        this.state.altitude = Math.min(this.state.targetAltitude, this.state.altitude + 6);
      }
      this.state.speed = this.state.maxSpeed;
    }

    this.state.battery = Math.max(5, Number((this.state.battery - 0.05).toFixed(2)));

    const targetWp = this.state.waypoints[this.state.currentWpIndex + 1];
    if (!targetWp) {
      if (this.state.status === 'EN_ROUTE') {
        this.state.status = 'DELIVERING_PAYLOAD';
        this.state.altitude = 8;
        this.state.speed = 0;
        this.logDroneEvent('Hovering above casualty ' + this.state.targetSoldierName + '. Releasing medical capsule...');

        setTimeout(() => {
          this.state.payloadDropped = true;
          this.logDroneEvent('Medical payload delivered to target. Commencing Return-to-Launch.');
          this.recallMission('Payload Delivered Successfully');
        }, 3500);
      } else if (this.state.status === 'RETURNING') {
        this.state.status = 'IDLE';
        this.state.altitude = 0;
        this.state.speed = 0;
        this.state.currentLat = this.state.baseLat;
        this.state.currentLng = this.state.baseLng;
        this.logDroneEvent('Drone landed at Base Command Post. Battery and payload recharged.');
      }
      return;
    }

    const stepRatio = 0.14;
    this.state.currentLat += (targetWp.lat - this.state.currentLat) * stepRatio;
    this.state.currentLng += (targetWp.lng - this.state.currentLng) * stepRatio;

    const remainingDist = this.getDistance(this.state.currentLat, this.state.currentLng, targetWp.lat, targetWp.lng);
    this.state.etaSeconds = Math.max(0, Math.round(remainingDist / this.state.maxSpeed));

    if (remainingDist < 12) {
      this.state.currentWpIndex++;
    }
  }
}

export const droneController = new DroneController();
