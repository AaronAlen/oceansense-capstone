import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldAlert,
  Wifi,
  Navigation,
  Server,
  BatteryCharging,
  Radio,
  Database,
  User,
  LogOut,
  KeyRound,
  ShieldCheck,
  Bot,
  Grid,
  Smartphone,
  SlidersHorizontal,
  Sun,
  Moon,
  CreditCard,
  Film,
} from 'lucide-react';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import { wsClient } from './services/websocket';
import { LoginModal } from './components/auth/LoginModal';
import { FishermanSubscriptionModal } from './components/subscription/FishermanSubscriptionModal';
import { NodeSafetyStudioModal } from './components/node-studio/NodeSafetyStudioModal';
import { OperationsCenter } from './pages/OperationsCenter';
import { DeploymentPage } from './pages/DeploymentPage';
import { NetworkTopologyPage } from './pages/NetworkTopologyPage';
import { ChargingStationsPage } from './pages/ChargingStationsPage';
import { SecurityCenterPage } from './pages/SecurityCenterPage';
import { TacticalAnalyticsPage } from './pages/TacticalAnalyticsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { SubscriberMobilePage } from './pages/SubscriberMobilePage';

export type NavPage =
  | 'OPERATIONS_CENTER'
  | 'DEPLOYMENT_PLAN'
  | 'NETWORK_TOPOLOGY'
  | 'CHARGING_STATIONS'
  | 'SECURITY_CENTER'
  | 'TACTICAL_ANALYTICS'
  | 'AI_ASSISTANT'
  | 'SUBSCRIBER_MOBILE';

