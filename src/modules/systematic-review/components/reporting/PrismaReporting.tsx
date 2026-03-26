import React from 'react';
import { useSystematicReview } from '../../context/SystematicReviewContext';

export function PrismaReporting() {
  const { state } = useSystematicReview();

  // 1. Identification
  const totalImported = state.records.length;
  const duplicatesRemoved = state.records.filter(r => r.dedupStatus === 'duplicate').length;
  
  // 2. Screening
  const recordsScreened = totalImported - duplicatesRemoved;
  const excludedInTiAb = state.records.filter(r => r.stage === 'excluded' && Object.values(r.titleAbstractDecisions).some(d => d.decision === 'exclude')).length;
  
  // 3. Retrieval
  const soughtForRetrieval = state.records.filter(r => r.titleAbstractDecisions[state.activeReviewer?.id || '']?.decision === 'include' || r.stage === 'full-text-retrieval' || r.stage === 'full-text-screening' || r.stage === 'included' || Object.values(r.fullTextDecisions).length > 0).length;
  const notRetrieved = state.records.filter(r => r.stage === 'excluded' && r.finalDisposition === 'excluded' && !Object.values(r.fullTextDecisions).length && !Object.values(r.titleAbstractDecisions).some(d => d.decision === 'exclude')).length; // Rough logic for 'missing full text' marking
  
  // 4. Eligibility
  const assessedForEligibility = state.records.filter(r => r.stage === 'full-text-screening' || r.stage === 'included' || Object.values(r.fullTextDecisions).length > 0).length;
  
  const excludedInFullText = state.records.filter(r => r.stage === 'excluded' && Object.values(r.fullTextDecisions).length > 0).length;
  
  // Calculate reasons for exclusion array dynamically:
  const exclusionReasonsMap = new Map<string, number>();
  state.records.forEach(r => {
    if (r.stage === 'excluded' && r.finalReasonId && Object.values(r.fullTextDecisions).length > 0) {
      const reasonLabel = state.project?.exclusionReasons.find(ex => ex.id === r.finalReasonId)?.label || 'Unknown Reason';
      exclusionReasonsMap.set(reasonLabel, (exclusionReasonsMap.get(reasonLabel) || 0) + 1);
    }
  });

  // 5. Included
  const totalIncluded = state.records.filter(r => r.finalDisposition === 'included').length;

  return (
    <div style={{ padding: 32, height: '100%', overflowY: 'auto', background: 'var(--color-bg-subtle)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
           <div>
             <h2 style={{ margin: '0 0 8px 0', fontSize: 24 }}>PRISMA Flow Diagram</h2>
             <div style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>Automatically generated from immutable review decisions.</div>
           </div>
           <button className="sr-btn sr-btn-primary">Export as PDF</button>
         </div>

         <div className="sr-card" style={{ padding: 40, fontFamily: 'Arial, sans-serif' }}>
           
           {/* Tier 1: Identification */}
           <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32, position: 'relative' }}>
             <div style={{ border: '2px solid #2c3e50', padding: 16, width: 300, textAlign: 'center', background: '#ecf0f1' }}>
               <strong style={{ display: 'block', fontSize: 14 }}>Records Identified via Databases</strong>
               <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>n = {totalImported}</div>
             </div>
             
             {/* Branch to duplicates */}
             <div style={{ position: 'absolute', right: 50, top: 0 }}>
               <div style={{ border: '2px solid #e74c3c', padding: 12, width: 220, textAlign: 'left', background: '#fdf2e9' }}>
                 <strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Records Removed Before Screening:</strong>
                 <div style={{ fontSize: 13 }}>Duplicate records: (n = {duplicatesRemoved})</div>
               </div>
               {/* Line connecting */}
               <div style={{ position: 'absolute', borderTop: '2px solid #333', width: 60, top: 30, left: -60 }}></div>
             </div>
             
             {/* Vertical Drop Line */}
             <div style={{ position: 'absolute', borderLeft: '2px solid #333', height: 32, bottom: -32, left: '50%' }}></div>
           </div>

           {/* Tier 2: Screening (TiAb) */}
           <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32, position: 'relative' }}>
             <div style={{ border: '2px solid #2c3e50', padding: 16, width: 300, textAlign: 'center', background: '#fff' }}>
               <strong style={{ display: 'block', fontSize: 14 }}>Records Screened (Title/Abstract)</strong>
               <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>n = {recordsScreened}</div>
             </div>

             <div style={{ position: 'absolute', right: 50, top: 0 }}>
               <div style={{ border: '2px solid #e74c3c', padding: 12, width: 220, textAlign: 'left', background: '#fff' }}>
                 <strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Records Excluded:</strong>
                 <div style={{ fontSize: 13 }}>n = {excludedInTiAb}</div>
               </div>
               <div style={{ position: 'absolute', borderTop: '2px solid #333', width: 60, top: 30, left: -60 }}></div>
             </div>

             <div style={{ position: 'absolute', borderLeft: '2px solid #333', height: 32, bottom: -32, left: '50%' }}></div>
           </div>

           {/* Tier 3: Retrieval */}
           <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32, position: 'relative' }}>
             <div style={{ border: '2px solid #2c3e50', padding: 16, width: 300, textAlign: 'center', background: '#fff' }}>
               <strong style={{ display: 'block', fontSize: 14 }}>Reports Sought for Retrieval</strong>
               <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>n = {soughtForRetrieval}</div>
             </div>

             <div style={{ position: 'absolute', right: 50, top: 0 }}>
               <div style={{ border: '2px solid #e74c3c', padding: 12, width: 220, textAlign: 'left', background: '#fff' }}>
                 <strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Reports Not Retrieved:</strong>
                 <div style={{ fontSize: 13 }}>n = {notRetrieved}</div>
               </div>
               <div style={{ position: 'absolute', borderTop: '2px solid #333', width: 60, top: 30, left: -60 }}></div>
             </div>

             <div style={{ position: 'absolute', borderLeft: '2px solid #333', height: 32, bottom: -32, left: '50%' }}></div>
           </div>

           {/* Tier 4: Eligibility (Full Text) */}
           <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32, position: 'relative' }}>
             <div style={{ border: '2px solid #2c3e50', padding: 16, width: 300, textAlign: 'center', background: '#fff' }}>
               <strong style={{ display: 'block', fontSize: 14 }}>Reports Assessed for Eligibility</strong>
               <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>n = {assessedForEligibility}</div>
             </div>

             <div style={{ position: 'absolute', right: 50, top: 0 }}>
               <div style={{ border: '2px solid #e74c3c', padding: 12, width: 220, textAlign: 'left', background: '#fff' }}>
                 <strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Reports Excluded:</strong>
                 <div style={{ fontSize: 13, marginBottom: 8, fontWeight: 'bold' }}>Total Excluded: n = {excludedInFullText}</div>
                 {Array.from(exclusionReasonsMap.entries()).map(([reason, count]) => (
                    <div key={reason} style={{ fontSize: 11, marginBottom: 2 }}>- {reason}: {count}</div>
                 ))}
               </div>
               <div style={{ position: 'absolute', borderTop: '2px solid #333', width: 60, top: 30, left: -60 }}></div>
             </div>

             <div style={{ position: 'absolute', borderLeft: '2px solid #333', height: 32, bottom: -32, left: '50%' }}></div>
           </div>

           {/* Tier 5: Included */}
           <div style={{ display: 'flex', justifyContent: 'center' }}>
             <div style={{ border: '3px solid #389e0d', padding: 20, width: 300, textAlign: 'center', background: '#f6ffed' }}>
               <strong style={{ display: 'block', fontSize: 15, color: '#237804' }}>New Studies Included in Review</strong>
               <div style={{ fontSize: 28, fontWeight: 'bold', marginTop: 8, color: '#135200' }}>n = {totalIncluded}</div>
             </div>
           </div>

         </div>
      </div>
    </div>
  );
}
