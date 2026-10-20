import React from 'react';
import { Cpu, HelpCircle, Activity } from 'lucide-react';
import { Triage } from '../types';

interface TriageExplainCardProps {
  triage: Triage | null;
}

export const TriageExplainCard: React.FC<TriageExplainCardProps> = ({ triage }) => {
  if (!triage) return null;

  const scorePct = Math.round(triage.score * 100);
  const comp = triage.components || { dSpO2: 0, dHR: 0, dT: 0, dM: 0 };

  const prioColor =
    triage.priority === 'RED' ? '#ef4444' :
    triage.priority === 'YELLOW' ? '#f59e0b' : '#10b981';

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
        <h3
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
          <Cpu style={{ width: '15px', height: '15px' }} /> AI TRIAGE EXPLAINABILITY
        </h3>
        <span
          style={{
            fontSize: '10px',
            color: '#10b981',
            background: 'rgba(6, 78, 59, 0.6)',
            padding: '2px 8px',
            borderRadius: '4px',
            border: '1px solid #10b981',
            fontFamily: 'monospace'
          }}
        >
          ML CONFIDENCE: {(triage.mlConfidence * 100).toFixed(0)}%
        </span>
      </div>

      {/* Clinical Explanation Text */}
      <div
        style={{
          background: 'rgba(15,23,42,0.7)',
          padding: '8px 10px',
          borderRadius: '6px',
          border: '1px solid rgba(56,189,248,0.15)',
          marginBottom: '10px',
          fontSize: '11px'
        }}
      >
        <div style={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'monospace', marginBottom: '3px' }}>
          CLINICAL TRIAGE RATIONALE:
        </div>
        <div style={{ color: '#f8fafc', fontWeight: 500, lineHeight: 1.4 }}>
          {triage.explain}
        </div>
      </div>

      {/* Mathematical Breakdown (Synopsis Section 5.7) */}
      <div
        style={{
          background: '#020617',
          padding: '8px 10px',
          borderRadius: '6px',
          border: '1px solid rgba(56,189,248,0.15)',
          fontSize: '10px',
          fontFamily: 'monospace'
        }}
      >
        <div style={{ color: '#38bdf8', fontWeight: 'bold', marginBottom: '6px' }}>
          FORMULA: S = 0.40·dSpO₂ + 0.30·dHR + 0.20·dT + 0.10·dM
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', textAlign: 'center' }}>
          <div style={{ background: '#0f172a', padding: '4px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '9px' }}>dSpO2</div>
            <div style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '11px' }}>{comp.dSpO2.toFixed(2)}</div>
          </div>
          <div style={{ background: '#0f172a', padding: '4px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '9px' }}>dHR</div>
            <div style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '11px' }}>{comp.dHR.toFixed(2)}</div>
          </div>
          <div style={{ background: '#0f172a', padding: '4px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '9px' }}>dT</div>
            <div style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '11px' }}>{comp.dT.toFixed(2)}</div>
          </div>
          <div style={{ background: '#0f172a', padding: '4px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '9px' }}>dM</div>
            <div style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '11px' }}>{comp.dM.toFixed(2)}</div>
          </div>
        </div>

        {/* Severity Progress Bar */}
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#94a3b8', marginBottom: '3px' }}>
            <span>SEVERITY SCORE: {triage.score.toFixed(3)} ({scorePct}%)</span>
            <span>&lt;0.30 GREEN | &gt;=0.60 RED</span>
          </div>
          <div style={{ width: '100%', height: '7px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, Math.max(5, scorePct))}%`,
                height: '100%',
                background: prioColor,
                transition: 'width 0.4s ease, background 0.4s ease'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
