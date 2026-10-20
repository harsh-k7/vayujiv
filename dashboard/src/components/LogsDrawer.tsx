import React from 'react';
import { Terminal, Shield } from 'lucide-react';
import { SystemLog } from '../types';

interface LogsDrawerProps {
  logs: SystemLog[];
}

export const LogsDrawer: React.FC<LogsDrawerProps> = ({ logs }) => {
  return (
    <div className="glass-panel" style={{ padding: '12px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(56,189,248,0.2)',
          paddingBottom: '6px',
          marginBottom: '8px'
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'var(--font-hud)'
          }}
        >
          <Terminal style={{ width: '15px', height: '15px' }} /> EVENT AUDIT LOG STREAM
        </div>
        <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
          SQLITE LOGGED // {logs.length} ENTRIES
        </span>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          maxHeight: '130px',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px'
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: '11px', textAlign: 'center', padding: '10px' }}>
            Awaiting system events...
          </div>
        ) : (
          logs.slice(0, 30).map((log) => (
            <div
              key={log.id}
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                background: 'rgba(0,0,0,0.45)',
                padding: '4px 8px',
                borderRadius: '4px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}
            >
              <span style={{ color: '#64748b', whiteSpace: 'nowrap' }}>
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>[{log.source}]</span>
              <span
                style={{
                  color:
                    log.level === 'CRITICAL' ? '#ef4444' :
                    log.level === 'WARNING' ? '#f59e0b' :
                    log.level === 'SCENARIO' ? '#a855f7' : '#f8fafc',
                  flex: 1
                }}
              >
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
