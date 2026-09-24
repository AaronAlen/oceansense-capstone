// ==============================================================================
// OceanSense — Hardware Telemetry & Raw Ping 3D Digital Twin Page
// Dedicated Page: Zero Artificial Flocking Fish
// Fish rendering is 100% driven by real-time WebSocket RAW_SONAR_PING packets
// Includes full Node Detail Drawer, Sonar Waterfall Echogram, and Azimuth PPI Radar
// ==============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RawPingDigitalTwinCanvas, VisualLightingMode, CameraPreset } from '../three/RawPingDigitalTwinCanvas';
import { Node3DData } from '../three/SonarNodeInstances';
import { NodeDetailDrawer } from '../components/hud/NodeDetailDrawer';
import { LiveSonarWaterfallModal } from '../components/sonar/LiveSonarWaterfallModal';
import { useThemeStore } from '../stores/themeStore';
import {
  Radio,
  Activity,
  Server,
  Terminal,
  Zap,
  RotateCcw,
  Eye,
  Camera,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Maximize2,
  X,
  Volume2,
} from 'lucide-react';
import { wsClient } from '../services/websocket';
import { PingFishContact } from '../three/RawPingFishRenderer';

export function RawPingDigitalTwinPage() {
  const { theme } = useThemeStore();
  const visualMode: VisualLightingMode = theme === 'light' ? 'DAY' : theme === 'grayish' ? 'GRAYISH' : 'NIGHT';

  const [nodes, setNodes] = useState<Node3DData[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node3DData | null>(null);
  const [isSonarModalOpen, setIsSonarModalOpen] = useState<boolean>(false);
  const [isNodeDrawerOpen, setIsNodeDrawerOpen] = useState<boolean>(false);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('OVERVIEW');

  // Real-Time Ping Telemetry State
  const [latestPing, setLatestPing] = useState<any>(null);
  const [pingCount, setPingCount] = useState<number>(0);
  const [isInjectingTest, setIsInjectingTest] = useState<boolean>(false);
  const [showScriptModal, setShowScriptModal] = useState<boolean>(false);
  const [selectedContact, setSelectedContact] = useState<PingFishContact | null>(null);

  // Fetch initial nodes
  const fetchNodes = useCallback(async () => {
    try {
      const res = await fetch('/api/nodes/instances-3d');
      const data = await res.json();
      if (data.success && data.data) {
        setNodes(data.data);
      }
    } catch (e) {
      console.warn('Waiting for backend 3D node instances:', e);
    }
  }, []);

  useEffect(() => {
    fetchNodes();
    wsClient.connect();
  }, [fetchNodes]);

  // Handle Node Selection (Opens both HUD Drawer and Sonar Waterfall Modal)
  const handleSelectNode = useCallback((node: Node3DData | null) => {
    setSelectedNode(node);
    if (node) {
      setIsSonarModalOpen(true);
      setIsNodeDrawerOpen(true);
    }
  }, []);

  // Callback when a real ping is received via WebSocket
  const handlePingReceived = useCallback((ping: any) => {
    setLatestPing(ping);
    setPingCount((prev) => prev + 1);
  }, []);

  // Quick Action: Inject an authentic Hydroacoustic Ping into Node SN-0001
  const handleInjectTestPing = async (species: 'Tuna' | 'Mackerel' | 'Sardine') => {
    setIsInjectingTest(true);
    try {
      const depth = species === 'Tuna' ? 142 : species === 'Mackerel' ? 88 : 45;
      const dist = species === 'Tuna' ? 820 : species === 'Mackerel' ? 540 : 380;
      const bearing = species === 'Tuna' ? 45.0 : species === 'Mackerel' ? 135.0 : 280.0;
      const ts = species === 'Tuna' ? -32.5 : species === 'Mackerel' ? -42.0 : -48.5;
      const tons = species === 'Tuna' ? 18.5 : species === 'Mackerel' ? 11.2 : 6.8;
      const speciesName = species === 'Tuna' ? 'Atlantic Bluefin Tuna' : species === 'Mackerel' ? 'Indian Mackerel' : 'Pacific Sardine';

      const payload = {
        pingId: Math.floor(70000 + Math.random() * 9000),
        nodeId: 'SN-0001',
        frequencyKhz: 800,
        bladeAzimuthDeg: bearing,
        hasBiomassHit: true,
        targetDetections: [
          {
            species: speciesName,
            depthM: depth,
            targetStrengthDb: ts,
            biomassTons: tons,
            bearingDeg: bearing,
            distanceM: dist,
          },
        ],
      };

      await fetch('/api/nodes/SN-0001/ingest-raw-sonar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error('Error injecting test ping:', e);
    } finally {
      setIsInjectingTest(false);
    }
  };

  const hasBiomass = latestPing?.hasBiomassHit && latestPing?.targetDetections?.length > 0;
  const detection = hasBiomass ? latestPing.targetDetections[0] : null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: 'var(--color-abyssal-deep)' }}>
      {/* Top Banner: Mode Indicator & Live Telemetry Metrics */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 14,
          right: 14,
          zIndex: 25,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          background: 'rgba(5, 12, 26, 0.92)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 242, 254, 0.3)',
          borderRadius: '8px',
          padding: '10px 16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Left: Mode Title & Hardware Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ position: 'relative', display: 'flex', width: '10px', height: '10px' }}>
              <span style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#00F2FE', opacity: 0.75, animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
              <span style={{ position: 'relative', borderRadius: '50%', width: '10px', height: '10px', backgroundColor: '#00F2FE' }} />
            </span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.8px', color: '#FFF' }}>
                HARDWARE-DRIVEN 3D TWIN <span style={{ fontSize: '10px', color: '#00F2FE', fontWeight: 500 }}>(PURE PING TELEMETRY)</span>
              </div>
              <div style={{ fontSize: '10px', color: '#94A3B8', fontFamily: 'monospace' }}>
                ZERO ARTIFICIAL FISH • CONTACTS RENDER STRICTLY ON INCOMING ECHO PINGS
              </div>
            </div>
          </div>

          <div style={{ height: '24px', width: '1px', backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />

          {/* Real-Time Detection Pill */}
          <div
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontFamily: 'monospace',
              fontWeight: 700,
              background: hasBiomass ? 'rgba(247, 37, 133, 0.18)' : 'rgba(0, 242, 254, 0.1)',
              border: `1px solid ${hasBiomass ? '#F72585' : 'rgba(0, 242, 254, 0.3)'}`,
              color: hasBiomass ? '#F72585' : '#00F2FE',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Radio size={13} />
            <span>{hasBiomass ? `BIOMASS DETECTED: ${detection.species.toUpperCase()}` : 'AWAITING ACOUSTIC ECHO TARGET'}</span>
          </div>
        </div>

        {/* Center: Live Ping Readouts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', fontFamily: 'monospace', color: '#CBD5E1' }}>
          <div>
            <span style={{ color: '#64748B' }}>PING ID: </span>
            <strong style={{ color: '#FFF' }}>#{latestPing?.pingId || 10480}</strong>
          </div>
          <div>
            <span style={{ color: '#64748B' }}>AZIMUTH: </span>
            <strong style={{ color: '#00F2FE' }}>{latestPing?.bladeAzimuthDeg ? `${latestPing.bladeAzimuthDeg.toFixed(1)}°` : '0.0°'}</strong>
          </div>
          {detection && (
            <>
              <div>
                <span style={{ color: '#64748B' }}>RANGE: </span>
                <strong style={{ color: '#FFB703' }}>{detection.distanceM}m @ {detection.bearingDeg}°</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>DEPTH: </span>
                <strong style={{ color: '#4CC9F0' }}>{detection.depthM}m</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>BIOMASS: </span>
                <strong style={{ color: '#00E699' }}>{detection.biomassTons} T</strong>
              </div>
            </>
          )}
        </div>

        {/* Right: Quick Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Quick Ping Injection Buttons */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => handleInjectTestPing('Tuna')}
              disabled={isInjectingTest}
              title="Transmit authentic Tuna detection ping (142m depth, 820m range)"
              style={{
                padding: '5px 9px',
                borderRadius: '4px',
                fontSize: '10px',
                fontFamily: 'monospace',
                fontWeight: 700,
                border: '1px solid #F72585',
                backgroundColor: 'rgba(247, 37, 133, 0.15)',
                color: '#F72585',
                cursor: 'pointer',
              }}
            >
              + PING TUNA
            </button>
            <button
              onClick={() => handleInjectTestPing('Mackerel')}
              disabled={isInjectingTest}
              title="Transmit authentic Mackerel detection ping (88m depth, 540m range)"
              style={{
                padding: '5px 9px',
                borderRadius: '4px',
                fontSize: '10px',
                fontFamily: 'monospace',
                fontWeight: 700,
                border: '1px solid #FFB703',
                backgroundColor: 'rgba(255, 183, 3, 0.15)',
                color: '#FFB703',
                cursor: 'pointer',
              }}
            >
              + PING MACKEREL
            </button>
          </div>

          {/* External Python/Node Script Instructions Button */}
          <button
            onClick={() => setShowScriptModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              fontFamily: 'monospace',
              fontWeight: 600,
              border: '1px solid #00F2FE',
              backgroundColor: 'rgba(0, 242, 254, 0.15)',
              color: '#00F2FE',
              cursor: 'pointer',
            }}
          >
            <Terminal size={13} />
            <span>EXTERNAL SCRIPT</span>
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Viewport */}
      <div style={{ width: '100%', height: '100%' }}>
        <RawPingDigitalTwinCanvas
          nodes={nodes}
          onSelectNode={handleSelectNode}
          selectedNodeId={selectedNode?.id || null}
          onPingReceived={handlePingReceived}
          selectedContact={selectedContact}
          onSelectContact={(c) => setSelectedContact(c)}
          visualMode={visualMode}
          cameraPreset={cameraPreset}
        />
      </div>

      {/* Camera Presets Bar Floating at Bottom Center */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          borderRadius: '8px',
          background: 'rgba(5, 12, 26, 0.9)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        }}
      >
        <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#64748B', marginRight: '4px' }}>
          CAMERA:
        </span>
        {(['OVERVIEW', 'SURFACE_BUOYS', 'SEABED_LEVEL', 'TARGET_NODE', 'FISH_CLUSTER', 'TOP_DOWN'] as CameraPreset[]).map((preset) => (
          <button
            key={preset}
            onClick={() => setCameraPreset(preset)}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontFamily: 'monospace',
              fontWeight: 600,
              border: cameraPreset === preset ? '1px solid #00F2FE' : '1px solid transparent',
              backgroundColor: cameraPreset === preset ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
              color: cameraPreset === preset ? '#00F2FE' : '#94A3B8',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {preset.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Floating Instructions / Tip in Bottom Left */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 16,
          zIndex: 20,
          padding: '8px 12px',
          borderRadius: '6px',
          background: 'rgba(5, 12, 26, 0.88)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#94A3B8',
          fontSize: '11px',
          fontFamily: 'monospace',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'none',
        }}
      >
        <Info size={14} color="#00F2FE" />
        <span>Click any Sonar Buoy (e.g. SN-0001) to open Rolling Echogram & 360° PPI Radar</span>
      </div>

      {/* Node Detail Drawer on Left/Right */}
      <NodeDetailDrawer
        node={selectedNode}
        onClose={() => {
          setIsNodeDrawerOpen(false);
          setSelectedNode(null);
        }}
        onNodeUpdated={fetchNodes}
      />

      {/* Live Sonar Waterfall & PPI Radar Modal */}
      {isSonarModalOpen && selectedNode && (
        <LiveSonarWaterfallModal
          node={selectedNode}
          allNodes={nodes}
          onSelectNode={(n) => setSelectedNode(n)}
          onClose={() => setIsSonarModalOpen(false)}
        />
      )}

      {/* External Sonar Hardware Script Modal */}
      {showScriptModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '680px',
              backgroundColor: '#0A1322',
              border: '1px solid #00F2FE',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: '0 0 30px rgba(0, 242, 254, 0.25)',
              color: '#FFFFFF',
              fontFamily: 'monospace',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, color: '#00F2FE' }}>
                <Terminal size={18} />
                <span>STREAM RAW SONAR FROM SECOND COMPUTER / HARDWARE</span>
              </div>
              <button
                onClick={() => setShowScriptModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.5, marginBottom: '16px' }}>
              Run our zero-dependency emulator on another laptop, computer, or Raspberry Pi connected to your Wi-Fi/Ethernet.
              Every ping sent from your second computer will instantly render live fish in this 3D model!
            </p>

            <div style={{ backgroundColor: '#050B14', border: '1px solid #1E293B', borderRadius: '6px', padding: '14px', marginBottom: '14px' }}>
              <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '6px' }}># 1. RUN WITH NODE.JS (ZERO DEPENDENCIES):</div>
              <code style={{ fontSize: '12px', color: '#00E699' }}>
                node scripts/external_sonar_transmitter.js --server {window.location.hostname || 'localhost'} --node SN-0001
              </code>
            </div>

            <div style={{ backgroundColor: '#050B14', border: '1px solid #1E293B', borderRadius: '6px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '6px' }}># 2. RUN WITH PYTHON (STANDARD URLLIB):</div>
              <code style={{ fontSize: '12px', color: '#00E699' }}>
                python scripts/external_sonar_transmitter.py --server {window.location.hostname || 'localhost'} --node SN-0001
              </code>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowScriptModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  backgroundColor: '#00F2FE',
                  color: '#050B14',
                  fontWeight: 700,
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                GOT IT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
