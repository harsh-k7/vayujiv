import React from 'react';
import { AlertTriangle, Send, CheckCircle2 } from 'lucide-react';
import { AlertItem } from '../types';

interface AlertBannerProps {
  alerts: AlertItem[];
  onAcknowledge: (id: string) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alerts, onAcknowledge }) => {
  const unackedRed = alerts.filter(a => a.priority === 'RED' && !a.acknowledged);
  if (unackedRed.length === 0) return null;

  const topAlert = unackedRed[0];

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, #7f1d1d 0%, #450a0a 100%)',
        border: '2px solid #ef4444',
        borderRadius: '8px',
        padding: '12px 18px',
        marginBottom: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 0 25px rgba(239, 68, 68, 0.55)',
        animation: 'pulse-red 1.8s infinite',
        flexWrap: 'wrap',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 12px #ef4444'
          }}
        >
          <AlertTriangle style={{ width: '22px', height: '22px' }} />
        </div>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#ffffff', letterSpacing: '0.06em', fontFamily: 'var(--font-hud)' }}>
            CRITICAL BATTLEFIELD CASUALTY ALERT // {topAlert.callsign} ({topAlert.soldierName})
          </div>
          <div style={{ fontSize: '12px', color: '#fca5a5', marginTop: '2px' }}>
            {topAlert.message}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {topAlert.droneDispatched && (
          <span
            style={{
              background: '#082f49',
              color: '#38bdf8',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '11px',
              border: '1px solid #38bdf8',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Send style={{ width: '13px', height: '13px' }} />
            AUTONOMOUS UAV DISPATCHED
          </span>
        )}
        <button
          onClick={() => onAcknowledge(topAlert.id)}
          style={{
            background: '#ef4444',
            color: '#ffffff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'var(--font-hud)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            transition: 'background 0.2s'
          }}
        >
          <CheckCircle2 style={{ width: '15px', height: '15px' }} />
          ACKNOWLEDGE INCIDENT
        </button>
      </div>
    </div>
  );
};
