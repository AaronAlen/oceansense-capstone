const https = require('https');
const fs = require('fs');
const path = require('path');

const downloads = [
  {
    name: 'fish_school_live.webm',
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Atlantic_bluefin_tuna_%28Thunnus_thynnus%29.webm'
  },
  {
    name: 'fish_school_3d.webm',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Three_dimensional_fish_school_underwater_scene_%283D%29_%28M%C3%A9diHAL_4372006%29.webm'
  },
  {
    name: 'auv_trench_live.webm',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Autonomous_Underwater_Vehicle_%28AUV%29_in_the_Flinders_Australian_Marine_Park.webm'
  }
];

const destDir = path.join(__dirname, '..', 'frontend', 'public', 'assets', 'camera');

function downloadFile(item) {
  return new Promise((resolve, reject) => {
    const destPath = path.join(destDir, item.name);
    console.log(`Starting download of ${item.name} from ${item.url}...`);
    const file = fs.createWriteStream(destPath);
    
    const request = (targetUrl) => {
      https.get(targetUrl, {
        headers: {
          'User-Agent': 'OceanSenseBot/1.0 (educational marine capstone; aaron@oceansense.internal)'
        }
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          console.log(`Redirected to: ${res.headers.location}`);
          request(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Failed with status ${res.statusCode}`));
          return;
        }

        let downloaded = 0;
        const total = parseInt(res.headers['content-length'] || '0', 10);
        res.on('data', chunk => {
          downloaded += chunk.length;
          file.write(chunk);
        });

        res.on('end', () => {
          file.end();
          console.log(`Successfully downloaded ${item.name} (${(downloaded / (1024*1024)).toFixed(2)} MB)`);
          resolve();
        });
      }).on('error', err => {
        file.close();
        fs.unlink(destPath, () => {});
        reject(err);
      });
    };

    request(item.url);
  });
}

async function run() {
  for (const item of downloads) {
    try {
      await downloadFile(item);
    } catch (err) {
      console.error(`Error downloading ${item.name}:`, err.message);
    }
  }
  console.log('All downloads finished!');
}

run();
