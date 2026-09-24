// ==============================================================================
// OceanSense — Simulation Controls Bar HUD (Bottom Overlay)
// Demonstrates: Dynamic Speed (0.5x to 10x) and Scale Multiplier (10 to 100k)
// ==============================================================================

import React, { useState } from 'react';
import { Play, Pause, FastForward, ShieldAlert, Sliders } from 'lucide-react';

interface Props {
  onSpeedChange: (speed: number) => void;
  onScaleChange: (count: number) => void;
  onTriggerTamper: () => void;
  activeScale: number;
  selectedNodeId?: string | null;
}

export function SimulationControlBar({ onSpeedChange, onScaleChange, onTriggerTamper, activeScale, selectedNodeId }: Props) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeSpeed, setActiveSpeed] = useState(1.0);

  const togglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    fetch(nextState ? '/api/simulation/resume' : '/api/simulation/pause', { method: 'POST' });
  };

  const handleSpeed = (speed: number) => {
    setActiveSpeed(speed);
    onSpeedChange(speed);
    fetch('/api/simulation/speed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speed }),
    });
  };

  const handleScale = (count: number) => {
    onScaleChange(count);
    fetch('/api/simulation/scale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count }),
    });
  };

  return (
    <div className="hud-panel" style={{
      position: 'absolute',
      bottom: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '8px 18px',
      borderRadius: '8px',
      zIndex: 35,
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
    }}>
      {/* Play / Pause Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={togglePlay}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid var(--color-slate-border)',
            backgroundColor: isPlaying ? 'rgba(0, 230, 153, 0.15)' : 'rgba(255, 183, 3, 0.15)',
            color: isPlaying ? 'var(--color-aquamarine)' : 'var(--color-amber-warning)',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          <span>{isPlaying ? 'PAUSE SIM' : 'RESUME'}</span>
        </button>
      </div>

      <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-slate-border)' }} />

      {/* Speed Multipliers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ color: '#64748B', marginRight: '6px', fontSize: '10px' }}>SPEED:</span>
        {[0.5, 1.0, 2.0, 5.0, 10.0].map((spd) => (
          <button
            key={spd}
            onClick={() => handleSpeed(spd)}
            style={{
              padding: '4px 8px',
              borderRadius: '3px',
              border: 'none',
              backgroundColor: activeSpeed === spd ? 'var(--color-electric-cyan)' : 'rgba(15, 23, 42, 0.6)',
              color: activeSpeed === spd ? 'var(--color-abyssal-deep)' : '#94A3B8',
              fontWeight: activeSpeed === spd ? 700 : 500,
              cursor: 'pointer',
              fontSize: '10px',
            }}
          >
            {spd}x
          </button>
        ))}
      </div>

      <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-slate-border)' }} />

      {/* Node Count Scaling */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ color: '#64748B', marginRight: '6px', fontSize: '10px' }}>SCALE:</span>
        {[4, 9, 100, 1000, 10000].map((cnt) => {
          const isSelected = activeScale === cnt || (cnt === 4 && activeScale <= 4);
          return (
            <button
              key={cnt}
              onClick={() => handleScale(cnt)}
              style={{
                padding: '4px 8px',
                borderRadius: '3px',
                border: 'none',
                backgroundColor: isSelected ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
                color: isSelected ? 'var(--color-electric-cyan)' : '#64748B',
                borderBottom: isSelected ? '2px solid var(--color-electric-cyan)' : 'none',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '10px',
              }}
            >
              {cnt === 4 ? '4 (3km)' : cnt === 9 ? '9' : cnt >= 1000 ? `${cnt / 1000}k` : cnt}
            </button>
          );
        })}
      </div>

      <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-slate-border)' }} />

      {/* Quick Theft Scenario Injection */}
      <button
        onClick={onTriggerTamper}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '4px',
          border: '1px solid var(--color-crimson-alert)',
          backgroundColor: 'rgba(255, 59, 48, 0.15)',
          color: 'var(--color-crimson-alert)',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        <ShieldAlert size={14} className="animate-pulse-crimson" />
        <span>{selectedNodeId ? `SIMULATE THEFT ON ${selectedNodeId}` : 'SIMULATE NODE THEFT'}</span>
      </button>
    </div>
  );
}
