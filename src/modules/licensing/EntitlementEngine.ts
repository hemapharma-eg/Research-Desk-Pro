export interface LicenseState {
  mode: 'demo' | 'licensed_active' | 'offline_grace' | 'offline_grace_expired';
  license_id: string | null;
  customer_name: string | null;
  organization: string | null;
  tier: string;
  activation_date: string | null;
  last_verified_at: string | null;
  offline_grace_days: number;
  reverify_after_hours: number;
  entitlement_token: string | null;
}

export interface DemoUsageCounters {
  projects_created: number;
  saves_performed: number;
  graphs_exported: number;
  documents_exported: number;
  [key: string]: number;
}

// Ideally fetched from server config or hardcoded defaults
export const DEFAULT_DEMO_POLICY = {
  demoProjectLimit: 3,
  demoSaveLimit: 50,
  demoReferenceLimit: 100,
  demoScreeningLimit: 50,
  watermarkEnabled: true,
  maxDemoExportResolution: 'preview_only',
  allowDemoAdvancedExports: false,
  allowDemoPremiumTemplates: false,
};

export class EntitlementEngine {
  static getEntitlements(state: LicenseState, counters: DemoUsageCounters, policy = DEFAULT_DEMO_POLICY) {
    // For perpetual licenses, ALL non-demo modes grant full access.
    // The server can explicitly revoke by setting mode back to 'demo'.
    const isFull = state.mode === 'licensed_active' || state.mode === 'offline_grace' || state.mode === 'offline_grace_expired';
    
    if (isFull) {
      return {
        canCreateProject: true,
        canSaveProject: true,
        remainingProjectCount: Infinity,
        remainingSaveCount: Infinity,
        canExportWithoutWatermark: true,
        maxExportResolution: 'full',
        canUseAdvancedExports: true,
        maxReferenceLibrarySize: Infinity,
        maxScreeningArticleCount: Infinity,
        canUsePremiumTemplates: true,
        canUseAllPremiumFeatures: true,
        showDemoBanner: false
      };
    }

    // Demo Mode constraints
    const projCount = counters.projects_created || 0;
    const saveCount = counters.saves_performed || 0;

    return {
      canCreateProject: projCount < policy.demoProjectLimit,
      canSaveProject: saveCount < policy.demoSaveLimit,
      remainingProjectCount: Math.max(0, policy.demoProjectLimit - projCount),
      remainingSaveCount: Math.max(0, policy.demoSaveLimit - saveCount),
      canExportWithoutWatermark: !policy.watermarkEnabled,
      maxExportResolution: policy.maxDemoExportResolution,
      canUseAdvancedExports: policy.allowDemoAdvancedExports,
      maxReferenceLibrarySize: policy.demoReferenceLimit,
      maxScreeningArticleCount: policy.demoScreeningLimit,
      canUsePremiumTemplates: policy.allowDemoPremiumTemplates,
      canUseAllPremiumFeatures: false,
      showDemoBanner: true
    };
  }
}
