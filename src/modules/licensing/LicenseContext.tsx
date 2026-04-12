import React, { createContext, useContext, useState, useEffect } from 'react';
import type { LicenseState, DemoUsageCounters } from './EntitlementEngine';
import { EntitlementEngine, DEFAULT_DEMO_POLICY } from './EntitlementEngine';

declare global {
  interface Window {
    api: any;
  }
}

interface LicenseContextType {
  isReady: boolean;
  deviceId: string | null;
  state: LicenseState;
  counters: DemoUsageCounters;
  entitlements: ReturnType<typeof EntitlementEngine.getEntitlements>;
  refreshLicenseState: () => Promise<any>;
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
    let currentData = { deviceId: null as string | null, state: defaultState, counters: defaultCounters };
    try {
      if (window.api && window.api.license) {
        const payload = await window.api.license.getState();
        if (payload) {
          currentData = { deviceId: payload.deviceId, state: payload.state || defaultState, counters: payload.counters || defaultCounters };
        }
      } else {
        // Web Browser Fallback
        let webDeviceId = localStorage.getItem('web_device_id');
        if (!webDeviceId) {
          webDeviceId = 'web-browser-' + Math.random().toString(36).substring(2, 12);
          localStorage.setItem('web_device_id', webDeviceId);
        }
        currentData.deviceId = webDeviceId;
        
        const storedState = localStorage.getItem('web_license_state');
        if (storedState) currentData.state = JSON.parse(storedState);
        
        const storedCounters = localStorage.getItem('web_demo_counters');
        if (storedCounters) currentData.counters = JSON.parse(storedCounters);
      }
      setDeviceId(currentData.deviceId);
      setState(currentData.state);
      setCounters(currentData.counters);
    } catch (err) {
      console.error("Failed to load license state", err);
    } finally {
      setIsReady(true);
    }
    return currentData;
  };

  useEffect(() => {
    const startup = async () => {
      const data = await refreshLicenseState();
      
      // Perform silent background sync if we have an active license token
      if (data.state.mode === 'licensed_active' && data.state.entitlement_token && data.deviceId) {
        try {
          const LICENSE_SERVER = import.meta.env.VITE_LICENSE_SERVER_URL || 'http://localhost:4000';
          const res = await fetch(`${LICENSE_SERVER}/api/license/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              entitlementToken: data.state.entitlement_token,
              deviceId: data.deviceId,
              appVersion: '1.0.0'
            })
          });
          const serverData = await res.json();
          // If server explicitly revokes it
          if (!serverData.success && (serverData.status === 'license_revoked' || serverData.status === 'license_invalid')) {
            console.warn('License was revoked centrally. Downgrading to Demo Mode.');
            await enterDemoMode();
          } else if (serverData.success && serverData.entitlementToken) {
            // Update local token successfully
            if (window.api && window.api.license) {
              await window.api.license.refreshVerification({
                entitlementToken: serverData.entitlementToken,
                offlineGraceDays: serverData.offlineGraceDays || 30,
                reverifyAfterHours: serverData.reverifyAfterHours || 72
              });
              await refreshLicenseState();
            } else {
              const newState = { 
                ...data.state, 
                entitlement_token: serverData.entitlementToken, 
                last_verified_at: new Date().toISOString() 
              };
              localStorage.setItem('web_license_state', JSON.stringify(newState));
              setState(newState);
            }
          }
        } catch (e) {
          console.log('Silent sync skipped: Working offline or server unreachable.');
        }
      }
    };
    startup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activateLicense = async (activationData: any) => {
    if (window.api && window.api.license) {
      const res = await window.api.license.saveActivation(activationData);
      if (res.success) {
        await refreshLicenseState();
        // Dispatch global event for other components unaware of React Context (if needed)
        window.dispatchEvent(new CustomEvent('LICENSE_ACTIVATED'));
      }
      return res;
    }

    // Web Browser Fallback
    const newState = {
      ...state,
      mode: 'licensed_active' as const,
      license_id: activationData.licenseId,
      customer_name: activationData.licensedToName,
      organization: activationData.licensedToOrganization,
      tier: activationData.tier,
      activation_date: activationData.activationDate,
      last_verified_at: new Date().toISOString(),
      offline_grace_days: activationData.offlineGraceDays,
      reverify_after_hours: activationData.reverifyAfterHours,
      entitlement_token: activationData.entitlementToken
    };
    localStorage.setItem('web_license_state', JSON.stringify(newState));
    setState(newState);
    window.dispatchEvent(new CustomEvent('LICENSE_ACTIVATED'));
    return { success: true };
  };

  const enterDemoMode = async () => {
    if (window.api && window.api.license) {
      await window.api.license.enterDemo();
      await refreshLicenseState();
      window.dispatchEvent(new CustomEvent('DEMO_STARTED'));
      return;
    }

    // Web Browser Fallback
    const newState = { ...defaultState };
    localStorage.setItem('web_license_state', JSON.stringify(newState));
    setState(newState);
    window.dispatchEvent(new CustomEvent('DEMO_STARTED'));
  };

  const trackUsage = async (key: string, amount = 1) => {
    if (window.api && window.api.license) {
      const newCount = await window.api.license.trackUsage(key, amount);
      setCounters(prev => ({ ...prev, [key]: newCount }));
      return;
    }

    // Web Browser Fallback
    setCounters(prev => {
      const next = { ...prev, [key]: (prev[key as keyof DemoUsageCounters] || 0) + amount };
      localStorage.setItem('web_demo_counters', JSON.stringify(next));
      return next;
    });
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
