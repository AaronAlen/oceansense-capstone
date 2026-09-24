const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://upload.wikimedia.org/wikipedia/commons/0/02/Underwater_Videos_2.webm';
const dest = path.join(__dirname, '..', 'frontend', 'public', 'assets', 'camera', 'underwater_diver.webm');

console.log('Downloading underwater_diver.webm...');
const file = fs.createWriteStream(dest);

function req(targetUrl) {
  https.get(targetUrl, { headers: { 'User-Agent': 'OceanSenseBot/1.0' } }, res => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      req(res.headers.location);
      return;
    }
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Done downloading underwater_diver.webm!');
    });
  });
}
req(url);
