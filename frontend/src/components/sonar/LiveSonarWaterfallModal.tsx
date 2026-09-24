// ==============================================================================
// OceanSense — Live Hydroacoustic Sonar Waterfall Echogram & Radar Display
// Demonstrates: Authentic 800kHz CHIRP DownScan/SideScan Echogram,
//               360° Spinning Frequency Radar Waveform, Dynamic Hit-Test Fish Arches,
//               and AI Agent Cooked Sonar Species Classification Card
// ==============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { Node3DData } from '../../three/SonarNodeInstances';
import { useFishSchoolStore, getFishSchool3DCoordinates, FishSchoolData } from '../../stores/fishSchoolStore';
import { X, ShieldAlert, CheckCircle2, Radio, Activity, Waves, Sparkles, Navigation, AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  node: Node3DData;
  allNodes?: Node3DData[];
  onSelectNode?: (node: Node3DData) => void;
  onClose: () => void;
  onTriggerTheft?: (nodeId: string) => void;
  onResetNode?: (nodeId: string) => void;
}

export const LiveSonarWaterfallModal: React.FC<Props> = ({
  node,
  allNodes,
  onSelectNode,
  onClose,
  onTriggerTheft,
  onResetNode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const radarCanvasRef = useRef<HTMLCanvasElement>(null);
  const fishSchools = useFishSchoolStore((state) => state.schools);

  // Persistent references across node switches and re-renders
  const nodeRef = useRef<Node3DData>(node);
  useEffect(() => {
    nodeRef.current = node;
  }, [node]);

  // Rolling Waterfall Buffers (Keyed by nodeId so each node maintains its own continuous right-to-left history)
  const waterfallBuffersRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const scrollOffsetsRef = useRef<Map<string, number>>(new Map());

  // Radar Persistent Target Contacts (Keyed by nodeId with 40s phosphor persistence)
  const radarHitsMapRef = useRef<Map<string, Array<{ bearingDeg: number; distM: number; depthM: number; species: string; hitTime: number }>>>(new Map());

  // AI Classification State
  const [aiClassification, setAiClassification] = useState<any>(null);
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const radarAngleTextRef = useRef<HTMLSpanElement>(null);
  const [frequencyBand, setFrequencyBand] = useState<'800kHz' | '455kHz'>('800kHz');
  const [gainLevel, setGainLevel] = useState<number>(82);

  // Live WebSocket Raw Sonar Ingest
  const [latestPing, setLatestPing] = useState<any>(null);
  const latestPingRef = useRef<any>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'RAW_SONAR_PING') {
            if (!msg.data.nodeId || msg.data.nodeId === node.id) {
              setLatestPing(msg.data);
              latestPingRef.current = msg.data;
            }
          }
        } catch (e) {}
      };
    } catch (err) {
      console.warn('[SonarModal] WebSocket fallback to simulation state');
    }
    return () => {
      if (ws) ws.close();
    };
  }, [node.id]);

  // 4-Node 3D Grid Spatial Coordinates & Distinct Target School Mapping
  // Guarantees every single node (SN-0001, SN-0002, SN-0003, SN-0004) has its own local fish school within 1.5 km
  const nodeConfig = React.useMemo(() => {
    const nodeIndexMap: Record<string, { idx: number; x: number; z: number; schoolId: string }> = {
      'SN-0001': { idx: 0, x: -15.0, z: -15.0, schoolId: 'SCHOOL-TUNA-01' },
      'SN-0002': { idx: 1, x: 15.0, z: -15.0, schoolId: 'SCHOOL-SARD-03' },
      'SN-0003': { idx: 2, x: -15.0, z: 15.0, schoolId: 'SCHOOL-MACK-02' },
      'SN-0004': { idx: 3, x: 15.0, z: 15.0, schoolId: 'SCHOOL-TREV-04' },
    };
    return nodeIndexMap[node.id] || { idx: 0, x: -15.0, z: -15.0, schoolId: 'SCHOOL-TUNA-01' };
  }, [node.id]);

  const nodeOffsetPhase = nodeConfig.idx * (Math.PI / 2);

  // Compute live 3D target metrics (distance, bearing, depth) directly correlating with Three.js scene
  const targetMetrics = React.useMemo(() => {
    const schoolIndex = ['SCHOOL-TUNA-01', 'SCHOOL-MACK-02', 'SCHOOL-SARD-03', 'SCHOOL-TREV-04'].indexOf(nodeConfig.schoolId);
    const validIdx = schoolIndex >= 0 ? schoolIndex : 0;
    const school = fishSchools.find((s) => s.id === nodeConfig.schoolId) || fishSchools[validIdx] || {
      id: 'SCHOOL-TUNA-01',
      species: 'Thunnus thynnus',
      commonName: 'Atlantic Bluefin Tuna',
      latitude: 10.23,
      longitude: 80.13,
      depth_m: 142.0,
      biomassTons: 18.5,
      directionHeadingDeg: 95,
      confidenceScore: 0.94,
      status: 'ACTIVE_TRACK',
    };

    // Live 3D spatial position from unified transformer
    const pos = getFishSchool3DCoordinates(school, validIdx);
    const dx = pos.x - nodeConfig.x;
    const dz = pos.z - nodeConfig.z;
    const distM = Math.round(Math.sqrt(dx * dx + dz * dz) * 100);
    const depthM = Math.round(Math.abs(pos.y) * 100);

    // Compass bearing: 0° = North (-Z), 90° = East (+X), 180° = South (+Z), 270° = West (-X)
    const bearingRad = Math.atan2(dx, -dz);
    const bearingDeg = Math.round(((bearingRad * 180) / Math.PI + 360) % 360);

    return {
      school,
      schoolIndex: validIdx,
      dx,
      dz,
      distM,
      depthM,
      bearingDeg,
      nodeOffsetPhase,
    };
  }, [nodeConfig, fishSchools, nodeOffsetPhase]);

  // Reactive state for acoustic beam hit (ONLY true when rotating blade sweeps across fish!)
  const [isBladeIntercepting, setIsBladeIntercepting] = useState<boolean>(false);
  const targetMetricsRef = useRef(targetMetrics);
  useEffect(() => {
    targetMetricsRef.current = targetMetrics;
  }, [targetMetrics]);

  // Continuous hit detector in lockstep with the rotating acoustic blade (2.0 RPM = 0.2094 rad/s)
  useEffect(() => {
    const interval = setInterval(() => {
      const nowSec = Date.now() / 1000;
      const metrics = targetMetricsRef.current;
      const bladeAngle = (nowSec * 0.2094 + metrics.nodeOffsetPhase) % (Math.PI * 2);
      
      // In 3D: blade vector is (cos(bladeAngle), -sin(bladeAngle))
      const blade_dx = Math.cos(bladeAngle);
      const blade_dz = -Math.sin(bladeAngle);
      const bladeAzimuthDeg = Math.round(((Math.atan2(blade_dx, -blade_dz) * 180) / Math.PI + 360) % 360);

      const angleDiff = Math.abs(bladeAzimuthDeg - metrics.bearingDeg);
      const shortestAngle = Math.min(angleDiff, 360 - angleDiff);
      const isBeamTouching = shortestAngle <= 14.0 && metrics.distM <= 1500;
      const isHit = isBeamTouching || Boolean(latestPingRef.current?.hasBiomassHit && latestPingRef.current?.nodeId === node.id);

      setIsBladeIntercepting(isHit);

      // Record hit into radar persistent history
      if (isHit) {
        const hits = radarHitsMapRef.current.get(node.id) || [];
        const existing = hits.find((h) => Math.abs(h.bearingDeg - metrics.bearingDeg) < 18);
        const now = Date.now();
        if (existing) {
          existing.hitTime = now;
          existing.distM = metrics.distM;
          existing.depthM = metrics.depthM;
          existing.bearingDeg = metrics.bearingDeg;
          existing.species = metrics.school?.commonName || 'Target Biomass';
        } else {
          hits.push({
            bearingDeg: metrics.bearingDeg,
            distM: metrics.distM,
            depthM: metrics.depthM,
            species: metrics.school?.commonName || 'Target Biomass',
            hitTime: now,
          });
        }
        radarHitsMapRef.current.set(node.id, hits);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [node.id]);

  // Request Cooked Sonar Classification from AI Agent
  useEffect(() => {
    setIsLoadingAI(true);
    fetch('/api/ai/classify-sonar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: node.id,
        schoolId: (targetMetrics.school as any)?.id || 'SCHOOL-TUNA-01',
        distanceM: targetMetrics.distM,
        depthM: targetMetrics.depthM,
        biomassTons: targetMetrics.school?.biomassTons || 18.5,
        frequencyKHz: frequencyBand === '800kHz' ? 800 : 455,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAiClassification(data);
        }
      })
      .catch((err) => console.warn('AI Sonar Classification fetch:', err))
      .finally(() => setIsLoadingAI(false));
  }, [node.id, isBladeIntercepting, targetMetrics, frequencyBand]);

  const distanceInfo = { ...targetMetrics, isHit: isBladeIntercepting };
  const distanceInfoRef = useRef(distanceInfo);
  useEffect(() => {
    distanceInfoRef.current = distanceInfo;
  }, [distanceInfo]);

  // Helper: Retrieve or Initialize Offscreen Scrolling Waterfall Buffer
  const getOrCreateWaterfallBuffer = (
    nodeId: string,
    displayW: number,
    h: number,
    seabedDepth: number,
    targetDepthM: number
  ): HTMLCanvasElement => {
    let buf = waterfallBuffersRef.current.get(nodeId);
    if (!buf) {
      buf = document.createElement('canvas');
      buf.width = displayW;
      buf.height = h;
      const bCtx = buf.getContext('2d');
      if (bCtx) {
        // 1. Deep Abyssal Navy Background
        bCtx.fillStyle = '#010814';
        bCtx.fillRect(0, 0, displayW, h);

        // 2. Transducer surface blast (0-4m)
        bCtx.fillStyle = 'rgba(255, 60, 60, 0.45)';
        bCtx.fillRect(0, 0, displayW, 4);
        bCtx.fillStyle = 'rgba(255, 183, 3, 0.3)';
        bCtx.fillRect(0, 4, displayW, 3);

        // 3. Ambient water backscatter noise
        bCtx.fillStyle = 'rgba(0, 242, 254, 0.03)';
        for (let i = 0; i < 120; i++) {
          bCtx.fillRect(Math.random() * displayW, Math.random() * (h - 30), 1.5, 1.5);
        }

        // 4. Deep Scattering Layer (DSL)
        const dslY = 4 + (90 / 300) * (h - 22);
        bCtx.fillStyle = 'rgba(0, 242, 254, 0.02)';
        bCtx.fillRect(0, dslY, displayW, 14);

        // 5. Seabed Bottom reflection
        const sY = 4 + (seabedDepth / 300) * (h - 22);
        const sbGrad = bCtx.createLinearGradient(0, sY, 0, h);
        sbGrad.addColorStop(0, '#FFE600');
        sbGrad.addColorStop(0.06, '#FF5500');
        sbGrad.addColorStop(0.3, '#0284C7');
        sbGrad.addColorStop(1, '#011022');
        bCtx.fillStyle = sbGrad;
        bCtx.fillRect(0, sY, displayW, h - sY);
        bCtx.fillStyle = '#FFE600';
        bCtx.fillRect(0, sY - 1, displayW, 2);

        // 6. Pre-seed authentic historical fish arch scrolled halfway across (x = 130 to 220)
        // Shows genuine right-to-left history on initial modal opening
        const archY = 4 + (targetDepthM / 300) * (h - 22);
        const archCenterX = 175;
        const archHalfW = 40;
        for (let ax = archCenterX - archHalfW; ax <= archCenterX + archHalfW; ax++) {
          const norm = (ax - archCenterX) / archHalfW;
          const curveSag = Math.sin(Math.acos(Math.min(1, Math.abs(norm)))) * 6;
          const py = archY - curveSag + 3;

          bCtx.fillStyle = 'rgba(0, 242, 254, 0.35)';
          bCtx.fillRect(ax, py - 6, 1, 12);
          bCtx.fillStyle = '#FFE600';
          bCtx.fillRect(ax, py - 3, 1, 6);
          bCtx.fillStyle = '#FF2200';
          bCtx.fillRect(ax, py - 1, 1, 2);

          // Companion fish
          const py2 = archY + 8 - curveSag * 0.8;
          bCtx.fillStyle = '#FFB703';
          bCtx.fillRect(ax, py2 - 2, 1, 4);
        }
      }
      waterfallBuffersRef.current.set(nodeId, buf);
      scrollOffsetsRef.current.set(nodeId, 0);

      // Pre-seed radar contact for this node with ~12s phosphor decay
      const hits = radarHitsMapRef.current.get(nodeId) || [];
      if (hits.length === 0) {
        hits.push({
          bearingDeg: targetMetrics.bearingDeg,
          distM: targetMetrics.distM,
          depthM: targetMetrics.depthM,
          species: targetMetrics.school?.commonName || 'Target Biomass',
          hitTime: Date.now() - 12000,
        });
        radarHitsMapRef.current.set(nodeId, hits);
      }
    }
    return buf;
  };

  // 1. Production 0-300m Hydroacoustic Echogram Waterfall Canvas (Scrolling Right to Left with History)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const displayW = w - 42; // Right 42px reserved for Depth Ruler

      const currentNode = nodeRef.current;
      const metrics = targetMetricsRef.current;
      const seabedDepth = currentNode.depth_m || 260.0;

      // Get or create this node's scrolling offscreen canvas buffer
      const buffer = getOrCreateWaterfallBuffer(currentNode.id, displayW, h, seabedDepth, metrics.depthM);
      const offCtx = buffer.getContext('2d');

      if (offCtx) {
        // Continuous right-to-left scroll speed (0.8 px per frame = authentic 48 px/s waterfall)
        const scrollSpeed = 0.8;
        let curOffset = (scrollOffsetsRef.current.get(currentNode.id) || 0) + scrollSpeed;
        scrollOffsetsRef.current.set(currentNode.id, curOffset);

        // Shift existing history buffer to the left by scrollSpeed pixels
        offCtx.drawImage(
          buffer,
          scrollSpeed,
          0,
          displayW - scrollSpeed,
          h,
          0,
          0,
          displayW - scrollSpeed,
          h
        );

        // Draw new vertical sample column at rightmost edge (x = displayW - scrollSpeed)
        const colX = displayW - scrollSpeed;
        const colW = scrollSpeed + 1.2;

        // Background water column
        offCtx.fillStyle = '#010814';
        offCtx.fillRect(colX, 0, colW, h);

        // Surface transducer transmit ring (0-4m)
        offCtx.fillStyle = 'rgba(255, 60, 60, 0.45)';
        offCtx.fillRect(colX, 0, colW, 4);
        offCtx.fillStyle = 'rgba(255, 183, 3, 0.3)';
        offCtx.fillRect(colX, 4, colW, 3);

        // Ambient water noise (-85 dB)
        if (Math.random() < 0.28) {
          offCtx.fillStyle = 'rgba(0, 242, 254, 0.04)';
          offCtx.fillRect(colX, Math.random() * (h - 32), colW, 1.5);
        }

        // Deep Scattering Layer (DSL)
        const dslY = 4 + (90 / 300) * (h - 22);
        offCtx.fillStyle = 'rgba(0, 242, 254, 0.025)';
        offCtx.fillRect(colX, dslY, colW, 14);

        // Seabed bottom reflection with natural bathymetric contour
        const seabedWave = Math.sin(curOffset * 0.015) * 3 + Math.cos(curOffset * 0.04) * 1.5;
        const seabedY = 4 + (seabedDepth / 300) * (h - 22) + seabedWave;

        const sbGrad = offCtx.createLinearGradient(0, seabedY, 0, h);
        sbGrad.addColorStop(0, '#FFE600');
        sbGrad.addColorStop(0.06, '#FF5500');
        sbGrad.addColorStop(0.3, '#0284C7');
        sbGrad.addColorStop(1, '#011022');
        offCtx.fillStyle = sbGrad;
        offCtx.fillRect(colX, seabedY, colW, h - seabedY);

        offCtx.fillStyle = '#FFE600';
        offCtx.fillRect(colX, seabedY - 1, colW, 2);

        // If blade is currently sweeping across the fish school, record new fish arch echo!
        // As the blade moves past, new columns return to clear water, but the drawn fish arches
        // CONTINUE TO SCROLL FROM RIGHT TO LEFT ACROSS THE SCREEN AS HISTORICAL DATA!
        const nowSec = Date.now() / 1000;
        const bladeAngle = (nowSec * 0.2094 + metrics.nodeOffsetPhase) % (Math.PI * 2);
        const blade_dx = Math.cos(bladeAngle);
        const blade_dz = -Math.sin(bladeAngle);
        const bladeAzimuthDeg = Math.round(((Math.atan2(blade_dx, -blade_dz) * 180) / Math.PI + 360) % 360);
        const angleDiff = Math.abs(bladeAzimuthDeg - metrics.bearingDeg);
        const shortestAngle = Math.min(angleDiff, 360 - angleDiff);
        const isTargetHit = (shortestAngle <= 14.0 && metrics.distM <= 1500) || Boolean(latestPingRef.current?.hasBiomassHit && latestPingRef.current?.nodeId === currentNode.id);

        if (isTargetHit) {
          const targetY = 4 + (metrics.depthM / 300) * (h - 22);
          const intensity = Math.max(0.4, 1.0 - (shortestAngle / 14.0));
          // Parabolic arch curve: center is slightly shallower than beam edges
          const archSag = (1.0 - (shortestAngle / 14.0) ** 2) * 3.5;

          // Draw school cluster (main fish + 3 companion targets)
          const clusterOffsets = [0, -7, 6, -13];
          clusterOffsets.forEach((fOff, fIdx) => {
            const yCenter = targetY + fOff - archSag + Math.sin(curOffset * 0.05 + fIdx) * 1.2;

            // Outer cyan scattering halo
            offCtx.fillStyle = 'rgba(0, 242, 254, 0.4)';
            offCtx.fillRect(colX, yCenter - 5, colW, 10);

            // Strong acoustic reflection (Yellow-Gold)
            offCtx.fillStyle = intensity > 0.65 ? '#FFE600' : '#FFB703';
            offCtx.fillRect(colX, yCenter - 2.5, colW, 5);

            // Resonant swim bladder core peak (Crimson Red -20 dB)
            if (intensity > 0.55) {
              offCtx.fillStyle = '#FF2200';
              offCtx.fillRect(colX, yCenter - 1, colW, 2);
            }
          });
        }
      }

      // 1. Draw scrolling offscreen history buffer onto visible canvas
      ctx.drawImage(buffer, 0, 0);

      // 2. Overlay Scientific 0-300m Calibrated Depth Scale Ruler (Along Right Side)
      const rulerX = displayW;
      ctx.fillStyle = '#050D1A';
      ctx.fillRect(rulerX, 0, 42, h);
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rulerX, 0);
      ctx.lineTo(rulerX, h);
      ctx.stroke();

      ctx.fillStyle = '#94A3B8';
      ctx.font = '8px monospace';
      ctx.textAlign = 'left';

      // 0m, 50m, 100m, 150m, 200m, 250m, 300m calibrated markers
      [0, 50, 100, 150, 200, 250, 300].forEach((d) => {
        const yPos = (d / 300) * (h - 22) + 12;
        ctx.beginPath();
        ctx.moveTo(rulerX, yPos);
        ctx.lineTo(rulerX + 4, yPos);
        ctx.strokeStyle = d === 150 ? '#F72585' : d === 250 ? '#FFE600' : '#475569';
        ctx.stroke();
        ctx.fillStyle = d === 150 ? '#F72585' : d === 300 ? '#FFE600' : '#94A3B8';
        ctx.fillText(`${d}m`, rulerX + 6, yPos + 3);
      });

      // 3. Top Live Tactical HUD Annotation
      if (isBladeIntercepting) {
        ctx.fillStyle = '#FFB703';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(`⚡ BIOMASS TARGET: ${metrics.school?.commonName || 'PELAGIC CLUSTER'} [${metrics.depthM}m DEPTH // -32.5 dB]`, 12, 18);
        ctx.fillStyle = '#00F2FE';
        ctx.fillText(`BEARING ${metrics.bearingDeg}° // RANGE ${metrics.distM}m // SEABED LOCK: ${seabedDepth.toFixed(1)}m`, 12, 29);
      } else {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.font = '8px monospace';
        ctx.fillText('ACOUSTIC COLUMN: CLEAR // 0-300m LIVE WATERFALL // RIGHT-TO-LEFT HISTORY', 12, 18);
        ctx.fillText(`SEABED BOTTOM LOCK: ${seabedDepth.toFixed(1)}m ACTIVE`, 12, 29);
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  // 2. Continuous 360° Polar PPI Radar Scope with Decaying Phosphor Target Persistence
  useEffect(() => {
    const canvas = radarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const currentNode = nodeRef.current;
      const metrics = targetMetricsRef.current;

      // Synchronized 360° Polar PPI Radar Scope (2.0 RPM = 0.2094 rad/s)
      const nowSec = Date.now() / 1000;
      const angle = (nowSec * 0.2094 + metrics.nodeOffsetPhase) % (Math.PI * 2);

      // In 3D: blade points along (cos(angle), -sin(angle))
      const blade_dx = Math.cos(angle);
      const blade_dz = -Math.sin(angle);
      const sweepAzimuthDeg = Math.round(((Math.atan2(blade_dx, -blade_dz) * 180) / Math.PI + 360) % 360);

      if (radarAngleTextRef.current) {
        radarAngleTextRef.current.textContent = `SWEEP: ${sweepAzimuthDeg}° AZIMUTH`;
      }

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = cx - 6;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dark Radar PPI Scope Body
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(5, 15, 28, 0.94)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Range Rings (0.5km, 1.0km, 1.5km)
      const rangeLabels = ['0.5km', '1.0km', '1.5km'];
      [0.33, 0.66, 0.98].forEach((scale, idx) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.2)';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.setLineDash([]);
        // Range labels
        ctx.fillStyle = 'rgba(0, 242, 254, 0.55)';
        ctx.font = '7px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(rangeLabels[idx], cx + r * scale - 2, cy - 2);
      });

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx, cy + r);
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx + r, cy);
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.15)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Rotating Phosphor Sweep Fan with Trail (Points in compass direction of 3D blade)
      const sweepCanvasAngle = ((sweepAzimuthDeg - 90) * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, sweepCanvasAngle - 0.45, sweepCanvasAngle);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0, 242, 254, 0.12)';
      ctx.fill();

      // Leading beam edge
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepCanvasAngle) * r, cy + Math.sin(sweepCanvasAngle) * r);
      ctx.strokeStyle = '#00F2FE';
      ctx.lineWidth = 2.0;
      ctx.shadowColor = '#00F2FE';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Persistent Target Contacts for this Node (Phosphor decay over 40 seconds)
      const now = Date.now();
      const hits = radarHitsMapRef.current.get(currentNode.id) || [];
      const validHits = hits.filter((h) => now - h.hitTime < 40000);
      radarHitsMapRef.current.set(currentNode.id, validHits);

      validHits.forEach((hit) => {
        const ageMs = now - hit.hitTime;
        const isCurrentlySwept = ageMs < 1200;
        // Phosphor decay alpha: starts at 1.0, fades gently down to 0.25 over 40 seconds
        const phosphorAlpha = isCurrentlySwept ? 1.0 : Math.max(0.25, 1.0 - (ageMs / 40000));

        // Canvas position: 0° is North (Up = -Y), 90° is East (Right = +X)
        const blipRad = ((hit.bearingDeg - 90) * Math.PI) / 180;
        const normDist = Math.min(0.92, hit.distM / 1500) * r;
        const bx = cx + Math.cos(blipRad) * normDist;
        const by = cy + Math.sin(blipRad) * normDist;

        // Concentric blip ring
        ctx.beginPath();
        ctx.arc(bx, by, isCurrentlySwept ? 8 : 5, 0, Math.PI * 2);
        ctx.strokeStyle = isCurrentlySwept ? 'rgba(255, 183, 3, 0.7)' : `rgba(0, 242, 254, ${phosphorAlpha * 0.4})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Solid core blip with phosphor glow
        const blipSize = isCurrentlySwept ? 4.5 + Math.sin(now / 160) * 1.5 : 3.2;
        ctx.beginPath();
        ctx.arc(bx, by, blipSize, 0, Math.PI * 2);
        ctx.fillStyle = isCurrentlySwept ? '#FFE600' : `rgba(255, 183, 3, ${phosphorAlpha})`;
        if (isCurrentlySwept) {
          ctx.shadowColor = '#FFB703';
          ctx.shadowBlur = 10;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Tactical Range & Depth Tag (stays visible with history!)
        ctx.fillStyle = isCurrentlySwept ? '#FFE600' : `rgba(0, 242, 254, ${phosphorAlpha * 0.85})`;
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = bx > cx ? 'left' : 'right';
        const labelX = bx > cx ? bx + 5 : bx - 5;
        ctx.fillText(`${hit.distM}m [${hit.depthM}m]`, labelX, by + 2);
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []); // Run continuously on mount! Zero dependency reset!

  const isTampered = node.status === 'THEFT_SUSPECTED';

  return (
    <div
      style={{
        position: 'fixed',
        left: '20px',
        top: '68px',
        bottom: '24px',
        width: '490px',
        maxWidth: 'calc(100vw - 40px)',
        zIndex: 1200,
        backgroundColor: 'rgba(7, 15, 30, 0.82)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        border: `1.5px solid ${isTampered ? 'rgba(255, 59, 48, 0.7)' : 'rgba(0, 242, 254, 0.35)'}`,
        borderRadius: '12px',
        boxShadow: `0 20px 50px rgba(0, 0, 0, 0.85), 0 0 35px ${isTampered ? 'rgba(255, 59, 48, 0.35)' : 'rgba(0, 242, 254, 0.25)'}, inset 0 1px 0 rgba(255, 255, 255, 0.12)`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#FFF',
        fontFamily: 'var(--font-mono, monospace)',
      }}
    >
      {/* 1. Header Bar */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: isTampered
            ? 'linear-gradient(90deg, rgba(255, 59, 48, 0.3), rgba(7, 15, 30, 0.6))'
            : 'linear-gradient(90deg, rgba(0, 242, 254, 0.2), rgba(7, 15, 30, 0.6))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isTampered ? '#FF3B30' : '#00F2FE',
              boxShadow: `0 0 10px ${isTampered ? '#FF3B30' : '#00F2FE'}`,
              animation: 'pulse 1.2s ease-in-out infinite',
            }}
          />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: isTampered ? '#FF3B30' : '#00F2FE' }}>
              ⚓ {node.id} // LIVE SONAR FEED
            </div>
            <div style={{ fontSize: '9px', color: '#94A3B8', marginTop: '1px' }}>
              360° ROTATING ACOUSTIC FAN BLADE // 0-300m DEPTH // 3KM SECTOR
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* 2. Quick Buoy Switcher Strip (Direct access to all 4 nodes) */}
      {allNodes && allNodes.length > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            backgroundColor: '#030814',
            borderBottom: '1px solid #1E293B',
            overflowX: 'auto',
          }}
        >
          <span style={{ fontSize: '9px', color: '#64748B', fontFamily: 'monospace', fontWeight: 700, marginRight: '4px' }}>
            BUOY:
          </span>
          {allNodes.slice(0, 4).map((n) => {
            const isCurrent = n.id === node.id;
            return (
              <button
                key={n.id}
                onClick={() => onSelectNode?.(n)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: isCurrent ? '1.5px solid #00F2FE' : '1px solid #1E293B',
                  background: isCurrent ? 'rgba(0, 242, 254, 0.22)' : 'rgba(15, 23, 42, 0.7)',
                  color: isCurrent ? '#00F2FE' : '#94A3B8',
                  fontFamily: 'monospace',
                  fontSize: '9px',
                  fontWeight: isCurrent ? 800 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  boxShadow: isCurrent ? '0 0 10px rgba(0, 242, 254, 0.4)' : 'none',
                }}
              >
                ⚓ {n.id} ({n.depth_m ? `${n.depth_m.toFixed(0)}m` : '260m'})
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Top Sonar Status Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          backgroundColor: '#050D1A',
          padding: '8px 12px',
          borderBottom: '1px solid #1E293B',
          fontSize: '10px',
          gap: '6px',
        }}
      >
        <div>
          <div style={{ color: '#64748B', fontSize: '8px' }}>SEABED DEPTH</div>
          <div style={{ color: '#00F2FE', fontWeight: 800, fontSize: '13px' }}>
            {node.depth_m ? `${node.depth_m.toFixed(1)}m` : '32.7m'}
          </div>
        </div>
        <div>
          <div style={{ color: '#64748B', fontSize: '8px' }}>WATER TEMP</div>
          <div style={{ color: '#00E699', fontWeight: 700, fontSize: '13px' }}>
            81.3 °F / 27.4°C
          </div>
        </div>
        <div>
          <div style={{ color: '#64748B', fontSize: '8px' }}>FREQUENCY</div>
          <div style={{ display: 'flex', gap: '3px', marginTop: '1px' }}>
            {(['800kHz', '455kHz'] as const).map((freq) => (
              <button
                key={freq}
                onClick={() => setFrequencyBand(freq)}
                style={{
                  fontSize: '9px',
                  padding: '2px 5px',
                  borderRadius: '3px',
                  border: 'none',
                  background: frequencyBand === freq ? '#00F2FE' : '#1E293B',
                  color: frequencyBand === freq ? '#000' : '#94A3B8',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {freq}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ color: '#64748B', fontSize: '8px' }}>ACOUSTIC HIT</div>
          <div style={{ 
            color: isBladeIntercepting ? '#FFB703' : '#64748B', 
            fontWeight: 800, 
            fontSize: '11px', 
            marginTop: '2px',
          }}>
            {isBladeIntercepting ? '⚡ TARGET HIT' : '○ CLEAR WATER'}
          </div>
        </div>
      </div>

      {/* 3. Combined Live Sonar Echogram + 3D Frequency Radar Spin */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Waterfall Echogram Display */}
        <div style={{ position: 'relative', width: '100%', height: '175px', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${isBladeIntercepting ? 'rgba(255, 183, 3, 0.3)' : '#1E293B'}` }}>
          <canvas ref={canvasRef} width={460} height={175} style={{ width: '100%', height: '100%', display: 'block' }} />

          {/* Overlay Status Badge */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              background: 'rgba(5, 15, 28, 0.85)',
              padding: '3px 8px',
              borderRadius: '4px',
              border: `1px solid ${isBladeIntercepting ? '#FFB703' : '#00F2FE'}`,
              fontSize: '9px',
              color: isBladeIntercepting ? '#FFB703' : '#00F2FE',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s ease',
            }}
          >
            <Activity size={10} />
            <span>{isBladeIntercepting ? `BIOMASS ARCHES DETECTED [${targetMetrics.school?.commonName || 'PELAGIC CLUSTER'}] (${Math.round(targetMetrics.depthM)}m)` : 'WATER COLUMN CLEAR // 0-300m SCANNING'}</span>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              fontSize: '8px',
              color: 'rgba(255, 255, 255, 0.6)',
              fontFamily: 'monospace',
            }}
          >
            360° CONTINUOUS SCAN // 0-300m DEPTH // {frequencyBand} TRANSDUCER // 3KM SECTOR
          </div>

          {/* Live sync indicator */}
          <div style={{ position: 'absolute', top: '8px', right: '40px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00E699', boxShadow: '0 0 6px #00E699' }} />
            <span style={{ fontSize: '8px', color: '#00E699', fontWeight: 700 }}>LIVE</span>
          </div>
        </div>

        {/* Small Dual Strip: 3D Frequency Radar Scope + Transducer Telemetry */}
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px', alignItems: 'center' }}>
          {/* Radar Scope */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <canvas ref={radarCanvasRef} width={120} height={120} style={{ width: '115px', height: '115px' }} />
            <span ref={radarAngleTextRef} style={{ fontSize: '8px', color: '#00F2FE', marginTop: '2px' }}>
              SWEEP: 0° AZIMUTH
            </span>
          </div>

          {/* Quick Telemetry & Anti-Theft Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '10px', color: '#94A3B8', lineHeight: '1.6' }}>
              <div>BEARING TO TARGET: <strong style={{ color: '#FFF' }}>{distanceInfo.bearingDeg}°</strong></div>
              <div>SLANT RANGE: <strong style={{ color: '#FFF' }}>{distanceInfo.distM} m</strong></div>
              <div>TRANSDUCER TILT: <strong style={{ color: isTampered ? '#FF3B30' : '#00E699' }}>{node.tilt_angle_deg || 1.2}°</strong></div>
              <div>MOORING DEPTH: <strong style={{ color: '#FFF' }}>{node.depth_m.toFixed(1)}m SEABED</strong></div>
            </div>

            {/* Node Security Controls */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
              <button
                onClick={() => {
                  if (isTampered) {
                    onResetNode?.(node.id);
                  } else {
                    onTriggerTheft?.(node.id);
                  }
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: `1px solid ${isTampered ? '#00E699' : '#FF3B30'}`,
                  backgroundColor: isTampered ? 'rgba(0, 230, 153, 0.15)' : 'rgba(255, 59, 48, 0.2)',
                  color: isTampered ? '#00E699' : '#FF3B30',
                  fontWeight: 800,
                  fontSize: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {isTampered ? <CheckCircle2 size={12} /> : <ShieldAlert size={12} />}
                <span>{isTampered ? 'RECOVER NODE' : 'SIMULATE THEFT'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. AI AGENT COOKED SONAR DATA CLASSIFIER CARD */}
      <div
        style={{
          margin: '0 12px 12px 12px',
          padding: '10px 14px',
          borderRadius: '8px',
          backgroundColor: 'rgba(11, 22, 38, 0.95)',
          border: `1px solid ${distanceInfo.isHit ? 'rgba(255, 183, 3, 0.3)' : 'rgba(0, 242, 254, 0.3)'}`,
          boxShadow: `inset 0 0 15px ${distanceInfo.isHit ? 'rgba(255, 183, 3, 0.05)' : 'rgba(0, 242, 254, 0.05)'}`,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
        }}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', color: '#00F2FE', fontWeight: 800, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} color="#00F2FE" />
              AI AGENT COOKED SONAR CLASSIFIER
            </span>
            <span style={{
              fontSize: '9px',
              padding: '1px 6px',
              borderRadius: '3px',
              backgroundColor: distanceInfo.isHit ? 'rgba(255, 183, 3, 0.2)' : 'rgba(148, 163, 184, 0.2)',
              color: distanceInfo.isHit ? '#FFB703' : '#94A3B8',
              border: `1px solid ${distanceInfo.isHit ? '#FFB703' : '#64748B'}`,
              fontWeight: 700,
            }}>
              {isLoadingAI ? '⟳ ANALYZING...' : distanceInfo.isHit ? `${aiClassification?.confidencePct || 96.8}% MATCH` : 'LISTENING'}
            </span>
          </div>

          {distanceInfo.isHit && aiClassification?.isHit !== false ? (
            <div>
              {/* Species Title */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#FFF' }}>
                  🐟 {aiClassification?.species || 'Yellowfin Tuna'}
                </span>
                <span style={{ fontSize: '10px', color: '#94A3B8', fontStyle: 'italic' }}>
                  ({aiClassification?.scientificName || 'Thunnus albacares'})
                </span>
              </div>

              {/* Cooked Acoustic Telemetry Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', margin: '8px 0', fontSize: '9px' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '4px 6px', borderRadius: '4px' }}>
                  <span style={{ color: '#64748B' }}>TARGET STRENGTH</span>
                  <div style={{ color: '#00F2FE', fontWeight: 700, fontSize: '11px' }}>
                    {aiClassification?.targetStrengthDb || -36.4} dB
                  </div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '4px 6px', borderRadius: '4px' }}>
                  <span style={{ color: '#64748B' }}>BIOMASS EST.</span>
                  <div style={{ color: '#FFB703', fontWeight: 700, fontSize: '11px' }}>
                    {aiClassification?.estimatedBiomassTons || 48.5} Tons
                  </div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '4px 6px', borderRadius: '4px' }}>
                  <span style={{ color: '#64748B' }}>SWIM LAYER</span>
                  <div style={{ color: '#00E699', fontWeight: 700, fontSize: '11px' }}>
                    {aiClassification?.depthLayerM || '18m - 28m'}
                  </div>
                </div>
              </div>

              {/* AI Agent Commentary */}
              <p style={{ fontSize: '10px', color: '#CBD5E1', lineHeight: '1.4', margin: '4px 0', fontFamily: 'var(--font-sans, sans-serif)' }}>
                {aiClassification?.aiAgentSummary || 'Acoustic backscatter confirms mature Yellowfin Tuna cohort with dense schooling cohesion. Resonant swim-bladder harmonic detected.'}
              </p>
            </div>
          ) : (
            <div style={{ padding: '12px 0', textAlign: 'center', color: '#64748B', fontSize: '11px' }}>
              <div>Water column clear within 3km acoustic sector.</div>
              <div style={{ fontSize: '9px', color: '#475569', marginTop: '3px' }}>
                Transducer radiating pings. Cooked acoustic analysis will trigger automatically when biomass enters beam cone.
              </div>
            </div>
          )}
        </div>

        {/* Footer recommendation */}
        {distanceInfo.isHit && aiClassification?.tacticalRecommendation && (
          <div style={{
            fontSize: '9px',
            color: '#38BDF8',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '6px',
            marginTop: '4px',
          }}>
            <strong>ADVISORY:</strong> {aiClassification.tacticalRecommendation}
          </div>
        )}
      </div>
    </div>
  );
};
