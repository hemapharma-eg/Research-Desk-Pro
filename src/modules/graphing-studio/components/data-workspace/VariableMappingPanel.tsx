import type { PublicationDataset, VariableMapping } from '../../types/GraphingCoreTypes';

interface VariableMappingPanelProps {
  dataset: PublicationDataset;
  mapping: VariableMapping;
  onChange: (mapping: VariableMapping) => void;
}

export function VariableMappingPanel({ dataset, mapping, onChange }: VariableMappingPanelProps) {
  
  const handleIVChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...mapping, independentParamIds: [e.target.value] });
  };
  
  const handleDVChange = (colId: string, checked: boolean) => {
    let newDVs = [...mapping.dependentParamIds];
    if (checked && !newDVs.includes(colId)) newDVs.push(colId);
    else if (!checked) newDVs = newDVs.filter(id => id !== colId);
    onChange({ ...mapping, dependentParamIds: newDVs });
  };

  return (
    <div style={{ padding: '16px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold', color: '#0F172A' }}>Variable Mapping</h3>
      
      {dataset.format === 'xy' && (
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>Independent Variable (X)</label>
          <select 
            value={mapping.independentParamIds[0] || ''} 
            onChange={handleIVChange}
            style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
          >
            <option value="">-- Select X Column --</option>
            {dataset.columns.filter(c => c.isX).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
      )}

      {dataset.format === 'grouped' && (
        <div style={{ marginBottom: '12px', padding: '8px', background: '#F1F5F9', borderRadius: '4px', fontSize: '12px', color: '#475569' }}>
          <strong>Factor 1:</strong> Rows<br/>
          <strong>Factor 2 (Groups):</strong> Columns
        </div>
      )}

      <div>
        <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>Dependent Variables (Y)</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px', background: 'white' }}>
          {dataset.columns.filter(c => !c.isX).map(col => (
            <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={mapping.dependentParamIds.includes(col.id)} 
                onChange={e => handleDVChange(col.id, e.target.checked)} 
              />
              {col.title}
            </label>
          ))}
          {dataset.columns.filter(c => !c.isX).length === 0 && (
            <span style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic' }}>No Y columns available.</span>
          )}
        </div>
      </div>
    </div>
  );
}
