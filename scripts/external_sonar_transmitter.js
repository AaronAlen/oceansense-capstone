#!/usr/bin/env node
/**
 * ==============================================================================
 * OceanSense — External Sonar Device Transmitter Emulator (Node.js)
 * ==============================================================================
 * Run this on a SECOND COMPUTER, LAPTOP, or RASPBERRY PI on the same network
 * to stream authentic hydroacoustic raw sonar packets directly into OceanSense.
 *
 * Zero External Dependencies: Uses standard built-in 'http' module.
 *
 * Usage:
 *   node external_sonar_transmitter.js --server 192.168.81.58 --node SN-0001
 * ==============================================================================
 */

const http = require('http');

// Parse command line arguments
const args = process.argv.slice(2);
function getArg(name, defaultValue) {
  const idx = args.indexOf(name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultValue;
}

const serverHost = getArg('--server', '192.168.81.58');
const serverPort = parseInt(getArg('--port', '5000'), 10);
const targetNodeId = getArg('--node', 'SN-0001');
const pingRateHz = parseFloat(getArg('--rate', '2.0')); // 2.0 Hz = 500ms
const intervalMs = Math.round(1000 / pingRateHz);

console.log('='.repeat(70));
console.log('📡 OceanSense External Sonar Device Transmitter (Node.js)');
console.log(`🎯 Target Server: http://${serverHost}:${serverPort}/api/nodes/${targetNodeId}/ingest-raw-sonar`);
console.log(`⚓ Emulated Hardware: Hydroacoustic Transducer on ${targetNodeId}`);
console.log(`⚡ Ping Frequency: ${pingRateHz} Hz (${intervalMs} ms interval)`);
console.log('='.repeat(70));

let currentAzimuth = 0.0;
let pingId = 60000;

// Target Biomass in the Sector (Atlantic Bluefin Tuna at 142m depth, 820m range, 45° bearing)
const targetBearingDeg = 45.0;
const targetRangeM = 820;
const targetDepthM = 142.0;

function sendPing() {
  pingId++;
  // 360° rotation: 2.0 RPM = 12 deg/sec -> 6 deg per 500ms
  currentAzimuth = (currentAzimuth + (12.0 * (intervalMs / 1000))) % 360.0;

  const angleDiff = Math.abs(currentAzimuth - targetBearingDeg);
  const shortestAngle = Math.min(angleDiff, 360.0 - angleDiff);
  const hasBiomassHit = shortestAngle <= 14.0;

  // 300 calibrated decibel samples (0m to 300m)
  const samplesDb = new Array(300).fill(-85.0); // ambient water

  // Seabed bottom reflection at 260m
  const seabedBin = 260;
  for (let b = seabedBin; b < 300; b++) {
    samplesDb[b] = b === seabedBin ? -5.0 : -35.0;
  }

  const targetDetections = [];
  if (hasBiomassHit) {
    // Fish swim bladder returns at 142m
    const fishBin = Math.round(targetDepthM);
    for (let fb = Math.max(0, fishBin - 3); fb <= Math.min(299, fishBin + 3); fb++) {
      samplesDb[fb] = -32.5 + (3 - Math.abs(fb - fishBin)) * 3.5;
    }
    targetDetections.push({
      species: 'Atlantic Bluefin Tuna',
      depthM: targetDepthM,
      targetStrengthDb: -32.5,
      biomassTons: 18.5,
      bearingDeg: Math.round(targetBearingDeg * 10) / 10,
      distanceM: targetRangeM,
    });
  }

  const payload = JSON.stringify({
    pingId,
    timestamp: Date.now(),
    nodeId: targetNodeId,
    frequencyKhz: 800,
    bladeAzimuthDeg: Math.round(currentAzimuth * 10) / 10,
    soundSpeedMs: 1500,
    maxRangeM: 300,
    seabedDepthM: 260.0,
    hasBiomassHit,
    targetDetections,
    samplesDb,
  });

  const options = {
    hostname: serverHost,
    port: serverPort,
    path: `/api/nodes/${targetNodeId}/ingest-raw-sonar`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
    timeout: 2000,
  };

  const req = http.request(options, (res) => {
    const hitLabel = hasBiomassHit ? '⚡ [BIOMASS HIT]' : '○ [CLEAR WATER]';
    const timeStr = new Date().toTimeString().split(' ')[0];
    console.log(`[${timeStr}] Ping #${pingId} | Azimuth: ${currentAzimuth.toFixed(1).padStart(5)}° | ${hitLabel} -> Server HTTP ${res.statusCode}`);
    res.resume(); // drain response
  });

  req.on('error', (err) => {
    console.error(`⚠️ [Connection Error] Cannot reach ${serverHost}:${serverPort} - ${err.message}`);
  });

  req.write(payload);
  req.end();
}

// Start recurring 2.0 Hz transmission
setInterval(sendPing, intervalMs);
sendPing();
