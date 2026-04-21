import { useState, useMemo } from 'react';
import { useLicense } from '../modules/licensing/LicenseContext';
import './HelpGuide.css';

import { HELP_SECTIONS } from './HelpGuideData';

interface HelpGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpGuide({ isOpen, onClose }: HelpGuideProps) {
  const { state } = useLicense();
  const isLicensed = state.mode === 'licensed_active';
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return HELP_SECTIONS;
    const q = searchQuery.toLowerCase();
    return HELP_SECTIONS.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.content.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const currentSection = HELP_SECTIONS.find(s => s.id === activeSection) || HELP_SECTIONS[0];

  // Highlight search matches in content (safely applying to text nodes only)
  const highlightedContent = useMemo(() => {
    if (!searchQuery.trim()) return currentSection.content;
    
    // Convert generic text matches to highlighting (avoiding touching HTML tags)
    const regex = new RegExp(
      '(?<!<[^>]*?)(' + searchQuery.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&') + ')(?![^<]*?>)',
      'gi'
    );
    return currentSection.content.replace(regex, '<mark class="help-highlight">$1</mark>');
  }, [currentSection.content, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="help-guide-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="help-guide-modal">
        {/* Header */}
        <div className="help-guide-header">
          <span style={{ fontSize: '22px' }}>📖</span>
          <h2>Research Desk Pro — Help Guide</h2>
          <input
            className="help-guide-search"
            type="text"
            placeholder="Search help topics..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoFocus
          />
          <button className="help-guide-close" onClick={onClose} title="Close">✕</button>
        </div>

        <div className="help-guide-body">
          {/* Sidebar */}
          <div className="help-guide-sidebar">
            {filteredSections.map(section => (
              <div
                key={section.id}
                className={`help-guide-sidebar-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <span>{section.icon}</span>
                <span>{section.title}</span>
              </div>
            ))}
            <div style={{ marginTop: 'auto', padding: '16px', fontSize: '12px', color: '#666', borderTop: '1px solid #333', textAlign: 'center' }}>
              &copy; 2026 ReseolabX.<br/>All rights reserved.
            </div>
          </div>

          {/* Content */}
          {isLicensed ? (
            <div
              className="help-guide-content"
              style={{ overflowY: 'auto' }}
              dangerouslySetInnerHTML={{ __html: highlightedContent }}
            />
          ) : (
            <div className="help-guide-demo-block">
              <span style={{ fontSize: '64px' }}>🔒</span>
              <h3>Help Guide — Full Version Only</h3>
              <p>
                The comprehensive help guide with detailed instructions, keyboard shortcuts, 
                and workflow guides is available exclusively in the licensed version of Research Desk Pro.
              </p>
              <button
                className="help-guide-demo-btn"
                onClick={() => {
                  onClose();
                  window.dispatchEvent(new CustomEvent('TRIGGER_ACTIVATION'));
                }}
              >
                Activate License
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
