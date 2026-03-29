import { useState } from 'react';

export interface ExtractorField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea';
  options?: string[]; // for select
  required?: boolean;
}

interface TemplateBuilderProps {
  onSave: (template: { name: string, fields: ExtractorField[] }) => void;
  onCancel: () => void;
  initialTemplate?: { id?: string, name: string, fields_json: string };
}

export function TemplateBuilder({ onSave, onCancel, initialTemplate }: TemplateBuilderProps) {
  const [name, setName] = useState(initialTemplate?.name || '');
  const [fields, setFields] = useState<ExtractorField[]>(() => {
    if (initialTemplate?.fields_json) {
      try { return JSON.parse(initialTemplate.fields_json); } catch (e) { return []; }
    }
    return [];
  });

  const addField = () => {
    const newField: ExtractorField = { id: crypto.randomUUID(), name: 'New Field', type: 'text', required: false };
    setFields([...fields, newField]);
  };

  const updateField = (index: number, updates: Partial<ExtractorField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const removeField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };

  const handleSave = () => {
    if (!name.trim()) return alert('Template name is required.');
    if (fields.length === 0) return alert('At least one field is required.');
    onSave({ name, fields });
  };

  return (
    <div style={{ padding: '20px', backgroundColor: 'var(--bg-panel)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '600px', margin: '0 auto' }}>
      <h3>{initialTemplate ? 'Edit Extraction Template' : 'Create Extraction Template'}</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label>Template Name</label>
        <input 
          type="text" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          className="sr-input" 
          placeholder="e.g. RCT PICO Extractor" 
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4>Fields</h4>
        <button className="sr-btn" onClick={addField}>+ Add Field</button>
      </div>

      {fields.map((f, i) => (
        <div key={f.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: 'var(--bg-default)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
          <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '5px'}}>
            <input 
              type="text" 
              value={f.name} 
              onChange={e => updateField(i, { name: e.target.value })} 
              className="sr-input"
              placeholder="Field Label"
            />
            {f.type === 'select' && (
              <input 
                type="text" 
                value={f.options?.join(', ') || ''} 
                onChange={e => updateField(i, { options: e.target.value.split(',').map(s => s.trim()) })} 
                className="sr-input"
                placeholder="Comma separated options"
              />
            )}
          </div>
          
          <select 
            value={f.type} 
            onChange={e => updateField(i, { type: e.target.value as ExtractorField['type'] })}
            className="sr-input"
          >
            <option value="text">Short Text</option>
            <option value="textarea">Long Text</option>
            <option value="number">Number</option>
            <option value="boolean">Yes / No</option>
            <option value="select">Dropdown</option>
          </select>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
            <input 
              type="checkbox" 
              checked={f.required} 
              onChange={e => updateField(i, { required: e.target.checked })}
            />
            Required
          </label>

          <button onClick={() => removeField(i)} style={{background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '16px'}} title="Remove">×</button>
        </div>
      ))}
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
        <button className="sr-btn sr-btn-danger" onClick={onCancel}>Cancel</button>
        <button className="sr-btn sr-btn-primary" onClick={handleSave}>Save Template</button>
      </div>
    </div>
  );
}
