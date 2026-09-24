const https = require('https');

function searchWiki(term) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(term + ' filetype:video')}&srnamespace=6&srlimit=20`;
  const options = { headers: { 'User-Agent': 'OceanSenseBot/1.0 (educational; aaron@oceansense.internal)' } };
  https.get(url, options, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log(`=== Results for: ${term} ===`);
        json.query?.search?.forEach(s => console.log(s.title));
      } catch (e) {
        console.error(e);
      }
    });
  });
}

searchWiki('school fish swimming');
searchWiki('tuna fish');
