import { createContext, useContext, useState, ReactNode } from 'react';

export type WizardMode = 'guided' | 'expert' | 'reverse';
export type ResearchSetting = 'human' | 'preclinical' | 'invitro' | 'other';

export interface StudyState {
  step: number; 
  // Base
  researchSetting: ResearchSetting | null;
  mode: WizardMode;
  
  // Preclinical Screens A-G
  studyContext?: string;          // e.g. pharmacology efficacy, PK/PD
  speciesModel?: Record<string, any>;
  trueExperimentalUnit?: string;  // e.g. animal, cage, litter
  nestingStructure?: Record<string, any>; // pseudoreplication detection
  
  // Core Wizard routing
  endpointFamily: string | null;  // continuous, binary, ordinal, survival...
  designStructure: string | null; // two-group parallel, paired, cluster...
  numberOfGroups: number;         // For multi-arm/ANOVA designs
  studyObjective: string | null;  // superiority, non-inferiority, equivalence...
  analysisModel: string | null;   // t-test, log-rank, gees, proportional odds...
  effectMeasure: string | null;   // risk difference, cohen's d, HR, etc
  
  // Operating Characteristics
  sidedness: 'one-sided' | 'two-sided' | 'tost' | null;
  alpha: number;
  power: number;
  fixedN?: number;                // Used in mode C (Reverse feasibility)
  allocationRatio: number;
  attrition: number;
  
  // High-Resolution Modifiers
  multiplicity?: Record<string, any>;
  clusterOptions?: Record<string, any>;
  repeatedMeasuresOptions?: Record<string, any>;
  survivalOptions?: Record<string, any>;
  diagnosticOptions?: Record<string, any>;
  predictionOptions?: Record<string, any>;
  doseResponseOptions?: Record<string, any>;
  
  // Assumption Engine
  assumptions: Record<string, any>;
  evidenceSources: Record<string, string>; // Maps assumption key to evidence citation
  
  // Deliverables
  sensitivityPlan?: Record<string, any>;
  results?: Record<string, any>;
  warnings: string[];
  references: string[];
}

const initialState: StudyState = {
  step: 0,
  researchSetting: null,
  mode: 'guided',
  endpointFamily: null,
  designStructure: null,
  numberOfGroups: 2,
  studyObjective: null,
  analysisModel: null,
  effectMeasure: null,
  sidedness: 'two-sided',
  alpha: 0.05,
  power: 0.80,
  allocationRatio: 1,
  attrition: 0,
  assumptions: {},
  evidenceSources: {},
  warnings: [],
  references: []
};

interface WizardContextType {
  state: StudyState;
  updateState: (updates: Partial<StudyState>) => void;
  updateAssumption: (key: string, value: any, evidenceSource?: string) => void;
  addWarning: (warning: string) => void;
  clearWarnings: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepIndex: number) => void;
  resetWizard: () => void;
}

const PowerWizardContext = createContext<WizardContextType | undefined>(undefined);

export function PowerWizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StudyState>(initialState);

  const updateState = (updates: Partial<StudyState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const updateAssumption = (key: string, value: any, evidenceSource?: string) => {
    setState(prev => {
      const newAssumptions = { ...prev.assumptions, [key]: value };
      const newEvidenceSources = { ...prev.evidenceSources };
      if (evidenceSource) newEvidenceSources[key] = evidenceSource;
      return { ...prev, assumptions: newAssumptions, evidenceSources: newEvidenceSources };
    });
  };

  const addWarning = (warning: string) => {
    setState(prev => {
      if (!prev.warnings.includes(warning)) {
        return { ...prev, warnings: [...prev.warnings, warning] };
      }
      return prev;
    });
  };

  const clearWarnings = () => {
    setState(prev => ({ ...prev, warnings: [] }));
  };

  const nextStep = () => {
    setState(prev => ({ ...prev, step: prev.step + 1 }));
  };

  const prevStep = () => {
    setState(prev => ({ ...prev, step: Math.max(0, prev.step - 1) }));
  };

  const goToStep = (stepIndex: number) => {
    setState(prev => ({ ...prev, step: stepIndex }));
  };

  const resetWizard = () => {
    setState(initialState);
  };

  return (
    <PowerWizardContext.Provider value={{ state, updateState, updateAssumption, addWarning, clearWarnings, nextStep, prevStep, goToStep, resetWizard }}>
      {children}
    </PowerWizardContext.Provider>
  );
}

export function usePowerWizard() {
  const context = useContext(PowerWizardContext);
  if (context === undefined) {
    throw new Error('usePowerWizard must be used within a PowerWizardProvider');
  }
  return context;
}
