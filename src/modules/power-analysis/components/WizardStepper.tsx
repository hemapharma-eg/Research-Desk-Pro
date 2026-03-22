import React from 'react';
import { usePowerWizard } from '../context/PowerWizardContext';

interface StepperProps {
  totalSteps?: number;
  currentStep?: number;
  setting?: string | null;
}

export function WizardStepper({ totalSteps = 4, currentStep = 0, setting }: StepperProps) {
  // If the total steps are massive (e.g. 12 steps for preclinical), we just render a segmented progress bar
  // rather than trying to fit 12 distinct text labels on mobile.

  const progressPercentage = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0;

  return (
    <div style={{ marginBottom: 'var(--space-6)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'bold', color: '#334155' }}>
          {setting === 'preclinical' ? 'Preclinical Flow Activation' : 'Clinical / Standard Flow'}
        </span>
        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'bold', color: 'var(--color-accent-primary)' }}>
          Step {currentStep + 1} of {totalSteps}
        </span>
      </div>

      <div style={{ 
        width: '100%', 
        height: '8px', 
        backgroundColor: 'var(--color-bg-hover)', 
        borderRadius: 'var(--radius-full)', 
        overflow: 'hidden',
        display: 'flex'
      }}>
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <div 
            key={idx}
            style={{ 
              flex: 1, 
              height: '100%', 
              backgroundColor: idx <= currentStep ? 'var(--color-accent-primary)' : 'transparent',
              borderRight: idx < totalSteps - 1 ? '1px solid var(--color-bg-app)' : 'none',
              transition: 'background-color 0.3s ease'
            }} 
          />
        ))}
      </div>

    </div>
  );
}
