import type { StatTestResult } from '../../utils/statService';
import type { GraphStyleOptions } from '../../types/GraphStyleOptions';

interface SignificanceAnnotatorProps {
  statResult: StatTestResult | null;
  options: GraphStyleOptions;
  groupNames: string[]; // List of group names corresponding to the X axis order
}

export function SignificanceAnnotator({ statResult, options, groupNames }: SignificanceAnnotatorProps) {
  if (!options.showAnnotations || !statResult || !statResult.postHoc || groupNames.length === 0) return null;

  // Filter for significant results
  const significantComparisons = statResult.postHoc.filter(ph => ph.isSignificant);
  
  if (significantComparisons.length === 0) return null;

  // Since we don't have direct access to Recharts' internal SVG coordinate system easily,
  // we build an absolute overlay. This assumes uniform distribution of groups on the X axis.
  const paddingX = 10; // approximate percentage of padding on left/right

  // Helper to find X center percentage for a group
  const getXPercent = (groupName: string) => {
    const totalGroups = groupNames.length;
    const index = groupNames.indexOf(groupName);
    if (index === -1) return 50;
    
    // Distribute remaining 80% among groups
    const availableWidth = 100 - (paddingX * 2);
    const step = availableWidth / Math.max(1, totalGroups);
    return paddingX + (step / 2) + (index * step);
  };

  // Stack brackets vertically to avoid overlap by sorting by width (gap)
  const sortedComps = [...significantComparisons].sort((a, b) => {
    const gapA = Math.abs(groupNames.indexOf(a.group1) - groupNames.indexOf(a.group2));
    const gapB = Math.abs(groupNames.indexOf(b.group1) - groupNames.indexOf(b.group2));
    return gapA - gapB; // Shorter spans first
  });

  return (
    <div style={{ position: 'absolute', top: 40, left: 0, right: 0, height: `${15 + (sortedComps.length * 20)}px`, pointerEvents: 'none', zIndex: 50 }}>
      {sortedComps.map((comp, idx) => {
        const x1 = getXPercent(comp.group1);
        const x2 = getXPercent(comp.group2);
        
        const startX = Math.min(x1, x2);
        const endX = Math.max(x1, x2);
        const width = endX - startX;
        
        // vertical stack offset (closer brackets lower down)
        const yOffset = idx * 22; 
        
        const labelText = options.annotationStyle === 'stars' 
          ? comp.significanceLevel 
          : `p = ${comp.pValue.toFixed(3)}`;

        // We use SVG for clean brackets
        return (
          <div key={`${comp.group1}-${comp.group2}`} style={{ position: 'absolute', left: `${startX}%`, width: `${width}%`, bottom: `${yOffset}px`, height: '20px' }}>
             <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                {/* Horizontal line */}
                <line x1="0" y1="15" x2="100%" y2="15" stroke="#0F172A" strokeWidth="1.5" />
                {/* Left tick */}
                <line x1="0" y1="15" x2="0" y2="22" stroke="#0F172A" strokeWidth="1.5" />
                {/* Right tick */}
                <line x1="100%" y1="15" x2="100%" y2="22" stroke="#0F172A" strokeWidth="1.5" />
             </svg>
             <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '0 4px', fontSize: '13px', fontWeight: 'bold', color: '#0F172A', lineHeight: '1' }}>
               {labelText}
             </div>
          </div>
        );
      })}
    </div>
  );
}
