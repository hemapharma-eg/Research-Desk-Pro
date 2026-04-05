import React, { createContext, useContext, useState, useEffect } from 'react';
import type { LicenseState, DemoUsageCounters } from './EntitlementEngine';
import { EntitlementEngine, DEFAULT_DEMO_POLICY } from './EntitlementEngine';

declare global {
  interface Window {
    electron?: {
      ipcRenderer: {
        invoke(channel: string, ...args: any[]): Promise<any>;
      }
    };
  }
}

interface LicenseContextType {
  isReady: boolean;
  deviceId: string | null;
  state: LicenseState;
  counters: DemoUsageCounters;
  entitlements: ReturnType<typeof EntitlementEngine.getEntitlements>;
  refreshLicenseState: () => Promise<void>;
  activateLicense: (data: any) => Promise<{success: boolean, error?: string}>;
  enterDemoMode: () => Promise<void>;
  trackUsage: (key: string, amount?: number) => Promise<void>;
}

const defaultState: LicenseState = {
  mode: 'demo',
  license_id: null,
  customer_name: null,
  organization: null,
  tier: 'demo',
  activation_date: null,
  last_verified_at: null,
  offline_grace_days: 7,
  reverify_after_hours: 72,
  entitlement_token: null
};

const defaultCounters: DemoUsageCounters = {
  projects_created: 0,
  saves_performed: 0,
  graphs_exported: 0,
  documents_exported: 0
};

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [state, setState] = useState<LicenseState>(defaultState);
  const [counters, setCounters] = useState<DemoUsageCounters>(defaultCounters);

  const refreshLicenseState = async () => {
    try {
      if (window.electron?.ipcRenderer) {
        const payload = await window.electron.ipcRenderer.invoke('license:get-state');
        if (payload) {
          setDeviceId(payload.deviceId);
          setState(payload.state || defaultState);
          setCounters(payload.counters || defaultCounters);
        }
      }
    } catch (err) {
      console.error("Failed to load license state", err);
    } finally {
      setIsReady(true);
    }
  };

  useEffect(() => {
    refreshLicenseState();
  }, []);

  const activateLicense = async (activationData: any) => {
    if (window.electron?.ipcRenderer) {
      const res = await window.electron.ipcRenderer.invoke('license:save-activation', activationData);
      if (res.success) {
        await refreshLicenseState();
        // Dispatch global event for other components unaware of React Context (if needed)
        window.dispatchEvent(new CustomEvent('LICENSE_ACTIVATED'));
      }
      return res;
    }
    return { success: false, error: 'IPC not available' };
  };

  const enterDemoMode = async () => {
    if (window.electron?.ipcRenderer) {
      await window.electron.ipcRenderer.invoke('license:enter-demo');
      await refreshLicenseState();
      window.dispatchEvent(new CustomEvent('DEMO_STARTED'));
    }
  };

  const trackUsage = async (key: string, amount = 1) => {
    if (window.electron?.ipcRenderer) {
      const newCount = await window.electron.ipcRenderer.invoke('license:track-usage', { key, amount });
      setCounters(prev => ({ ...prev, [key]: newCount }));
    }
  };

  const entitlements = EntitlementEngine.getEntitlements(state, counters, DEFAULT_DEMO_POLICY);

  return (
    <LicenseContext.Provider value={{
      isReady,
      deviceId,
      state,
      counters,
      entitlements,
      refreshLicenseState,
      activateLicense,
      enterDemoMode,
      trackUsage
    }}>
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
};
