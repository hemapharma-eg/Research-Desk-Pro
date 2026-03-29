import { useState } from 'react';

interface UnpaywallSetupModalProps {
  onComplete: (email: string) => void;
  onCancel: () => void;
}

export function UnpaywallSetupModal({ onComplete, onCancel }: UnpaywallSetupModalProps) {
  const [email, setEmail] = useState(localStorage.getItem('unpaywall_email') || '');

  const handleSave = () => {
    if (!email.includes('@') || !email.includes('.')) {
      return alert('Please enter a valid email address.');
    }
    localStorage.setItem('unpaywall_email', email.trim());
    onComplete(email.trim());
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#ffffff', padding: '30px', 
        borderRadius: '8px', maxWidth: '500px', width: '100%',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
      }}>
        <h2 style={{ marginTop: 0, color: '#334e68' }}>Open Access Auto-Fetch</h2>
        <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          This feature uses the public <strong>Unpaywall API</strong> to automatically find and download Open Access PDFs for your references using their DOIs.
        </p>
        <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '12px', borderRadius: '4px', border: '1px solid #ffeeba', fontSize: '13px', marginBottom: '20px' }}>
          <strong>API Policy Requirement:</strong> Unpaywall requires an email address so they can contact you if your usage violates their rate limits. This email is sent with each request but is not used for marketing.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Contact Email Address</label>
          <input 
            type="email" 
            className="sr-input"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="e.g. researcher@university.edu"
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="sr-btn" onClick={onCancel}>Cancel</button>
          <button className="sr-btn sr-btn-success" onClick={handleSave}>Confirm & Start Fetch</button>
        </div>
      </div>
    </div>
  );
}
