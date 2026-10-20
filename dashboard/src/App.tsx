import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AlertBanner } from './components/AlertBanner';
import { SoldierList } from './components/SoldierList';
import { TacticalMap } from './components/TacticalMap';
import { VitalsPanel } from './components/VitalsPanel';
import { TriageExplainCard } from './components/TriageExplainCard';
import { LogsDrawer } from './components/LogsDrawer';
import { socketService } from './services/websocket';
import { Soldier, DroneState, AlertItem, BaseStation, NoFlyZone, SystemLog } from './types';

export const App: React.FC = () => {
  const [soldiers, setSoldiers] = useState<Soldier[]>([]);
  const [drone, setDrone] = useState<DroneState | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [baseStation, setBaseStation] = useState<BaseStation | null>(null);
  const [noFlyZones, setNoFlyZones] = useState<NoFlyZone[]>([]);
  const [selectedSoldierId, setSelectedSoldierId] = useState<string | null>('S1');
  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    // Initial fetch fallback
    fetch('http://localhost:5001/api/soldiers')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSoldiers(data.soldiers || []);
          setBaseStation(data.baseStation || null);
          setNoFlyZones(data.noFlyZones || []);
        }
      })
      .catch((err) => console.log('HTTP fallback pending:', err.message));

    // WebSocket connection for real-time streaming
    socketService.connect((data) => {
      setConnected(true);
      if (data.type === 'INITIAL_STATE') {
        if (data.soldiers) setSoldiers(data.soldiers);
        if (data.drone) setDrone(data.drone);
        if (data.alerts) setAlerts(data.alerts);
        if (data.logs) setLogs(data.logs);
        if (data.baseStation) setBaseStation(data.baseStation);
        if (data.noFlyZones) setNoFlyZones(data.noFlyZones);
      } else if (data.type === 'SOLDIERS_UPDATE') {
        if (data.soldiers) setSoldiers(data.soldiers);
        if (data.drone) setDrone(data.drone);
      } else if (data.type === 'DRONE_UPDATE') {
        if (data.drone) setDrone(data.drone);
      } else if (data.type === 'ALERT_RAISED') {
        setAlerts((prev) => [data.alert, ...prev]);
        // Auto-select casualty
        if (data.alert?.priority === 'RED') {
          setSelectedSoldierId(data.alert.soldierId);
        }
      } else if (data.type === 'ALERT_ACKNOWLEDGED') {
        setAlerts((prev) =>
          prev.map((a) => (a.id === data.alertId ? { ...a, acknowledged: true } : a))
        );
      }
    });
  }, []);

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`http://localhost:5001/api/alerts/${alertId}/ack`, { method: 'POST' });
      socketService.sendAction('ACK_ALERT', { alertId });
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleScenarioChange = async (scenario: string) => {
    try {
      await fetch('http://localhost:5001/api/scenarios/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecallDrone = async () => {
    try {
      await fetch('http://localhost:5001/api/drone/recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Manual Operator Recall' })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const selectedSoldier = soldiers.find((s) => s.id === selectedSoldierId) || soldiers[0] || null;
  const criticalCount = soldiers.filter((s) => s.triage.priority === 'RED').length;

  return (
    <div style={{ padding: '16px', maxWidth: '1800px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        drone={drone}
        activeSoldiersCount={soldiers.length}
        criticalCount={criticalCount}
        onScenarioChange={handleScenarioChange}
        onRecallDrone={handleRecallDrone}
      />

      <AlertBanner alerts={alerts} onAcknowledge={handleAcknowledgeAlert} />

      {/* Main 3-Column Tactical Display */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr 380px',
          gap: '14px',
          flex: 1,
          alignItems: 'stretch'
        }}
      >
        {/* Left Column: Squad Casualty Priority Roster */}
        <div style={{ height: 'calc(100vh - 160px)', minHeight: '620px' }}>
          <SoldierList
            soldiers={soldiers}
            selectedSoldierId={selectedSoldierId}
            onSelectSoldier={(id) => setSelectedSoldierId(id)}
          />
        </div>

        {/* Center Column: Radar Map & Live System Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: 'calc(100vh - 160px)', minHeight: '620px' }}>
          <div style={{ flex: 1, minHeight: '380px' }}>
            <TacticalMap
              soldiers={soldiers}
              drone={drone}
              baseStation={baseStation}
              noFlyZones={noFlyZones}
              selectedSoldierId={selectedSoldierId}
              onSelectSoldier={(id) => setSelectedSoldierId(id)}
            />
          </div>
          <div style={{ height: '170px' }}>
            <LogsDrawer logs={logs} />
          </div>
        </div>

        {/* Right Column: Vitals Telemetry & AI Triage Formula Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: 'calc(100vh - 160px)', minHeight: '620px' }}>
          <div style={{ flex: '1 1 55%', minHeight: '320px' }}>
            <VitalsPanel soldier={selectedSoldier} />
          </div>
          <div style={{ flex: '1 1 45%', minHeight: '260px' }}>
            <TriageExplainCard triage={selectedSoldier ? selectedSoldier.triage : null} />
          </div>
        </div>
      </div>
    </div>
  );
};
