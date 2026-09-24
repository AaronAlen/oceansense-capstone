const https = require('https');

const titles = [
  'File:Wreck Diving - Black sea Jacques Fraissinet 1-4.webm',
  'File:Underwater Videos 2.webm',
  'File:Underwater Videos 3.webm',
  'File:Spearfishing Madeira.webm',
  'File:Autonomous landers, Observing the deepest places on Earth.WebM'
];

titles.forEach(t => {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(t)}&prop=imageinfo&iiprop=url|size|mime`;
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
      } catch (e) {}
    });
  });
});
