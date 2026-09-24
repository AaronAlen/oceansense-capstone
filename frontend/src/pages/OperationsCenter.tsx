// ==============================================================================
// OceanSense — Operations Control Center Page
// Demonstrates: Full 3D Digital Twin Viewport, Tactical Event Feed & Telemetry HUD
// ==============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { OceanDigitalTwinCanvas, VisualLightingMode, CameraPreset } from '../three/OceanDigitalTwinCanvas';
import { Node3DData } from '../three/SonarNodeInstances';
import { NodeDetailDrawer } from '../components/hud/NodeDetailDrawer';
import { SimulationControlBar } from '../components/hud/SimulationControlBar';
import { LiveSonarWaterfallModal } from '../components/sonar/LiveSonarWaterfallModal';
import { useThemeStore } from '../stores/themeStore';
import { Server, ShieldAlert, Battery, Radio, AlertTriangle, Activity, Bell, ChevronRight, ChevronLeft, Maximize2, Minimize2, Sun, Moon, Eye, Video } from 'lucide-react';

import { wsClient } from '../services/websocket';
import { useFishSchoolStore } from '../stores/fishSchoolStore';

export function OperationsCenter() {
  const { theme, setTheme } = useThemeStore();
  const fishSchools = useFishSchoolStore((state) => state.schools);
  const visualMode: VisualLightingMode = theme === 'light' ? 'DAY' : theme === 'grayish' ? 'GRAYISH' : 'NIGHT';
  const [nodes, setNodes] = useState<Node3DData[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node3DData | null>(null);
  const [isSonarModalOpen, setIsSonarModalOpen] = useState<boolean>(false);
  const [isNodeDrawerOpen, setIsNodeDrawerOpen] = useState<boolean>(false);

  const handleSelectNode = useCallback((node: Node3DData | null) => {
    setSelectedNode(node);
    if (node) {
      setIsSonarModalOpen(true);
      setIsNodeDrawerOpen(true);
    }
  }, []);
  const [activeScale, setActiveScale] = useState<number>(() => {
    const saved = localStorage.getItem('oceansense_grid_scale');
    return saved ? Number(saved) : 9;
  });
  const lastDeltaUpdateRef = useRef<number>(0);
  const [isEventFeedOpen, setIsEventFeedOpen] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('OVERVIEW');
  const [is3DFullscreen, setIs3DFullscreen] = useState<boolean>(false);
  const [selectedAUVForCamera, setSelectedAUVForCamera] = useState<any | null>(null);
  const [cameraOverlayMode, setCameraOverlayMode] = useState<'CLOSED' | 'MINI_PIP' | 'BIG_OVERLAY'>('CLOSED');
  const [targetFishSchool, setTargetFishSchool] = useState<any | null>(null);
  const [initialCameraChannel, setInitialCameraChannel] = useState<'AUV_OPTICAL' | 'FISH_MOVEMENTS' | 'DOCK_CRADLE' | 'TRENCH_SURVEY'>('FISH_MOVEMENTS');
  const [auvs, setAuvs] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelectFishSchool = useCallback((school: any) => {
    setTargetFishSchool(school);
    const auv2 = auvs.find(a => a.id === 'AUV-02') || {
      id: 'AUV-02',
      name: 'Nautilus-2 Biomass Scout',
      depth_m: 40.0,
      speedKnots: 12.4,
      headingDeg: 95.0,
      batteryPct: 91.0,
      cameraStatus: 'RECORDING',
    };
    setSelectedAUVForCamera(auv2);
    setInitialCameraChannel('FISH_MOVEMENTS');
    setCameraOverlayMode('MINI_PIP');
  }, [auvs]);

  const fetchNodes = useCallback(async () => {
    try {
      const res = await fetch('/api/nodes/instances-3d');
      const data = await res.json();
      if (data.success && data.data) {
        setNodes(data.data);
        if (data.count) {
          setActiveScale(data.count);
        }
      }
    } catch (e) {
      console.warn('Waiting for backend 3D node instances:', e);
    }
  }, []);

  const fetchKPIs = useCallback(async () => {
    try {
      const res = await fetch('/api/nodes/kpis');
      const data = await res.json();
      if (data.success) {
        setKpis(data.data);
      }
    } catch (e) {
      console.warn('Waiting for KPIs:', e);
    }
  }, []);

  useEffect(() => {
    fetchNodes();
    fetchKPIs();

    // Fetch AUVs
    fetch('/api/auvs')
      .then((r) => r.json())
      .then((d) => { if (d?.auvs) setAuvs(d.auvs); })
      .catch((e) => console.warn('Waiting for AUVs:', e));

    // Connect WebSocket
    wsClient.connect();

    // Fullscreen change listener
    const onFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIs3DFullscreen(isFull);
      if (!isFull) {
        setIsEventFeedOpen(wasEventFeedOpenBeforeFullscreen.current);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);

    // Real-time KPI tick listener
    const unsubKPI = wsClient.on('KPI_TELEMETRY_TICK', (data) => {
      setKpis(data);
      if (data?.activeNodes) {
        setActiveScale(data.activeNodes);
      } else if (data?.totalNodes) {
        setActiveScale(data.totalNodes);
      }
    });

    // Real-time grid config & scale update listener
    const unsubGrid = wsClient.on('GRID_CONFIG_UPDATED', (payload) => {
      if (payload?.totalNodes) {
        setActiveScale(payload.totalNodes);
        localStorage.setItem('oceansense_grid_scale', String(payload.totalNodes));
        fetchNodes();
        fetchKPIs();
      }
    });

    // Real-time differential node update listener (Throttled to prevent React/Three.js re-render lag)
    const unsubDelta = wsClient.on('NODE_BATCH_DELTA', (payload) => {
      if (payload?.updates?.length) {
        const now = Date.now();
        const hasTheftOrTamper = payload.updates.some((u: any) => u.tamper_status || u.status === 'THEFT_SUSPECTED' || u.status === 'ACTIVE');
        
        // Immediate update on tamper/theft events; otherwise throttle rolling telemetry to 1.2s intervals
        if (hasTheftOrTamper || now - lastDeltaUpdateRef.current > 1200) {
          lastDeltaUpdateRef.current = now;
          setNodes((prev) => {
            const map = new Map(prev.map(n => [n.id, n]));
            payload.updates.forEach((u: any) => {
              const existing = map.get(u.id);
              if (existing) {
                map.set(u.id, { ...existing, ...u });
              }
            });
            return Array.from(map.values());
          });
        }
      }
    });

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      unsubKPI();
      unsubGrid();
      unsubDelta();
    };
  }, [fetchNodes, fetchKPIs]);

  const wasEventFeedOpenBeforeFullscreen = useRef<boolean>(true);

  const toggle3DFullscreen = () => {
    if (!is3DFullscreen) {
      wasEventFeedOpenBeforeFullscreen.current = isEventFeedOpen;
      setIs3DFullscreen(true);
      setIsEventFeedOpen(false);
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      setIs3DFullscreen(false);
      setIsEventFeedOpen(wasEventFeedOpenBeforeFullscreen.current);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const handleTriggerTheft = async (nodeId?: string) => {
    const targetId = nodeId || selectedNode?.id || nodes[0]?.id || 'SN-0001';
    try {
      const res = await fetch(`/api/nodes/${targetId}/tamper`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        fetchNodes();
        fetchKPIs();
        const target = nodes.find((n) => n.id === targetId);
        if (target) {
          setSelectedNode({ ...target, status: 'THEFT_SUSPECTED', tamper_status: 'ALERT_ACTIVE', tilt_angle_deg: 48.5 });
        }
      }
    } catch (e) {
      console.warn('Theft trigger:', e);
    }
  };

  const handleResetNode = async (nodeId?: string) => {
    const targetId = nodeId || selectedNode?.id || nodes[0]?.id || 'SN-0001';
    try {
      const res = await fetch(`/api/nodes/${targetId}/reset`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchNodes();
        fetchKPIs();
        const target = nodes.find((n) => n.id === targetId);
        if (target) {
          setSelectedNode({ ...target, status: 'ACTIVE', tamper_status: 'SECURE', tilt_angle_deg: 1.2 });
        }
      }
    } catch (e) {
      console.warn('Reset node:', e);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        overflow: 'hidden',
        backgroundColor: '#000',
      }}
    >
      {/* Central 3D Ocean Digital Twin Canvas */}
      <div style={{ flex: 1, minWidth: 0, height: '100%', position: 'relative', overflow: 'hidden' }}>
        <OceanDigitalTwinCanvas
          nodes={nodes}
          fishSchools={fishSchools}
          onSelectNode={handleSelectNode}
          selectedNodeId={selectedNode?.id || null}
          auvs={auvs}
          onSelectAUV={(auv) => {
            setSelectedAUVForCamera(auv);
            setCameraOverlayMode('MINI_PIP');
          }}
          onSelectSchool={handleSelectFishSchool}
          selectedSchoolId={targetFishSchool?.id || null}
          targetSchool={targetFishSchool}
          visualMode={visualMode}
          cameraPreset={cameraPreset}
        />

        {/* Floating 3D Viewport Interactive Controls Bar (Fixed Permanent Position) */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 40,
          background: 'rgba(11, 19, 32, 0.92)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--color-slate-border)',
          borderRadius: '8px',
          padding: '6px 12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          maxWidth: 'calc(100% - 320px)',
          overflowX: 'auto',
        }}>
          {/* Lighting Mode Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '8px' }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginRight: '2px' }}>
              LIGHT:
            </span>
            <button
              onClick={() => setTheme('light')}
              title="Daylight: Sunlit coastal waters for enhanced visibility"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: visualMode === 'DAY' ? '1px solid var(--color-amber-warning)' : '1px solid transparent',
                background: visualMode === 'DAY' ? 'rgba(255, 183, 3, 0.2)' : 'transparent',
                color: visualMode === 'DAY' ? 'var(--color-amber-warning)' : '#94A3B8',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ☀️ DAY
            </button>
            <button
              onClick={() => setTheme('grayish')}
              title="Grayish Contour: High-contrast neutral slate gray for seeing underwater terrain clearly"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: visualMode === 'GRAYISH' ? '1px solid var(--color-electric-cyan)' : '1px solid transparent',
                background: visualMode === 'GRAYISH' ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
                color: visualMode === 'GRAYISH' ? 'var(--color-electric-cyan)' : '#94A3B8',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🌫️ GRAYISH
            </button>
            <button
              onClick={() => setTheme('dark')}
              title="Night: Deep tactical navy abyssal lighting"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: visualMode === 'NIGHT' ? '1px solid var(--color-aquamarine)' : '1px solid transparent',
                background: visualMode === 'NIGHT' ? 'rgba(0, 230, 153, 0.2)' : 'transparent',
                color: visualMode === 'NIGHT' ? 'var(--color-aquamarine)' : '#94A3B8',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🌙 NIGHT
            </button>
          </div>

          {/* Camera Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '8px' }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginRight: '2px' }}>
              CAMERA:
            </span>
            <button
              onClick={() => setCameraPreset('OVERVIEW')}
              style={{
                padding: '4px 7px',
                borderRadius: '4px',
                border: cameraPreset === 'OVERVIEW' ? '1px solid var(--color-electric-cyan)' : '1px solid transparent',
                background: cameraPreset === 'OVERVIEW' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                color: cameraPreset === 'OVERVIEW' ? 'var(--color-electric-cyan)' : '#94A3B8',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
              }}
            >
              🌐 OVERVIEW
            </button>
            <button
              onClick={() => setCameraPreset('SURFACE_BUOYS')}
              title="Waterline view across floating surface telemetry buoys and subsea tethers"
              style={{
                padding: '4px 7px',
                borderRadius: '4px',
                border: cameraPreset === 'SURFACE_BUOYS' ? '1px solid var(--color-electric-cyan)' : '1px solid transparent',
                background: cameraPreset === 'SURFACE_BUOYS' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                color: cameraPreset === 'SURFACE_BUOYS' ? 'var(--color-electric-cyan)' : '#94A3B8',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
              }}
            >
              🌊 BUOYS
            </button>
            <button
              onClick={() => setCameraPreset('SEABED_LEVEL')}
              title="Fly directly along the seabed floor above bottom-anchored sonar nodes"
              style={{
                padding: '4px 7px',
                borderRadius: '4px',
                border: cameraPreset === 'SEABED_LEVEL' ? '1px solid var(--color-aquamarine)' : '1px solid transparent',
                background: cameraPreset === 'SEABED_LEVEL' ? 'rgba(0, 230, 153, 0.15)' : 'transparent',
                color: cameraPreset === 'SEABED_LEVEL' ? 'var(--color-aquamarine)' : '#94A3B8',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
              }}
            >
              🏔️ SEABED
            </button>
            <button
              onClick={() => setCameraPreset('TARGET_NODE')}
              title="Focus on Surface Buoy Node SN-0431 in Zone Alpha"
              style={{
                padding: '4px 7px',
                borderRadius: '4px',
                border: cameraPreset === 'TARGET_NODE' ? '1px solid var(--color-crimson-alert)' : '1px solid transparent',
                background: cameraPreset === 'TARGET_NODE' ? 'rgba(255, 59, 48, 0.15)' : 'transparent',
                color: cameraPreset === 'TARGET_NODE' ? 'var(--color-crimson-alert)' : '#94A3B8',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
              }}
            >
              🎯 SN-0431
            </button>
            <button
              onClick={() => setCameraPreset('FISH_CLUSTER')}
              title="Focus on swimming Atlantic Bluefin Tuna cluster"
              style={{
                padding: '4px 7px',
                borderRadius: '4px',
                border: cameraPreset === 'FISH_CLUSTER' ? '1px solid var(--color-biomass-magenta)' : '1px solid transparent',
                background: cameraPreset === 'FISH_CLUSTER' ? 'rgba(247, 37, 133, 0.15)' : 'transparent',
                color: cameraPreset === 'FISH_CLUSTER' ? 'var(--color-biomass-magenta)' : '#94A3B8',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
              }}
            >
              🐟 FISH
            </button>
            <button
              onClick={() => setCameraPreset('TOP_DOWN')}
              title="Nautical 2D Top-Down Bathymetry Map"
              style={{
                padding: '4px 7px',
                borderRadius: '4px',
                border: cameraPreset === 'TOP_DOWN' ? '1px solid var(--color-electric-cyan)' : '1px solid transparent',
                background: cameraPreset === 'TOP_DOWN' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                color: cameraPreset === 'TOP_DOWN' ? 'var(--color-electric-cyan)' : '#94A3B8',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
              }}
            >
              ⬇️ TOP-DOWN
            </button>
          </div>
        </div>

        {/* Top-Right Quick Action & Fullscreen Bar (Anchored firmly to top-right, always visible) */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 45,
          background: 'rgba(11, 19, 32, 0.92)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--color-slate-border)',
          borderRadius: '8px',
          padding: '6px 10px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        }}>
          {/* Quick Sonar Echogram Shortcut */}
          <button
            onClick={() => {
              if (nodes.length > 0) {
                setSelectedNode(selectedNode || nodes[0]);
              }
            }}
            title="Open Live Hydroacoustic Sonar & Radar Overlay"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid var(--color-electric-cyan, #00F2FE)',
              background: 'rgba(0, 242, 254, 0.15)',
              color: 'var(--color-electric-cyan, #00F2FE)',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Activity size={12} />
            ⚓ LIVE BUOY SONAR
          </button>

          {/* Quick Direct Buoy Selectors */}
          {nodes.slice(0, 4).map((n) => {
            const isSelected = selectedNode?.id === n.id;
            return (
              <button
                key={n.id}
                onClick={() => handleSelectNode(n)}
                title={`Inspect Sonar Telemetry for Buoy ${n.id} (${n.depth_m ? n.depth_m.toFixed(0) : '260'}m depth)`}
                style={{
                  padding: '4px 7px',
                  borderRadius: '4px',
                  border: isSelected ? '1px solid var(--color-electric-cyan, #00F2FE)' : '1px solid rgba(255,255,255,0.12)',
                  background: isSelected ? 'rgba(0, 242, 254, 0.25)' : 'rgba(255,255,255,0.04)',
                  color: isSelected ? 'var(--color-electric-cyan, #00F2FE)' : '#94A3B8',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: isSelected ? 800 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                ⚓ {n.id}
              </button>
            );
          })}

          {/* Fullscreen 3D Viewport Toggle */}
          <button
            onClick={toggle3DFullscreen}
            title={is3DFullscreen ? 'Exit Fullscreen 3D View' : 'Maximize 3D Digital Twin to Fullscreen'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              borderRadius: '5px',
              border: is3DFullscreen ? '1px solid var(--color-crimson-alert)' : '1px solid var(--color-electric-cyan)',
              background: is3DFullscreen ? 'rgba(255, 59, 48, 0.2)' : 'rgba(0, 242, 254, 0.15)',
              color: is3DFullscreen ? 'var(--color-crimson-alert)' : 'var(--color-electric-cyan)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {is3DFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span>{is3DFullscreen ? 'EXIT FULL' : 'FULLSCREEN'}</span>
          </button>
        </div>

        {/* Top Tactical KPI Bar (Floating Over 3D Scene) */}
        {!is3DFullscreen && (
          <div style={{
            position: 'absolute',
            top: '64px',
            left: '20px',
            right: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '8px',
            zIndex: 30,
            pointerEvents: 'none',
          }}>
            <KPICard
              label="DEPLOYED SENSORS"
              value={`${kpis?.totalNodes || nodes.length || 1000}`}
              sub="10x10 km Grid (Surface Anchored Buoys)"
              icon={<Server size={14} color="var(--color-electric-cyan)" />}
              color="var(--color-electric-cyan)"
            />
            <KPICard
              label="ACTIVE MESH HEALTH"
              value={`${kpis?.networkHealthPct || 99.5}%`}
              sub={`${kpis?.activeNodes || 995} Nominal`}
              icon={<Activity size={14} color="var(--color-aquamarine)" />}
              color="var(--color-aquamarine)"
            />
            <KPICard
              label="AVERAGE BATTERY"
              value={`${kpis?.avgBatteryPct || 86.4}%`}
              sub="Solar Deck & Li-SOCl2"
              icon={<Battery size={14} color="var(--color-aquamarine)" />}
              color="var(--color-aquamarine)"
            />
            <KPICard
              label="AVERAGE SNR"
              value={`${kpis?.avgSnrDb || 25.4} dB`}
              sub="Ambient: 52 dB"
              icon={<Radio size={14} color="var(--color-electric-cyan)" />}
              color="var(--color-electric-cyan)"
            />
            <KPICard
              label="SECURITY ALERTS"
              value={`${kpis?.theftSuspectedNodes || 1}`}
              sub="SN-0431 Tamper"
              icon={<ShieldAlert size={14} color="var(--color-crimson-alert)" />}
              color="var(--color-crimson-alert)"
              alert
            />
          </div>
        )}

        {/* Bottom Simulation Controls Bar */}
        <SimulationControlBar
          onSpeedChange={() => fetchKPIs()}
          onScaleChange={(scale) => {
            setActiveScale(scale);
            localStorage.setItem('oceansense_grid_scale', String(scale));
            fetchNodes();
            fetchKPIs();
          }}
          onTriggerTamper={() => handleTriggerTheft(selectedNode?.id)}
          activeScale={activeScale}
          selectedNodeId={selectedNode?.id}
        />

        {/* Live Hydroacoustic Sonar & Radar Overlay on Left Side when any Buoy Node is Selected */}
        {selectedNode && isSonarModalOpen && (
          <LiveSonarWaterfallModal
            node={selectedNode}
            allNodes={nodes}
            onSelectNode={(newNode) => setSelectedNode(newNode)}
            onClose={() => setIsSonarModalOpen(false)}
            onTriggerTheft={handleTriggerTheft}
            onResetNode={handleResetNode}
          />
        )}

        {/* Selected Node Details Slideout */}
        <NodeDetailDrawer
          node={isNodeDrawerOpen ? selectedNode : null}
          onClose={() => setIsNodeDrawerOpen(false)}
          onNodeUpdated={() => {
            fetchNodes();
            fetchKPIs();
          }}
        />
      </div>

      {/* Right-Side Acoustic Event Stream & Security Feed */}
      <div style={{
        width: isEventFeedOpen ? '340px' : '0px',
        minWidth: isEventFeedOpen ? '340px' : '0px',
        flexShrink: 0,
        height: '100%',
        backgroundColor: 'rgba(11, 19, 32, 0.95)',
        borderLeft: isEventFeedOpen ? '1px solid var(--color-slate-border)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        zIndex: 35,
        position: 'relative',
      }}>
        {/* Feed Header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--color-slate-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={15} color="var(--color-electric-cyan)" />
            <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#FFF' }}>
              ACOUSTIC EVENT FEED
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-aquamarine)', marginRight: '4px' }}>
              LIVE STREAM
            </span>
            <button
              onClick={() => setIsEventFeedOpen(false)}
              title="Close Acoustic Feed"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#94A3B8',
                borderRadius: '4px',
                padding: '3px 6px',
                cursor: 'pointer',
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Feed Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <EventCard
            title="CRITICAL TAMPER ALERT"
            desc="Acoustic Anomaly: Node SN-0431 displacement detected (Tilt: 44.5°). Automated theft response initiated."
            time="JUST NOW"
            severity="CRITICAL"
            badge="▶ TAMPER CAM"
            onClick={() => {
              const auv1 = auvs.find(a => a.id === 'AUV-01') || { id: 'AUV-01', name: 'Security Intercept', depth_m: 28.5, speedKnots: 8.2, headingDeg: 215.0, batteryPct: 78.4, cameraStatus: 'RECORDING' };
              setSelectedAUVForCamera(auv1);
              setInitialCameraChannel('AUV_OPTICAL');
              setCameraOverlayMode('MINI_PIP');
            }}
          />
          <EventCard
            title="BIOMASS MULTI-LATERATION"
            desc="Zone A: Atlantic Bluefin Tuna detected by SN-0218, SN-0219, SN-0220. Est. Biomass: 18.5 tons."
            time="2m ago"
            severity="BIOMASS"
            badge="▶ LIVE FISH MOVEMENTS"
            onClick={() => {
              handleSelectFishSchool({
                id: 'SCHOOL-TUNA-01',
                species: 'Thunnus thynnus',
                commonName: 'Atlantic Bluefin Tuna',
                latitude: 10.258,
                longitude: 80.156,
                depth_m: 62,
                biomassTons: 18.5,
                directionHeadingDeg: 95,
                confidenceScore: 0.94,
                status: 'ACTIVE_TRACK',
              });
            }}
          />
          <EventCard
            title="AUV-01 DISPATCHED"
            desc="Mission: SECURITY_INTERCEPT. Target coordinates: Node SN-0431. Spotlight & Camera standby."
            time="3m ago"
            severity="INFO"
            badge="▶ OPTICAL FEED"
            onClick={() => {
              const auv1 = auvs.find(a => a.id === 'AUV-01') || { id: 'AUV-01', name: 'Security Intercept', depth_m: 28.5, speedKnots: 8.2, headingDeg: 215.0, batteryPct: 78.4, cameraStatus: 'RECORDING' };
              setSelectedAUVForCamera(auv1);
              setInitialCameraChannel('AUV_OPTICAL');
              setCameraOverlayMode('MINI_PIP');
            }}
          />
          <EventCard
            title="LOW BATTERY WARNING"
            desc="Node SN-0112 battery below 15% (13.5%). State switched to POWER_CRITICAL. Task MAINT-BAT-0112 queued."
            time="5m ago"
            severity="WARNING"
          />
          <EventCard
            title="GATEWAY LINK NOMINAL"
            desc="Cabled Gateway GW-001 heartbeat received via shore cable. Zero packet loss across 250 mesh hops."
            time="8m ago"
            severity="NOMINAL"
          />
        </div>
      </div>

      {/* Docked Edge Tab to reopen Event Feed (Only shown when closed & not in fullscreen, pinned firmly to screen right border) */}
      {!isEventFeedOpen && !is3DFullscreen && (
        <button
          onClick={() => setIsEventFeedOpen(true)}
          title="Open Acoustic Event Feed"
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(11, 19, 32, 0.92)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--color-slate-border)',
            borderRight: 'none',
            color: 'var(--color-electric-cyan)',
            padding: '10px 5px',
            borderTopLeftRadius: '6px',
            borderBottomLeftRadius: '6px',
            cursor: 'pointer',
            zIndex: 45,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.5)',
          }}
        >
          <ChevronLeft size={16} />
          <span style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            fontSize: '9px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            letterSpacing: '1px',
            color: 'var(--color-aquamarine)',
          }}>
            EVENTS
          </span>
        </button>
      )}

    </div>
  );
}

