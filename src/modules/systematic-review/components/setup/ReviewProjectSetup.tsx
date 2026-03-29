import React, { useState } from 'react';
import { useSystematicReview } from '../../context/SystematicReviewContext';
import type { ReviewType, Discipline } from '../../types/ReviewModels';

const REVIEW_TYPES: ReviewType[] = [
  'systematic review', 'scoping review', 'rapid review', 'umbrella review',
  'narrative structured review', 'meta-analysis support', 'evidence map', 'custom'
];

const DISCIPLINES: Discipline[] = [
  'pharmacy', 'medicine', 'nursing', 'public health', 'biomedical sciences',
  'pharmacology', 'toxicology', 'preclinical animal research',
  'in vitro/laboratory research', 'education research', 'other'
];

export function ReviewProjectSetup() {
  const { state, dispatch, logEvent } = useSystematicReview();
  const [activeTab, setActiveTab] = useState<'general' | 'question' | 'eligibility' | 'reasons'>('general');

  // If there's no project yet, we should render an initialization screen or assume the parent initialized it.
  // For the sake of this component, let's assume `state.project` is what we edit. 
  // If null, we show a "Create Project" button.
  
  if (!state.project) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>No Active Project</h2>
        <p>Create a new systematic review project to get started.</p>
        <button 
          className="sr-btn sr-btn-primary" 
          style={{ marginTop: 20 }}
          onClick={() => {
            dispatch({
              type: 'SET_PROJECT',
              payload: {
                id: crypto.randomUUID(),
                title: 'Untitled Review Project',
                shortTitle: '',
                type: 'systematic review',
                discipline: 'medicine',
                reviewers: [],
                leadReviewerId: null,
                adjudicatorId: null,
                startDate: new Date().toISOString().split('T')[0],
                protocolRegistration: '',
                funding: '',
                notes: '',
                pico: { p: '', i: '', c: '', o: '', statement: '' },
                inclusionCriteria: [],
                exclusionCriteria: [],
                publicationYearLimits: [null, null],
                languageLimits: [],
                documentTypeRestrictions: [],
                exclusionReasons: [
                  { id: crypto.randomUUID(), label: 'Wrong population', type: 'both' },
                  { id: crypto.randomUUID(), label: 'Wrong intervention', type: 'both' },
                  { id: crypto.randomUUID(), label: 'Wrong study design', type: 'both' },
                ],
                topicDictionaries: {},
                studyDesignDictionaries: {},
                settings: { screeningMode: 'single', blinding: true }
              }
            });
            logEvent('project_created', 'setup', undefined, 'Initialized new project');
          }}
        >
          Create New Review Project
        </button>
      </div>
    );
  }

  const p = state.project;

  const updateProject = (updates: Partial<typeof p>) => {
    dispatch({ type: 'SET_PROJECT', payload: { ...p, ...updates } });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', overflowY: 'auto' }}>
      
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--color-border-light)', marginBottom: '24px' }}>
        {[
          { id: 'general', label: '1. General Details' },
          { id: 'question', label: '2. Research Question' },
          { id: 'eligibility', label: '3. Eligibility Criteria' },
          { id: 'reasons', label: '4. Exclusion Reasons' }
        ].map(t => (
          <button
            key={t.id}
            className={`sr-nav-item ${activeTab === t.id ? 'active' : ''}`}
            style={{ padding: '8px 16px', border: 'none', background: 'transparent', borderBottom: activeTab === t.id ? '2px solid var(--color-accent-primary)' : 'none', borderRadius: 0, fontWeight: activeTab === t.id ? 'bold' : 'normal', color: activeTab === t.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}
            onClick={() => setActiveTab(t.id as any)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, paddingBottom: 60, maxWidth: 800 }}>
        {activeTab === 'general' && (
          <div className="sr-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6 }}>Review Title</label>
              <input value={p.title} onChange={e => updateProject({ title: e.target.value })} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid var(--color-border-light)' }} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6 }}>Short Title</label>
                <input value={p.shortTitle} onChange={e => updateProject({ shortTitle: e.target.value })} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid var(--color-border-light)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6 }}>Start Date</label>
                <input type="date" value={p.startDate} onChange={e => updateProject({ startDate: e.target.value })} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid var(--color-border-light)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6 }}>Review Type</label>
                <select value={p.type} onChange={e => updateProject({ type: e.target.value as ReviewType })} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid var(--color-border-light)' }}>
                  {REVIEW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6 }}>Discipline</label>
                <select value={p.discipline} onChange={e => updateProject({ discipline: e.target.value as Discipline })} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid var(--color-border-light)' }}>
                  {DISCIPLINES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6 }}>Protocol Registration (PROSPERO / OSF)</label>
                <input value={p.protocolRegistration} onChange={e => updateProject({ protocolRegistration: e.target.value })} placeholder="e.g. CRD420..." style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid var(--color-border-light)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6 }}>Screening Mode</label>
                <select value={p.settings.screeningMode} onChange={e => updateProject({ settings: { ...p.settings, screeningMode: e.target.value as any } })} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid var(--color-border-light)' }}>
                  <option value="single">Single Reviewer (Auto-advance)</option>
                  <option value="dual independent">Dual Independent</option>
                  <option value="dual with adjudication">Dual with Adjudication</option>
                </select>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'question' && (
          <div className="sr-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>Define your research framework to guide the relevance scoring algorithms.</p>
            
            {/* PICO Framework */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--color-bg-subtle)', padding: 16, borderRadius: 8 }}>
              <h3 style={{ margin: 0 }}>PICO Framework</h3>
              <div>
                <label style={{ fontWeight: 600, fontSize: 13 }}>Population (P)</label>
                <input value={p.pico.p} onChange={e => updateProject({ pico: { ...p.pico, p: e.target.value }})} style={{ width: '100%', padding: 6, marginTop: 4, border: '1px solid var(--color-border-light)', borderRadius: 4 }} />
              </div>
              <div>
                <label style={{ fontWeight: 600, fontSize: 13 }}>Intervention/Exposure (I)</label>
                <input value={p.pico.i} onChange={e => updateProject({ pico: { ...p.pico, i: e.target.value }})} style={{ width: '100%', padding: 6, marginTop: 4, border: '1px solid var(--color-border-light)', borderRadius: 4 }} />
              </div>
              <div>
                <label style={{ fontWeight: 600, fontSize: 13 }}>Comparator (C)</label>
                <input value={p.pico.c} onChange={e => updateProject({ pico: { ...p.pico, c: e.target.value }})} style={{ width: '100%', padding: 6, marginTop: 4, border: '1px solid var(--color-border-light)', borderRadius: 4 }} />
              </div>
              <div>
                <label style={{ fontWeight: 600, fontSize: 13 }}>Outcome (O)</label>
                <input value={p.pico.o} onChange={e => updateProject({ pico: { ...p.pico, o: e.target.value }})} style={{ width: '100%', padding: 6, marginTop: 4, border: '1px solid var(--color-border-light)', borderRadius: 4 }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6 }}>Summarized Statement</label>
              <textarea 
                value={p.pico.statement} 
                onChange={e => updateProject({ pico: { ...p.pico, statement: e.target.value }})}
                rows={4}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid var(--color-border-light)', fontFamily: 'inherit' }} 
              />
            </div>
          </div>
        )}

        {activeTab === 'eligibility' && (
          <div className="sr-card" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 'bold' }}>Inclusion Criteria</span>
                <button className="sr-btn sr-btn-primary" onClick={() => updateProject({ inclusionCriteria: [...p.inclusionCriteria, ''] })}>+ Add Criterion</button>
              </div>
              {p.inclusionCriteria.map((crit, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input value={crit} onChange={e => {
                    const newArr = [...p.inclusionCriteria];
                    newArr[i] = e.target.value;
                    updateProject({ inclusionCriteria: newArr });
                  }} style={{ flex: 1, padding: 6, border: '1px solid var(--color-border-light)', borderRadius: 4 }} />
                  <button className="sr-btn" onClick={() => updateProject({ inclusionCriteria: p.inclusionCriteria.filter((_, idx) => idx !== i) })}>x</button>
                </div>
              ))}
              {p.inclusionCriteria.length === 0 && <span style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>No inclusion criteria defined.</span>}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-light)' }} />

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 'bold' }}>Exclusion Criteria</span>
                <button className="sr-btn sr-btn-primary" onClick={() => updateProject({ exclusionCriteria: [...p.exclusionCriteria, ''] })}>+ Add Criterion</button>
              </div>
              {p.exclusionCriteria.map((crit, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input value={crit} onChange={e => {
                    const newArr = [...p.exclusionCriteria];
                    newArr[i] = e.target.value;
                    updateProject({ exclusionCriteria: newArr });
                  }} style={{ flex: 1, padding: 6, border: '1px solid var(--color-border-light)', borderRadius: 4 }} />
                  <button className="sr-btn" onClick={() => updateProject({ exclusionCriteria: p.exclusionCriteria.filter((_, idx) => idx !== i) })}>x</button>
                </div>
              ))}
              {p.exclusionCriteria.length === 0 && <span style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>No exclusion criteria defined.</span>}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6 }}>Publication Year Limit</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="number" placeholder="From" value={p.publicationYearLimits[0] || ''} onChange={e => updateProject({ publicationYearLimits: [e.target.value ? Number(e.target.value) : null, p.publicationYearLimits[1]] })} style={{ width: '80px', padding: 6 }} />
                  <span>to</span>
                  <input type="number" placeholder="To" value={p.publicationYearLimits[1] || ''} onChange={e => updateProject({ publicationYearLimits: [p.publicationYearLimits[0], e.target.value ? Number(e.target.value) : null] })} style={{ width: '80px', padding: 6 }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6 }}>Language Restrictions (comma separated)</label>
                <input value={p.languageLimits.join(', ')} onChange={e => updateProject({ languageLimits: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="e.g. English, French" style={{ width: '100%', padding: 6, border: '1px solid var(--color-border-light)' }} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reasons' && (
          <div className="sr-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>Define structured exclusion reasons used during screening.</p>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--color-border-light)' }}>
                  <th style={{ padding: 8 }}>Label</th>
                  <th style={{ padding: 8 }}>Available At</th>
                  <th style={{ padding: 8 }}>Requires Note</th>
                  <th style={{ padding: 8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {p.exclusionReasons.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                    <td style={{ padding: 8 }}>
                      <input value={r.label} onChange={e => {
                        updateProject({ exclusionReasons: p.exclusionReasons.map(x => x.id === r.id ? { ...x, label: e.target.value } : x) })
                      }} style={{ width: '100%', padding: 4, border: 'none', background: 'transparent' }} />
                    </td>
                    <td style={{ padding: 8 }}>
                      <select value={r.type} onChange={e => {
                        updateProject({ exclusionReasons: p.exclusionReasons.map(x => x.id === r.id ? { ...x, type: e.target.value as any } : x) })
                      }} style={{ padding: 4, border: 'none', background: 'transparent' }}>
                        <option value="both">Both Stages</option>
                        <option value="title-abstract">Title/Abstract only</option>
                        <option value="full-text">Full Text only</option>
                      </select>
                    </td>
                    <td style={{ padding: 8 }}>
                      <input type="checkbox" checked={r.requiresNote || false} onChange={e => {
                        updateProject({ exclusionReasons: p.exclusionReasons.map(x => x.id === r.id ? { ...x, requiresNote: e.target.checked } : x) })
                      }} />
                    </td>
                    <td style={{ padding: 8 }}>
                      <button className="sr-btn" onClick={() => updateProject({ exclusionReasons: p.exclusionReasons.filter(x => x.id !== r.id) })}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <button className="sr-btn sr-btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => {
              updateProject({ exclusionReasons: [...p.exclusionReasons, { id: crypto.randomUUID(), label: 'New Reason', type: 'both', requiresNote: false }] })
            }}>
              + Add Reason
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
