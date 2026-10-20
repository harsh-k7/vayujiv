export interface Vitals {
  hr: number;
  spo2: number;
  temp: number;
  battery: number;
  signalQuality: number;
  motionEnergy: number;
  isFall: boolean;
  panic: boolean;
  lastFixAge: number;
  satellites?: number;
}

export interface Triage {
  priority: 'GREEN' | 'YELLOW' | 'RED';
  score: number;
  components?: {
    dSpO2: number;
    dHR: number;
    dT: number;
    dM: number;
  };
  ruleTriggered: string;
  mlConfidence: number;
  explain: string;
}

export interface HistoryPoint {
  time: string;
  hr: number;
  spo2: number;
  temp: number;
  motion: number;
}

export interface Soldier {
  id: string;
  name: string;
  callsign: string;
  lat: number;
  lng: number;
  isLiveHardware?: boolean;
  packetCount?: number;
  lastPacketTimestamp?: string;
  dataSource?: string;
  vitals: Vitals;
  triage: Triage;
  history: HistoryPoint[];
}

export interface BaseStation {
  name: string;
  lat: number;
  lng: number;
}

export interface NoFlyZone {
  id: string;
  name: string;
  center: [number, number];
  radius: number;
}

export interface Waypoint {
  lat: number;
  lng: number;
  note?: string;
}

export interface DroneState {
  droneId: string;
  model: string;
  status: 'IDLE' | 'PLANNING' | 'EN_ROUTE' | 'DELIVERING_PAYLOAD' | 'RETURNING' | 'EMERGENCY_RECALL';
  battery: number;
  altitude: number;
  targetAltitude: number;
  speed: number;
  maxSpeed: number;
  currentLat: number;
  currentLng: number;
  baseLat: number;
  baseLng: number;
  targetSoldierId: string | null;
  targetSoldierName: string | null;
  targetLat: number | null;
  targetLng: number | null;
  waypoints: Waypoint[];
  currentWpIndex: number;
  payloadDropped: boolean;
  payloadType: string;
  etaSeconds: number;
  missionStartTime: string | null;
  logs: Array<{ timestamp: string; message: string }>;
}

export interface AlertItem {
  id: string;
  timestamp: string;
  soldierId: string;
  soldierName: string;
  callsign: string;
  priority: 'GREEN' | 'YELLOW' | 'RED';
  message: string;
  lat: number;
  lng: number;
  vitalsSnapshot: Vitals;
  acknowledged: boolean;
  ackedAt?: string;
  droneDispatched: boolean;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: string;
  source: string;
  message: string;
}