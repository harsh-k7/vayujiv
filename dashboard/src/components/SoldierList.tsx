import React from 'react';
import { Heart, Activity, Thermometer, Battery, Users, AlertCircle } from 'lucide-react';
import { Soldier } from '../types';

interface SoldierListProps {
  soldiers: Soldier[];
  selectedSoldierId: string | null;
  onSelectSoldier: (id: string) => void;
}

export const SoldierList: React.FC<SoldierListProps> = ({ soldiers, selectedSoldierId, onSelectSoldier }) => {
  const sorted = [...soldiers].sort((a, b) => {
    const w: Record<string, number> = { RED: 3, YELLOW: 2, GREEN: 1 };
    return (w[b.triage.priority] || 0) - (w[a.triage.priority] || 0);
  });

  return (
    <div className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', height: '100%' }}>
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
        <h2
          style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            margin: 0,
            fontFamily: 'var(--font-hud)'
          }}
        >
          <Users style={{ width: '15px', height: '15px' }} /> SQUAD CASUALTY TRIAGE
        </h2>
        <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
          {soldiers.length} SENSING NODES
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
        {sorted.map((soldier) => {
          const isSelected = soldier.id === selectedSoldierId;
          const prio = soldier.triage.priority;

          const badgeBg =
            prio === 'RED' ? '#7f1d1d' :
            prio === 'YELLOW' ? '#78350f' : '#064e3b';
          const badgeBorder =
            prio === 'RED' ? '#ef4444' :
            prio === 'YELLOW' ? '#f59e0b' : '#10b981';
          const badgeText =
            prio === 'RED' ? '#fca5a5' :
            prio === 'YELLOW' ? '#fde68a' : '#a7f3d0';

          return (
            <div
              key={soldier.id}
              onClick={() => onSelectSoldier(soldier.id)}
              style={{
                background: isSelected
                  ? 'rgba(30,41,59,0.95)'
                  : prio === 'RED'
                  ? 'rgba(127,29,29,0.25)'
                  : 'rgba(15,23,42,0.65)',
                border: isSelected
                  ? '1px solid #38bdf8'
                  : prio === 'RED'
                  ? '1px solid rgba(239,68,68,0.6)'
                  : '1px solid rgba(56,189,248,0.15)',
                borderRadius: '6px',
                padding: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 0 12px rgba(56,189,248,0.25)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontWeight: 'bold', color: '#f8fafc', fontSize: '12px', fontFamily: 'monospace', marginRight: '6px' }}>
                    {soldier.callsign}
                  </span>
                  {soldier.id === 'S1' && (
                    soldier.packetCount ? (
                      <span style={{ fontSize: '9px', background: 'rgba(5, 150, 105, 0.3)', color: '#34d399', padding: '1px 5px', borderRadius: '3px', border: '1px solid #10b981', marginRight: '6px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                        ● ESP32 LIVE (#{soldier.packetCount})
                      </span>
                    ) : (
                      <span style={{ fontSize: '9px', background: 'rgba(180, 83, 9, 0.25)', color: '#fbbf24', padding: '1px 5px', borderRadius: '3px', border: '1px solid #f59e0b', marginRight: '6px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                        ○ AWAITING ESP32
                      </span>
                    )
                  )}
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{soldier.name}</span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: badgeBg,
                    border: `1px solid ${badgeBorder}`,
                    color: badgeText,
                    fontFamily: 'monospace'
                  }}
                >
                  {prio} ({(soldier.triage.score * 100).toFixed(0)}%)
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
                <div style={{ background: '#030712', padding: '4px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '8px', color: '#64748b' }}>HR</div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: soldier.vitals.hr > 110 || soldier.vitals.hr < 50 ? '#ef4444' : '#f8fafc',
                      fontFamily: 'monospace'
                    }}
                  >
                    {Math.round(soldier.vitals.hr)}
                  </div>
                </div>

                <div style={{ background: '#030712', padding: '4px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '8px', color: '#64748b' }}>SpO₂</div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: soldier.vitals.spo2 < 95 ? '#ef4444' : '#38bdf8',
                      fontFamily: 'monospace'
                    }}
                  >
                    {Math.round(soldier.vitals.spo2)}%
                  </div>
                </div>

                <div style={{ background: '#030712', padding: '4px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '8px', color: '#64748b' }}>TEMP</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#f59e0b', fontFamily: 'monospace' }}>
                    {soldier.vitals.temp.toFixed(1)}°
                  </div>
                </div>

                <div style={{ background: '#030712', padding: '4px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '8px', color: '#64748b' }}>BAT</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#10b981', fontFamily: 'monospace' }}>
                    {Math.round(soldier.vitals.battery)}%
                  </div>
                </div>
              </div>

              {(soldier.vitals.isFall || soldier.vitals.panic) && (
                <div style={{ marginTop: '6px', display: 'flex', gap: '4px' }}>
                  {soldier.vitals.isFall && (
                    <span style={{ fontSize: '9px', background: '#991b1b', color: '#fee2e2', padding: '2px 5px', borderRadius: '3px', fontWeight: 'bold' }}>
                      FALL DETECTED
                    </span>
                  )}
                  {soldier.vitals.panic && (
                    <span style={{ fontSize: '9px', background: '#be123c', color: '#ffe4e6', padding: '2px 5px', borderRadius: '3px', fontWeight: 'bold' }}>
                      SOS PANIC
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
