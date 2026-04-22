const appDb = require('./appDb');

class LicenseStorageService {
  constructor() {
    this.db = appDb.getDb();
  }

  getDeviceUuid() {
    const row = this.db.prepare(`SELECT value FROM app_settings WHERE key = 'device_uuid'`).get();
    return row ? row.value : null;
  }

  getLicenseState() {
    const row = this.db.prepare(`SELECT * FROM license_state WHERE id = 1`).get();
    return row;
  }

  updateLicenseState(updates) {
    const current = this.getLicenseState();
    
    const mode = updates.mode !== undefined ? updates.mode : current.mode;
    const license_id = updates.license_id !== undefined ? updates.license_id : current.license_id;
    const customer_name = updates.customer_name !== undefined ? updates.customer_name : current.customer_name;
    const organization = updates.organization !== undefined ? updates.organization : current.organization;
    const tier = updates.tier !== undefined ? updates.tier : current.tier;
    const activation_date = updates.activation_date !== undefined ? updates.activation_date : current.activation_date;
    const last_verified_at = updates.last_verified_at !== undefined ? updates.last_verified_at : current.last_verified_at;
    const offline_grace_days = updates.offline_grace_days !== undefined ? updates.offline_grace_days : current.offline_grace_days;
    const reverify_after_hours = updates.reverify_after_hours !== undefined ? updates.reverify_after_hours : current.reverify_after_hours;
    const entitlement_token = updates.entitlement_token !== undefined ? updates.entitlement_token : current.entitlement_token;

    const stmt = this.db.prepare(`
      UPDATE license_state
      SET mode = ?, license_id = ?, customer_name = ?, organization = ?, tier = ?,
          activation_date = ?, last_verified_at = ?, offline_grace_days = ?,
          reverify_after_hours = ?, entitlement_token = ?
      WHERE id = 1
    `);

    stmt.run(mode, license_id, customer_name, organization, tier, 
             activation_date, last_verified_at, offline_grace_days, 
             reverify_after_hours, entitlement_token);
             
    return this.getLicenseState();
  }

  // --- DEMO COUNTERS ---
  
  getUsageCounters() {
    const rows = this.db.prepare(`SELECT key, count FROM demo_usage`).all();
    const counters = {};
    rows.forEach(r => counters[r.key] = r.count);
    return counters;
  }

  incrementCounter(key, amount = 1) {
    this.db.prepare(`INSERT OR IGNORE INTO demo_usage (key, count) VALUES (?, 0)`).run(key);
    this.db.prepare(`UPDATE demo_usage SET count = count + ? WHERE key = ?`).run(amount, key);
    return this.getUsageCounters()[key];
  }

  getCombinedState() {
    const state = this.getLicenseState();
    const counters = this.getUsageCounters();
    const deviceId = this.getDeviceUuid();

    // For perpetual licenses: NEVER auto-downgrade the mode based on time.
    // The license server can explicitly revoke via the silent refresh endpoint
    // if needed. Time-based degradation caused false demo-mode regressions
    // when the server was unreachable (e.g. Render free-tier sleeping).
    if (state.mode === 'licensed_active' && state.last_verified_at) {
      const lastVerified = new Date(state.last_verified_at).getTime();
      const now = new Date().getTime();
      const hoursSinceVerify = (now - lastVerified) / (1000 * 60 * 60);

      // Hint flag: tells the renderer it should attempt a background refresh.
      // This does NOT change the mode or entitlements in any way.
      state.isRefreshDue = hoursSinceVerify > (state.reverify_after_hours || 8760);
    }

    // Also treat any previously-degraded states as fully licensed.
    // This recovers users who were already stuck in offline_grace_expired.
    if (state.mode === 'offline_grace' || state.mode === 'offline_grace_expired') {
      if (state.license_id && state.entitlement_token) {
        state.mode = 'licensed_active';
        // Persist the recovery so it sticks
        this.updateLicenseState({ mode: 'licensed_active' });
      }
    }

    return {
      deviceId,
      state,
      counters
    };
  }
}

module.exports = new LicenseStorageService();
