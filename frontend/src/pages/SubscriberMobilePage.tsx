// ==============================================================================
// OceanSense — Commercial Fishing Subscriber Mobile Experience
// Features: Real-Time Synchronized Simulation Data with Main Operations Center,
// Day/Night Theme System, 3D Fisherman Digital Twin, Dynamic 2D Radar,
// Live Catch Biomass & Fuel Cost Saving Metrics
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { wsClient } from '../services/websocket';
import { FishermanMobile3DTwin, LiveFishCluster } from '../three/FishermanMobile3DTwin';
import { FishermanSubscriptionModal } from '../components/subscription/FishermanSubscriptionModal';
import { useFishSchoolStore, CANONICAL_FALLBACK_SCHOOLS, getFishSchool3DCoordinates } from '../stores/fishSchoolStore';
import { Globe, Radio, Fish, Waves, Compass, Navigation, CreditCard, Sparkles, Sun, Moon, Shield } from 'lucide-react';

export const SubscriberMobilePage: React.FC = () => {
  const { user, setLoginModalOpen } = useAuthStore();
  const { theme, setTheme, toggleTheme } = useThemeStore();
  const isSubscriber = user?.roles?.includes('SUBSCRIBER') || false;

  // Detect whether device is a real mobile screen
  const [isRealMobile, setIsRealMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth > 768 : false
  );
  const liveSchools = useFishSchoolStore((state) => state.schools);
  const [activeTab, setActiveTab] = useState<'3D_TWIN' | 'RADAR' | 'CLUSTERS' | 'WEATHER'>('3D_TWIN');
  const [routedClusterId, setRoutedClusterId] = useState<string>('SCHOOL-TUNA-01');
  const [isSubModalOpen, setIsSubModalOpen] = useState<boolean>(false);
  const [subscription, setSubscription] = useState<any>(null);

  // Periodic radar tick to smoothly update 2D radar blips with live 3D coordinates
  const [, setRadarTick] = useState<number>(0);
  useEffect(() => {
    if (activeTab !== 'RADAR') return;
    const interval = setInterval(() => {
      setRadarTick((t) => t + 1);
    }, 400);
    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsRealMobile(mobile);
      if (mobile) setIsMobileFrame(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Synchronize with exact same live simulation data from backend
  useEffect(() => {
    const unsubFish = useFishSchoolStore.getState().initialize();

    // Initial subscription status fetch
    fetch('/api/subscriptions/status')
      .then(res => res.json())
      .then(d => { if (d.success) setSubscription(d.data); })
      .catch(console.warn);

    return () => {
      unsubFish();
    };
  }, []);

  // Compute live clusters relative to vessel (10.245°N, 80.145°E) using the exact same data
  const clusters = React.useMemo(() => {
    const raw = liveSchools.length > 0 ? liveSchools : CANONICAL_FALLBACK_SCHOOLS;

    const vLat = 10.245;
    const vLon = 80.145;

    return raw.map((s) => {
      const dLatNM = (s.latitude - vLat) * 60.0;
      const dLonNM = (s.longitude - vLon) * 60.0 * Math.cos(s.latitude * (Math.PI / 180.0));
      const distNM = +Math.sqrt(dLatNM * dLatNM + dLonNM * dLonNM).toFixed(1);
      const bearingRad = Math.atan2(dLonNM, dLatNM);
      const bearingDeg = Math.round(((bearingRad * 180.0) / Math.PI + 360.0) % 360.0);

      let color = '#00F2FE';
      let marketVal = `₹${(s.biomassTons * 1.05).toFixed(1)} Lakhs`;
      let netDepth = `${Math.round(s.depth_m - 10)}m - ${Math.round(s.depth_m + 15)}m Deep Purse Seine`;

      if (s.id.includes('TUNA') || s.species.toLowerCase().includes('thunnus')) {
        color = '#F72585';
      } else if (s.id.includes('MACK') || s.species.toLowerCase().includes('scomber')) {
        color = '#FFB703';
        marketVal = `₹${(s.biomassTons * 0.52).toFixed(1)} Lakhs`;
        netDepth = `${Math.round(s.depth_m - 10)}m - ${Math.round(s.depth_m + 10)}m Midwater Trawl`;
      } else if (s.id.includes('SARD') || s.species.toLowerCase().includes('sardinops')) {
        color = '#00E699';
        marketVal = `₹${(s.biomassTons * 0.40).toFixed(1)} Lakhs`;
        netDepth = `${Math.round(s.depth_m - 8)}m - ${Math.round(s.depth_m + 8)}m Surface Driftnet`;
      } else {
        color = '#38BDF8';
        marketVal = `₹${(s.biomassTons * 0.65).toFixed(1)} Lakhs`;
        netDepth = `${Math.round(s.depth_m - 10)}m - ${Math.round(s.depth_m + 10)}m Midwater Trawl`;
      }

      return {
        ...s,
        distNM,
        bearingDeg,
        color,
        marketVal,
        netDepth,
      };
    });
  }, [liveSchools]);

  const activeRoutedCluster = clusters.find(c => c.id === routedClusterId) || clusters[0];

  const content = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      background: '#070B14',
      color: '#E2E8F0',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Mobile Top Header (Clean, Responsive, No Horizontal Overflow) */}
      <div style={{
        padding: '8px 12px',
        background: 'linear-gradient(180deg, #0B1626, #070B14)',
        borderBottom: '1px solid #1E293B',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
        zIndex: 15,
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: '0.62rem', color: '#00F2FE', fontFamily: 'monospace', letterSpacing: '0.05em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            VESSEL "NORDIC RUNNER" // 7.2 KTS
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Fisherman Tactical 3D Feed
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Day / Night Theme Quick Toggle */}
          <button
            onClick={() => toggleTheme()}
            title="Switch Day / Night Theme"
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid var(--color-slate-border)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: theme === 'light' ? '#FFB703' : '#00F2FE',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '0.65rem',
              fontFamily: 'monospace',
              fontWeight: 700,
            }}
          >
            {theme === 'light' ? <Sun size={12} /> : <Moon size={12} />}
            <span>{theme === 'light' ? 'DAY' : 'NIGHT'}</span>
          </button>

          {/* Pro Subscriber Badge & Plans */}
          <button
            onClick={() => setIsSubModalOpen(true)}
            style={{
              fontSize: '0.65rem',
              fontFamily: 'monospace',
              padding: '4px 8px',
              background: 'linear-gradient(90deg, rgba(247, 37, 133, 0.25), rgba(0, 242, 254, 0.25))',
              color: '#00F2FE',
              borderRadius: '4px',
              border: '1px solid #00F2FE',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <Sparkles size={11} color="#00F2FE" />
            <span>{subscription?.plan?.name ? subscription.plan.name.split(' ')[0] : 'PRO'}</span>
          </button>

          {/* Persona Switcher / Admin Login Shortcut */}
          <button
            onClick={() => setLoginModalOpen(true)}
            title="Switch Persona / Login as Admin"
            style={{
              fontSize: '0.65rem',
              fontFamily: 'monospace',
              padding: '4px 8px',
              background: 'rgba(255, 59, 48, 0.15)',
              color: '#FF6B6B',
              borderRadius: '4px',
              border: '1px solid rgba(255, 59, 48, 0.4)',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <Shield size={11} color="#FF6B6B" />
            <span>ADMIN</span>
          </button>
        </div>
      </div>

      {/* Main Tab Viewport */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* TAB 1: 3D FLEET TWIN (SYNCHRONIZED WITH LIVE SIMULATION DATA) */}
        {activeTab === '3D_TWIN' && (
          <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
            <FishermanMobile3DTwin
              schools={liveSchools}
              onSelectCluster={(c) => setRoutedClusterId(c.id)}
            />
          </div>
        )}

        {/* TAB 2: LIVE 2D NAUTICAL RADAR (SYNCHRONIZED WITH MOVING FISH SCHOOLS) */}
        {activeTab === 'RADAR' && (
          <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#00F2FE', textAlign: 'center' }}>
              LIVE ACOUSTIC TARGET RADAR (RANGE: 5.0 NM)
            </div>

            {/* Synthetic Radar Circle Display */}
            <div style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1',
              maxHeight: '280px',
              background: 'radial-gradient(circle, #091A2E 0%, #050B14 75%)',
              border: '1px solid #1E293B',
              borderRadius: '50%',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
            }}>
              {/* Concentric distance rings */}
              <div style={{ position: 'absolute', width: '33%', height: '33%', border: '1px dashed rgba(0, 242, 254, 0.2)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', width: '66%', height: '66%', border: '1px dashed rgba(0, 242, 254, 0.2)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', width: '96%', height: '96%', border: '1px solid rgba(0, 242, 254, 0.3)', borderRadius: '50%' }} />

              {/* Crosshairs */}
              <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'rgba(0, 242, 254, 0.15)' }} />
              <div style={{ position: 'absolute', height: '100%', width: '1px', background: 'rgba(0, 242, 254, 0.15)' }} />

              {/* Center Vessel Dot */}
              <div style={{
                position: 'absolute',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#00F2FE',
                boxShadow: '0 0 10px #00F2FE',
              }} />

              {/* Dynamically Positioned Biomass Radar Blips from Real Simulation */}
              {clusters.map((c, sIdx) => {
                // Live dynamic 3D coordinates synchronized with 3D twin
                const coords = getFishSchool3DCoordinates(c, sIdx);
                // Map coords.x, coords.z (-18 to +18 scene units) to circular radar plane
                const radarRange = 18.0;
                const normX = Math.max(-1, Math.min(1, coords.x / radarRange));
                const normZ = Math.max(-1, Math.min(1, coords.z / radarRange));
                const leftPct = 50 + normX * 42;
                const topPct = 50 + normZ * 42;

                return (
                  <div
                    key={c.id}
                    onClick={() => { setRoutedClusterId(c.id); setActiveTab('3D_TWIN'); }}
                    style={{
                      position: 'absolute',
                      top: `${topPct}%`,
                      left: `${leftPct}%`,
                      transform: 'translate(-50%, -50%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'top 0.4s ease-out, left 0.4s ease-out',
                    }}
                  >
                    <div style={{
                      width: c.id === routedClusterId ? '14px' : '10px',
                      height: c.id === routedClusterId ? '14px' : '10px',
                      borderRadius: '50%',
                      background: c.color,
                      boxShadow: `0 0 10px ${c.color}`,
                    }} />
                    <span style={{ fontSize: '0.55rem', color: c.color, fontFamily: 'monospace', marginTop: '2px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                      {c.commonName.split(' ').pop()?.toUpperCase()} ({c.biomassTons}t)
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Radar Telemetry Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'monospace',
              fontSize: '0.68rem',
              color: '#94A3B8',
              padding: '0 4px',
            }}>
              <span>VESSEL SPEED: 7.2 KTS</span>
              <span>HDG TO TARGET: {activeRoutedCluster.bearingDeg}°</span>
              <span>ETA: {Math.round((activeRoutedCluster.distNM / 7.2) * 60)} MIN</span>
            </div>
          </div>
        )}

        {/* TAB 3: CLUSTERS LIST (POPULATED WITH REAL LIVE SIMULATION DATA) */}
        {activeTab === 'CLUSTERS' && (
          <div style={{ flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#00F2FE' }}>
              IDENTIFIED HARVEST CLUSTERS (REAL SIMULATION DATA)
            </div>

            {clusters.map((c) => (
              <div
                key={c.id}
                style={{
                  background: 'rgba(11, 22, 38, 0.95)',
                  border: c.id === routedClusterId ? `1px solid ${c.color}` : '1px solid #1E293B',
                  borderRadius: '6px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.color }} />
                    <strong style={{ fontSize: '0.85rem', color: '#FFF' }}>{c.commonName}</strong>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: c.color, fontFamily: 'monospace', fontWeight: 700 }}>
                    ~{c.biomassTons} TONS
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', fontSize: '0.7rem', fontFamily: 'monospace', color: '#94A3B8' }}>
                  <div>EST. VALUE: <strong style={{ color: '#00E699' }}>{c.marketVal}</strong></div>
                  <div>DISTANCE: <strong style={{ color: '#FFFFFF' }}>{c.distNM} NM ({c.bearingDeg}°)</strong></div>
                  <div>DEPTH: <strong style={{ color: '#00F2FE' }}>{Math.round(c.depth_m)}m</strong></div>
                  <div>HEADING: <strong style={{ color: '#FFB703' }}>{c.directionHeadingDeg || 90}°</strong></div>
                </div>

                <button
                  onClick={() => { setRoutedClusterId(c.id); setActiveTab('3D_TWIN'); }}
                  style={{
                    marginTop: '4px',
                    padding: '6px',
                    borderRadius: '4px',
                    border: 'none',
                    background: c.id === routedClusterId ? 'rgba(0, 242, 254, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                    color: c.id === routedClusterId ? '#00F2FE' : '#CBD5E1',
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {c.id === routedClusterId ? '✓ ACTIVE ROUTE IN 3D' : 'SET 3D COURSE VECTOR'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: WEATHER & SEA STATE */}
        {activeTab === 'WEATHER' && (
          <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#00F2FE' }}>
              COASTAL SEA STATE & SWELL ADVISORY
            </div>
            <div style={{ background: '#0B1626', border: '1px solid #1E293B', borderRadius: '6px', padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
              <div><span style={{ color: '#64748B' }}>WAVE SWELL:</span><br /><strong style={{ color: '#00E699' }}>0.8m (Gentle)</strong></div>
              <div><span style={{ color: '#64748B' }}>SURFACE TEMP:</span><br /><strong style={{ color: '#FFFFFF' }}>24.5 °C</strong></div>
              <div><span style={{ color: '#64748B' }}>WIND SPEED:</span><br /><strong style={{ color: '#38BDF8' }}>11 Kts ENE</strong></div>
              <div><span style={{ color: '#64748B' }}>SURFACE CURRENT:</span><br /><strong style={{ color: '#FFB703' }}>0.4 Kts SE</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar (Ergonomic Thumb Targets) */}
      <div style={{
        height: '52px',
        background: '#0B1626',
        borderTop: '1px solid #1E293B',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        flexShrink: 0,
        zIndex: 15,
      }}>
        <button
          onClick={() => setActiveTab('3D_TWIN')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            color: activeTab === '3D_TWIN' ? '#00F2FE' : '#64748B',
            cursor: 'pointer',
            fontSize: '0.65rem',
            fontFamily: 'monospace',
            fontWeight: activeTab === '3D_TWIN' ? 800 : 500,
          }}
        >
          <Globe size={18} />
          <span>3D FLEET</span>
        </button>

        <button
          onClick={() => setActiveTab('RADAR')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            color: activeTab === 'RADAR' ? '#00F2FE' : '#64748B',
            cursor: 'pointer',
            fontSize: '0.65rem',
            fontFamily: 'monospace',
            fontWeight: activeTab === 'RADAR' ? 800 : 500,
          }}
        >
          <Radio size={18} />
          <span>RADAR</span>
        </button>

        <button
          onClick={() => setActiveTab('CLUSTERS')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            color: activeTab === 'CLUSTERS' ? '#00F2FE' : '#64748B',
            cursor: 'pointer',
            fontSize: '0.65rem',
            fontFamily: 'monospace',
            fontWeight: activeTab === 'CLUSTERS' ? 800 : 500,
          }}
        >
          <Fish size={18} />
          <span>BIOMASS</span>
        </button>

        <button
          onClick={() => setActiveTab('WEATHER')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            color: activeTab === 'WEATHER' ? '#00F2FE' : '#64748B',
            cursor: 'pointer',
            fontSize: '0.65rem',
            fontFamily: 'monospace',
            fontWeight: activeTab === 'WEATHER' ? 800 : 500,
          }}
        >
          <Waves size={18} />
          <span>SEA STATE</span>
        </button>

        <button
          onClick={() => setIsSubModalOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            color: '#F72585',
            cursor: 'pointer',
            fontSize: '0.65rem',
            fontFamily: 'monospace',
            fontWeight: 800,
          }}
        >
          <CreditCard size={18} />
          <span>PLANS</span>
        </button>
      </div>

      {/* Fisherman Subscription & Payment Modal */}
      <FishermanSubscriptionModal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        onSubscriptionUpdated={(sub) => setSubscription(sub)}
      />
    </div>
  );

  // If real mobile device or small screen: clean full-screen native mobile experience
  if (isRealMobile || !isMobileFrame) {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
        {content}
      </div>
    );
  }

  // When previewed on Desktop: provide realistic mobile phone frame with toggle
  return (
    <div style={{
      padding: '1rem',
      background: 'var(--color-page-bg)',
      height: '100%',
      color: 'var(--color-text-secondary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.75rem',
      overflowY: 'auto',
    }}>
      {/* Desktop Preview Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '850px' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-electric-cyan)', fontFamily: 'monospace' }}>
            COMMERCIAL SUBSCRIBER INTERFACE // DATA PRIVACY SHIELD
          </div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '2px 0 0 0', color: 'var(--color-text-primary)' }}>
            Licensed Commercial Fisher Mobile 3D Client
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setIsMobileFrame(true)}
            style={{
              padding: '5px 10px',
              fontSize: '0.72rem',
              fontFamily: 'monospace',
              borderRadius: '4px',
              border: isMobileFrame ? '1px solid var(--color-electric-cyan)' : '1px solid var(--color-slate-border)',
              background: isMobileFrame ? 'rgba(0, 242, 254, 0.15)' : 'var(--color-slate-card)',
              color: isMobileFrame ? 'var(--color-electric-cyan)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            📱 PHONE FRAME (390px)
          </button>
          <button
            onClick={() => setIsMobileFrame(false)}
            style={{
              padding: '5px 10px',
              fontSize: '0.72rem',
              fontFamily: 'monospace',
              borderRadius: '4px',
              border: !isMobileFrame ? '1px solid var(--color-electric-cyan)' : '1px solid var(--color-slate-border)',
              background: !isMobileFrame ? 'rgba(0, 242, 254, 0.15)' : 'var(--color-slate-card)',
              color: !isMobileFrame ? 'var(--color-electric-cyan)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            💻 FULLSCREEN VIEW
          </button>
        </div>
      </div>

      {/* Frame Rendering */}
      <div style={{
        width: '390px',
        height: '750px',
        background: '#070B14',
        borderRadius: '36px',
        border: '8px solid var(--color-slate-border)',
        boxShadow: '0 0 50px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 242, 254, 0.15)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {content}
      </div>
    </div>
  );
};
