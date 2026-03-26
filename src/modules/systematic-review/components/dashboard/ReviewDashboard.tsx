import React, { useMemo } from 'react';
import { useSystematicReview } from '../../context/SystematicReviewContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#eb2f96'];

export function ReviewDashboard() {
  const { state } = useSystematicReview();
  const records = state.records;

  // Calculate KPIs
  const totalImported = records.length;
  
  const dupCandidates = state.clusters.reduce((sum, c) => sum + c.recordIds.length, 0);
  const dupResolved = state.clusters.filter(c => c.resolved).length;

  const tiabIncluded = records.filter(r => Object.values(r.titleAbstractDecisions).some(d => d.decision === 'include')).length;
  const tiabExcluded = records.filter(r => Object.values(r.titleAbstractDecisions).some(d => d.decision === 'exclude')).length;
  const unscreened = records.filter(r => r.stage === 'title-abstract-screening' && Object.keys(r.titleAbstractDecisions).length === 0).length;

  const ftPending = records.filter(r => r.stage === 'full-text-retrieval' && !r.pdfAttached).length;
  const ftIncluded = records.filter(r => Object.values(r.fullTextDecisions).some(d => d.decision === 'include')).length;
  const ftExcluded = records.filter(r => Object.values(r.fullTextDecisions).some(d => d.decision === 'exclude')).length;

  const unresolvedConflicts = state.conflicts.filter(c => c.status === 'pending').length;
  const finalIncluded = records.filter(r => r.finalDisposition === 'included').length;

  // Visuals Data preparation

  // 1. Stage Distribution Pie
  const stageDist = useMemo(() => {
    const counts = records.reduce((acc, r) => {
      acc[r.stage] = (acc[r.stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [records]);

  // 2. Simple PRISMA Preview Nodes
  const prismaNodes = [
    { label: 'Imported', value: totalImported },
    { label: 'After Dedup', value: totalImported - (dupCandidates - state.clusters.length) },
    { label: 'TiAb Included', value: tiabIncluded },
    { label: 'Excluded', value: tiabExcluded },
    { label: 'Final Included', value: finalIncluded }
  ];

  const KpiCard = ({ title, value, sub, color }: any) => (
    <div className="sr-card" style={{ padding: '16px 20px', borderLeft: `4px solid ${color}` }}>
      <div style={{ color: 'var(--color-text-secondary)', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--color-text-primary)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, marginTop: 8, color: 'var(--color-text-tertiary)' }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', overflowY: 'auto' }}>
      
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: 20 }}>Project Overview</h2>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 14 }}>
          Live metrics and screening progress across all stages.
        </p>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KpiCard title="Total Imported" value={totalImported} color="#1890ff" />
        <KpiCard title="Duplicates Resolved" value={`${dupResolved}/${state.clusters.length}`} sub="clusters" color="#faad14" />
        <KpiCard title="Titles/Abstracts Screened" value={tiabIncluded + tiabExcluded} sub={`${unscreened} waiting`} color="#722ed1" />
        <KpiCard title="Full Texts Missing" value={ftPending} color="#f5222d" />
        <KpiCard title="Open Conflicts" value={unresolvedConflicts} color="#fa8c16" />
        <KpiCard title="Final Included" value={finalIncluded} color="#52c41a" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Stage Distribution */}
        <div className="sr-card">
          <h3 style={{ marginTop: 0, fontSize: 15 }}>Records by Stage</h3>
          <div style={{ height: 280, marginTop: 16 }}>
            {records.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stageDist}
                    cx="50%" cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {stageDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No data</div>
            )}
          </div>
        </div>

        {/* PRISMA Funnel Preview */}
        <div className="sr-card">
          <h3 style={{ marginTop: 0, fontSize: 15 }}>PRISMA Progression Preview</h3>
          <div style={{ height: 280, marginTop: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
            {prismaNodes.map((n, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 140, fontSize: 13, color: 'var(--color-text-secondary)' }}>{n.label}</div>
                <div style={{ flex: 1, backgroundColor: 'var(--color-bg-subtle)', height: 24, borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${totalImported > 0 ? (n.value / totalImported) * 100 : 0}%`, 
                    backgroundColor: COLORS[i % COLORS.length],
                    transition: 'width 0.5s ease'
                  }} />
                </div>
                <div style={{ width: 60, textAlign: 'right', fontWeight: 'bold', fontSize: 14 }}>{n.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
