import { useState, useEffect, useMemo } from 'react';
import { REFERENCE_TYPES, getCategoryGroups } from '../utils/referenceRegistry';
import type { FieldDef, ContributorRole } from '../utils/referenceRegistry';
import type { Contributor, StructuredMetadata, Reference } from '../../../types/electron.d';

interface AddReferenceModalProps {
  onClose: () => void;
  onSave: (ref: Reference) => void;
  initialType?: string;
}

// Simple unique ID generator
const generateId = () => Math.random().toString(36).substring(2, 9);

export function AddReferenceModal({ onClose, onSave, initialType = 'journal_article' }: AddReferenceModalProps) {
  const [selectedType, setSelectedType] = useState<string>(initialType);
  
  // The master form state, representing StructuredMetadata
  const [formData, setFormData] = useState<Partial<StructuredMetadata>>({
    reference_type: initialType,
    contributors: [{ id: generateId(), role: 'Author', isCorporate: false, firstName: '', lastName: '' }]
  });

  const categories = useMemo(() => getCategoryGroups(), []);
  const schema = useMemo(() => REFERENCE_TYPES.find(t => t.id === selectedType)!, [selectedType]);

  // When type changes, ensure we have the default roles ready (but don't wipe data entirely to allow switching gracefully)
  useEffect(() => {
    if (schema) {
      setFormData(prev => ({
        ...prev,
        reference_type: schema.id,
      }));
    }
  }, [schema]);

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- CONTRIBUTOR HANDLING ---
  const addContributor = (role: ContributorRole = 'Author') => {
    setFormData(prev => ({
      ...prev,
      contributors: [...(prev.contributors || []), { id: generateId(), role, isCorporate: false, firstName: '', lastName: '' }]
    }));
  };

  const updateContributor = (id: string, updates: Partial<Contributor>) => {
    setFormData(prev => ({
      ...prev,
      contributors: (prev.contributors || []).map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const removeContributor = (id: string) => {
    setFormData(prev => ({
      ...prev,
      contributors: (prev.contributors || []).filter(c => c.id !== id)
    }));
  };

  const moveContributor = (index: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const arr = [...(prev.contributors || [])];
      if (direction === 'up' && index > 0) {
        [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      } else if (direction === 'down' && index < arr.length - 1) {
        [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];
      }
      return { ...prev, contributors: arr };
    });
  };

  // --- SUBMISSION ---
  const handleSubmit = async (status: 'draft' | 'final') => {
    // Basic validation
    if (status === 'final') {
      if (!formData.title) {
        alert("Title is required.");
        return;
      }
      if (!formData.year) {
         if(!confirm("Year is missing. Continue saving?")) return;
      }
    }

    // Convert structured contributors to a flat 'authors' string for backward compatibility
    let flatAuthors = "Unknown Author";
    if (formData.contributors && formData.contributors.length > 0) {
      flatAuthors = formData.contributors.map(c => {
        if (c.isCorporate) return c.corporateName || '';
        return `${c.firstName || ''} ${c.lastName || ''}`.trim();
      }).filter(Boolean).join(', ');
    }

    // Build the payload mapping our StructuredMetadata to DB's fields
    const payload: Omit<Reference, 'id'> = {
      reference_type: schema.id,
      title: formData.title || 'Untitled',
      authors: flatAuthors,
      year: formData.year || '',
      journal: formData.journal || null, // Many schemas map 'source' to 'journal'
      doi: formData.doi || null,
      notes: formData.notes || null,
      tags: formData.tags || null,
      pdf_path: formData.pdf_path || null,
      raw_metadata: JSON.stringify(formData)
    };

    const res = await window.api.createReference(payload);
    if (res.success && res.data) {
      onSave(res.data);
    } else {
      alert("Error saving: " + res.error);
    }
  };

  // --- RENDER HELPERS ---
  const renderField = (def: FieldDef) => {
    const value = formData[def.name as keyof StructuredMetadata] || '';

    const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748B', marginBottom: '4px' };
    const inputStyle = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px' };

    return (
      <div key={def.name} style={{ marginBottom: '12px', flex: '1 1 45%', minWidth: '200px' }}>
        <label style={labelStyle}>
          {def.label} {def.required && <span style={{ color: '#EF4444' }}>*</span>}
        </label>
        {def.type === 'textarea' ? (
          <textarea 
            value={value} 
            onChange={e => handleChange(def.name, e.target.value)}
            placeholder={def.placeholder}
            style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }}
          />
        ) : def.type === 'select' && def.options ? (
          <select value={value} onChange={e => handleChange(def.name, e.target.value)} style={inputStyle}>
            <option value="">-- Select --</option>
            {def.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : (
          <input 
            type={def.type === 'date' ? 'text' : def.type} 
            value={value} 
            onChange={e => handleChange(def.name, e.target.value)}
            placeholder={def.placeholder || (def.type === 'date' ? 'YYYY-MM-DD or Year' : '')}
            style={inputStyle}
          />
        )}
      </div>
    );
  };

  const renderGroup = (title: string, fields: FieldDef[]) => {
    if (!fields || fields.length === 0) return null;
    return (
      <div style={{ marginBottom: '24px', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#0F172A' }}>{title}</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          {fields.map(renderField)}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '12px', width: '850px', maxWidth: '95vw', height: '90vh',
        display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
      }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#0F172A' }}>Add New Reference</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94A3B8' }}>×</button>
        </div>

        {/* Form Body Wrap */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#FFFFFF' }}>
          
          {/* Reference Type Selector */}
          <div style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '2px solid #F1F5F9' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#1E293B', marginBottom: '8px' }}>Reference Type <span style={{ color: '#EF4444' }}>*</span></label>
            <select 
              value={selectedType} 
              onChange={e => setSelectedType(e.target.value)}
              style={{ width: '100%', maxWidth: '400px', padding: '10px', borderRadius: '6px', border: '1px solid #94A3B8', fontSize: '14px', backgroundColor: '#F8FAFC' }}
            >
              {Object.entries(categories).map(([cat, types]) => (
                <optgroup key={cat} label={cat}>
                  {types.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Dynamic Form Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            
            {/* 1. Primary Metadata */}
            {renderGroup('Core Details', schema.fields.primary)}

            {/* 2. Contributors */}
            <div style={{ marginBottom: '24px', backgroundColor: '#F0F9FF', padding: '16px', borderRadius: '8px', border: '1px solid #BAE6FD' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', color: '#0369A1' }}>Contributors</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => addContributor('Author')} style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: 'white', border: '1px solid #7DD3FC', color: '#0284C7', borderRadius: '4px', cursor: 'pointer' }}>+ Add Author</button>
                  <button onClick={() => addContributor('Editor')} style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: 'white', border: '1px solid #7DD3FC', color: '#0284C7', borderRadius: '4px', cursor: 'pointer' }}>+ Add Editor</button>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(formData.contributors || []).map((c, i) => (
                  <div key={c.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'white', padding: '8px', borderRadius: '6px', border: '1px solid #E0F2FE' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <button onClick={() => moveContributor(i, 'up')} disabled={i === 0} style={{ border: 'none', background: 'none', cursor: i===0?'default':'pointer', color: i===0?'#CBD5E1':'#64748B' }}>▲</button>
                      <button onClick={() => moveContributor(i, 'down')} disabled={i === (formData.contributors?.length||0)-1} style={{ border: 'none', background: 'none', cursor: i===(formData.contributors?.length||0)-1?'default':'pointer', color: i===(formData.contributors?.length||0)-1?'#CBD5E1':'#64748B' }}>▼</button>
                    </div>

                    <select 
                      value={c.role} 
                      onChange={e => updateContributor(c.id, { role: e.target.value as ContributorRole })}
                      style={{ padding: '6px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px', width: '120px' }}
                    >
                      <option value="Author">Author</option>
                      <option value="Editor">Editor</option>
                      <option value="Translator">Translator</option>
                      <option value="Principal Investigator">PI</option>
                      <option value="Organization">Organization</option>
                    </select>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748B' }}>
                      <input type="checkbox" checked={c.isCorporate} onChange={e => updateContributor(c.id, { isCorporate: e.target.checked })} />
                      Corp/Inst.
                    </label>

                    {c.isCorporate ? (
                      <input 
                        type="text" value={c.corporateName} onChange={e => updateContributor(c.id, { corporateName: e.target.value })}
                        placeholder="Institution or Corporate Name" style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                      />
                    ) : (
                      <>
                        <input 
                          type="text" value={c.firstName} onChange={e => updateContributor(c.id, { firstName: e.target.value })}
                          placeholder="First / Given Name" style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                        />
                        <input 
                          type="text" value={c.middleName} onChange={e => updateContributor(c.id, { middleName: e.target.value })}
                          placeholder="Middle" style={{ width: '80px', padding: '6px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                        />
                        <input 
                          type="text" value={c.lastName} onChange={e => updateContributor(c.id, { lastName: e.target.value })}
                          placeholder="Last / Family Name" style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                        />
                      </>
                    )}

                    <button onClick={() => removeContributor(c.id)} style={{ padding: '6px', backgroundColor: 'transparent', color: '#EF4444', border: 'none', cursor: 'pointer', fontSize: '16px' }}>×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Publication */}
            {renderGroup('Publication Details', schema.fields.publication)}

            {/* 4. Identifiers */}
            {renderGroup('Identifiers / Standard Numbers', schema.fields.identifiers)}

            {/* 5. Online & Access */}
            {renderGroup('Online Access & Archive', schema.fields.online)}

            {/* 6. Metadata & Notes */}
            {renderGroup('Metadata & Notes', schema.fields.metadata)}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', borderRadius: '0 0 12px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <button 
              onClick={() => handleSubmit('draft')}
               style={{ padding: '10px 16px', backgroundColor: 'transparent', color: '#475569', borderRadius: '6px', border: '1px solid #CBD5E1', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
            >
              Save as Draft
            </button>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={onClose} 
              style={{ padding: '10px 16px', backgroundColor: 'transparent', color: '#64748B', borderRadius: '6px', border: '1px solid transparent', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
            >
              Cancel
            </button>
            <button 
              onClick={() => { handleSubmit('final'); onClose(); }} 
              style={{ padding: '10px 24px', backgroundColor: 'var(--color-accent-primary)', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
            >
              Save Reference
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
