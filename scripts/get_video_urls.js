const https = require('https');

const titles = [
  'File:A school of juvenile common bleak (Alburnus alburnus) swimming in shallow water of the Drina river.webm',
  'File:Autonomous Underwater Vehicle (AUV) in the Flinders Australian Marine Park.webm',
  'File:Discovering Tenggol- Aerial Views and Submerged Delights in 4K.webm',
  'File:Sea Creatures- US and British Virgin Islands, CC BY-SA credit Kira Hammond.webm'
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
          console.log(`TITLE: ${t}\nURL: ${info?.url}\nSIZE: ${info?.size} bytes\nMIME: ${info?.mime}\n`);
        }
      } catch (e) {
        console.error(e);
      }
    });
  });
});
