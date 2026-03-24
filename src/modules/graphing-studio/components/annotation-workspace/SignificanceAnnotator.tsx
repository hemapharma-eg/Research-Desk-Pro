import type { StatTestResult } from '../../utils/statService';
import type { GraphStyleOptions } from '../../types/GraphStyleOptions';
import { getSignificanceStars } from '../../utils/statService';

interface SignificanceAnnotatorProps {
  statResult: StatTestResult | null;
  options: GraphStyleOptions;
  groupNames: string[];
}

export function SignificanceAnnotator({ statResult, options, groupNames }: SignificanceAnnotatorProps) {
  if (!statResult || !statResult.postHoc || statResult.postHoc.length === 0) {
    return null;
  }

  if (!options.showAnnotations) return null;

  // Filter to significant comparisons (or all if none significant)
  const significantPairs = statResult.postHoc.filter(ph => ph.isSignificant);
  const pairsToShow = significantPairs.length > 0 ? significantPairs : [];

  if (pairsToShow.length === 0) return null;

  // Map group names to positions
  const groupIndex = (name: string) => groupNames.indexOf(name);

  // Generate letter groupings if needed
  if (options.annotationStyle === 'letters') {
    return renderLetterGroupings(statResult, groupNames);
  }

  // Calculate bracket positions
  const brackets = pairsToShow.map((pair, idx) => {
    const g1Idx = groupIndex(pair.group1);
    const g2Idx = groupIndex(pair.group2);
    if (g1Idx === -1 || g2Idx === -1) return null;

    const leftIdx = Math.min(g1Idx, g2Idx);
    const rightIdx = Math.max(g1Idx, g2Idx);
    const n = groupNames.length;

    // Position as percentage
    const leftX = ((leftIdx + 0.5) / n) * 100;
    const rightX = ((rightIdx + 0.5) / n) * 100;
    
    const spacing = options.annotationBracketSpacing ?? 18;
    const yBase = 6 + idx * spacing; // Stack brackets vertically

    const label = options.annotationStyle === 'p-value'
      ? (pair.pValue < 0.0001 ? 'p < 0.0001' : `p = ${pair.pValue.toFixed(4)}`)
      : getSignificanceStars(pair.pValue);

    return { leftX, rightX, yBase, label, key: idx };
  }).filter((b): b is NonNullable<typeof b> => b !== null);

  const yOffset = options.annotationYOffset ?? 0;
  const spacing = options.annotationBracketSpacing ?? 18;

  return (
    <div
      className="gs-annotation-overlay"
      style={{
        position: 'absolute',
        top: `${yOffset}px`,
        left: '60px',
        right: '40px',
        height: `${Math.max(50, brackets.length * spacing + 20)}px`,
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
        {brackets.map(b => (
          <g key={b.key}>
            {/* Left leg */}
            <line
              x1={`${b.leftX}%`} y1={b.yBase + 12}
              x2={`${b.leftX}%`} y2={b.yBase + 4}
              stroke="#333" strokeWidth="1.2"
            />
            {/* Right leg */}
            <line
              x1={`${b.rightX}%`} y1={b.yBase + 12}
              x2={`${b.rightX}%`} y2={b.yBase + 4}
              stroke="#333" strokeWidth="1.2"
            />
            {/* Horizontal bar */}
            <line
              x1={`${b.leftX}%`} y1={b.yBase + 4}
              x2={`${b.rightX}%`} y2={b.yBase + 4}
              stroke="#333" strokeWidth="1.2"
            />
            {/* Label */}
            <text
              x={`${(b.leftX + b.rightX) / 2}%`}
              y={b.yBase}
              textAnchor="middle"
              fontSize="11"
              fontWeight="bold"
              fill="#333"
            >
              {b.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function renderLetterGroupings(statResult: StatTestResult, groupNames: string[]) {
  // Compact letter display: assign letters based on non-significant pairings
  const n = groupNames.length;
  if (n === 0) return null;

  // Initialize: all groups start with letter 'a'
  const assignments: string[][] = groupNames.map(() => []);
  let currentLetter = 'a';

  // Build a significance matrix
  const sigMatrix: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));
  statResult.postHoc?.forEach(ph => {
    const i = groupNames.indexOf(ph.group1);
    const j = groupNames.indexOf(ph.group2);
    if (i >= 0 && j >= 0 && ph.isSignificant) {
      sigMatrix[i][j] = true;
      sigMatrix[j][i] = true;
    }
  });

  // Simple letter grouping algorithm
  const used = new Set<number>();
  for (let i = 0; i < n; i++) {
    if (!assignments[i].length) {
      assignments[i].push(currentLetter);
    }
    for (let j = i + 1; j < n; j++) {
      if (!sigMatrix[i][j]) {
        // i and j are NOT significantly different → same group
        if (!assignments[j].includes(currentLetter)) {
          assignments[j].push(currentLetter);
        }
      }
    }
    // Check if next group needs a new letter
    if (i < n - 1) {
      const nextNeedNewLetter = assignments[i + 1].length === 0 ||
        sigMatrix[i][i + 1];
      if (nextNeedNewLetter && !used.has(i + 1)) {
        currentLetter = String.fromCharCode(currentLetter.charCodeAt(0) + 1);
        used.add(i + 1);
      }
    }
  }

  return (
    <div
      className="gs-annotation-overlay"
      style={{
        position: 'absolute',
        top: '8px',
        left: '60px',
        right: '40px',
        height: '30px',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      <svg width="100%" height="100%">
        {groupNames.map((_, i) => {
          const x = ((i + 0.5) / n) * 100;
          const letters = assignments[i].join('');
          return (
            <text
              key={i}
              x={`${x}%`}
              y="20"
              textAnchor="middle"
              fontSize="13"
              fontWeight="bold"
              fill="#333"
              fontFamily="serif"
            >
              {letters}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
