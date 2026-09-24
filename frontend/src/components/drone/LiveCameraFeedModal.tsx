// ==============================================================================
// OceanSense — AUV Live Subsea Video Stream & Computer Vision HUD
// Features: Real-Time Hardware-Accelerated Underwater Video Feed
// Real Swimming Atlantic Bluefin Tuna Footage & Real AUV Seafloor Video
// Dynamic Drone Approach Dolly Zoom & Computer Vision AI Bounding Boxes
// Multi-Channel Feeds: AUV-01 (Theft), AUV-02 (Fish), AUV-03 (Dock), AUV-04 (Trench)
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { AUVState } from '../../three/AUVDroneModels';
import { Camera, Eye, Zap, ZoomIn, ShieldAlert, Maximize2, Minimize2, Radio, Disc, X, Fish, Play, RotateCcw, Video } from 'lucide-react';

export type CameraChannel = 'AUV_OPTICAL' | 'FISH_MOVEMENTS' | 'DOCK_CRADLE' | 'TRENCH_SURVEY';
export type VisionMode = 'OPTICAL' | 'NIGHT_VISION' | 'SONAR';

interface Props {
  auv: AUVState | null;
  displayMode?: 'MINI_PIP' | 'BIG_OVERLAY';
  onExpandToBig?: () => void;
  onMinimizeToMini?: () => void;
  onClose: () => void;
  initialChannel?: CameraChannel;
  targetSchool?: any;
}

