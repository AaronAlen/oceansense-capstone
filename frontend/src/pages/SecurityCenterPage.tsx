// ==============================================================================
// OceanSense — Anti-Theft Security Center & Drone Intercept Console
// Demonstrates: Week 11 Incident Dispatch, Tamper Triangulation & Drone Optics
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { LiveCameraFeedModal } from '../components/drone/LiveCameraFeedModal';
import { AUVState } from '../three/AUVDroneModels';

export const SecurityCenterPage: React.FC = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [auvs, setAuvs] = useState<AUVState[]>([]);
  const [selectedAUVForCamera, setSelectedAUVForCamera] = useState<AUVState | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchSecurityState = async () => {
    try {
      const incRes = await fetch('/api/auvs/incidents');
      const incData = await incRes.json();
      setIncidents(incData.incidents || []);

      const auvRes = await fetch('/api/auvs');
      const auvData = await auvRes.json();
      setAuvs(auvData.auvs || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSecurityState();
    const interval = setInterval(fetchSecurityState, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerTamper = async (nodeId: string = 'SN-0431') => {
    try {
      const res = await fetch(`/api/simulation/tamper/${nodeId}`, { method: 'POST' });
      const data = await res.json();
      setActionMessage(`[SECURITY ALERT] Tamper injected on ${nodeId}! Intercept drone dispatched automatically.`);
      fetchSecurityState();
    } catch (e: any) {
      setActionMessage(`Error: ${e.message}`);
    }
  };

  const handleResetAlarm = async (nodeId: string = 'SN-0431') => {
    try {
      const res = await fetch(`/api/simulation/reset/${nodeId}`, { method: 'POST' });
      if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
      const data = await res.json();
      setActionMessage(`Node ${nodeId} tamper alarm cleared. Restored to SECURE baseline.`);
      fetchSecurityState();
    } catch (e: any) {
      setActionMessage(`Error: ${e.message}`);
    }
  };

  const primaryIncident = incidents.find(i => i.nodeId === 'SN-0431');
  const respondingDrone = auvs.find(a => a.id === 'AUV-01');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      padding: '1.5rem',
      paddingBottom: '3rem',
      background: 'var(--color-page-bg)',
      minHeight: '100%',
      color: 'var(--color-text-secondary)',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-crimson-alert)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
            SUBSEA CRITICAL INFRASTRUCTURE DEFENSE // ANTI-THEFT & TAMPER DETECTION
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '4px 0 0 0', color: 'var(--color-text-primary)' }}>
            Anti-Theft Security Center & Drone Intercept
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => handleTriggerTamper('SN-0431')}
            style={{
              padding: '6px 14px',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              borderRadius: '4px',
              border: '1px solid var(--color-crimson-alert)',
              background: 'rgba(255, 59, 48, 0.2)',
              color: 'var(--color-crimson-alert)',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ⚡ INJECT TAMPER ON SN-0431
          </button>
          <button
            onClick={() => handleResetAlarm('SN-0431')}
            style={{
              padding: '6px 14px',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              borderRadius: '4px',
              border: '1px solid var(--color-aquamarine)',
              background: 'rgba(0, 230, 153, 0.15)',
              color: 'var(--color-aquamarine)',
              cursor: 'pointer',
            }}
          >
            ✓ RESET TAMPER ALARM
          </button>
        </div>
      </div>

      {actionMessage && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '4px',
          background: actionMessage.includes('ALERT') ? 'rgba(255, 59, 48, 0.15)' : 'rgba(0, 230, 153, 0.15)',
          border: actionMessage.includes('ALERT') ? '1px solid #FF3B30' : '1px solid #00E699',
          color: actionMessage.includes('ALERT') ? '#FF3B30' : '#00E699',
          fontSize: '0.85rem',
          fontFamily: 'monospace',
        }}>
          {actionMessage}
        </div>
      )}

      {/* Primary Incident Alert Banner */}
      {primaryIncident ? (
        <div style={{
          background: 'var(--color-surface-navy)',
          border: '1px solid var(--color-crimson-alert)',
          boxShadow: '0 0 25px rgba(255, 59, 48, 0.2)',
          borderRadius: '6px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#FF3B30',
                boxShadow: '0 0 10px #FF3B30',
                animation: 'pulse 1.2s infinite',
              }} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)', letterSpacing: '0.05em' }}>
                CRITICAL SECURITY EVENT // {primaryIncident.status}
              </h2>
            </div>

            <span style={{
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              padding: '3px 8px',
              background: 'rgba(255, 59, 48, 0.2)',
              color: '#FF3B30',
              borderRadius: '4px',
              border: '1px solid #FF3B30',
            }}>
              INCIDENT ID: {primaryIncident.id}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'var(--color-slate-card)', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>TARGET NODE</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-crimson-alert)', fontFamily: 'monospace' }}>{primaryIncident.nodeId}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Zone Alpha (142m Depth)</div>
            </div>

            <div style={{ padding: '0.75rem', background: 'var(--color-slate-card)', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>TILT DEVIATION</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-amber-warning)', fontFamily: 'monospace' }}>{primaryIncident.tiltAngleDeg}°</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Threshold &gt; 45° exceeded</div>
            </div>

            <div style={{ padding: '0.75rem', background: 'var(--color-slate-card)', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>ACCELEROMETER DISPLACEMENT</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-crimson-alert)', fontFamily: 'monospace' }}>{primaryIncident.accelerometerDisplacementG} G</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Physical drag transient</div>
            </div>

            <div style={{ padding: '0.75rem', background: 'var(--color-slate-card)', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>RESPONDING DRONE</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-electric-cyan)', fontFamily: 'monospace' }}>{primaryIncident.assignedDroneId}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>En route to coordinates</div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            background: 'rgba(255, 59, 48, 0.08)',
            borderRadius: '4px',
            border: '1px dashed rgba(255, 59, 48, 0.4)',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              <strong>AI Evidence Assessment:</strong> {primaryIncident.inspectionDetails?.description || 'Autonomous drone en route with optical searchlights enabled.'}
            </div>

            <button
              onClick={() => {
                if (respondingDrone) setSelectedAUVForCamera(respondingDrone);
              }}
              style={{
                padding: '8px 16px',
                background: 'var(--color-crimson-alert)',
                border: 'none',
                borderRadius: '4px',
                color: '#FFFFFF',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              📹 VIEW AUV OPTICAL FEED
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'var(--color-surface-navy)',
          border: '1px solid var(--color-slate-border)',
          borderRadius: '6px',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <span style={{ fontSize: '1.5rem' }}>🛡️</span>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--color-aquamarine)' }}>ALL SUBSEA SECTORS SECURE</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              No active accelerometer anomalies or unauthorized displacement vectors detected across 1,000 seabed sonar nodes.
            </div>
          </div>
        </div>
      )}

      {/* Autonomous Drone Fleet Status Table */}
      <div style={{
        background: 'var(--color-surface-navy)',
        border: '1px solid var(--color-slate-border)',
        borderRadius: '6px',
        padding: '1.25rem',
      }}>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--color-electric-cyan)', fontFamily: 'monospace', margin: '0 0 1rem 0', textTransform: 'uppercase' }}>
          AUV Robotic Swarm Status & Mission Profiles
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', fontFamily: 'monospace' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-slate-border)', color: 'var(--color-text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>DRONE ID</th>
                <th style={{ padding: '8px' }}>NAME</th>
                <th style={{ padding: '8px' }}>ZONE / DOCK</th>
                <th style={{ padding: '8px' }}>MISSION STATUS</th>
                <th style={{ padding: '8px' }}>DEPTH</th>
                <th style={{ padding: '8px' }}>SPEED</th>
                <th style={{ padding: '8px' }}>BATTERY</th>
                <th style={{ padding: '8px' }}>OPTICS</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {auvs.map((auv) => (
                <tr key={auv.id} style={{ borderBottom: '1px solid var(--color-slate-border)' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 700, color: 'var(--color-electric-cyan)' }}>{auv.id}</td>
                  <td style={{ padding: '10px 8px', color: 'var(--color-text-primary)' }}>{auv.name}</td>
                  <td style={{ padding: '10px 8px', color: 'var(--color-text-muted)' }}>{auv.zoneId} ({auv.dockId})</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '3px',
                      background: auv.status.includes('INTERCEPT') || auv.status.includes('TAMPER') ? 'rgba(255, 59, 48, 0.2)' : 'rgba(0, 230, 153, 0.15)',
                      color: auv.status.includes('INTERCEPT') || auv.status.includes('TAMPER') ? 'var(--color-crimson-alert)' : 'var(--color-aquamarine)',
                    }}>
                      {auv.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', color: 'var(--color-text-secondary)' }}>{auv.depth_m.toFixed(1)}m</td>
                  <td style={{ padding: '10px 8px', color: 'var(--color-text-secondary)' }}>{auv.speedKnots.toFixed(1)} kts</td>
                  <td style={{ padding: '10px 8px', color: auv.batteryPct > 50 ? 'var(--color-aquamarine)' : 'var(--color-amber-warning)' }}>
                    {auv.batteryPct.toFixed(1)}%
                  </td>
                  <td style={{ padding: '10px 8px', color: 'var(--color-text-muted)' }}>{auv.cameraStatus}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedAUVForCamera(auv)}
                      style={{
                        padding: '4px 8px',
                        background: 'rgba(0, 242, 254, 0.1)',
                        border: '1px solid var(--color-electric-cyan)',
                        borderRadius: '3px',
                        color: 'var(--color-electric-cyan)',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                      }}
                    >
                      LIVE CAM
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Camera Feed Modal */}
      {selectedAUVForCamera && (
        <LiveCameraFeedModal
          auv={selectedAUVForCamera}
          onClose={() => setSelectedAUVForCamera(null)}
        />
      )}
    </div>
  );
};
