const https = require('https');

const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=categorymembers&cmtitle=Category:Videos_of_underwater_diving&cmtype=file&cmlimit=30`;
const options = { headers: { 'User-Agent': 'OceanSenseBot/1.0 (educational; aaron@oceansense.internal)' } };

https.get(url, options, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Category:Videos_of_underwater_diving:');
      json.query?.categorymembers?.forEach(m => console.log(m.title));
    } catch (e) {
      console.error(e);
    }
  });
});
