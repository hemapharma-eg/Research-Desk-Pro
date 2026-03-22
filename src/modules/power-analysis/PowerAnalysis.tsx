import React from 'react';
import { PowerWizardProvider, usePowerWizard } from './context/PowerWizardContext';
import { WizardStepper } from './components/WizardStepper';

import { Screen0Setting } from './components/Screen0Setting';
// Preclinical Block
import { ScreenAContext } from './components/preclinical/ScreenAContext';
import { ScreenBSpecies } from './components/preclinical/ScreenBSpecies';
import { ScreenCExperimentalUnit } from './components/preclinical/ScreenCExperimentalUnit';
import { ScreenDPseudoreplication } from './components/preclinical/ScreenDPseudoreplication';
import { ScreenEIntent } from './components/preclinical/ScreenEIntent';
import { ScreenFBiologicallyRelevantEffect } from './components/preclinical/ScreenFBiologicallyRelevantEffect';
import { ScreenGSpecialDesign } from './components/preclinical/ScreenGSpecialDesign';

// Shared / Clinical Block (Screens 1-4)
import { Screen1Endpoint } from './components/Screen1Endpoint';
import { Screen2Structure } from './components/Screen2Structure';
import { Screen3Objective } from './components/Screen3Objective';
import { Screen4Analysis } from './components/Screen4Analysis';

// Parameter Block (Screens 5-7)
import { Screen5Characteristics } from './components/Screen5Characteristics';
import { Screen6Assumptions } from './components/Screen6Assumptions';
import { Screen7Feasibility } from './components/Screen7Feasibility';

// Legacy Output Phase
import { Screen9Results } from './components/Screen9Results';

function WizardContent() {
  const { state, updateState } = usePowerWizard();

  const handleLoadTemplate = async () => {
    try {
      // Use the generic file open dialog
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        try {
          const parsed = JSON.parse(text);
          // Validate it looks like a StudyState
          if (parsed && typeof parsed === 'object' && 'researchSetting' in parsed) {
            // Reset step to 0 so user can review from beginning
            updateState({ ...parsed, step: 0 });
            alert('Template loaded successfully! Review your settings and proceed through the wizard.');
          } else {
            alert('Invalid template file. Please select a JSON file previously exported from Power Analysis.');
          }
        } catch {
          alert('Failed to parse JSON file. The file may be corrupted.');
        }
      };
      input.click();
    } catch (err) {
      console.error('Load template error:', err);
      alert('Error loading template.');
    }
  };

  // Dynamic Route Engine
  const getRoute = () => {
    const route = [Screen0Setting];
    
    if (state.researchSetting === 'preclinical') {
      route.push(
        ScreenAContext,
        ScreenBSpecies,
        ScreenCExperimentalUnit,
        ScreenDPseudoreplication,
        ScreenEIntent,
        ScreenFBiologicallyRelevantEffect,
        ScreenGSpecialDesign
      );
    }
    
    // Full guided wizard pipeline
    route.push(
      Screen1Endpoint,
      Screen2Structure,
      Screen3Objective,
      Screen4Analysis,
      Screen5Characteristics,
      Screen6Assumptions,
      Screen7Feasibility,
      Screen9Results
    );
    
    return route;
  };

  const route = getRoute();
  const CurrentComponent = route[state.step] || Screen0Setting;

  // Phase color theming based on step index
  const getPhaseInfo = () => {
    const s = state.step;
    const isPreclinical = state.researchSetting === 'preclinical';
    
    if (s === 0) return { label: 'Research Setting', color: '#6366F1', bg: '#EEF2FF' };
    if (isPreclinical && s >= 1 && s <= 7) return { label: 'Preclinical Rigor', color: '#059669', bg: '#ECFDF5' };
    const shared = s - (isPreclinical ? 7 : 0);
    if (shared === 1) return { label: 'Endpoint Family', color: '#2563EB', bg: '#EFF6FF' };
    if (shared === 2) return { label: 'Design Structure', color: '#0891B2', bg: '#ECFEFF' };
    if (shared === 3) return { label: 'Study Objective', color: '#7C3AED', bg: '#F5F3FF' };
    if (shared === 4) return { label: 'Analysis Model', color: '#C026D3', bg: '#FDF4FF' };
    if (shared === 5) return { label: 'Operating Characteristics', color: '#EA580C', bg: '#FFF7ED' };
    if (shared === 6) return { label: 'Mathematical Assumptions', color: '#DC2626', bg: '#FEF2F2' };
    if (shared === 7) return { label: 'Feasibility Constraints', color: '#CA8A04', bg: '#FEFCE8' };
    if (shared === 8) return { label: 'Results Dashboard', color: '#16A34A', bg: '#F0FDF4' };
    return { label: `Step ${s + 1}`, color: '#64748B', bg: '#F8FAFC' };
  };
  const phase = getPhaseInfo();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-bg-app)' }}>
      {/* Header */}
      <div style={{ borderBottom: `3px solid ${phase.color}`, backgroundColor: 'var(--color-bg-surface)', padding: 'var(--space-4) var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginBottom: '2px' }}>Power Analysis Studio</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: '#64748B' }}>Integrated Clinical & Preclinical Edition</span>
            <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold', backgroundColor: phase.bg, color: phase.color, border: `1px solid ${phase.color}30` }}>
              {phase.label}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button onClick={handleLoadTemplate} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', backgroundColor: 'var(--color-bg-app)', cursor: 'pointer', fontSize: 'var(--font-size-sm)', fontWeight: 'bold' }}>📂 Load Template</button>
        </div>
      </div>

      <div style={{ padding: 'var(--space-6) var(--space-6) 0 var(--space-6)' }}>
         <WizardStepper totalSteps={route.length} currentStep={state.step} setting={state.researchSetting} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)' }}>
         <CurrentComponent />
      </div>
    </div>
  );
}

export function PowerAnalysis() {
  return (
    <PowerWizardProvider>
      <WizardContent />
    </PowerWizardProvider>
  );
}
