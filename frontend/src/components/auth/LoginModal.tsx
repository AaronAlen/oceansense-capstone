// ==============================================================================
// OceanSense — Tactical Login Modal & Demo Persona Switcher
// Demonstrates: Week 6 RBAC Persona Selection & Modern Glassmorphism UI
// ==============================================================================

import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Shield, Key, X, Lock, AlertCircle, Ship, Compass, Wrench, BarChart2 } from 'lucide-react';

const DEMO_PERSONAS = [
  {
    role: 'SUPER_ADMIN',
    name: 'Marcus Vance',
    email: 'admin@oceansense.io',
    description: 'Full Root Access, User RBAC & Deployment Management',
    icon: <Shield size={16} color="var(--color-crimson-alert)" />,
    badgeColor: 'var(--color-crimson-alert)',
  },
  {
    role: 'OPERATIONS_MANAGER',
    name: 'Elena Rostova',
    email: 'operator@oceansense.io',
    description: 'Digital Twin, AUV Drone Dispatch & Anti-Theft Response',
    icon: <Compass size={16} color="var(--color-electric-cyan)" />,
    badgeColor: 'var(--color-electric-cyan)',
  },
  {
    role: 'MARINE_ENGINEER',
    name: 'Chen Wei',
    email: 'engineer@oceansense.io',
    description: 'Sonar Node Grid, Seabed Mooring & Recharging Stations',
    icon: <Wrench size={16} color="var(--color-amber-warning)" />,
    badgeColor: 'var(--color-amber-warning)',
  },
  {
    role: 'ANALYST',
    name: 'Aria Nakamura',
    email: 'analyst@oceansense.io',
    description: 'Oceanographic Analytics, SOFAR Charts & AI Agent Queries',
    icon: <BarChart2 size={16} color="var(--color-aquamarine)" />,
    badgeColor: 'var(--color-aquamarine)',
  },
  {
    role: 'SUBSCRIBER',
    name: 'Sean Callahan',
    email: 'subscriber@pacificatrawlers.com',
    description: 'Commercial Fleet View, Tuna Biomass Alerts & 2D Map',
    icon: <Ship size={16} color="var(--color-biomass-magenta)" />,
    badgeColor: 'var(--color-biomass-magenta)',
  },
];

export function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose?: () => void }) {
  const { login, quickLogin, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('operator@oceansense.io');
  const [password, setPassword] = useState('Password123!');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(7, 11, 18, 0.85)',
      backdropFilter: 'blur(10px)',
      padding: '20px',
    }}>
      <div className="hud-panel hud-panel-glow-cyan" style={{
        width: '100%',
        maxWidth: '820px',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--color-slate-border)',
          backgroundColor: 'var(--color-surface-navy)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Lock size={18} color="var(--color-electric-cyan)" />
            <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '0.5px', color: '#FFF' }}>
              OCEANSENSE SECURE AUTHENTICATION GATEWAY
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
              <span style={{ padding: '2px 6px', borderRadius: '3px', backgroundColor: 'rgba(0, 242, 254, 0.1)', color: 'var(--color-electric-cyan)', border: '1px solid rgba(0, 242, 254, 0.2)' }}>
                JWT-HS256
              </span>
              <span style={{ padding: '2px 6px', borderRadius: '3px', backgroundColor: 'rgba(0, 230, 153, 0.1)', color: 'var(--color-aquamarine)', border: '1px solid rgba(0, 230, 153, 0.2)' }}>
                BCRYPT
              </span>
              <span style={{ padding: '2px 6px', borderRadius: '3px', backgroundColor: 'rgba(255, 183, 3, 0.1)', color: 'var(--color-amber-warning)', border: '1px solid rgba(255, 183, 3, 0.2)' }}>
                RBAC GUARD
              </span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Content Body: Split into Form & Quick Demo Logins */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', padding: '24px', gap: '24px' }}>
          {/* Credentials Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-electric-cyan)', marginBottom: '4px' }}>
                TACTICAL USER CREDENTIALS
              </div>
              <p style={{ fontSize: '12px', color: '#94A3B8' }}>
                Sign in to activate role-based console permissions.
              </p>
            </div>

            {error && (
              <div style={{
                padding: '10px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 59, 48, 0.15)',
                border: '1px solid rgba(255, 59, 48, 0.4)',
                color: '#FF6B6B',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94A3B8', marginBottom: '6px' }}>
                SECURITY IDENTIFIER (EMAIL)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--color-slate-border)',
                  color: '#FFF',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94A3B8', marginBottom: '6px' }}>
                ACCESS KEY (PASSWORD)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--color-slate-border)',
                  color: '#FFF',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                }}
                required
              />
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#64748B', marginTop: '4px' }}>
                Demo password: Password123!
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: '8px',
                padding: '12px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'var(--color-electric-cyan)',
                color: 'var(--color-abyssal-deep)',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'opacity 0.2s',
              }}
            >
              <Key size={16} />
              {isLoading ? 'AUTHENTICATING...' : 'AUTHENTICATE & ENTER'}
            </button>
          </form>

          {/* 1-Click Fast Persona Switcher */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '1px solid var(--color-slate-border)', paddingLeft: '24px' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-aquamarine)', marginBottom: '2px' }}>
              FAST 1-CLICK DEMO PERSONAS (WEEK 6 RBAC)
            </div>
            <p style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>
              Click any persona below to authenticate instantly with appropriate permissions:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {DEMO_PERSONAS.map((persona) => (
                <button
                  key={persona.role}
                  type="button"
                  onClick={() => quickLogin(persona.email)}
                  disabled={isLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid var(--color-slate-border)',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = persona.badgeColor;
                    e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.95)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-slate-border)';
                    e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.6)';
                  }}
                >
                  <div style={{ padding: '6px', borderRadius: '4px', backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
                    {persona.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#FFF' }}>{persona.name}</span>
                      <span style={{
                        fontSize: '9px',
                        fontFamily: 'var(--font-mono)',
                        padding: '1px 5px',
                        borderRadius: '2px',
                        color: persona.badgeColor,
                        border: `1px solid ${persona.badgeColor}40`,
                        backgroundColor: `${persona.badgeColor}15`,
                      }}>
                        {persona.role}
                      </span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>
                      {persona.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
