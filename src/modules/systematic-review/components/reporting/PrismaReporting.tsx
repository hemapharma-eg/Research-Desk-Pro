import { useRef, useState } from 'react';
import { useSystematicReview } from '../../context/SystematicReviewContext';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export function PrismaReporting() {
  const { state } = useSystematicReview();
  const diagramRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [includeMetadata, setIncludeMetadata] = useState(false);

  // 1. Identification
  const totalImported = state.records.length;
  const duplicatesRemoved = state.records.filter(r => r.dedupStatus === 'duplicate').length;
  
  // 2. Screening
  const recordsScreened = totalImported - duplicatesRemoved;
  const excludedInTiAb = state.records.filter(r => r.stage === 'excluded' && Object.values(r.titleAbstractDecisions).some(d => d.decision === 'exclude')).length;
  
  // 3. Retrieval
  const soughtForRetrieval = state.records.filter(r => r.titleAbstractDecisions[state.activeReviewer?.id || '']?.decision === 'include' || r.stage === 'full-text-retrieval' || r.stage === 'full-text-screening' || r.stage === 'included' || Object.values(r.fullTextDecisions).length > 0).length;
  const notRetrieved = state.records.filter(r => r.stage === 'excluded' && r.finalDisposition === 'excluded' && !Object.values(r.fullTextDecisions).length && !Object.values(r.titleAbstractDecisions).some(d => d.decision === 'exclude')).length;
  
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

  const exportPDF = async () => {
    if (!diagramRef.current) return;
    setIsExporting(true);
    
    try {
      // Capture the element as a high-res image
      const canvas = await html2canvas(diagramRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`PRISMA_Diagram_${state.project?.shortTitle?.replace(/\\s+/g, '_') || 'Review'}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Failed to generate PDF. See console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  const VerticalLine = () => (
    <div style={{ display: 'flex', justifyContent: 'center', height: 40 }}>
      <div style={{ width: 0, borderLeft: '3px solid #334e68' }}></div>
    </div>
  );

  return (
    <div style={{ padding: 32, height: '100%', overflowY: 'auto', background: 'var(--color-bg-subtle)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
           <div>
             <h2 style={{ margin: '0 0 8px 0', fontSize: 24 }}>PRISMA Flow Diagram</h2>
             <div style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>Automatically generated from immutable review decisions.</div>
           </div>
           
           <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
             <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
               <input 
                 type="checkbox" 
                 checked={includeMetadata} 
                 onChange={e => setIncludeMetadata(e.target.checked)} 
               />
               Stamp Project Metadata
             </label>
             <button 
               className="sr-btn sr-btn-primary" 
               onClick={exportPDF}
               disabled={isExporting}
             >
               {isExporting ? 'Generating PDF...' : 'Export as PDF'}
             </button>
           </div>
         </div>

         {/* The wrapper for PDF export. We give it a white background so html2canvas renders cleanly */}
         <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: 8, border: '1px solid var(--color-border-light)' }}>
           <div ref={diagramRef} style={{ padding: '60px', fontFamily: 'Arial, sans-serif', background: '#ffffff', width: 'max-content', minWidth: '100%' }}>
             
             {includeMetadata && state.project && (
               <div style={{ marginBottom: 40, padding: 20, border: '2px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', fontSize: 14 }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: 18, color: '#0f172a' }}>{state.project.title}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, color: '#334155' }}>
                     <div><strong>Project Type:</strong> <span style={{ textTransform: 'capitalize' }}>{state.project.type}</span></div>
                     <div><strong>Discipline:</strong> <span style={{ textTransform: 'capitalize' }}>{state.project.discipline}</span></div>
                     <div><strong>Protocol ID:</strong> {state.project.protocolRegistration || 'N/A'}</div>
                     <div><strong>Date Generated:</strong> {new Date().toLocaleDateString()}</div>
                  </div>
               </div>
             )}

             <h3 style={{ textAlign: 'center', marginBottom: 40, borderBottom: '1px solid #eee', paddingBottom: 16, color: '#334e68' }}>
               PRISMA 2020 flow diagram for new systematic reviews
             </h3>

             {/* Layout wrapper for HTML2Canvas rigid bounding box */}
             <div style={{ width: 640, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>

               {/* Tier 1: Identification */}
               <div style={{ display: 'flex', width: '100%' }}>
                 <div style={{ width: 320, flexShrink: 0, border: '3px solid #334e68', padding: '16px 20px', borderRadius: 6, textAlign: 'center', background: '#f0f4f8' }}>
                   <strong style={{ display: 'block', fontSize: 14 }}>Records Identified via Databases</strong>
                   <div style={{ fontSize: 22, fontWeight: 'bold', marginTop: 8 }}>n = {totalImported}</div>
                 </div>
                 
                 {/* Branch to duplicates */}
                 <div style={{ display: 'flex', alignItems: 'center', width: 320, flexShrink: 0 }}>
                   <div style={{ width: 40, borderTop: '3px solid #334e68' }}></div>
                   <div style={{ flex: 1, border: '2px solid #e12d39', padding: '12px 16px', borderRadius: 4, textAlign: 'left', background: '#fff0f2' }}>
                     <strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Records Removed Before Screening:</strong>
                     <div style={{ fontSize: 13, fontWeight: 'bold' }}>Duplicate records (n = {duplicatesRemoved})</div>
                   </div>
                 </div>
               </div>
               
               <div style={{ width: 320 }}>
                 <VerticalLine />
               </div>

               {/* Tier 2: Screening (TiAb) */}
               <div style={{ display: 'flex', width: '100%' }}>
                 <div style={{ width: 320, flexShrink: 0, border: '3px solid #334e68', padding: '16px 20px', borderRadius: 6, textAlign: 'center', background: '#fff' }}>
                   <strong style={{ display: 'block', fontSize: 14 }}>Records Screened (Title/Abstract)</strong>
                   <div style={{ fontSize: 22, fontWeight: 'bold', marginTop: 8 }}>n = {recordsScreened}</div>
                 </div>

                 <div style={{ display: 'flex', alignItems: 'center', width: 320, flexShrink: 0 }}>
                   <div style={{ width: 40, borderTop: '3px solid #334e68' }}></div>
                   <div style={{ flex: 1, border: '2px solid #e12d39', padding: '12px 16px', borderRadius: 4, textAlign: 'left', background: '#fff' }}>
                     <strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Records Excluded:</strong>
                     <div style={{ fontSize: 14, fontWeight: 'bold' }}>n = {excludedInTiAb}</div>
                   </div>
                 </div>
               </div>

               <div style={{ width: 320 }}>
                 <VerticalLine />
               </div>

               {/* Tier 3: Retrieval */}
               <div style={{ display: 'flex', width: '100%' }}>
                 <div style={{ width: 320, flexShrink: 0, border: '3px solid #334e68', padding: '16px 20px', borderRadius: 6, textAlign: 'center', background: '#fff' }}>
                   <strong style={{ display: 'block', fontSize: 14 }}>Reports Sought for Retrieval</strong>
                   <div style={{ fontSize: 22, fontWeight: 'bold', marginTop: 8 }}>n = {soughtForRetrieval}</div>
                 </div>

                 <div style={{ display: 'flex', alignItems: 'center', width: 320, flexShrink: 0 }}>
                   <div style={{ width: 40, borderTop: '3px solid #334e68' }}></div>
                   <div style={{ flex: 1, border: '2px solid #e12d39', padding: '12px 16px', borderRadius: 4, textAlign: 'left', background: '#fff' }}>
                     <strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Reports Not Retrieved:</strong>
                     <div style={{ fontSize: 14, fontWeight: 'bold' }}>n = {notRetrieved}</div>
                   </div>
                 </div>
               </div>

               <div style={{ width: 320 }}>
                 <VerticalLine />
               </div>

               {/* Tier 4: Eligibility (Full Text) */}
               <div style={{ display: 'flex', width: '100%' }}>
                 <div style={{ width: 320, flexShrink: 0, border: '3px solid #334e68', padding: '16px 20px', borderRadius: 6, textAlign: 'center', background: '#fff' }}>
                   <strong style={{ display: 'block', fontSize: 14 }}>Reports Assessed for Eligibility</strong>
                   <div style={{ fontSize: 22, fontWeight: 'bold', marginTop: 8 }}>n = {assessedForEligibility}</div>
                 </div>

                 <div style={{ display: 'flex', width: 340, flexShrink: 0 }}>
                   <div style={{ width: 40, borderTop: '3px solid #334e68', marginTop: 35 }}></div>
                   <div style={{ flex: 1, border: '2px solid #e12d39', padding: '12px 16px', borderRadius: 4, textAlign: 'left', background: '#fff' }}>
                     <strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Reports Excluded:</strong>
                     <div style={{ fontSize: 14, marginBottom: 8, fontWeight: 'bold', color: '#c92a2a' }}>Total Excluded: n = {excludedInFullText}</div>
                     <div style={{ paddingLeft: 8, borderLeft: '2px solid #ffe3e3' }}>
                       {Array.from(exclusionReasonsMap.entries()).length === 0 && <span style={{ fontSize: 12, color: '#888' }}>No specific reasons logged</span>}
                       {Array.from(exclusionReasonsMap.entries()).map(([reason, count]) => (
                          <div key={reason} style={{ fontSize: 12, margin: '4px 0', lineHeight: 1.3 }}>• {reason}: <b>{count}</b></div>
                       ))}
                     </div>
                   </div>
                 </div>
               </div>

               <div style={{ width: 320 }}>
                 <VerticalLine />
               </div>

               {/* Tier 5: Included */}
               <div style={{ display: 'flex', width: '100%' }}>
                 <div style={{ width: 320, flexShrink: 0, border: '4px solid #2b8a3e', padding: '20px', borderRadius: 8, textAlign: 'center', background: '#ebfbee', boxShadow: '0 4px 12px rgba(43, 138, 62, 0.15)' }}>
                   <strong style={{ display: 'block', fontSize: 16, color: '#2b8a3e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Studies Included in Review</strong>
                   <div style={{ fontSize: 32, fontWeight: 'bold', marginTop: 8, color: '#1862ab' }}>n = {totalIncluded}</div>
                 </div>
               </div>

             </div>
           </div>
         </div>
      </div>
    </div>
  );
}
