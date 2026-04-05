const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('./database');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
// Serve static admin dashboard
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

// A secret key for signing entitlement tokens (in production, use env var)
const JWT_SECRET = process.env.JWT_SECRET || 'research-desk-pro-super-secret-key-2026';

// Helper: sign entitlement token
const createEntitlementToken = (license, policy, activationId) => {
  return jwt.sign({
    licenseId: license.id,
    activationId: activationId,
    tier: license.tier,
    flags: {
      unlimitedProjects: true,
      unlimitedSaves: true,
      highResolutionExports: true,
      advancedExports: true,
      premiumTemplates: true
    },
    policySnapshot: policy
  }, JWT_SECRET, { expiresIn: '7d' }); // Requires refresh every 7 days
};

// -----------------------------------------------------
// PUBLIC APP ENDPOINTS
// -----------------------------------------------------

// ACTIVATE LICENSE
app.post('/api/license/activate', async (req, res) => {
  const { licenseKey, deviceId, platform, appVersion } = req.body;
  
  try {
    const license = await db.get('SELECT * FROM licenses WHERE license_key = ?', [licenseKey]);
    
    if (!license) {
      return res.status(400).json({ success: false, status: 'license_invalid', message: 'This license key is not valid.' });
    }
    
    if (license.status === 'revoked') {
      return res.status(403).json({ success: false, status: 'license_revoked', message: 'This license has been revoked. Please contact support.' });
    }
    
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return res.status(403).json({ success: false, status: 'license_expired', message: 'This license has expired.' });
    }

    // Check seat limits
    if (license.current_activation_count >= license.max_seats) {
      // Is this device already activated?
      const existing = await db.get('SELECT id FROM activations WHERE license_id = ? AND device_id = ?', [license.id, deviceId]);
      if (!existing) {
        return res.status(403).json({ 
          success: false, 
          status: 'license_seats_exceeded', 
          message: `This license is already active on the maximum number of devices (${license.max_seats}).` 
        });
      }
    }

    // Register or update device activation
    let activation = await db.get('SELECT id, status FROM activations WHERE license_id = ? AND device_id = ?', [license.id, deviceId]);
    const activationId = activation ? activation.id : uuidv4();
    const now = new Date().toISOString();

    if (activation) {
      await db.run('UPDATE activations SET last_verified_at = ?, app_version = ?, status = ? WHERE id = ?', 
        [now, appVersion, 'active', activation.id]);
    } else {
      await db.run(
        'INSERT INTO activations (id, license_id, device_id, platform, app_version, first_activated_at, last_verified_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [activationId, license.id, deviceId, platform, appVersion, now, now]
      );
      await db.run('UPDATE licenses SET current_activation_count = current_activation_count + 1 WHERE id = ?', [license.id]);
    }
    
    // Mark license as activated if first time
    if (!license.activated_at) {
      await db.run('UPDATE licenses SET activated_at = ? WHERE id = ?', [now, license.id]);
    }

    const policy = await db.get('SELECT * FROM license_policy WHERE id = 1');
    const token = createEntitlementToken(license, policy, activationId);

    // Audit log
    await db.run('INSERT INTO audit_log (id, action, target_type, target_id, details_json) VALUES (?, ?, ?, ?, ?)', 
      [uuidv4(), 'activation_success', 'license', license.id, JSON.stringify({ deviceId, appVersion })]);

    res.json({
      success: true,
      status: 'licensed_active',
      message: 'License activated successfully.',
      licenseId: license.id,
      licensedToName: license.customer_name,
      licensedToOrganization: license.organization,
      tier: license.tier,
      activationDate: now,
      expiryDate: license.expires_at,
      offlineGraceDays: policy.offline_grace_days,
      reverifyAfterHours: policy.reverify_after_hours,
      entitlementToken: token
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// REFRESH / VERIFY LICENSE
app.post('/api/license/refresh', async (req, res) => {
  const { entitlementToken, deviceId, appVersion } = req.body;
  
  try {
    const decoded = jwt.verify(entitlementToken, JWT_SECRET, { ignoreExpiration: true });
    
    // Fetch current state of license and activation
    const license = await db.get('SELECT * FROM licenses WHERE id = ?', [decoded.licenseId]);
    const activation = await db.get('SELECT * FROM activations WHERE id = ?', [decoded.activationId]);

    if (!license || !activation || activation.device_id !== deviceId) {
      return res.status(401).json({ success: false, status: 'license_invalid' });
    }

    if (license.status === 'revoked' || activation.status === 'revoked') {
      return res.status(403).json({ success: false, status: 'license_revoked' });
    }

    const now = new Date().toISOString();
    await db.run('UPDATE activations SET last_verified_at = ?, app_version = ? WHERE id = ?', [now, appVersion, activation.id]);
    
    const policy = await db.get('SELECT * FROM license_policy WHERE id = 1');
    const newToken = createEntitlementToken(license, policy, activation.id);

    res.json({
      success: true,
      status: 'licensed_active',
      entitlementToken: newToken,
      offlineGraceDays: policy.offline_grace_days,
      reverifyAfterHours: policy.reverify_after_hours
    });

  } catch (err) {
    console.error(err);
    res.status(401).json({ success: false, status: 'license_invalid', message: 'Token rejected.' });
  }
});

// FETCH PUBLIC POLICY (For demo configuration)
app.get('/api/license/config', async (req, res) => {
  try {
    const policy = await db.get('SELECT * FROM license_policy WHERE id = 1');
    res.json({ success: true, policy });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// -----------------------------------------------------
// ADMIN ENDPOINTS
// -----------------------------------------------------

// GET ALL LICENSES
app.get('/api/admin/licenses', async (req, res) => {
  try {
    const licenses = await db.all('SELECT * FROM licenses ORDER BY created_at DESC');
    res.json({ success: true, licenses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GENERATE LICENSE
app.post('/api/admin/licenses', async (req, res) => {
  const { customerName, customerEmail, organization, tier, maxSeats } = req.body;
  const id = uuidv4();
  // Generate something like RDP-XXXX-XXXX-XXXX
  const key = 'RDP-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
               Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
               Math.random().toString(36).substring(2, 6).toUpperCase();
               
  try {
    await db.run(`
      INSERT INTO licenses (id, license_key, customer_name, customer_email, organization, tier, max_seats)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, key, customerName, customerEmail, organization, tier || 'full', maxSeats || 1]);

    const newLic = await db.get('SELECT * FROM licenses WHERE id = ?', [id]);
    res.json({ success: true, license: newLic });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// REVOKE LICENSE
app.post('/api/admin/licenses/:id/revoke', async (req, res) => {
  try {
    const { reason } = req.body;
    await db.run('UPDATE licenses SET status = ?, revoked_reason = ?, revoked_at = ? WHERE id = ?', 
      ['revoked', reason || 'Admin revoked', new Date().toISOString(), req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/policy', async (req, res) => {
  try {
    const policy = await db.get('SELECT * FROM license_policy WHERE id = 1');
    res.json({ success: true, policy });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`License server running on http://localhost:${PORT}`);
});