export default function App() {
  const [activePage, setActivePage] = useState<NavPage>('OPERATIONS_CENTER');
  const [healthData, setHealthData] = useState<any>(null);
  const [activeNodesCount, setActiveNodesCount] = useState<number>(() => {
    const saved = localStorage.getItem('oceansense_grid_scale');
    return saved ? Number(saved) : 1000;
  });
  const [avgSnr, setAvgSnr] = useState<number>(22.4);
  const [isSubModalOpen, setIsSubModalOpen] = useState<boolean>(false);
  const [isStudioModalOpen, setIsStudioModalOpen] = useState<boolean>(false);
  const { user, isLoginModalOpen, setLoginModalOpen, logout, quickLogin, checkAuth } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    // Initial health check
    fetch('/health')
      .then((res) => res.json())
      .then((data) => setHealthData(data))
      .catch((err) => console.warn('Backend waiting:', err));

    // Live WebSocket KPI and scale listener
    wsClient.connect();
    const unsubKPI = wsClient.on('KPI_TELEMETRY_TICK', (data) => {
      if (data?.activeNodes) {
        setActiveNodesCount(data.activeNodes);
      } else if (data?.totalNodes) {
        setActiveNodesCount(data.totalNodes);
      }
      if (data?.avgSnrDb) setAvgSnr(data.avgSnrDb);
    });

    const unsubGrid = wsClient.on('GRID_CONFIG_UPDATED', (payload) => {
      if (payload?.totalNodes) {
        setActiveNodesCount(payload.totalNodes);
      }
    });

    fetch('/api/nodes/kpis')
      .then((r) => r.json())
      .then((d) => {
        if (d?.data?.activeNodes) setActiveNodesCount(d.data.activeNodes);
        else if (d?.data?.totalNodes) setActiveNodesCount(d.data.totalNodes);
        if (d?.data?.avgSnrDb) setAvgSnr(d.data.avgSnrDb);
      })
      .catch(() => {});

    // Verify authentication or auto-login with default Operations Manager for seamless start
    checkAuth();

    return () => {
      unsubKPI();
      unsubGrid();
    };
  }, []);

  const isSubscriber = user?.roles.includes('SUBSCRIBER');
  const activeRole = user?.roles[0] || 'VIEWER';

  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobileScreen(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Automatically route subscriber to mobile view upon login; return to operations center when switching to admin/engineer
  useEffect(() => {
    if (isSubscriber) {
      setActivePage('SUBSCRIBER_MOBILE');
    } else if (user && !isMobileScreen && activePage === 'SUBSCRIBER_MOBILE') {
      setActivePage('OPERATIONS_CENTER');
    }
  }, [isSubscriber, isMobileScreen, user]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', backgroundColor: 'var(--color-abyssal-deep)' }}>
      {/* Top Banner: Operations Status & Auth Profile */}
      <header style={{
        height: '52px',
        borderBottom: '1px solid var(--color-slate-border)',
        backgroundColor: 'var(--color-surface-navy)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-electric-cyan)', boxShadow: '0 0 10px var(--color-electric-cyan)' }} />
          <span style={{ fontWeight: 700, letterSpacing: '1px', fontSize: '15px', color: '#FFF' }}>
            OCEANSENSE <span style={{ color: 'var(--color-electric-cyan)', fontSize: '11px', fontWeight: 500 }}>v1.0-PROD</span>
          </span>
          {!isMobileScreen && (
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(0, 242, 254, 0.1)',
              color: 'var(--color-electric-cyan)',
              border: '1px solid rgba(0, 242, 254, 0.3)',
              marginLeft: '8px'
            }}>
              SIMULATION / DIGITAL TWIN DATA
            </span>
          )}

          {isSubscriber && !isMobileScreen && (
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(247, 37, 133, 0.15)',
              color: 'var(--color-biomass-magenta)',
              border: '1px solid rgba(247, 37, 133, 0.4)',
            }}>
              SUBSCRIBER FLEET VIEW (RAW TELEMETRY RESTRICTED)
            </span>
          )}
        </div>

        {/* Right Header: Telemetry status + User RBAC Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobileScreen ? '8px' : '18px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
          {isMobileScreen && (
            <select
              value={activePage}
              onChange={(e) => setActivePage(e.target.value as any)}
              style={{
                padding: '4px 6px',
                fontSize: '10px',
                fontFamily: 'monospace',
                background: '#0B1626',
                color: '#00F2FE',
                border: '1px solid var(--color-electric-cyan)',
                borderRadius: '4px',
              }}
            >
              <option value="SUBSCRIBER_MOBILE">📱 Fisherman 3D</option>
              <option value="OPERATIONS_CENTER">🌐 Operations 3D</option>
              <option value="SECURITY_CENTER">🛡️ Security</option>
            </select>
          )}

          {!isSubscriber && !isMobileScreen && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8' }}>
                <Server size={14} color="var(--color-aquamarine)" />
                <span>NODES: {activeNodesCount.toLocaleString()} ACTIVE</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8' }}>
                <Radio size={14} color="var(--color-electric-cyan)" />
                <span>MESH SNR: {avgSnr} dB</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8' }}>
                <Database size={14} color="var(--color-aquamarine)" />
                <span>POSTGRES: {healthData?.database?.connected ? 'ONLINE' : 'ACTIVE_SIM_STORAGE'}</span>
              </div>
            </>
          )}

          {/* Theme Toggle (Dark Abyssal / Light Daylight / Grayish Contour) */}
          <button
            onClick={() => toggleTheme()}
            title={`Current Theme: ${theme.toUpperCase()}. Click to cycle (Daylight -> Grayish -> Dark).`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid var(--color-slate-border)',
              backgroundColor: 'var(--color-slate-card)',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {theme === 'dark' && <Moon size={14} color="var(--color-electric-cyan)" />}
            {theme === 'light' && <Sun size={14} color="var(--color-amber-warning)" />}
            {theme === 'grayish' && <span style={{ fontSize: '12px' }}>🌫️</span>}
            <span>{theme === 'dark' ? 'DARK' : theme === 'light' ? 'DAYLIGHT' : 'GRAYISH'}</span>
          </button>

          {/* 3D Node Safety & Physics Studio Button */}
          <button
            onClick={() => setIsStudioModalOpen(true)}
            title="3D Safety & Physics Simulation Studio (Collision Duck-Under, Net Defense, Internal Cutaway, Uplink, Mobile)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 11px',
              borderRadius: '6px',
              border: '1px solid var(--color-electric-cyan)',
              backgroundColor: 'rgba(0, 242, 254, 0.12)',
              color: 'var(--color-electric-cyan)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 0 10px rgba(0, 242, 254, 0.2)',
            }}
          >
            <Film size={14} color="var(--color-electric-cyan)" />
            <span>3D SAFETY STUDIO</span>
          </button>

          {/* Subscription & Pricing Quick Button */}
          <button
            onClick={() => setIsSubModalOpen(true)}
            title="Fisherman Subscriptions & UPI/Card Payment"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid #00E699',
              backgroundColor: 'rgba(0, 230, 153, 0.12)',
              color: '#00E699',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <CreditCard size={14} color="#00E699" />
            <span>PRICING & PAY</span>
          </button>

          {/* User Auth Profile Badge */}
          {user ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: 'var(--color-slate-card)',
              border: '1px solid var(--color-slate-border)',
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 242, 254, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-electric-cyan)'
              }}>
                <User size={13} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {user.first_name} {user.last_name}
                </span>
                <span style={{ fontSize: '9px', color: 'var(--color-electric-cyan)' }}>
                  {activeRole}
                </span>
              </div>
              <button
                onClick={() => setLoginModalOpen(true)}
                title="Switch Demo Persona"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '3px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
              >
                <KeyRound size={14} />
              </button>
              <button
                onClick={() => logout()}
                title="Log Out"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FF6B6B',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '3px',
                }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setLoginModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '4px',
                border: '1px solid var(--color-electric-cyan)',
                backgroundColor: 'rgba(0, 242, 254, 0.1)',
                color: 'var(--color-electric-cyan)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <KeyRound size={13} />
              SIGN IN
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Tactical Navigation Sidebar (Operations Only — Hidden for Mobile Subscriber & Mobile Screens) */}
        {!isSubscriber && activePage !== 'SUBSCRIBER_MOBILE' && !isMobileScreen && (
          <aside style={{
            width: '240px',
            borderRight: '1px solid var(--color-slate-border)',
            backgroundColor: 'var(--color-surface-navy)',
            display: 'flex',
            flexDirection: 'column',
            padding: '16px 8px',
            gap: '6px',
            overflowY: 'auto',
          }}>
            <div style={{ padding: '0 8px 12px 8px', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>
              COMMAND CONSOLE
            </div>

            {/* Core Navigation Items */}
            <NavItem
              icon={<Activity size={16} />}
              label="Operations 3D Twin"
              active={activePage === 'OPERATIONS_CENTER'}
              onClick={() => setActivePage('OPERATIONS_CENTER')}
            />
            <NavItem
              icon={<Grid size={16} />}
              label="Deployment Grid"
              badge="100 km²"
              active={activePage === 'DEPLOYMENT_PLAN'}
              onClick={() => setActivePage('DEPLOYMENT_PLAN')}
            />
            <NavItem
              icon={<Wifi size={16} />}
              label="Acoustic Mesh"
              badge="Hop Trace"
              active={activePage === 'NETWORK_TOPOLOGY'}
              onClick={() => setActivePage('NETWORK_TOPOLOGY')}
            />
            <NavItem
              icon={<ShieldAlert size={16} />}
              label="Anti-Theft Security"
              badge="INCIDENT"
              color="var(--color-crimson-alert)"
              active={activePage === 'SECURITY_CENTER'}
              onClick={() => setActivePage('SECURITY_CENTER')}
            />
            <NavItem
              icon={<Radio size={16} />}
              label="Tactical Analytics"
              badge="Waterfall"
              color="var(--color-biomass-magenta)"
              active={activePage === 'TACTICAL_ANALYTICS'}
              onClick={() => setActivePage('TACTICAL_ANALYTICS')}
            />
            <NavItem
              icon={<Bot size={16} />}
              label="AI Ops Assistant"
              badge="13 Tools"
              color="var(--color-electric-cyan)"
              active={activePage === 'AI_ASSISTANT'}
              onClick={() => setActivePage('AI_ASSISTANT')}
            />
            <NavItem
              icon={<Smartphone size={16} />}
              label="Subscriber Portal"
              badge="Mobile"
              active={(activePage as string) === 'SUBSCRIBER_MOBILE'}
              onClick={() => setActivePage('SUBSCRIBER_MOBILE')}
            />
            <NavItem
              icon={<Film size={16} />}
              label="3D Safety & Physics"
              badge="6 SCENES"
              color="var(--color-electric-cyan)"
              active={false}
              onClick={() => setIsStudioModalOpen(true)}
            />
            <NavItem
              icon={<CreditCard size={16} />}
              label="Fisherman Plans"
              badge="₹499/mo"
              color="#00E699"
              active={false}
              onClick={() => setIsSubModalOpen(true)}
            />

            <div style={{ marginTop: 'auto', padding: '12px 8px', borderTop: '1px solid var(--color-slate-border)', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
              AUTH ROLE: <span style={{ color: 'var(--color-electric-cyan)' }}>{activeRole}</span><br />
              NO SATELLITE COMMS
            </div>
          </aside>
        )}

        {/* Central Viewport */}
        <main style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflowY: activePage === 'OPERATIONS_CENTER' ? 'hidden' : 'auto',
          overflowX: 'hidden',
          backgroundColor: 'var(--color-page-bg)',
        }}>
          {activePage === 'OPERATIONS_CENTER' && <OperationsCenter />}
          {activePage === 'DEPLOYMENT_PLAN' && <DeploymentPage />}
          {activePage === 'NETWORK_TOPOLOGY' && <NetworkTopologyPage />}
          {activePage === 'CHARGING_STATIONS' && <ChargingStationsPage />}
          {activePage === 'SECURITY_CENTER' && <SecurityCenterPage />}
          {activePage === 'TACTICAL_ANALYTICS' && <TacticalAnalyticsPage />}
          {activePage === 'AI_ASSISTANT' && <AIAssistantPage />}
          {activePage === 'SUBSCRIBER_MOBILE' && <SubscriberMobilePage />}
        </main>
      </div>

      {/* Login / Persona Switcher Modal */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} />

      {/* Fisherman Subscription & Monetization Payment Modal */}
      <FishermanSubscriptionModal isOpen={isSubModalOpen} onClose={() => setIsSubModalOpen(false)} />

      {/* 3D Node Engineering & Safety Physics Simulation Studio Modal */}
      <NodeSafetyStudioModal isOpen={isStudioModalOpen} onClose={() => setIsStudioModalOpen(false)} />
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  badge,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
  color?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 12px',
        borderRadius: '4px',
        border: 'none',
        backgroundColor: active ? 'rgba(0, 242, 254, 0.12)' : 'transparent',
        color: active ? 'var(--color-electric-cyan)' : '#94A3B8',
        fontSize: '12px',
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: 'all 0.15s ease',
      }}
    >
      <span style={{ color: color || (active ? 'var(--color-electric-cyan)' : '#64748B') }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span style={{
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          padding: '1px 6px',
          borderRadius: '3px',
          backgroundColor: color ? `${color}20` : 'rgba(255, 255, 255, 0.08)',
          color: color || '#94A3B8',
          border: `1px solid ${color ? `${color}50` : 'rgba(255, 255, 255, 0.1)'}`
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}