function KPICard({ label, value, sub, icon, color, alert }: any) {
  return (
    <div className={`hud-panel ${alert ? 'hud-panel-glow-crimson' : ''}`} style={{
      padding: '10px 14px',
      borderRadius: '6px',
      pointerEvents: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#94A3B8' }}>{label}</span>
        {icon}
      </div>
      <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>
        {value}
      </div>
      <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
        {sub}
      </div>
    </div>
  );
}

function EventCard({ title, desc, time, severity, badge, onClick }: any) {
  let borderColor = 'var(--color-slate-border)';
  let titleColor = '#FFF';

  if (severity === 'CRITICAL') {
    borderColor = 'var(--color-crimson-alert)';
    titleColor = 'var(--color-crimson-alert)';
  } else if (severity === 'WARNING') {
    borderColor = 'var(--color-amber-warning)';
    titleColor = 'var(--color-amber-warning)';
  } else if (severity === 'BIOMASS') {
    borderColor = 'var(--color-biomass-magenta)';
    titleColor = 'var(--color-biomass-magenta)';
  }

  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px',
        borderRadius: '4px',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        border: `1px solid ${borderColor}`,
        fontFamily: 'var(--font-mono)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.9)';
      }}
      onMouseLeave={(e) => {
        if (onClick) e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.8)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: titleColor }}>{title}</span>
        <span style={{ fontSize: '9px', color: '#64748B' }}>{time}</span>
      </div>
      <p style={{ fontSize: '11px', color: '#94A3B8', lineHeight: '1.4', fontFamily: 'var(--font-sans)', margin: 0 }}>
        {desc}
      </p>
      {badge && (
        <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{
            fontSize: '9px',
            fontFamily: 'var(--font-mono)',
            padding: '2px 6px',
            borderRadius: '3px',
            background: 'rgba(0, 242, 254, 0.15)',
            color: 'var(--color-electric-cyan)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
          }}>
            {badge}
          </span>
        </div>
      )}
    </div>
  );
}