export const LiveCameraFeedModal: React.FC<Props> = ({
  auv,
  displayMode = 'BIG_OVERLAY',
  onExpandToBig,
  onMinimizeToMini,
  onClose,
  initialChannel,
  targetSchool,
}) => {
  // Automatically determine camera channel based on drone ID
  const getChannelForAUV = (drone: AUVState | null): CameraChannel => {
    if (initialChannel) return initialChannel;
    if (drone?.id === 'AUV-02') return 'FISH_MOVEMENTS';
    if (drone?.id === 'AUV-03') return 'DOCK_CRADLE';
    if (drone?.id === 'AUV-04') return 'TRENCH_SURVEY';
    return 'AUV_OPTICAL';
  };

  const [channel, setChannel] = useState<CameraChannel>(getChannelForAUV(auv));
  const [visionMode, setVisionMode] = useState<VisionMode>('OPTICAL');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isRecording, setIsRecording] = useState(true);
  const [recordSecs, setRecordSecs] = useState(154);

  // Sub-modes for video feeds: default to previous cinematic theft deduction video
  const [fishVideoSource, setFishVideoSource] = useState<'REAL_TUNA' | 'SWARM_3D'>('REAL_TUNA');
  const [theftVideoSource, setTheftVideoSource] = useState<'LIVE_DIVER' | 'CINEMATIC_SWOOP'>('CINEMATIC_SWOOP');

  // Dynamic telemetry state updated in real-time
  const [approachDist, setApproachDist] = useState<number>(38.4);
  const [droneScale, setDroneScale] = useState<number>(1.0);

  // DOM references
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Static keyframe references for fallback or cinematic approach
  const theftWideRef = useRef<HTMLImageElement | null>(null);
  const theftCloseRef = useRef<HTMLImageElement | null>(null);
  const dockRef = useRef<HTMLImageElement | null>(null);

  // Sync channel when AUV prop changes
  useEffect(() => {
    setChannel(getChannelForAUV(auv));
  }, [auv, initialChannel]);

  // Preload high-res keyframes for cinematic approach
  useEffect(() => {
    const tw = new Image();
    tw.src = '/assets/camera/theft_wide.jpg';
    tw.onload = () => { theftWideRef.current = tw; };

    const tc = new Image();
    tc.src = '/assets/camera/theft_close.jpg';
    tc.onload = () => { theftCloseRef.current = tc; };

    const dk = new Image();
    dk.src = '/assets/camera/dock_cradle_cam.jpg';
    dk.onload = () => { dockRef.current = dk; };
  }, []);

  // Recording counter
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setRecordSecs(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTimer = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const s = (totalSecs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Determine which video source to play - 100% Real Live Video on all channels
  const getVideoSrc = (): string | null => {
    if (channel === 'FISH_MOVEMENTS') {
      return fishVideoSource === 'REAL_TUNA'
        ? '/assets/camera/fish_school_live.webm'
        : '/assets/camera/fish_school_3d.webm';
    }
    if (channel === 'AUV_OPTICAL') {
      if (theftVideoSource === 'LIVE_DIVER') {
        return '/assets/camera/underwater_diver.webm';
      }
      return null; // Uses dynamic canvas cinematic approach between theft_wide.jpg & theft_close.jpg
    }
    if (channel === 'DOCK_CRADLE') {
      // Real subsea docking footage
      return '/assets/camera/auv_trench_live.webm';
    }
    if (channel === 'TRENCH_SURVEY') {
      return '/assets/camera/auv_trench_live.webm';
    }
    return '/assets/camera/auv_trench_live.webm';
  };

  const currentVideoSrc = getVideoSrc();

  // Ensure video plays immediately on source or channel change
  useEffect(() => {
    if (videoRef.current && currentVideoSrc) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentVideoSrc, channel]);

  // Dynamic approach simulation and Computer Vision HUD overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    // Organic diver regulator bubbles & turbulence particles
    const bubbles: { x: number; y: number; s: number; vy: number; vx: number; alpha: number }[] = [];
    for (let i = 0; i < 60; i++) {
      bubbles.push({
        x: Math.random() * 860,
        y: Math.random() * 480,
        s: Math.random() * 3.5 + 1.2,
        vy: -(Math.random() * 2.2 + 1.0),
        vx: (Math.random() - 0.5) * 0.5,
        alpha: Math.random() * 0.7 + 0.3,
      });
    }

    const renderHUD = () => {
      t += 0.035;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // =======================================================================
      // CHANNEL 1: AUV_OPTICAL (THEFT DETECTION: TOP-TO-LOW ANGLE CINEMATIC APPROACH)
      // =======================================================================
      if (channel === 'AUV_OPTICAL' && theftVideoSource === 'CINEMATIC_SWOOP') {
        const approachCycle = (t * 0.28) % 10; // 10s cinematic approach loop
        const isApproaching = approachCycle < 5.0;

        const cameraSwayX = Math.sin(t * 1.2) * 5;
        const cameraSwayY = Math.cos(t * 0.9) * 4;

        if (isApproaching) {
          // Top-to-low angle long distance shot of seabed
          const img = theftWideRef.current;
          if (img && img.complete && img.naturalWidth > 0) {
            const progress = approachCycle / 5.0; // 0 to 1
            const scale = 1.0 + progress * 0.45;
            const offsetX = -((w * scale - w) / 2) + cameraSwayX;
            const offsetY = -((h * scale - h) / 2) + cameraSwayY + progress * 15;
            ctx.drawImage(img, offsetX, offsetY, w * scale, h * scale);
          }
        } else {
          // Low-angle dramatic close-up of diver in black wetsuit with oxygen tank tampering with node
          const img = theftCloseRef.current;
          if (img && img.complete && img.naturalWidth > 0) {
            const scale = 1.05 + Math.sin(t * 0.5) * 0.03;
            const offsetX = -((w * scale - w) / 2) + cameraSwayX;
            const offsetY = -((h * scale - h) / 2) + cameraSwayY;
            ctx.drawImage(img, offsetX, offsetY, w * scale, h * scale);
          }
        }

        // Searchlight flickering cone from drone headlights
        const lightPulse = 0.14 + Math.sin(t * 4) * 0.04;
        const beam = ctx.createRadialGradient(w / 2, 40, 20, w / 2, h / 2, 340);
        beam.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        beam.addColorStop(0.5, `rgba(0, 242, 254, ${lightPulse})`);
        beam.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = beam;
        ctx.fillRect(0, 0, w, h);

        // Flashing red alarm beacon on node SN-0431
        const alarmAlpha = Math.sin(t * 8) > 0 ? 0.4 : 0.0;
        if (alarmAlpha > 0) {
          const redGlow = ctx.createRadialGradient(w * 0.65, h * 0.65, 5, w * 0.65, h * 0.65, 90);
          redGlow.addColorStop(0, `rgba(255, 59, 48, ${alarmAlpha})`);
          redGlow.addColorStop(1, 'rgba(255, 59, 48, 0)');
          ctx.fillStyle = redGlow;
          ctx.fillRect(0, 0, w, h);
        }

        // Diver bubbles streaming from regulator
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        bubbles.forEach((b) => {
          b.y += b.vy * 1.4;
          b.x += b.vx + Math.sin(b.y * 0.05 + t) * 0.6;
          if (b.y < 0) {
            b.y = h;
            b.x = isApproaching ? w / 2 + (Math.random() - 0.5) * 120 : w * 0.48 + (Math.random() - 0.5) * 80;
          }
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.s, 0, Math.PI * 2);
          ctx.fill();
        });

        // AI Computer Vision Bounding Box on Diver
        const boxX = isApproaching ? w * 0.38 : w * 0.24;
        const boxY = isApproaching ? h * 0.42 : h * 0.25;
        const boxW = isApproaching ? w * 0.24 : w * 0.52;
        const boxH = isApproaching ? h * 0.30 : h * 0.55;

        ctx.strokeStyle = '#FF3B30';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // HUD Tag
        ctx.fillStyle = 'rgba(255, 59, 48, 0.9)';
        ctx.fillRect(boxX, boxY - 22, 280, 22);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('TARGET: ROGUE DIVER // TAMPER IN PROGRESS', boxX + 6, boxY - 7);

        // Telemetry Sub-Tag
        ctx.fillStyle = 'rgba(11, 19, 32, 0.85)';
        ctx.fillRect(boxX, boxY + boxH, 290, 18);
        ctx.fillStyle = '#FFB703';
        ctx.font = '9px monospace';
        ctx.fillText(
          isApproaching
            ? 'APPROACH VECTOR: SINK 1.8 m/s | DIST: 38m -> 8m'
            : 'CLOSED-CIRCUIT O2 SCUBA | NODE TILT: 44.5°',
          boxX + 6,
          boxY + boxH + 13
        );
      }

      // =======================================================================
      // CHANNEL 2: FISH_MOVEMENTS (DRONE APPROACH + COMPUTER VISION AI TRACKING)
      // =======================================================================
      else if (channel === 'FISH_MOVEMENTS') {
        // Continuous drone approach loop: closes distance from 38m down to 5.5m
        const approachLoop = (t * 0.22) % 1.0; // 0 to 1 cycle
        const dist = Math.max(5.5, +(38.5 - approachLoop * 33.0).toFixed(1));
        const approachZoom = 1.0 + approachLoop * 0.38;

        setApproachDist(dist);
        setDroneScale(approachZoom);

        // Computer Vision Multi-Target Tracking Bounding Boxes
        // Smoothly oscillate across the swimming fish bodies
        const fishPanX = Math.sin(t * 1.5) * 45;
        const fishPanY = Math.cos(t * 1.2) * 15;

        // Box 1: Lead Atlantic Bluefin Tuna
        const b1X = w * 0.32 + fishPanX;
        const b1Y = h * 0.25 + fishPanY;
        const b1W = w * 0.36;
        const b1H = h * 0.44;

        ctx.strokeStyle = '#00F2FE';
        ctx.lineWidth = 2;
        ctx.strokeRect(b1X, b1Y, b1W, b1H);

        // Corner Targeting Reticles
        const cornerLen = 14;
        ctx.strokeStyle = '#F72585';
        ctx.lineWidth = 3;
        // Top-Left
        ctx.beginPath();
        ctx.moveTo(b1X, b1Y + cornerLen); ctx.lineTo(b1X, b1Y); ctx.lineTo(b1X + cornerLen, b1Y);
        ctx.stroke();
        // Top-Right
        ctx.beginPath();
        ctx.moveTo(b1X + b1W - cornerLen, b1Y); ctx.lineTo(b1X + b1W, b1Y); ctx.lineTo(b1X + b1W, b1Y + cornerLen);
        ctx.stroke();
        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(b1X, b1Y + b1H - cornerLen); ctx.lineTo(b1X, b1Y + b1H); ctx.lineTo(b1X + cornerLen, b1Y + b1H);
        ctx.stroke();
        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(b1X + b1W - cornerLen, b1Y + b1H); ctx.lineTo(b1X + b1W, b1Y + b1H); ctx.lineTo(b1X + b1W, b1Y + b1H - cornerLen);
        ctx.stroke();

        // AI Classification Badge
        ctx.fillStyle = 'rgba(247, 37, 133, 0.9)';
        ctx.fillRect(b1X, b1Y - 22, 310, 22);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('TARGET: THUNNUS THYNNUS (ATLANTIC BLUEFIN)', b1X + 6, b1Y - 7);

        // Live Approach & Biomass Metrics
        ctx.fillStyle = 'rgba(11, 19, 32, 0.85)';
        ctx.fillRect(b1X, b1Y + b1H, 310, 20);
        ctx.fillStyle = '#00F2FE';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(
          `APPROACH: ${dist.toFixed(1)}m | SPD: 14.8 KTS | BIOMASS: 18.5 T`,
          b1X + 6,
          b1Y + b1H + 14
        );

        // Center Optical Crosshair
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w / 2 - 20, h / 2); ctx.lineTo(w / 2 + 20, h / 2);
        ctx.moveTo(w / 2, h / 2 - 20); ctx.lineTo(w / 2, h / 2 + 20);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 8, 0, Math.PI * 2);
        ctx.stroke();

        // Micro-turbulence water bubbles streaming backwards from drone forward movement
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        bubbles.forEach((b) => {
          b.x -= 3.2; // Moving leftwards against forward drone push
          b.y += b.vy * 0.6;
          if (b.x < 0) {
            b.x = w;
            b.y = h * 0.5 + (Math.random() - 0.5) * 180;
          }
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.s * 0.8, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // =======================================================================
      // CHANNEL 3: DOCK_CRADLE (INDUCTIVE CHARGING CRADLE OVER REAL VIDEO)
      // =======================================================================
      else if (channel === 'DOCK_CRADLE') {
        // Concentric magnetic induction flux rings over real live video
        const fluxR = 30 + (t * 45) % 140;
        ctx.strokeStyle = `rgba(0, 230, 153, ${Math.max(0, 1 - fluxR / 140)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(w / 2, h * 0.65, fluxR * 1.8, fluxR * 0.8, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 230, 153, 0.9)';
        ctx.fillRect(w * 0.05, h * 0.12, 310, 24);
        ctx.fillStyle = '#070B14';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('INDUCTIVE CRADLE ALPHA // 48V 12A FAST CHARGE', w * 0.05 + 8, h * 0.12 + 16);
      }

      // =======================================================================
      // CHANNEL 4: TRENCH_SURVEY (DEEP ABYSSAL LASER SCANNER)
      // =======================================================================
      else if (channel === 'TRENCH_SURVEY') {
        // Laser Bathymetry Sweep Line
        const scanY = ((t * 60) % h);
        const grad = ctx.createLinearGradient(0, scanY - 15, 0, scanY + 15);
        grad.addColorStop(0, 'rgba(0, 242, 254, 0)');
        grad.addColorStop(0.5, 'rgba(0, 242, 254, 0.7)');
        grad.addColorStop(1, 'rgba(0, 242, 254, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, scanY - 15, w, 30);

        ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(w, scanY);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 242, 254, 0.9)';
        ctx.fillRect(w * 0.05, h * 0.15, 260, 22);
        ctx.fillStyle = '#050A14';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('BATHYMETRIC LIDAR SCAN // 382.4m ABYSS', w * 0.05 + 8, h * 0.15 + 15);
      }

      animId = requestAnimationFrame(renderHUD);
    };

    renderHUD();

    return () => cancelAnimationFrame(animId);
  }, [channel, fishVideoSource, theftVideoSource, zoomLevel]);

  // CSS filter applied to video based on Vision Mode
  const getVisionFilter = () => {
    switch (visionMode) {
      case 'NIGHT_VISION':
        return 'brightness(1.3) contrast(1.25) hue-rotate(85deg) saturate(2.4)';
      case 'SONAR':
        return 'contrast(1.8) invert(0.85) hue-rotate(180deg) saturate(2.8)';
      default:
        return 'contrast(1.05) saturate(1.1)';
    }
  };

  // Dynamic zoom transform for drone camera approach
  const totalScale = channel === 'FISH_MOVEMENTS' ? droneScale * zoomLevel : zoomLevel;

  // =========================================================================
  // VIEW 1: MINI PIP (CORNER OVERLAY MATCHING SCREENSHOT 1)
  // =========================================================================
  if (displayMode === 'MINI_PIP') {
    return (
      <div
        style={{
          position: 'fixed',
          top: '80px',
          right: '24px',
          width: '320px',
          height: '210px',
          background: 'rgba(11, 19, 32, 0.94)',
          border: '1px solid var(--color-electric-cyan)',
          boxShadow: '0 8px 32px rgba(0, 242, 254, 0.25)',
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 45,
          backdropFilter: 'blur(10px)',
          animation: 'fadeIn 0.2s ease',
        }}
      >
        {/* Mini Header */}
        <div style={{
          padding: '6px 10px',
          background: 'var(--color-slate-card)',
          borderBottom: '1px solid var(--color-slate-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#FF3B30',
              boxShadow: '0 0 8px #FF3B30',
            }} />
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#FFFFFF' }}>
              LIVE CAM // {auv?.id || 'AUV-02'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {onExpandToBig && (
              <button
                onClick={onExpandToBig}
                title="Expand to Big Overlay"
                style={{
                  background: 'rgba(0, 242, 254, 0.15)',
                  border: '1px solid var(--color-electric-cyan)',
                  color: 'var(--color-electric-cyan)',
                  borderRadius: '3px',
                  padding: '2px 5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Maximize2 size={11} />
              </button>
            )}
            <button
              onClick={onClose}
              title="Close Live Cam"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                fontSize: '12px',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Video + HUD Viewport */}
        <div
          onClick={onExpandToBig}
          style={{
            position: 'relative',
            flex: 1,
            cursor: 'pointer',
            background: '#000',
            overflow: 'hidden',
          }}
          title="Click to Expand Live Drone View to Big Overlay"
        >
          {/* Actual Looping Video */}
          {currentVideoSrc && (
            <video
              ref={videoRef}
              src={currentVideoSrc}
              autoPlay
              loop
              muted
              playsInline
              crossOrigin="anonymous"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${totalScale})`,
                transition: 'transform 0.15s ease-out',
                filter: getVisionFilter(),
              }}
            />
          )}

          {/* Canvas AI HUD Overlay */}
          <canvas
            ref={canvasRef}
            width={320}
            height={165}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              display: 'block',
            }}
          />

          {/* Mini Telemetry Badge */}
          <div style={{
            position: 'absolute',
            bottom: '4px',
            left: '6px',
            right: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '9px',
            fontFamily: 'var(--font-mono)',
            color: '#FFFFFF',
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '2px 6px',
            borderRadius: '3px',
            pointerEvents: 'none',
          }}>
            <span>REC ● {formatTimer(recordSecs)}</span>
            <span style={{ color: channel === 'FISH_MOVEMENTS' ? 'var(--color-aquamarine)' : 'var(--color-crimson-alert)' }}>
              {channel === 'FISH_MOVEMENTS' ? `APPROACH ${approachDist.toFixed(1)}m` : 'INTERCEPTING (8m)'}
            </span>
            <span style={{ color: 'var(--color-electric-cyan)', fontWeight: 700 }}>[ ⛶ EXPAND ]</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: BIG OVERLAY (MATCHING SCREENSHOT 2 BOUNDED POSITION)
  // =========================================================================
  return (
    <div
      style={{
        position: 'fixed',
        top: '68px',
        bottom: '80px',
        left: '30px',
        right: '30px',
        background: 'rgba(11, 19, 32, 0.96)',
        border: '1px solid var(--color-electric-cyan)',
        boxShadow: '0 0 50px rgba(0, 242, 254, 0.25)',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        backdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.25s ease',
      }}
    >
      {/* Big Modal Header Bar */}
      <div style={{
        padding: '8px 16px',
        background: 'var(--color-slate-card)',
        borderBottom: '1px solid var(--color-slate-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#FF3B30',
            boxShadow: '0 0 10px #FF3B30',
          }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>
            SUBSEA OPTICAL SURVEILLANCE // {channel}
          </span>
          <span style={{
            fontSize: '0.7rem',
            padding: '2px 8px',
            borderRadius: '3px',
            background: 'rgba(0, 242, 254, 0.15)',
            color: 'var(--color-electric-cyan)',
            fontFamily: 'var(--font-mono)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
          }}>
            LIVE 60 FPS // HARDWARE H.265 / WEBM STREAM
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onMinimizeToMini && (
            <button
              onClick={onMinimizeToMini}
              title="Minimize to Corner Mini PiP"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid var(--color-electric-cyan)',
                background: 'rgba(0, 242, 254, 0.15)',
                color: 'var(--color-electric-cyan)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <Minimize2 size={12} />
              <span>MINI PIP</span>
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '2px 8px',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Channel Switcher Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '6px 16px',
        background: 'var(--color-surface-navy)',
        borderBottom: '1px solid var(--color-slate-border)',
        overflowX: 'auto',
      }}>
        {[
          { key: 'AUV_OPTICAL', label: '🚨 CAM 1: AUV-01 Bow Optical (Scuba Diver Theft Video)' },
          { key: 'FISH_MOVEMENTS', label: '🐟 CAM 2: AUV-02 Biomass Scout (Real Swimming Tuna Video)' },
          { key: 'DOCK_CRADLE', label: '⚓ CAM 3: AUV-03 Dock Alpha Inductive Cradle' },
          { key: 'TRENCH_SURVEY', label: '🌊 CAM 4: AUV-04 Deep Trench Laser Scanner' },
        ].map((c) => (
          <button
            key={c.key}
            onClick={() => setChannel(c.key as CameraChannel)}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              borderRadius: '4px',
              border: channel === c.key ? '1px solid var(--color-electric-cyan)' : '1px solid var(--color-slate-border)',
              background: channel === c.key ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
              color: channel === c.key ? 'var(--color-electric-cyan)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              fontWeight: channel === c.key ? 700 : 400,
              whiteSpace: 'nowrap',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Sub-Mode Selector for Active Channel */}
      <div style={{
        padding: '4px 16px',
        background: 'rgba(5, 10, 20, 0.85)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
      }}>
        {channel === 'FISH_MOVEMENTS' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>STREAM SOURCE:</span>
            <button
              onClick={() => setFishVideoSource('REAL_TUNA')}
              style={{
                padding: '2px 8px',
                borderRadius: '3px',
                border: fishVideoSource === 'REAL_TUNA' ? '1px solid var(--color-aquamarine)' : '1px solid transparent',
                background: fishVideoSource === 'REAL_TUNA' ? 'rgba(0, 230, 153, 0.2)' : 'transparent',
                color: fishVideoSource === 'REAL_TUNA' ? 'var(--color-aquamarine)' : '#94A3B8',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              🐟 REAL ATLANTIC BLUEFIN TUNA (LIVE SUBSEA FOOTAGE)
            </button>
            <button
              onClick={() => setFishVideoSource('SWARM_3D')}
              style={{
                padding: '2px 8px',
                borderRadius: '3px',
                border: fishVideoSource === 'SWARM_3D' ? '1px solid var(--color-electric-cyan)' : '1px solid transparent',
                background: fishVideoSource === 'SWARM_3D' ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
                color: fishVideoSource === 'SWARM_3D' ? 'var(--color-electric-cyan)' : '#94A3B8',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              🌊 3D SUBSEA SWARM SIMULATION
            </button>
          </div>
        ) : channel === 'AUV_OPTICAL' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>THEFT VIEW MODE:</span>
            <button
              onClick={() => setTheftVideoSource('CINEMATIC_SWOOP')}
              style={{
                padding: '2px 8px',
                borderRadius: '3px',
                border: theftVideoSource === 'CINEMATIC_SWOOP' ? '1px solid #FF3B30' : '1px solid transparent',
                background: theftVideoSource === 'CINEMATIC_SWOOP' ? 'rgba(255, 59, 48, 0.2)' : 'transparent',
                color: theftVideoSource === 'CINEMATIC_SWOOP' ? '#FF3B30' : '#94A3B8',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              🚨 CRIME INTERCEPT SWOOP (TOP-TO-LOW ANGLE APPROACH)
            </button>
            <button
              onClick={() => setTheftVideoSource('LIVE_DIVER')}
              style={{
                padding: '2px 8px',
                borderRadius: '3px',
                border: theftVideoSource === 'LIVE_DIVER' ? '1px solid var(--color-electric-cyan)' : '1px solid transparent',
                background: theftVideoSource === 'LIVE_DIVER' ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
                color: theftVideoSource === 'LIVE_DIVER' ? 'var(--color-electric-cyan)' : '#94A3B8',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              🤿 LIVE DIVER SEABED CAM (UNDERWATER VIDEO)
            </button>
          </div>
        ) : (
          <div style={{ color: 'var(--color-text-muted)' }}>
            CHANNEL: {channel} // ACTIVE SUBSEA TELEMETRY
          </div>
        )}

        {channel === 'FISH_MOVEMENTS' && (
          <div style={{ color: 'var(--color-aquamarine)', fontWeight: 600 }}>
            DRONE DOLLEY-IN APPROACH: {approachDist.toFixed(1)} METERS // RATE: 2.1 m/s
          </div>
        )}
      </div>

      {/* Main Viewport + Telemetry Panel */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Center Big Video Viewport */}
        <div style={{ position: 'relative', flex: 1, background: '#000', overflow: 'hidden' }}>
          {/* Actual Looping Video */}
          {currentVideoSrc && (
            <video
              ref={videoRef}
              src={currentVideoSrc}
              autoPlay
              loop
              muted
              playsInline
              crossOrigin="anonymous"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${totalScale})`,
                transition: 'transform 0.15s ease-out',
                filter: getVisionFilter(),
              }}
            />
          )}

          {/* Computer Vision AI HUD Overlay Canvas */}
          <canvas
            ref={canvasRef}
            width={860}
            height={480}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              pointerEvents: 'none',
            }}
          />

          {/* Tactical HUD Overlay Top Bar */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '16px',
            right: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: 'var(--color-electric-cyan)',
            textShadow: '0 0 5px rgba(0, 242, 254, 0.9)',
            pointerEvents: 'none',
          }}>
            <div>
              REC ● {formatTimer(recordSecs)} | HD 1080p | 60.00 FPS
            </div>
            <div>
              DEPTH: {auv?.depth_m?.toFixed(1) || '42.5'}m | HEADING: {auv?.headingDeg || 95}° | SPD: {auv?.speedKnots?.toFixed(1) || '14.8'} KTS
            </div>
          </div>

          {/* Tactical Bottom Controls Bar (Zoom + Vision Modes) */}
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '16px',
            right: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(5, 10, 20, 0.85)',
            padding: '6px 12px',
            borderRadius: '6px',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
          }}>
            {/* Vision Mode Buttons */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['OPTICAL', 'NIGHT_VISION', 'SONAR'] as VisionMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setVisionMode(m)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    border: visionMode === m ? '1px solid var(--color-electric-cyan)' : '1px solid rgba(255,255,255,0.1)',
                    background: visionMode === m ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
                    color: visionMode === m ? 'var(--color-electric-cyan)' : '#94A3B8',
                    cursor: 'pointer',
                    fontWeight: visionMode === m ? 700 : 400,
                  }}
                >
                  {m === 'OPTICAL' && '👁️ OPTICAL'}
                  {m === 'NIGHT_VISION' && '🟢 NIGHT VISION'}
                  {m === 'SONAR' && '🔊 SONAR FALSE-COLOR'}
                </button>
              ))}
            </div>

            {/* Optical Zoom Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                ZOOM:
              </span>
              {[1, 2, 4].map((z) => (
                <button
                  key={z}
                  onClick={() => setZoomLevel(z)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '3px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    border: zoomLevel === z ? '1px solid var(--color-electric-cyan)' : '1px solid rgba(255,255,255,0.1)',
                    background: zoomLevel === z ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
                    color: zoomLevel === z ? 'var(--color-electric-cyan)' : '#94A3B8',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {z}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side Telemetry & Threat Analysis Bar */}
        <div style={{
          width: '300px',
          background: 'var(--color-slate-card)',
          borderLeft: '1px solid var(--color-slate-border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '12px',
          gap: '12px',
          overflowY: 'auto',
        }}>
          <div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
              MISSION TARGET
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {channel === 'FISH_MOVEMENTS'
                ? 'Atlantic Bluefin Tuna School Tracking'
                : channel === 'AUV_OPTICAL'
                ? 'Seabed Node Physical Security Intercept'
                : channel === 'DOCK_CRADLE'
                ? 'Dock Alpha Inductive Charge Re-alignment'
                : 'Abyssal Trench Bathymetric Laser Survey'}
            </div>
          </div>

          {/* Telemetry Metrics */}
          <div style={{
            background: 'var(--color-surface-navy)',
            borderRadius: '6px',
            padding: '10px',
            border: '1px solid var(--color-slate-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>DRONE ID:</span>
              <span style={{ color: 'var(--color-electric-cyan)', fontWeight: 700 }}>
                {auv?.id || 'AUV-02'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>CAMERA STATUS:</span>
              <span style={{ color: 'var(--color-aquamarine)', fontWeight: 700 }}>
                ACTIVE H.265 STREAM
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>BATTERY:</span>
              <span style={{ color: '#00E699' }}>
                {auv?.batteryPct?.toFixed(1) || '88.5'}%
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>PROPULSION:</span>
              <span style={{ color: '#FFB703' }}>
                {channel === 'FISH_MOVEMENTS' ? '88% FORWARD THRUST' : '45% HOVER DOCK'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>WATER CLARITY:</span>
              <span style={{ color: 'var(--color-text-primary)' }}>94.2%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>EST. DISTANCE:</span>
              <span style={{ color: 'var(--color-electric-cyan)', fontWeight: 700 }}>
                {channel === 'FISH_MOVEMENTS' ? `${approachDist.toFixed(1)}m (APPROACHING)` : '8.2m (LOCK)'}
              </span>
            </div>
          </div>

          {/* AI Detection Summary */}
          <div style={{
            background: 'var(--color-surface-navy)',
            borderRadius: '6px',
            padding: '10px',
            border: '1px solid var(--color-slate-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
              COMPUTER VISION INFERENCE
            </div>
            {channel === 'FISH_MOVEMENTS' ? (
              <>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-aquamarine)' }}>
                  ✅ Active Schooling Motion
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  YOLOv8-Marine model detected 147 moving specimens swimming at 14.8 Kts with synchronized lateral undulation.
                </div>
              </>
            ) : channel === 'AUV_OPTICAL' ? (
              <>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#FF3B30' }}>
                  ⚠️ Severe Physical Tamper Alert
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Rogue scuba diver in black tactical wetsuit with closed-circuit oxygen tank attempting unmooring of seabed node SN-0431.
                </div>
              </>
            ) : (
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Nominal station telemetry. System operates within baseline safety parameters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
