const https = require('https');

const terms = ['school fish underwater', 'shoal fish underwater', 'caranx school', 'jackfish', 'coral reef fish'];

terms.forEach(term => {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(term + ' filetype:video')}&srnamespace=6&srlimit=5`;
  const options = { headers: { 'User-Agent': 'OceanSenseBot/1.0 (educational; aaron@oceansense.internal)' } };
  https.get(url, options, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log(`=== ${term} ===`);
        json.query?.search?.forEach(s => console.log(s.title));
      } catch (e) {}
    });
  });
});
