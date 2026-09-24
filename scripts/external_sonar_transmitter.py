#!/usr/bin/env python3
"""
==============================================================================
OceanSense — External Sonar Device Transmitter Emulator
==============================================================================
Run this script on a SECOND COMPUTER, LAPTOP, or RASPBERRY PI on the same network
to stream real hydroacoustic ping packets directly into the OceanSense server.

Zero External Dependencies: Uses standard Python 3 (urllib.request, json, time).

Usage:
  python external_sonar_transmitter.py --server 192.168.81.58 --node SN-0001
==============================================================================
"""

import argparse
import json
import math
import sys
import time
import urllib.request
import urllib.error

def run_transmitter(server_ip: str, port: int, node_id: str, ping_rate_hz: float = 2.0):
    url = f"http://{server_ip}:{port}/api/nodes/{node_id}/ingest-raw-sonar"
    interval_sec = 1.0 / ping_rate_hz

    print("=" * 70)
    print(f"📡 OceanSense Sonar Hardware Transmitter Active")
    print(f"🎯 Target Server: {url}")
    print(f"⚓ Transmitting as Node: {node_id}")
    print(f"⚡ Ping Frequency: {ping_rate_hz} Hz ({interval_sec * 1000:.0f} ms period)")
    print("=" * 70)

    # Simulated target cluster within the acoustic sector (e.g. Bluefin Tuna at 142m depth, 820m range, 45° bearing)
    target_bearing_deg = 45.0
    target_range_m = 820
    target_depth_m = 142.0

    current_azimuth_deg = 0.0
    ping_id = 50000

    while True:
        try:
            ping_id += 1
            # 360° sweep rotation: 2.0 RPM = 12° per second -> 6° per 500ms ping
            current_azimuth_deg = (current_azimuth_deg + (12.0 * interval_sec)) % 360.0

            # Acoustic beam aperture: 14° beam width
            angle_diff = abs(current_azimuth_deg - target_bearing_deg)
            shortest_angle = min(angle_diff, 360.0 - angle_diff)
            has_biomass_hit = shortest_angle <= 14.0

            # Realistic acoustic intensity samples across 300 depth bins (0 to 300m)
            # Ambient water backscatter = -85 dB
            samples_db = [-85.0] * 300

            # Seabed reflection around 260m (-5 dB hard bottom lock)
            seabed_bin = 260
            for b in range(seabed_bin, 300):
                samples_db[b] = -5.0 if b == seabed_bin else -35.0

            target_detections = []
            if has_biomass_hit:
                # Swim bladder acoustic return at 142m (-32.5 dB TS)
                fish_bin = int(target_depth_m)
                for fb in range(max(0, fish_bin - 3), min(300, fish_bin + 4)):
                    samples_db[fb] = -32.5 + (3 - abs(fb - fish_bin)) * 3.5

                target_detections.append({
                    "species": "Atlantic Bluefin Tuna",
                    "depthM": target_depth_m,
                    "targetStrengthDb": -32.5,
                    "biomassTons": 18.5,
                    "bearingDeg": round(target_bearing_deg, 1),
                    "distanceM": target_range_m,
                })

            payload = {
                "pingId": ping_id,
                "timestamp": int(time.time() * 1000),
                "nodeId": node_id,
                "frequencyKhz": 800,
                "bladeAzimuthDeg": round(current_azimuth_deg, 1),
                "soundSpeedMs": 1500,
                "maxRangeM": 300,
                "seabedDepthM": 260.0,
                "hasBiomassHit": has_biomass_hit,
                "targetDetections": target_detections,
                "samplesDb": samples_db,
            }

            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=req_data,
                headers={"Content-Type": "application/json"},
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=2.0) as resp:
                status_code = resp.getcode()
                hit_indicator = "⚡ [BIOMASS HIT]" if has_biomass_hit else "○ [CLEAR WATER]"
                print(f"[{time.strftime('%H:%M:%S')}] Ping #{ping_id} | Azimuth: {current_azimuth_deg:5.1f}° | {hit_indicator} -> Server HTTP {status_code}")

        except urllib.error.URLError as e:
            print(f"⚠️ [Connection Error] Cannot reach {url}: {e}")
            print(f"   Check that Server IP '{server_ip}' is correct and port {port} is open in firewall.")
        except Exception as e:
            print(f"⚠️ [Error]: {e}")

        time.sleep(interval_sec)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OceanSense External Sonar Device Transmitter")
    parser.add_argument("--server", default="192.168.81.58", help="IP address of the OceanSense host computer")
    parser.add_argument("--port", type=int, default=5000, help="Port of OceanSense backend (default: 5000)")
    parser.add_argument("--node", default="SN-0001", help="Node ID to transmit as (SN-0001 to SN-0004)")
    parser.add_argument("--rate", type=float, default=2.0, help="Ping rate in Hz (default: 2.0 Hz = 500ms)")

    args = parser.parse_args()
    try:
        run_transmitter(args.server, args.port, args.node, args.rate)
    except KeyboardInterrupt:
        print("\nTransmitter stopped by user.")
        sys.exit(0)
