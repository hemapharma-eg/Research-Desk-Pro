import { useState } from 'react';
import type { PublicationDataset } from '../../types/GraphingCoreTypes';

interface DatasetMetadata {
  experimentTitle: string;
  author: string;
  date: string;
  organism: string;
  units: string;
  notes: string;
}

interface MetadataPanelProps {
  dataset: PublicationDataset;
  onChange: (dataset: PublicationDataset) => void;
}

export function MetadataPanel({ dataset, onChange }: MetadataPanelProps) {
  const meta = (dataset.metadata as unknown as DatasetMetadata & { createdAt: number; updatedAt: number }) || {};

  const [experimentTitle, setExperimentTitle] = useState(meta.experimentTitle || '');
  const [author, setAuthor] = useState(meta.author || '');
  const [date, setDate] = useState(meta.date || new Date().toISOString().split('T')[0]);
  const [organism, setOrganism] = useState(meta.organism || '');
  const [units, setUnits] = useState(meta.units || '');
  const [notes, setNotes] = useState(meta.notes || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onChange({
      ...dataset,
      metadata: {
        ...dataset.metadata,
        experimentTitle,
        author,
        date,
        organism,
        units,
        notes,
        updatedAt: Date.now(),
      } as typeof dataset.metadata,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div className="gs-panel-title" style={{ margin: 0 }}>Experiment Metadata</div>
        <button className="gs-btn gs-btn-primary gs-btn-sm" onClick={handleSave}>
          {saved ? '✅ Saved' : '💾 Save Metadata'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="gs-form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="gs-label">Experiment Title</label>
          <input className="gs-input" value={experimentTitle} onChange={e => setExperimentTitle(e.target.value)} placeholder="e.g. Effect of Drug X on Cell Viability" />
        </div>

        <div className="gs-form-group">
          <label className="gs-label">Author / Investigator</label>
          <input className="gs-input" value={author} onChange={e => setAuthor(e.target.value)} placeholder="e.g. John Doe" />
        </div>

        <div className="gs-form-group">
          <label className="gs-label">Date of Experiment</label>
          <input className="gs-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <div className="gs-form-group">
          <label className="gs-label">Organism / Model</label>
          <input className="gs-input" value={organism} onChange={e => setOrganism(e.target.value)} placeholder="e.g. Wistar Rats, HeLa Cells" />
        </div>

        <div className="gs-form-group">
          <label className="gs-label">Measurement Units</label>
          <input className="gs-input" value={units} onChange={e => setUnits(e.target.value)} placeholder="e.g. ng/mL, %, mmHg" />
        </div>

        <div className="gs-form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="gs-label">Notes / Protocol</label>
          <textarea
            className="gs-input"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Experimental conditions, protocol details, batch info..."
            style={{ height: '80px', resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      <div style={{ marginTop: '12px', padding: '10px', background: '#F1F5F9', borderRadius: '6px', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
        <strong>Created:</strong> {new Date(dataset.metadata.createdAt).toLocaleString()} &nbsp;|&nbsp;
        <strong>Last Modified:</strong> {new Date(dataset.metadata.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}
