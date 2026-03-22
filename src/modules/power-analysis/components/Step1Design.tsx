import { usePowerWizard, type StudyType, type TestFamily, type TestDesign } from '../context/PowerWizardContext';

export function Step1Design() {
  const { state, updateState, nextStep } = usePowerWizard();

  const isComplete = state.studyType && state.testFamily && state.testDesign;

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-2)' }}>Step 1: Study Design & Framework</h2>
        <p style={{ color: '#334155', fontSize: 'var(--font-size-sm)' }}>Select the core architecture and statistical framework for your study.</p>
      </div>

      {/* 1. Study Type */}
      <div>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>1. What type of study are you conducting?</label>
        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          {(['superiority', 'equivalence', 'non-inferiority'] as StudyType[]).map(type => (
            <button
              key={type}
              onClick={() => updateState({ studyType: type })}
              style={{
                flex: 1,
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                border: state.studyType === type ? '2px solid var(--color-accent-primary)' : '2px solid var(--color-border-light)',
                backgroundColor: state.studyType === type ? 'rgba(79, 70, 229, 0.05)' : 'var(--color-bg-surface)',
                cursor: 'pointer',
                textAlign: 'center',
                fontWeight: state.studyType === type ? 'bold' : 'normal'
              }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Test Family */}
      <div>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>2. What statistical family does your analysis belong to?</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          {[
            { id: 't-test', label: 'T-Tests (Means)', desc: 'Comparing 1 or 2 groups on a continuous outcome.' },
            { id: 'anova', label: 'ANOVA', desc: 'Comparing 3+ groups on a continuous outcome.' },
            { id: 'proportion', label: 'Proportions / Chi-Square', desc: 'Comparing categorical rates or event frequencies.' },
            { id: 'correlation', label: 'Correlation', desc: 'Association between two continuous variables.' }
          ].map(fam => (
            <button
              key={fam.id}
              onClick={() => updateState({ testFamily: fam.id as TestFamily, testDesign: '' })} // Reset design on family change
              style={{
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                border: state.testFamily === fam.id ? '2px solid var(--color-accent-primary)' : '2px solid var(--color-border-light)',
                backgroundColor: state.testFamily === fam.id ? 'rgba(79, 70, 229, 0.05)' : 'var(--color-bg-surface)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ fontWeight: state.testFamily === fam.id ? 'bold' : 'normal', marginBottom: 'var(--space-1)' }}>{fam.label}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: '#475569' }}>{fam.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Test Design */}
      {state.testFamily && (
        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>3. Specific Design</label>
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            {state.testFamily === 't-test' && ['one-sample', 'two-sample-independent', 'paired'].map(d => (
              <DesignButton key={d} id={d} current={state.testDesign} onClick={d => updateState({ testDesign: d as TestDesign })} />
            ))}
            {state.testFamily === 'proportion' && ['one-sample', 'two-sample-independent'].map(d => (
               <DesignButton key={d} id={d} current={state.testDesign} onClick={d => updateState({ testDesign: d as TestDesign })} />
            ))}
            {state.testFamily === 'anova' && (
               <DesignButton id="one-way" label="One-Way ANOVA" current={state.testDesign || 'one-way'} onClick={() => updateState({ testDesign: 'one-way' as any })} />
            )}
            {state.testFamily === 'correlation' && (
               <DesignButton id="pearson" label="Pearson Correlation" current={state.testDesign || 'pearson'} onClick={() => updateState({ testDesign: 'pearson' as any })} />
            )}
          </div>
        </div>
      )}

      {/* Footer Nav */}
      <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={nextStep}
          disabled={!isComplete}
          style={{ 
            padding: 'var(--space-3) var(--space-6)', 
            backgroundColor: isComplete ? 'var(--color-accent-primary)' : 'var(--color-bg-hover)', 
            color: isComplete ? 'white' : 'var(--color-text-tertiary)', 
            borderRadius: 'var(--radius-md)', 
            border: 'none', 
            fontWeight: 'bold',
            cursor: isComplete ? 'pointer' : 'not-allowed'
          }}
        >
          Next: Test Parameters →
        </button>
      </div>

    </div>
  );
}

function DesignButton({ id, label, current, onClick }: { id: string, label?: string, current: string, onClick: (id: string) => void }) {
  const displayLabel = label || id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return (
    <button
      onClick={() => onClick(id)}
      style={{
        padding: 'var(--space-2) var(--space-4)',
        borderRadius: 'var(--radius-full)',
        border: current === id ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border-strong)',
        backgroundColor: current === id ? 'var(--color-accent-primary)' : 'transparent',
        color: current === id ? 'white' : 'var(--color-text-primary)',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: 'var(--font-size-sm)'
      }}
    >
      {displayLabel}
    </button>
  );
}
