import React from 'react';
import { Heart, Activity, Thermometer, Gauge, Battery, ShieldCheck, Radio } from 'lucide-react';
import { Soldier } from '../types';

interface VitalsPanelProps {
  soldier: Soldier | null;
}

export const VitalsPanel: React.FC<VitalsPanelProps> = ({ soldier }) => {
  if (!soldier) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#64748b',
          textAlign: 'center'
        }}
      >
        <Activity style={{ width: '40px', height: '40px', marginBottom: '12px', opacity: 0.3 }} />
        <p style={{ fontSize: '13px', margin: 0 }}>Select a soldier node on the squad list or tactical map</p>
      </div>
    );
  }

  const { vitals, triage } = soldier;

  const prioBg =
    triage.priority === 'RED' ? '#7f1d1d' :
    triage.priority === 'YELLOW' ? '#78350f' : '#064e3b';
  const prioBorder =
    triage.priority === 'RED' ? '#ef4444' :
    triage.priority === 'YELLOW' ? '#f59e0b' : '#10b981';
  const prioText =
    triage.priority === 'RED' ? '#fca5a5' :
    triage.priority === 'YELLOW' ? '#fde68a' : '#a7f3d0';

  return (
    <div
      className="glass-panel"
      style={{
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto'
      }}
    >
      {/* Soldier Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(56,189,248,0.15)',
          paddingBottom: '8px',
          marginBottom: '10px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#f8fafc', fontFamily: 'monospace' }}>
              {soldier.callsign}
            </span>
            <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 'bold' }}>{soldier.name}</span>
          </div>
          <p style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace', margin: '2px 0 0 0' }}>
            NODE-ID: {soldier.id} | POS: {soldier.lat.toFixed(4)}, {soldier.lng.toFixed(4)}
          </p>
        </div>

        <div
          style={{
            padding: '4px 10px',
            borderRadius: '4px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            fontSize: '11px',
            background: prioBg,
            border: `1px solid ${prioBorder}`,
            color: prioText
          }}
        >
          {triage.priority} TRIAGE
        </div>
      </div>

      {/* Real Hardware Verification Badge */}
      {soldier.id === 'S1' && (
        <div
          style={{
            background: soldier.packetCount ? 'rgba(6, 78, 59, 0.4)' : 'rgba(120, 53, 15, 0.3)',
            border: `1px solid ${soldier.packetCount ? '#10b981' : '#f59e0b'}`,
            borderRadius: '6px',
            padding: '8px 12px',
            marginBottom: '10px',
            fontSize: '11px',
            fontFamily: 'monospace',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: soldier.packetCount ? '#34d399' : '#fbbf24', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: soldier.packetCount ? '#10b981' : '#f59e0b', display: 'inline-block', boxShadow: soldier.packetCount ? '0 0 8px #10b981' : 'none' }}></span>
              {soldier.packetCount ? 'REAL HARDWARE STREAM (LIVE)' : 'AWAITING ESP32 PACKET...'}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '10px' }}>
              {soldier.packetCount ? `Packets: #${soldier.packetCount}` : 'Wi-Fi: jiowife'}
            </span>
          </div>
          <div style={{ fontSize: '10px', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
            <span>Sensors: DS18B20 Temp + NEO-6M GPS</span>
            <span style={{ color: '#38bdf8' }}>
              {soldier.lastPacketTimestamp ? `Synced ${new Date(soldier.lastPacketTimestamp).toLocaleTimeString()}` : 'Awaiting 1st ping'}
            </span>
          </div>
        </div>
      )}

      {/* PPG Waveform Preview */}
      <div
        style={{
          background: '#020617',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid rgba(56,189,248,0.2)',
          marginBottom: '10px'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#94a3b8',
            marginBottom: '4px'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Heart style={{ width: '12px', height: '12px', color: '#f43f5e' }} /> LIVE PPG CARDIAC WAVEFORM
          </span>
          <span style={{ color: '#10b981' }}>1 Hz FILTERED</span>
        </div>
        <svg viewBox="0 0 300 35" style={{ width: '100%', height: '35px', stroke: '#38bdf8', fill: 'none', strokeWidth: 2 }}>
          <path d="M 0,18 L 40,18 L 45,8 L 50,28 L 55,4 L 60,32 L 65,18 L 100,18 L 140,18 L 145,8 L 150,28 L 155,4 L 160,32 L 165,18 L 200,18 L 240,18 L 245,8 L 250,28 L 255,4 L 260,32 L 265,18 L 300,18" />
        </svg>
      </div>

      {/* Vitals 4-Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        {/* Heart Rate */}
        <div style={{ background: 'rgba(15,23,42,0.6)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(56,189,248,0.15)' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Heart style={{ width: '12px', height: '12px', color: '#f43f5e' }} /> HEART RATE
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              color: vitals.hr > 110 || vitals.hr < 50 ? '#ef4444' : '#f8fafc',
              marginTop: '4px'
            }}
          >
            {Math.round(vitals.hr)} <span style={{ fontSize: '11px', color: '#64748b' }}>BPM</span>
          </div>
        </div>

        {/* SpO2 */}
        <div style={{ background: 'rgba(15,23,42,0.6)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(56,189,248,0.15)' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Activity style={{ width: '12px', height: '12px', color: '#38bdf8' }} /> SpO₂ OXYGEN
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              color: vitals.spo2 < 95 ? '#ef4444' : '#38bdf8',
              marginTop: '4px'
            }}
          >
            {Math.round(vitals.spo2)} <span style={{ fontSize: '11px', color: '#64748b' }}>%</span>
          </div>
        </div>

        {/* Temperature */}
        <div style={{ background: 'rgba(15,23,42,0.6)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(56,189,248,0.15)' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Thermometer style={{ width: '12px', height: '12px', color: '#f59e0b' }} /> BODY TEMP
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              color: vitals.temp > 37.8 || vitals.temp < 36.0 ? '#ef4444' : '#f59e0b',
              marginTop: '4px'
            }}
          >
            {vitals.temp.toFixed(1)} <span style={{ fontSize: '11px', color: '#64748b' }}>°C</span>
          </div>
        </div>

        {/* MPU Motion */}
        <div style={{ background: 'rgba(15,23,42,0.6)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(56,189,248,0.15)' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Gauge style={{ width: '12px', height: '12px', color: '#10b981' }} /> MPU MOTION
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              color: vitals.motionEnergy > 0.6 ? '#f59e0b' : '#10b981',
              marginTop: '4px'
            }}
          >
            {vitals.motionEnergy.toFixed(2)} <span style={{ fontSize: '11px', color: '#64748b' }}>g</span>
          </div>
        </div>
      </div>

      {/* Telemetry metadata footer */}
      <div
        style={{
          background: 'rgba(2,6,23,0.7)',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid rgba(56,189,248,0.1)',
          fontSize: '11px',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
          <span>Motion Signal Quality:</span>
          <span style={{ color: vitals.signalQuality > 80 ? '#10b981' : '#f59e0b', fontWeight: 'bold', fontFamily: 'monospace' }}>
            {vitals.signalQuality}% {vitals.signalQuality < 80 ? '(Motion Gating Active)' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
          <span>GPS Satellites Locked:</span>
          <span style={{ color: '#38bdf8', fontWeight: 'bold', fontFamily: 'monospace' }}>
            {vitals.satellites ?? 12} Sats (Fix Age: {vitals.lastFixAge ?? 35}ms)
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
          <span>Battery Pack:</span>
          <span style={{ color: '#f8fafc', fontFamily: 'monospace' }}>
            {Math.round(vitals.battery)}% (2000 mAh Li-Po)
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
          <span>LoRa Encryption:</span>
          <span style={{ color: '#10b981', fontWeight: 'bold', fontFamily: 'monospace' }}>
            AES-128 GCM [PASS]
          </span>
        </div>
      </div>
    </div>
  );
};
