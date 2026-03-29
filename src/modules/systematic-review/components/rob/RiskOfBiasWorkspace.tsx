import { useState, useEffect } from 'react';
import { useSystematicReview } from '../../context/SystematicReviewContext';

// Hardcoded Tools for Demonstration
const ROB_TOOLS = {
  cochrane2: {
    name: 'Cochrane RoB 2.0',
    domains: [
      { id: 'd1', label: 'Bias arising from the randomization process' },
      { id: 'd2', label: 'Bias due to deviations from intended interventions' },
      { id: 'd3', label: 'Bias due to missing outcome data' },
      { id: 'd4', label: 'Bias in measurement of the outcome' },
      { id: 'd5', label: 'Bias in selection of the reported result' }
    ]
  },
  newcastle: {
    name: 'Newcastle-Ottawa Scale (Cohort)',
    domains: [
      { id: 'd1', label: 'Selection: Representativeness of cohort' },
      { id: 'd2', label: 'Selection: Ascertainment of exposure' },
      { id: 'd3', label: 'Comparability: Based on design or analysis' },
      { id: 'd4', label: 'Outcome: Assessment of outcome' },
      { id: 'd5', label: 'Outcome: Adequacy of follow up' }
    ]
  }
};

type RobScore = 'Low' | 'High' | 'Some Concerns' | 'Unclear';
const SCORE_COLORS = {
  'Low': '#c8e6c9', // green
  'High': '#ffccbc', // red
  'Some Concerns': '#fff9c4', // yellow
  'Unclear': '#eeeeee' // grey
};

export function RiskOfBiasWorkspace() {
  const { state } = useSystematicReview();
  const [selectedTool, setSelectedTool] = useState<'cochrane2' | 'newcastle'>('cochrane2');
  const [selectedRefId, setSelectedRefId] = useState<string | null>(null);
  
  const [domainScores, setDomainScores] = useState<Record<string, RobScore>>({});
  const [overallRisk, setOverallRisk] = useState<RobScore>('Unclear');

  const includedRecords = state.records.filter(r => r.userLabels?.includes('Included') || r.finalDisposition === 'included' || true);

  useEffect(() => {
    if (selectedRefId) {
      loadAssessment(selectedRefId);
    }
  }, [selectedRefId, selectedTool]);

  const loadAssessment = async (refId: string) => {
    try {
      const res = await window.api.getRobAssessments(refId);
      if (res.success && res.data) {
        const assessment = res.data.find(a => a.tool_used === selectedTool);
        if (assessment) {
          setDomainScores(JSON.parse(assessment.domain_scores_json));
          setOverallRisk(assessment.overall_risk as RobScore);
        } else {
          setDomainScores({});
          setOverallRisk('Unclear');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveAssessment = async () => {
    if (!selectedRefId) return;
    try {
      const res = await window.api.saveRobAssessment({
        ref_id: selectedRefId,
        reviewer_id: state.activeReviewer?.id || null,
        tool_used: selectedTool,
        domain_scores_json: JSON.stringify(domainScores),
        overall_risk: overallRisk
      });
      if (res.success) {
        alert('Assessment saved successfully!');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to save assessment');
    }
  };

  const tool = ROB_TOOLS[selectedTool];
  const activeRecord = includedRecords.find(r => r.id === selectedRefId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', backgroundColor: 'var(--bg-panel)', padding: '10px 20px', borderBottom: '1px solid var(--border-color)' }}>
        <h4 style={{ margin: 0 }}>Risk of Bias Assessment</h4>
        <select 
          value={selectedTool} 
          onChange={e => setSelectedTool(e.target.value as any)}
          className="sr-input"
          style={{ minWidth: '200px' }}
        >
          <option value="cochrane2">Cochrane RoB 2.0</option>
          <option value="newcastle">Newcastle-Ottawa Scale</option>
        </select>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left pane: Reference List */}
        <div style={{ width: '300px', backgroundColor: 'var(--bg-panel)', borderRight: '1px solid var(--border-color)', overflowY: 'auto' }}>
          <div style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
            STUDIES TO ASSESS ({includedRecords.length})
          </div>
          {includedRecords.map(r => (
            <div 
              key={r.id}
              onClick={() => setSelectedRefId(r.id)}
              style={{
                padding: '12px 15px',
                borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer',
                backgroundColor: selectedRefId === r.id ? 'var(--bg-active)' : 'transparent'
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)' }}>{r.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>{r.authors} • {r.year}</div>
            </div>
          ))}
        </div>

        {/* Center/Right pane: RoB Form */}
        <div style={{ flex: 1, backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'center', overflowY: 'auto' }}>
          {!selectedRefId ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#888' }}>
              Select a study from the left panel to begin.
            </div>
          ) : (
            <div style={{ width: '100%', maxWidth: '800px', margin: '30px', backgroundColor: 'var(--bg-panel)', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <h2 style={{ marginTop: 0 }}>{tool.name}</h2>
              <p style={{ color: 'var(--color-text-secondary)' }}><strong>Assessing:</strong> {activeRecord?.title}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                {tool.domains.map((d, index) => (
                  <div key={d.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '15px', backgroundColor: 'var(--bg-default)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 'bold' }}>D{index + 1}: {d.label}</div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {['Low', 'Some Concerns', 'High', 'Unclear'].map(sc => (
                        <button
                          key={sc}
                          onClick={() => setDomainScores({...domainScores, [d.id]: sc as RobScore})}
                          style={{
                            padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer',
                            backgroundColor: domainScores[d.id] === sc ? SCORE_COLORS[sc as RobScore] : '#fff',
                            fontWeight: domainScores[d.id] === sc ? 'bold' : 'normal'
                          }}
                        >
                          {sc}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid var(--border-color)' }}>
                  <h3 style={{ margin: '0 0 15px 0' }}>Overall Risk of Bias</h3>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {['Low', 'Some Concerns', 'High', 'Unclear'].map(sc => (
                      <button
                        key={sc}
                        onClick={() => setOverallRisk(sc as RobScore)}
                        style={{
                          padding: '10px 16px', borderRadius: '4px', border: '1px solid #aaa', cursor: 'pointer',
                          backgroundColor: overallRisk === sc ? SCORE_COLORS[sc as RobScore] : '#fff',
                          fontWeight: overallRisk === sc ? 'bold' : 'normal',
                          fontSize: '15px'
                        }}
                      >
                        {sc}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="sr-btn sr-btn-primary" style={{ padding: '10px 20px', fontSize: '16px' }} onClick={handleSaveAssessment}>
                    Save Assessment
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
