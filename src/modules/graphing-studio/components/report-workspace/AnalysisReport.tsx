import type { StatTestResult, PairwiseComparison, DescriptiveStats } from '../../utils/statService';

interface AnalysisReportProps {
  result: StatTestResult | null;
  onClear?: () => void;
}

function formatP(p: number): string {
  if (p < 0.0001) return '< 0.0001';
  return p.toFixed(4);
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function CopyButton({ text }: { text: string }) {
  return (
    <button
      className="gs-btn gs-btn-sm"
      onClick={() => copyToClipboard(text)}
      title="Copy to clipboard"
    >
      📋 Copy
    </button>
  );
}

export function AnalysisReport({ result, onClear }: AnalysisReportProps) {
  if (!result) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
        <p style={{ fontSize: '16px', marginBottom: '8px' }}>No analysis results yet</p>
        <p style={{ fontSize: '13px' }}>Run a statistical test from the <strong>Analyze</strong> tab to see results here.</p>
      </div>
    );
  }

  const generateInterpretation = (): string => {
    const { testName, mainPValue, statisticType, statisticValue, df1, df2, isSignificant, effectSize, effectSizeType, rSquared, equation } = result;
    let text = `A ${testName} was performed. `;

    if (df2 !== undefined) {
      text += `The test yielded ${statisticType}(${df1}, ${df2}) = ${statisticValue.toFixed(3)}, p = ${formatP(mainPValue)}. `;
    } else if (df1 !== undefined) {
      text += `The test yielded ${statisticType}(${df1}) = ${statisticValue.toFixed(3)}, p = ${formatP(mainPValue)}. `;
    } else {
      text += `The test yielded ${statisticType} = ${statisticValue.toFixed(3)}, p = ${formatP(mainPValue)}. `;
    }

    if (isSignificant) {
      text += 'The result was statistically significant (p ≤ 0.05). ';
    } else {
      text += 'The result was not statistically significant (p > 0.05). ';
    }

    if (effectSize !== undefined && effectSizeType) {
      text += `Effect size: ${effectSizeType} = ${effectSize.toFixed(4)}. `;
    }
    if (rSquared !== undefined) {
      text += `R² = ${rSquared.toFixed(4)}. `;
    }
    if (equation) {
      text += `Equation: ${equation}. `;
    }

    return text;
  };

  const interpretationText = generateInterpretation();

  return (
    <div style={{ padding: '20px', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>{result.testName}</h2>
        {onClear && (
          <button className="gs-btn gs-btn-sm" onClick={onClear}>Clear Results</button>
        )}
      </div>

      {/* Summary Card */}
      <div className="gs-report-block">
        <div className="gs-report-header">
          <span>Summary</span>
          <CopyButton text={interpretationText} />
        </div>
        <div className="gs-report-body">
          <div className="gs-interpretation">{interpretationText}</div>
          <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            <div style={statCardStyle}>
              <div style={statCardLabel}>{result.statisticType}</div>
              <div style={statCardValue}>{result.statisticValue.toFixed(4)}</div>
            </div>
            <div style={statCardStyle}>
              <div style={statCardLabel}>p-value</div>
              <div style={{ ...statCardValue, color: result.isSignificant ? '#16A34A' : '#DC2626' }}>{formatP(result.mainPValue)}</div>
            </div>
            {result.effectSize !== undefined && (
              <div style={statCardStyle}>
                <div style={statCardLabel}>{result.effectSizeType || 'Effect Size'}</div>
                <div style={statCardValue}>{result.effectSize.toFixed(4)}</div>
              </div>
            )}
            {result.rSquared !== undefined && (
              <div style={statCardStyle}>
                <div style={statCardLabel}>R²</div>
                <div style={statCardValue}>{result.rSquared.toFixed(4)}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      {result.notes && result.notes.length > 0 && (
        <div className="gs-report-block">
          <div className="gs-report-header"><span>Details & Notes</span></div>
          <div className="gs-report-body">
            <ul style={{ paddingLeft: '18px', fontSize: '13px', lineHeight: 1.7, color: 'var(--color-text-primary)' }}>
              {result.notes.map((note, i) => <li key={i}>{note}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Assumption Checks */}
      {(result.normalityTest || result.varianceTest) && (
        <div className="gs-report-block">
          <div className="gs-report-header"><span>Assumption Checks</span></div>
          <div className="gs-report-body">
            {result.normalityTest && (
              <>
                <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Normality ({result.normalityTest[0]?.testName})</h4>
                <table className="gs-table">
                  <thead><tr><th>Group</th><th>W</th><th>p</th><th>Normal?</th></tr></thead>
                  <tbody>
                    {result.normalityTest.map((nt, i) => (
                      <tr key={i}>
                        <td>{nt.group}</td>
                        <td>{nt.statistic.toFixed(4)}</td>
                        <td>{formatP(nt.pValue)}</td>
                        <td>{nt.isNormal ? '✅ Yes' : '⚠️ No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            {result.varianceTest && (
              <div style={{ marginTop: '12px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>{result.varianceTest.testName}</h4>
                <p style={{ fontSize: '13px' }}>
                  F = {result.varianceTest.statistic.toFixed(4)}, p = {formatP(result.varianceTest.pValue)} — {result.varianceTest.isHomogeneous ? '✅ Equal variances assumed' : '⚠️ Unequal variances detected'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Descriptive Statistics */}
      {result.descriptives.length > 0 && (
        <div className="gs-report-block">
          <div className="gs-report-header">
            <span>Descriptive Statistics</span>
            <CopyButton text={descToCSV(result.descriptives)} />
          </div>
          <div className="gs-report-body" style={{ overflowX: 'auto' }}>
            <table className="gs-table">
              <thead>
                <tr>
                  <th>Group</th><th>n</th><th>Mean</th><th>Median</th><th>SD</th><th>SEM</th><th>95% CI</th>
                </tr>
              </thead>
              <tbody>
                {result.descriptives.map((d, i) => (
                  <tr key={i}>
                    <td><strong>{d.group}</strong></td>
                    <td>{d.n}</td>
                    <td>{d.mean.toFixed(3)}</td>
                    <td>{d.median.toFixed(3)}</td>
                    <td>{d.sd.toFixed(3)}</td>
                    <td>{d.sem.toFixed(3)}</td>
                    <td>[{d.ci95_lower.toFixed(3)}, {d.ci95_upper.toFixed(3)}]</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Post-hoc / Pairwise Comparisons */}
      {result.postHoc && result.postHoc.length > 0 && (
        <div className="gs-report-block">
          <div className="gs-report-header">
            <span>Pairwise Comparisons</span>
            <CopyButton text={postHocToCSV(result.postHoc)} />
          </div>
          <div className="gs-report-body" style={{ overflowX: 'auto' }}>
            <table className="gs-table">
              <thead>
                <tr>
                  <th>Comparison</th><th>Mean Diff</th><th>95% CI</th>
                  <th>p (adj)</th><th>Significance</th>
                  {result.postHoc[0]?.effectSize !== undefined && <th>Effect Size</th>}
                </tr>
              </thead>
              <tbody>
                {result.postHoc.map((ph, i) => (
                  <tr key={i} className={ph.isSignificant ? 'sig-yes' : ''}>
                    <td><strong>{ph.group1}</strong> vs <strong>{ph.group2}</strong></td>
                    <td>{ph.meanDifference !== undefined ? ph.meanDifference.toFixed(3) : '—'}</td>
                    <td>{ph.ci_lower !== undefined ? `[${ph.ci_lower.toFixed(3)}, ${ph.ci_upper?.toFixed(3)}]` : '—'}</td>
                    <td className="sig-cell" style={{ color: ph.isSignificant ? '#16A34A' : '#DC2626' }}>{formatP(ph.pValue)}</td>
                    <td>{ph.significanceLevel}</td>
                    {ph.effectSize !== undefined && <td>{ph.effectSizeType}: {ph.effectSize.toFixed(3)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Regression Details */}
      {result.slope !== undefined && (
        <div className="gs-report-block">
          <div className="gs-report-header"><span>Regression Results</span></div>
          <div className="gs-report-body">
            <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '14px', padding: '12px', background: '#F1F5F9', borderRadius: '6px', marginBottom: '8px' }}>
              {result.equation}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div style={statCardStyle}>
                <div style={statCardLabel}>Slope</div>
                <div style={statCardValue}>{result.slope.toFixed(4)}</div>
              </div>
              <div style={statCardStyle}>
                <div style={statCardLabel}>Intercept</div>
                <div style={statCardValue}>{result.intercept?.toFixed(4)}</div>
              </div>
              <div style={statCardStyle}>
                <div style={statCardLabel}>R²</div>
                <div style={statCardValue}>{result.rSquared?.toFixed(4)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Style shortcuts
const statCardStyle: React.CSSProperties = {
  padding: '10px 12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--color-border-light)'
};
const statCardLabel: React.CSSProperties = { fontSize: '11px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' };
const statCardValue: React.CSSProperties = { fontSize: '18px', fontWeight: 'bold', fontFamily: 'var(--font-family-mono)' };

function descToCSV(desc: DescriptiveStats[]): string {
  const header = 'Group,n,Mean,Median,SD,SEM,CI_Lower,CI_Upper';
  const rows = desc.map(d => `${d.group},${d.n},${d.mean.toFixed(4)},${d.median.toFixed(4)},${d.sd.toFixed(4)},${d.sem.toFixed(4)},${d.ci95_lower.toFixed(4)},${d.ci95_upper.toFixed(4)}`);
  return [header, ...rows].join('\n');
}

function postHocToCSV(postHoc: PairwiseComparison[]): string {
  const header = 'Comparison,Mean_Diff,CI_Lower,CI_Upper,p_adj,Significance,Effect_Size';
  const rows = postHoc.map(ph =>
    `${ph.group1} vs ${ph.group2},${ph.meanDifference?.toFixed(4) || ''},${ph.ci_lower?.toFixed(4) || ''},${ph.ci_upper?.toFixed(4) || ''},${ph.pValue.toFixed(4)},${ph.significanceLevel},${ph.effectSize?.toFixed(4) || ''}`
  );
  return [header, ...rows].join('\n');
}
