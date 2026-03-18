const https = require('https');

/**
 * Fetches metadata from Crossref's public API for a given DOI.
 * 
 * @param {string} doi The Digital Object Identifier to look up
 * @returns {Promise<Object>} An object mapping to our Reference schema
 */
function fetchMetadataFromDOI(doi) {
  return new Promise((resolve, reject) => {
    // Crossref recommends adding a mailto for polite pool, but we'll use a generic one for now
    const options = {
      hostname: 'api.crossref.org',
      path: `/works/${encodeURIComponent(doi)}`,
      method: 'GET',
      headers: {
        'User-Agent': 'ResearchDeskApp/1.0 (mailto:support@hemapharma.eg)'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          try {
            const errorParsed = JSON.parse(data);
            return reject(new Error(errorParsed.message || `Failed to fetch: ${res.statusCode}`));
          } catch {
            return reject(new Error(`Failed to fetch DOI metadata (Status ${res.statusCode})`));
          }
        }

        try {
          const parsed = JSON.parse(data);
          const work = parsed.message;

          // Process the authors list into a string
          let authorString = '';
          if (work.author && Array.isArray(work.author)) {
            authorString = work.author.map(a => {
              if (a.family && a.given) {
                return `${a.family} ${a.given.charAt(0)}.`;
              }
              return a.family || a.name || 'Unknown';
            }).join(', ');
          }

          // Extract basic year (prefer published-print or published-online)
          let year = '';
          const published = work['published-print'] || work['published-online'] || work['issued'];
          if (published && published['date-parts'] && published['date-parts'][0]) {
            year = published['date-parts'][0][0].toString();
          }

          // Extract title (usually an array in crossref)
          const title = (work.title && work.title[0]) || '';
          
          // Extract journal name
          const journal = (work['container-title'] && work['container-title'][0]) || '';

          resolve({
            title,
            authors: authorString,
            year,
            journal,
            doi: work.DOI || doi,
            raw_metadata: JSON.stringify(work)
          });

        } catch (e) {
          reject(new Error('Failed to parse DOI response: ' + e.message));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Network error while fetching DOI: ${e.message}`));
    });

    req.end();
  });
}

module.exports = {
  fetchMetadataFromDOI
};
