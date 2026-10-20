import React, { useState, useEffect } from 'react';
import { Shield, Radio, Activity, Send, Zap, RotateCcw, Cpu, Terminal, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { DroneState } from '../types';
import { API_BASE } from '../services/api';

interface HeaderProps {
  drone: DroneState | null;
  activeSoldiersCount: number;
  criticalCount: number;
  onScenarioChange: (scenario: string) => void;
  onRecallDrone?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  drone,
  activeSoldiersCount,
  criticalCount,
  onScenarioChange,
  onRecallDrone
}) => {
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString());
  const [showIoTModal, setShowIoTModal] = useState<boolean>(false);
  const [serialInput, setSerialInput] = useState<string>(
`Temperature: 26.81 C
Latitude: 28.706578
Longitude: 77.680298
GPS satellites: 12
GPS fix age (ms): 35`
  );
  const [iotStatusMsg, setIotStatusMsg] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sendDirectTelemetry = async (payload: any) => {
    try {
      const res = await fetch(`${API_BASE}/api/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setIotStatusMsg(`✅ Updated: ${data.soldier?.callsign} (${data.soldier?.lat.toFixed(4)}, ${data.soldier?.lng.toFixed(4)}) Temp: ${data.soldier?.vitals?.temp}°C`);
      setTimeout(() => setIotStatusMsg(''), 4000);
    } catch (err: any) {
      setIotStatusMsg('❌ Error: ' + err.message);
    }
  };

  const handleSendSerialRaw = async (isRed = false) => {
    try {
      const res = await fetch(`${API_BASE}/api/telemetry/raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: serialInput, redSignal: isRed, panic: isRed })
      });
      const data = await res.json();
      if (isRed) {
        setIotStatusMsg('🚨 CRITICAL RED SIGNAL BROADCAST! UAV Drone Dispatched on A* Route!');
      } else {
        setIotStatusMsg(`✅ GPS & Temp Synced from Serial Monitor log!`);
      }
      setTimeout(() => setIotStatusMsg(''), 4500);
    } catch (err: any) {
      setIotStatusMsg('❌ Error: ' + err.message);
    }
  };

  return (
    <header
      className="glass-panel"
      style={{
        padding: '12px 18px',
        marginBottom: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}
    >
      {/* Brand & Project Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #0369a1 0%, #082f49 100%)',
            border: '1px solid #38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8',
            boxShadow: '0 0 15px rgba(56,189,248,0.4)'
          }}
        >
          <Shield style={{ width: '24px', height: '24px' }} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="hud-font" style={{ fontSize: '20px', fontWeight: 'bold', color: '#f8fafc', margin: 0, letterSpacing: '0.08em' }}>
              VAYUJIV
            </h1>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: '#0c4a6e',
                color: '#38bdf8',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                border: '1px solid rgba(56,189,248,0.3)'
              }}
            >
              COMMAND POST v1.0
            </span>
          </div>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
            Autonomous Battlefield Medical Intelligence & Rescue System
          </p>
        </div>
      </div>

      {/* Real-time Status Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', flexWrap: 'wrap' }}>
        {/* LoRa Uplink */}
        <div
          style={{
            background: 'rgba(15,23,42,0.8)',
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid rgba(56,189,248,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Radio style={{ width: '16px', height: '16px', color: '#10b981' }} />
          <div>
            <div style={{ fontSize: '9px', color: '#64748b', fontFamily: 'monospace' }}>LORA GATEWAY</div>
            <div style={{ color: '#10b981', fontWeight: 'bold', fontFamily: 'monospace' }}>
              865–867 MHz · SF7
            </div>
          </div>
        </div>

        {/* Squad Status */}
        <div
          style={{
            background: 'rgba(15,23,42,0.8)',
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid rgba(56,189,248,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Activity style={{ width: '16px', height: '16px', color: '#38bdf8' }} />
          <div>
            <div style={{ fontSize: '9px', color: '#64748b', fontFamily: 'monospace' }}>ACTIVE SQUAD</div>
            <div style={{ color: '#38bdf8', fontWeight: 'bold', fontFamily: 'monospace' }}>
              {activeSoldiersCount} UNITS {criticalCount > 0 && <span style={{ color: '#ef4444' }}>({criticalCount} CRITICAL)</span>}
            </div>
          </div>
        </div>

        {/* Drone Status */}
        <div
          style={{
            background: 'rgba(15,23,42,0.8)',
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid rgba(56,189,248,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Send style={{ width: '16px', height: '16px', color: drone?.status === 'IDLE' ? '#94a3b8' : '#38bdf8' }} />
          <div>
            <div style={{ fontSize: '9px', color: '#64748b', fontFamily: 'monospace' }}>MEDICAL DRONE</div>
            <div style={{ color: drone?.status === 'IDLE' ? '#cbd5e1' : '#38bdf8', fontWeight: 'bold', fontFamily: 'monospace' }}>
              {drone ? drone.status : 'STANDBY'} ({drone?.battery || 100}%)
            </div>
          </div>
          {drone && drone.status !== 'IDLE' && onRecallDrone && (
            <button
              onClick={onRecallDrone}
              title="Emergency Return to Base"
              style={{
                marginLeft: '4px',
                background: '#be123c',
                color: '#fff',
                border: 'none',
                padding: '3px 6px',
                borderRadius: '4px',
                fontSize: '9px',
                cursor: 'pointer',
                fontFamily: 'monospace'
              }}
            >
              RECALL
            </button>
          )}
        </div>

        {/* Clock */}
        <div
          style={{
            background: '#020617',
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid rgba(56,189,248,0.3)',
            color: '#38bdf8',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            fontSize: '12px'
          }}
        >
          {time} IST
        </div>
      </div>

      {/* Scenario Injector Dropdown & ESP32 Hardware Link */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowIoTModal(true)}
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#fff',
            border: '1px solid #38bdf8',
            borderRadius: '6px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 0 12px rgba(56,189,248,0.3)'
          }}
        >
          <Cpu style={{ width: '15px', height: '15px' }} />
          <span>ESP32 IOT GATEWAY</span>
        </button>

        <span style={{ fontSize: '11px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
          <Zap style={{ width: '14px', height: '14px' }} /> DEMO SCENARIO:
        </span>
        <select
          onChange={(e) => {
            onScenarioChange(e.target.value);
            e.target.value = '';
          }}
          style={{
            background: '#0f172a',
            color: '#f8fafc',
            fontSize: '11px',
            padding: '6px 10px',
            borderRadius: '4px',
            border: '1px solid #0284c7',
            fontFamily: 'monospace',
            cursor: 'pointer'
          }}
          defaultValue=""
        >
          <option value="" disabled>Select Casualty Event...</option>
          <option value="SOLDIER_2_TRAUMA_CRITICAL">🚨 Soldier 2: Trauma Fall + Severe Hypoxia (Auto Drone)</option>
          <option value="SOLDIER_3_PANIC_SOS">🚨 Soldier 3: Tactile Emergency SOS Panic Button</option>
          <option value="SOLDIER_4_HYPOTHERMIA">⚠️ Soldier 4: Hypothermia Critical (33.8 °C)</option>
          <option value="RESET_ALL_STABLE">🔄 Reset All Soldiers to Stable Patrol</option>
        </select>
      </div>

      {/* ESP32 Hardware Ingestion & Red Signal Trigger Modal */}
      {showIoTModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
        >
          <div
            style={{
              background: '#0b1329',
              border: '1px solid #38bdf8',
              borderRadius: '10px',
              maxWidth: '640px',
              width: '100%',
              padding: '20px',
              boxShadow: '0 0 35px rgba(56,189,248,0.25)',
              color: '#f8fafc',
              fontFamily: 'sans-serif',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(56,189,248,0.2)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu style={{ width: '20px', height: '20px', color: '#38bdf8' }} />
                <h3 style={{ margin: 0, fontSize: '15px', color: '#38bdf8', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                  ESP32 HARDWARE SENSOR INTEGRATION
                </h3>
              </div>
              <button
                onClick={() => setShowIoTModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            {/* Local IP Endpoint for ESP32 HTTP POST */}
            <div style={{ background: '#020617', padding: '10px 14px', borderRadius: '6px', border: '1px solid #1e293b', marginBottom: '14px', fontSize: '11px', fontFamily: 'monospace' }}>
              <div style={{ color: '#94a3b8', marginBottom: '4px' }}>📡 Wi-Fi HTTP REST Ingestion Endpoint:</div>
              <div style={{ color: '#38bdf8', fontWeight: 'bold' }}>POST / GET: http://192.168.29.4:5001/api/telemetry</div>
              <div style={{ color: '#64748b', fontSize: '10px', marginTop: '2px' }}>
                Query or JSON: ?lat=28.706578&lng=77.680298&temp=26.81&redSignal=1
              </div>
            </div>

            {/* Quick 1-Click Action Buttons for Demo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <button
                onClick={() => sendDirectTelemetry({
                  soldierId: 'S1',
                  lat: 28.706578,
                  lng: 77.680298,
                  temp: 26.81,
                  satellites: 12,
                  fixAge: 35,
                  panic: false
                })}
                style={{
                  background: '#0369a1',
                  color: '#fff',
                  border: '1px solid #38bdf8',
                  padding: '10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  cursor: 'pointer'
                }}
              >
                📍 PUSH GPS (28.7065, 77.6802) & TEMP (26.8°C)
              </button>

              <button
                onClick={() => sendDirectTelemetry({
                  soldierId: 'S1',
                  lat: 28.706578,
                  lng: 77.680298,
                  temp: 26.81,
                  panic: true,
                  redSignal: true
                })}
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  color: '#fff',
                  border: '1px solid #f87171',
                  padding: '10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  boxShadow: '0 0 15px rgba(239,68,68,0.5)'
                }}
              >
                🚨 TRIGGER RED SIGNAL (AUTONOMOUS DRONE)
              </button>
            </div>

            {/* Raw Serial Log Parser for phone serial output */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Terminal style={{ width: '13px', height: '13px' }} />
                <span>PASTE PHONE SERIAL MONITOR LOG HERE:</span>
              </div>
              <textarea
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value)}
                rows={5}
                style={{
                  width: '100%',
                  background: '#020617',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  color: '#e2e8f0',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center' }}>
              {iotStatusMsg && (
                <div style={{ flex: 1, fontSize: '11px', color: iotStatusMsg.includes('🚨') ? '#f87171' : '#34d399', fontFamily: 'monospace' }}>
                  {iotStatusMsg}
                </div>
              )}
              <button
                onClick={() => handleSendSerialRaw(false)}
                style={{
                  background: '#1e293b',
                  color: '#38bdf8',
                  border: '1px solid #38bdf8',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  cursor: 'pointer'
                }}
              >
                Sync Parsed Data
              </button>
              <button
                onClick={() => handleSendSerialRaw(true)}
                style={{
                  background: '#b91c1c',
                  color: '#fff',
                  border: '1px solid #ef4444',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                🚨 Transmit Red Signal
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
