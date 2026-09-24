// ==============================================================================
// OceanSense — Tactical Node Details HUD Drawer
// Demonstrates: Hardware Telemetry Readouts, Gauge Micro-Data & Tamper Actions
// ==============================================================================

import React, { useState } from 'react';
import { Node3DData } from '../../three/SonarNodeInstances';
import { X, Battery, Radio, Compass, AlertTriangle, ShieldCheck, RefreshCw, Cpu, Activity } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface Props {
  node: Node3DData | null;
  onClose: () => void;
  onNodeUpdated?: () => void;
}

export function NodeDetailDrawer({ node, onClose, onNodeUpdated }: Props) {
  const { token } = useAuthStore();
  const [isActionLoading, setIsActionLoading] = useState(false);

  if (!node) return null;

  const isTampered = node.status === 'THEFT_SUSPECTED' || node.tamper_status !== 'SECURE';

  const handleTamperTest = async () => {
    setIsActionLoading(true);
    try {
      await fetch(`/api/nodes/${node.id}/tamper`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (onNodeUpdated) onNodeUpdated();
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReset = async () => {
    setIsActionLoading(true);
    try {
      await fetch(`/api/nodes/${node.id}/reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (onNodeUpdated) onNodeUpdated();
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div style={{
      position: 'absolute',
      right: '20px',
      top: '70px',
      bottom: '70px',
      width: '380px',
      borderRadius: '12px',
      zIndex: 1100,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: 'rgba(7, 15, 30, 0.82)',
      backdropFilter: 'blur(20px) saturate(160%)',
      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      border: `1.5px solid ${isTampered ? 'rgba(255, 59, 48, 0.7)' : 'rgba(0, 242, 254, 0.35)'}`,
      boxShadow: `0 20px 50px rgba(0, 0, 0, 0.85), 0 0 35px ${isTampered ? 'rgba(255, 59, 48, 0.35)' : 'rgba(0, 242, 254, 0.25)'}, inset 0 1px 0 rgba(255, 255, 255, 0.12)`,
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: 'rgba(11, 22, 40, 0.65)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} color={isTampered ? 'var(--color-crimson-alert)' : 'var(--color-electric-cyan)'} />
          <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#FFF' }}>
            ANCHORED BUOY: {node.id}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Body Scrollable Area */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', flex: 1 }}>
        {/* Status Banner */}
        <div style={{
          padding: '10px 14px',
          borderRadius: '4px',
          backgroundColor: isTampered ? 'rgba(255, 59, 48, 0.15)' : 'rgba(0, 242, 254, 0.1)',
          border: `1px solid ${isTampered ? 'var(--color-crimson-alert)' : 'rgba(0, 242, 254, 0.3)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isTampered ? (
              <AlertTriangle size={16} color="var(--color-crimson-alert)" className="animate-pulse-crimson" />
            ) : (
              <ShieldCheck size={16} color="var(--color-aquamarine)" />
            )}
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '12px', color: isTampered ? 'var(--color-crimson-alert)' : '#FFF' }}>
              {node.status}
            </span>
          </div>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#94A3B8' }}>
            {node.zoneId}
          </span>
        </div>

        {/* Acoustic Sonar Aperture & Beam Coverage Banner */}
        <div style={{
          padding: '10px',
          borderRadius: '4px',
          background: 'rgba(0, 242, 254, 0.08)',
          border: '1px solid rgba(0, 242, 254, 0.25)',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
        }}>
          <div style={{ color: 'var(--color-electric-cyan)', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Radio size={14} />
            <span>ACOUSTIC FAN BLADE (0-300m SCAN)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>
            <div>Azimuth: <strong style={{ color: '#FFF' }}>360° Continuous</strong></div>
            <div>Depth Reach: <strong style={{ color: 'var(--color-aquamarine)' }}>0-300m Seabed</strong></div>
            <div>Transducer: <strong style={{ color: '#FFF' }}>-10.0m Keel</strong></div>
            <div>Mooring: <strong style={{ color: 'var(--color-neon-gold)' }}>{node.depth_m.toFixed(1)}m Tether</strong></div>
          </div>
        </div>

        {/* Battery & Solar Deck Telemetry Card */}
        <div style={{ padding: '12px', borderRadius: '4px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--color-slate-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Battery size={14} color={node.battery_level < 20 ? 'var(--color-crimson-alert)' : 'var(--color-aquamarine)'} />
              BATTERY & SOLAR HARVESTER
            </span>
            <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: node.battery_level < 20 ? 'var(--color-crimson-alert)' : 'var(--color-aquamarine)' }}>
              {node.battery_level.toFixed(1)}%
            </span>
          </div>
          <div style={{ height: '6px', borderRadius: '3px', backgroundColor: '#1E293B', overflow: 'hidden' }}>
            <div style={{
              width: `${node.battery_level}%`,
              height: '100%',
              backgroundColor: node.battery_level < 20 ? 'var(--color-crimson-alert)' : 'var(--color-aquamarine)',
              transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
            <span>Solar Deck: Photovoltaic Top</span>
            <span>Auxiliary: Li-SOCl2</span>
          </div>
        </div>

        {/* Environmental & Acoustic Sensors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
          <div style={{ padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--color-slate-border)', borderRadius: '4px' }}>
            <div style={{ color: '#64748B' }}>SEABED ANCHOR DEPTH</div>
            <div style={{ color: '#FFF', fontWeight: 600, fontSize: '13px', marginTop: '4px' }}>
              {node.depth_m.toFixed(1)} m
            </div>
          </div>
          <div style={{ padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--color-slate-border)', borderRadius: '4px' }}>
            <div style={{ color: '#64748B' }}>SIGNAL-TO-NOISE</div>
            <div style={{ color: 'var(--color-electric-cyan)', fontWeight: 600, fontSize: '13px', marginTop: '4px' }}>
              {node.snr_db} dB
            </div>
          </div>
          <div style={{ padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--color-slate-border)', borderRadius: '4px' }}>
            <div style={{ color: '#64748B' }}>BUOY TILT / SWELL</div>
            <div style={{ color: node.tilt_angle_deg > 30 ? 'var(--color-crimson-alert)' : '#FFF', fontWeight: 600, fontSize: '13px', marginTop: '4px' }}>
              {node.tilt_angle_deg.toFixed(1)}°
            </div>
          </div>
          <div style={{ padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--color-slate-border)', borderRadius: '4px' }}>
            <div style={{ color: '#64748B' }}>TELEMETRY GATEWAY</div>
            <div style={{ color: 'var(--color-neon-gold)', fontWeight: 600, fontSize: '13px', marginTop: '4px' }}>
              {node.gatewayId}
            </div>
          </div>
        </div>

        {/* Geographic Coordinates */}
        <div style={{ padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--color-slate-border)', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', marginBottom: '6px' }}>
            <Compass size={14} />
            <span>SURFACE GPS ANCHOR POSITION</span>
          </div>
          <div style={{ color: '#FFF' }}>LAT: {node.latitude.toFixed(6)}° N</div>
          <div style={{ color: '#FFF', marginTop: '2px' }}>LON: {node.longitude.toFixed(6)}° E</div>
        </div>

        {/* Firmware & Micro-Specs */}
        <div style={{ padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--color-slate-border)', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#64748B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Cpu size={12} color="var(--color-electric-cyan)" />
            <span>FIRMWARE: v3.4.1-rc2 (ARM Cortex-M4 + DSP)</span>
          </div>
          <div>Acoustic Beam: 360° Horizontal x 180° Vertical Downward</div>
          <div>Uplink: Direct Iridium SBD / 4G LTE + 24kHz Acoustic Mesh</div>
          <div>Mooring Tether: High-Tensile Armored Steel (Seabed Locked)</div>
        </div>
      </div>

      {/* Footer Actions: Tamper Scenario Injection */}
      <div style={{ padding: '14px 18px', borderTop: '1px solid var(--color-slate-border)', backgroundColor: 'var(--color-surface-navy)', display: 'flex', gap: '10px' }}>
        {!isTampered ? (
          <button
            onClick={handleTamperTest}
            disabled={isActionLoading}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid var(--color-crimson-alert)',
              backgroundColor: 'rgba(255, 59, 48, 0.15)',
              color: 'var(--color-crimson-alert)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <AlertTriangle size={14} />
            TRIGGER TAMPER TEST
          </button>
        ) : (
          <button
            onClick={handleReset}
            disabled={isActionLoading}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid var(--color-aquamarine)',
              backgroundColor: 'rgba(0, 230, 153, 0.15)',
              color: 'var(--color-aquamarine)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} />
            RESET TO NOMINAL
          </button>
        )}
      </div>
    </div>
  );
}
