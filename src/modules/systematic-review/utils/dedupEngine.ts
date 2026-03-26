import { v4 as uuidv4 } from 'uuid';
import type { ReviewRecord, DeduplicationCluster } from '../types/ReviewModels';

// Basic string normalization for fuzzy matching
const normalize = (str: string) => {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Extremely simplified dedup engine mimicking rigorous deterministic matches
export function runDeduplication(records: ReviewRecord[]): { clusters: DeduplicationCluster[], records: ReviewRecord[] } {
  const newClusters: DeduplicationCluster[] = [];
  const updatedRecords = [...records];
  
  // Track records already grouped
  const groupedIds = new Set<string>();

  // Helper to create a cluster
  const formCluster = (matchIds: string[], basis: string, confidence: DeduplicationCluster['confidence']) => {
    if (matchIds.length < 2) return;
    
    // Check if any of these are already clustered to avoid overlap (simplified approach)
    if (matchIds.some(id => groupedIds.has(id))) return;

    const clusterId = uuidv4();
    newClusters.push({
      id: clusterId,
      recordIds: matchIds,
      confidence,
      matchingBasis: basis,
      survivorId: null,
      resolved: false
    });

    matchIds.forEach(id => {
      groupedIds.add(id);
      const rec = updatedRecords.find(r => r.id === id);
      if (rec) {
        rec.dedupClusterId = clusterId;
        rec.dedupStatus = 'duplicate';
      }
    });
  };

  // Pass 1: Exact DOI / PMID Match
  const doiMap = new Map<string, string[]>();
  const pmidMap = new Map<string, string[]>();

  records.forEach(r => {
    if (r.doi) {
      if (!doiMap.has(r.doi)) doiMap.set(r.doi, []);
      doiMap.get(r.doi)!.push(r.id);
    }
    if (r.pmid) {
      if (!pmidMap.has(r.pmid)) pmidMap.set(r.pmid, []);
      pmidMap.get(r.pmid)!.push(r.id);
    }
  });

  doiMap.forEach((ids, doi) => formCluster(ids, `Exact DOI (${doi})`, 'exact'));
  pmidMap.forEach((ids, pmid) => formCluster(ids, `Exact PMID (${pmid})`, 'exact'));

  // Pass 2: Exact Title Match (Normalized)
  const titleMap = new Map<string, string[]>();
  records.forEach(r => {
    if (!groupedIds.has(r.id) && r.title) {
      const normTitle = normalize(r.title);
      if (!titleMap.has(normTitle)) titleMap.set(normTitle, []);
      titleMap.get(normTitle)!.push(r.id);
    }
  });

  titleMap.forEach((ids) => formCluster(ids, `Exact Normalized Title`, 'very high'));

  // Pass 3: Fuzzy / Metadata Matches (Year + First Author + Similar length title)
  // Simplified O(N^2) comparison for remaining ungrouped records
  const ungrouped = records.filter(r => !groupedIds.has(r.id));
  for (let i = 0; i < ungrouped.length; i++) {
    const r1 = ungrouped[i];
    if (groupedIds.has(r1.id)) continue;
    
    const matches = [r1.id];
    
    const normTitle1 = normalize(r1.title).substring(0, 30); // Compare first 30 normalized chars
    const author1 = normalize(r1.authors).substring(0, 10);
    
    for (let j = i + 1; j < ungrouped.length; j++) {
      const r2 = ungrouped[j];
      if (groupedIds.has(r2.id)) continue;

      const normTitle2 = normalize(r2.title).substring(0, 30);
      const author2 = normalize(r2.authors).substring(0, 10);

      if (r1.year === r2.year && normTitle1 === normTitle2 && author1 === author2 && r1.year !== null) {
        matches.push(r2.id);
      }
    }

    if (matches.length > 1) {
      formCluster(matches, `Year + Author + Partial Title`, 'medium');
    }
  }

  // Label the remaining un-clustered items naturally
  updatedRecords.forEach(r => {
    if (!groupedIds.has(r.id)) {
      r.dedupStatus = 'unique';
    }
  });

  return { clusters: newClusters, records: updatedRecords };
}
