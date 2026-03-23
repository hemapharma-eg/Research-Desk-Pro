import type { StatTestResult } from '../../utils/statService';

interface AnalysisReportProps {
  result: StatTestResult | null;
  onClear: () => void;
}

export function AnalysisReport({ result, onClear }: AnalysisReportProps) {
  if (!result) {
    return (
      <div style={{ padding: '16px', color: '#64748B', textAlign: 'center', fontSize: '13px', fontStyle: 'italic' }}>
        No analysis results yet. Run a test from the Analysis Wizard.
      </div>
    );
  }

  // Generate interpretation
  let interpretation = `A ${result.testName} was conducted. `;
  if (result.statisticType === 'F') {
    interpretation += `The main effect was ${result.isSignificant ? 'statistically significant' : 'not statistically significant'} (F(${result.df1}, ${result.df2}) = ${result.statisticValue.toFixed(3)}, p = ${result.mainPValue.toExponential(2)}).`;
  } else if (result.statisticType === 't') {
    interpretation += `The difference was ${result.isSignificant ? 'statistically significant' : 'not statistically significant'} (t(${result.df1}) = ${result.statisticValue.toFixed(3)}, p = ${result.mainPValue.toExponential(2)}).`;
  } else if (result.statisticType === 'H') {
      interpretation += `There was a ${result.isSignificant ? 'statistically significant' : 'non-significant'} difference between groups (H(${result.df1}) = ${result.statisticValue.toFixed(3)}, p = ${result.mainPValue.toExponential(2)}).`;
  } else {
    interpretation += `The result was ${result.isSignificant ? 'significant' : 'ns'} (${result.statisticType} = ${result.statisticValue.toFixed(3)}, p = ${result.mainPValue.toExponential(2)}).`;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'white', color: '#0F172A', fontSize: '13px' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Statistical Report</h3>
        <button onClick={onClear} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '18px' }}>×</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#1E293B', fontSize: '14px' }}>Interpretation</h4>
        <div style={{ padding: '12px', background: '#F1F5F9', borderLeft: '4px solid #3B82F6', borderRadius: '4px', marginBottom: '24px', lineHeight: '1.5' }}>
          {interpretation}
        </div>

        <h4 style={{ margin: '0 0 8px 0', color: '#1E293B', fontSize: '14px' }}>Descriptive Statistics</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
              <th style={{ padding: '6px' }}>Group</th>
              <th>N</th>
              <th>Mean</th>
              <th>SD</th>
              <th>SEM</th>
              <th>95% CI</th>
            </tr>
          </thead>
          <tbody>
            {result.descriptives.map((d, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '6px', fontWeight: 'bold' }}>{d.group}</td>
                <td>{d.n}</td>
                <td>{d.mean.toFixed(2)}</td>
                <td>{d.sd.toFixed(2)}</td>
                <td>{d.sem.toFixed(2)}</td>
                <td>[{d.ci95_lower.toFixed(2)}, {d.ci95_upper.toFixed(2)}]</td>
              </tr>
            ))}
          </tbody>
        </table>

         {result.postHoc && result.postHoc.length > 0 && (
          <>
            <h4 style={{ margin: '0 0 8px 0', color: '#1E293B', fontSize: '14px' }}>Pairwise Comparisons (Post-Hoc)</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                  <th style={{ padding: '6px' }}>Comparison</th>
                  <th>p-Value</th>
                  <th>Sig.</th>
                </tr>
              </thead>
              <tbody>
                {result.postHoc.map((ph, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #E2E8F0', background: ph.isSignificant ? '#F0FDF4' : 'transparent' }}>
                    <td style={{ padding: '6px' }}>{ph.group1} vs {ph.group2}</td>
                    <td>{ph.pValue < 0.0001 ? '< 0.0001' : ph.pValue.toFixed(4)}</td>
                    <td style={{ fontWeight: 'bold', color: ph.isSignificant ? '#166534' : '#64748B' }}>
                      {ph.significanceLevel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {result.notes && result.notes.length > 0 && (
           <div style={{ marginTop: '16px', fontSize: '11px', color: '#64748B' }}>
             <strong>Notes:</strong>
             <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
               {result.notes.map((n, i) => <li key={i}>{n}</li>)}
             </ul>
           </div>
        )}
      </div>
    </div>
  );
}
