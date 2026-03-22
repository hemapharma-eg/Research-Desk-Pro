import React from 'react';
import { usePowerWizard, type ResearchSetting } from '../context/PowerWizardContext';

export function Screen0Setting() {
  const { state, updateState, nextStep } = usePowerWizard();

  const handleSelectSetting = (setting: ResearchSetting) => {
    updateState({ researchSetting: setting });
  };

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-2)' }}>
        <h2 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: '#0F172A', marginBottom: 'var(--space-2)' }}>
          Research Setting & Context
        </h2>
        <p style={{ fontSize: '1.05rem', color: '#334155', maxWidth: '650px', margin: '0 auto', lineHeight: 1.6, fontWeight: '500' }}>
          Sample size formulas must adapt to the true experimental unit. Please identify the primary domain of your planned study.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
        
        {/* Human Clinical */}
        <button 
          onClick={() => handleSelectSetting('human')}
          style={{ 
            padding: 'var(--space-5)', 
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)',
            backgroundColor: 'var(--color-bg-surface)', 
            border: state.researchSetting === 'human' ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border-light)',
            borderRadius: 'var(--radius-xl)', 
            cursor: 'pointer',
            textAlign: 'center',
            boxShadow: state.researchSetting === 'human' ? '0 4px 12px rgba(79, 70, 229, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
            transform: state.researchSetting === 'human' ? 'translateY(-2px)' : 'none',
            transition: 'all 0.2s ease-in-out'
          }}
        >
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-primary)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', color: '#1E293B' }}>Human / Clinical</h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: '#475569', fontWeight: '500' }}>RCTs, observational clinical cohorts, diagnostic accuracy studies, epidemiology.</p>
        </button>

        {/* Preclinical Animal */}
        <button 
          onClick={() => handleSelectSetting('preclinical')}
          style={{ 
            padding: 'var(--space-5)', 
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)',
            backgroundColor: 'var(--color-bg-surface)', 
            border: state.researchSetting === 'preclinical' ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border-light)',
            borderRadius: 'var(--radius-xl)', 
            cursor: 'pointer',
            textAlign: 'center',
            boxShadow: state.researchSetting === 'preclinical' ? '0 4px 12px rgba(79, 70, 229, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
            transform: state.researchSetting === 'preclinical' ? 'translateY(-2px)' : 'none',
            transition: 'all 0.2s ease-in-out'
          }}
        >
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-primary)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path></svg>
          </div>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', color: '#1E293B' }}>Experimental / Preclinical</h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: '#475569', fontWeight: '500' }}>In-vivo pharmacology, toxicology, animal behavioral models, disease mechanisms.</p>
          <div style={{ marginTop: 'auto', backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>Mandatory ARRIVE / NC3Rs Logging</div>
        </button>

        {/* In vitro */}
        <button 
          onClick={() => handleSelectSetting('invitro')}
          style={{ 
            padding: 'var(--space-5)', 
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)',
            backgroundColor: 'var(--color-bg-surface)', 
            border: state.researchSetting === 'invitro' ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border-light)',
            borderRadius: 'var(--radius-xl)', 
            cursor: 'pointer',
            textAlign: 'center',
            boxShadow: state.researchSetting === 'invitro' ? '0 4px 12px rgba(79, 70, 229, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
            transform: state.researchSetting === 'invitro' ? 'translateY(-2px)' : 'none',
            transition: 'all 0.2s ease-in-out'
          }}
        >
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-primary)' }}>
             <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21h6"></path><path d="M10.25 15.68c-.62-.35-1.12-.9-1.39-1.57L4 4v-2h16v2l-4.86 10.11c-.27.67-.77 1.22-1.39 1.57A3.99 3.99 0 0 1 12 17a3.99 3.99 0 0 1-1.75-1.32z"></path><path d="M9 2v2"></path><path d="M15 2v2"></path></svg>
          </div>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', color: '#1E293B' }}>In Vitro / Ex Vivo</h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: '#475569', fontWeight: '500' }}>Cell lines, isolated tissues, molecular biology assays, biochemical assays.</p>
        </button>

      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
        <button 
          onClick={nextStep}
          disabled={!state.researchSetting}
          style={{ 
            padding: 'var(--space-3) var(--space-8)', 
            backgroundColor: state.researchSetting ? 'var(--color-accent-primary)' : 'var(--color-bg-hover)', 
            color: state.researchSetting ? 'white' : '#94A3B8', 
            borderRadius: 'var(--radius-full)', 
            border: 'none', 
            fontWeight: 'bold',
            fontSize: 'var(--font-size-md)',
            cursor: state.researchSetting ? 'pointer' : 'not-allowed',
            boxShadow: state.researchSetting ? '0 4px 6px rgba(79, 70, 229, 0.3)' : 'none'
          }}
        >
          Initialize Studio Mode →
        </button>
      </div>

    </div>
  );
}
