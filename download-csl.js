const fs = require('fs');
const https = require('https');

const styles = [
  'apa', 'modern-language-association', 'vancouver', 'ieee', 
  'chicago-author-date', 'harvard-cite-them-right', 'nature', 
  'science', 'american-medical-association', 'american-chemical-society',
  'american-institute-of-physics', 'american-sociological-association', 
  'council-of-science-editors', 'national-library-of-medicine'
];

styles.forEach(style => {
  https.get(`https://raw.githubusercontent.com/citation-style-language/styles/master/${style}.csl`, res => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      fs.writeFileSync(`src/assets/csl-styles/${style}.csl`, data);
      console.log(`Downloaded ${style}.csl`);
    });
  }).on('error', err => {
    console.error(`Error downloading ${style}:`, err.message);
  });
});
