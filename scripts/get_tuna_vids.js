const https = require('https');

const titles = [
  'File:Atlantic bluefin tuna (Thunnus thynnus).webm',
  'File:Sardines reacting to tuna - MBA.webm',
  'File:Spawning-Behaviour-and-Post-Spawning-Migration-Patterns-of-Atlantic-Bluefin-Tuna-(Thunnus-thynnus)-pone.0076445.s001.ogv',
  'File:Autonomous Underwater Vehicle (AUV) in the Flinders Australian Marine Park.webm'
];

titles.forEach(t => {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(t)}&prop=imageinfo&iiprop=url|size|mime|derivatives`;
  const options = { headers: { 'User-Agent': 'OceanSenseBot/1.0 (educational; aaron@oceansense.internal)' } };
  https.get(url, options, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        const pages = json.query.pages;
        for (const k in pages) {
          const info = pages[k].imageinfo?.[0];
          console.log(`TITLE: ${t}\nURL: ${info?.url}\nSIZE: ${((info?.size || 0) / (1024*1024)).toFixed(2)} MB\nMIME: ${info?.mime}\n`);
        }
      } catch (e) {
        console.error(e);
      }
    });
  });
});
