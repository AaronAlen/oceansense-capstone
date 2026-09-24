const https = require('https');

function getCategory(cat) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=categorymembers&cmtitle=${encodeURIComponent(cat)}&cmtype=file|subcat&cmlimit=50`;
  const options = {
    headers: {
      'User-Agent': 'OceanSenseBot/1.0 (educational; aaron@oceansense.internal)'
    }
  };

  https.get(url, options, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log(`Members of ${cat}:`);
        json.query?.categorymembers?.forEach(m => console.log(`  [${m.type}] ${m.title}`));
      } catch (e) {
        console.log('Error:', data.slice(0, 200));
      }
    });
  });
}

getCategory('Category:Shoaling_and_schooling_fish');
getCategory('Category:Underwater_videos');
