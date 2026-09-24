const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://upload.wikimedia.org/wikipedia/commons/0/02/Underwater_Videos_2.webm';
const dest = path.join(__dirname, '..', 'frontend', 'public', 'assets', 'camera', 'underwater_diver.webm');

function download(targetUrl) {
  https.get(targetUrl, {
    headers: { 'User-Agent': 'OceanSenseBot/1.0 (educational; aaron@oceansense.internal)' }
  }, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      console.log('Redirecting to:', res.headers.location);
      download(res.headers.location);
      return;
    }
    if (res.statusCode === 200) {
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('Successfully downloaded underwater_diver.webm, size:', fs.statSync(dest).size);
      });
    } else {
      console.error('Failed with status:', res.statusCode);
    }
  }).on('error', e => console.error(e));
}

download(url);
