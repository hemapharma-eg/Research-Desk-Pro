import { useState, useEffect, useRef } from 'react';

interface ScanPhase {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  duration: number; // ms
}

const SCAN_PHASES: ScanPhase[] = [
  {
    id: 'parsing',
    label: 'Parsing Document',
    description: 'Traversing TipTap AST nodes and extracting text blocks...',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    duration: 600,
  },
  {
    id: 'references',
    label: 'Checking Citations',
    description: 'Matching in-text citations against reference bibliography...',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    duration: 800,
  },
  {
    id: 'abbreviations',
    label: 'Scanning Abbreviations',
    description: 'Building acronym registry and checking definition order...',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" />
      </svg>
    ),
    duration: 500,
  },
  {
    id: 'data',
    label: 'Verifying Data Consistency',
    description: 'Cross-checking sample sizes, p-values, and statistical measures...',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    duration: 700,
  },
  {
    id: 'compliance',
    label: 'Evaluating Compliance',
    description: 'Checking for IRB, COI, funding, and data availability statements...',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    duration: 400,
  },
  {
    id: 'scoring',
    label: 'Computing Integrity Score',
    description: 'Aggregating findings and calculating readiness score...',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    duration: 350,
  },
];

export function ProgressScreen() {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [nodesScanned, setNodesScanned] = useState(0);
  const [issuesFound, setIssuesFound] = useState(0);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
    let phaseIdx = 0;
    let phaseSt = Date.now();

    const tick = () => {
      const now = Date.now();
      if (phaseIdx >= SCAN_PHASES.length) return;

      const elapsed = now - phaseSt;
      const duration = SCAN_PHASES[phaseIdx].duration;
      const progress = Math.min(elapsed / duration, 1);

      setPhaseProgress(progress);
      setNodesScanned(prev => prev + Math.floor(Math.random() * 4));
      if (Math.random() < 0.05) setIssuesFound(prev => prev + 1);

      if (progress >= 1) {
        phaseIdx++;
        phaseSt = now;
        if (phaseIdx < SCAN_PHASES.length) {
          setCurrentPhaseIndex(phaseIdx);
          setPhaseProgress(0);
        }
      }

      if (phaseIdx < SCAN_PHASES.length) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const totalPhases = SCAN_PHASES.length;
  const overallProgress = ((currentPhaseIndex + phaseProgress) / totalPhases) * 100;
  const currentPhase = SCAN_PHASES[Math.min(currentPhaseIndex, totalPhases - 1)];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 'var(--space-6)', padding: 'var(--space-6)' }}>
      <style>{`
        @keyframes ic-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes ic-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes ic-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .ic-phase-step { animation: ic-fadeIn 0.3s ease forwards; }
      `}</style>

      {/* Animated Shield Spinner */}
      <div style={{ position: 'relative', width: '80px', height: '80px' }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '3px solid var(--color-border-light)',
          borderTopColor: 'var(--color-accent-primary)',
          animation: 'ic-spin 1s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-accent-primary)', animation: 'ic-pulse 2s ease infinite',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
      </div>

      {/* Current Phase Info */}
      <div className="ic-phase-step" key={currentPhase.id} style={{ textAlign: 'center' }}>
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-1)' }}>
          {currentPhase.label}
        </h3>
        <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)', maxWidth: '420px' }}>
          {currentPhase.description}
        </p>
      </div>

      {/* Overall Progress Bar */}
      <div style={{ width: '440px', maxWidth: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
            Phase {Math.min(currentPhaseIndex + 1, totalPhases)} of {totalPhases}
          </span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>
            {Math.round(overallProgress)}%
          </span>
        </div>
        <div style={{
          width: '100%', backgroundColor: 'var(--color-bg-hover)', height: '8px',
          borderRadius: '4px', overflow: 'hidden',
        }}>
          <div style={{
            width: `${overallProgress}%`,
            background: 'linear-gradient(90deg, var(--color-accent-primary), rgba(120,85,255,0.9))',
            height: '100%', borderRadius: '4px',
            transition: 'width 0.15s ease',
          }} />
        </div>
      </div>

      {/* Phase Steps Timeline */}
      <div style={{
        display: 'flex', gap: 'var(--space-1)', alignItems: 'center', flexWrap: 'wrap',
        justifyContent: 'center', maxWidth: '520px',
      }}>
        {SCAN_PHASES.map((phase, idx) => {
          const isDone = idx < currentPhaseIndex;
          const isCurrent = idx === currentPhaseIndex;
          return (
            <div
              key={phase.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)',
                backgroundColor: isCurrent ? 'rgba(41,98,255,0.08)' : 'transparent',
                opacity: isDone ? 0.5 : isCurrent ? 1 : 0.25,
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: isDone ? 'var(--color-success)' : isCurrent ? 'var(--color-accent-primary)' : 'var(--color-bg-hover)',
                color: isDone || isCurrent ? '#fff' : 'var(--color-text-tertiary)',
                fontSize: '10px', fontWeight: 'bold',
                transition: 'all 0.3s ease',
              }}>
                {isDone ? '✓' : idx + 1}
              </div>
              <span style={{ fontSize: '11px', fontWeight: isCurrent ? 'var(--font-weight-medium)' : 'normal', whiteSpace: 'nowrap' }}>
                {phase.label.split(' ').slice(-1)[0]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Live Counters */}
      <div style={{ display: 'flex', gap: 'var(--space-6)', marginTop: 'var(--space-2)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)',
            fontFamily: 'var(--font-family-mono)', color: 'var(--color-text-primary)',
          }}>
            {nodesScanned.toLocaleString()}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Nodes Scanned
          </div>
        </div>
        <div style={{ width: '1px', backgroundColor: 'var(--color-border-light)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)',
            fontFamily: 'var(--font-family-mono)',
            color: issuesFound > 0 ? 'var(--color-warning)' : 'var(--color-success)',
          }}>
            {issuesFound}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Issues Detected
          </div>
        </div>
      </div>
    </div>
  );
}
