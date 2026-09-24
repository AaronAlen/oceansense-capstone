// ==============================================================================
// OceanSense — Tactical Ocean Analytics, Spectrogram & Signal Intelligence
// Demonstrates: Week 9 Tactical Charts, HTML5 Canvas 2D Waterfall & Sound Velocity Profile
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';

export const TacticalAnalyticsPage: React.FC = () => {
  const waterfallCanvasRef = useRef<HTMLCanvasElement>(null);
  const [svpData, setSvpData] = useState<any>(null);
  const [spectrumData, setSpectrumData] = useState<any>(null);

  // Fetch SVP & Spectrum
  useEffect(() => {
    fetch('/api/analytics/sound-velocity-profile')
      .then(res => res.json())
      .then(data => setSvpData(data))
      .catch(console.error);

    fetch('/api/analytics/acoustic-spectrum')
      .then(res => res.json())
      .then(data => setSpectrumData(data))
      .catch(console.error);
  }, []);

  // Procedural Sonar Waterfall Spectrogram Animation on HTML5 Canvas 2D
  useEffect(() => {
    const canvas = waterfallCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 640;
    const height = 280;
    let animId: number;
    let frame = 0;

    // Color map for acoustic decibels: Deep Navy -> Electric Cyan -> Gold -> Crimson
    const getColor = (val: number) => {
      // val in [0, 1]
      if (val < 0.25) {
        const r = 4;
        const g = Math.floor(val * 4 * 120);
        const b = Math.floor(val * 4 * 255);
        return `rgb(${r},${g},${b})`;
      } else if (val < 0.6) {
        const norm = (val - 0.25) / 0.35;
        const r = 0;
        const g = Math.floor(120 + norm * 122);
        const b = Math.floor(255 - norm * 50);
        return `rgb(${r},${g},${b})`;
      } else if (val < 0.85) {
        const norm = (val - 0.6) / 0.25;
        const r = Math.floor(norm * 255);
        const g = Math.floor(242 - norm * 50);
        const b = 0;
        return `rgb(${r},${g},${b})`;
      } else {
        const norm = (val - 0.85) / 0.15;
        const r = 255;
        const g = Math.floor(180 * (1 - norm));
        const b = Math.floor(50 * (1 - norm));
        return `rgb(${r},${g},${b})`;
      }
    };

    const render = () => {
      frame++;

      // Shift existing rows down by 2 pixels (waterfall downward scroll)
      const imgData = ctx.getImageData(0, 0, width, height - 2);
      ctx.putImageData(imgData, 0, 2);

      // Generate new top row of acoustic frequency bins (5 kHz to 50 kHz across 640 pixels)
      for (let x = 0; x < width; x += 2) {
        const freqKhz = 5 + (x / width) * 45;

        // Base ocean background noise
        let intensity = 0.12 + Math.random() * 0.15;

        // Biological Fish School Target acoustic return spikes around 24-28 kHz
        if (freqKhz >= 24 && freqKhz <= 28) {
          const centerDist = Math.abs(freqKhz - 26);
          const bioWave = Math.sin(frame * 0.08) * 0.3 + 0.5;
          intensity += (1.0 - centerDist / 2.0) * 0.55 * bioWave;
        }

        // PZT Transducer Ping Line (periodic chirp at 32 kHz)
        if (Math.abs(freqKhz - 32) < 0.4 && frame % 40 < 5) {
          intensity += 0.65;
        }

        intensity = Math.min(1.0, Math.max(0.0, intensity));
        ctx.fillStyle = getColor(intensity);
        ctx.fillRect(x, 0, 2, 2);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

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
          <div style={{ fontSize: '0.75rem', color: 'var(--color-electric-cyan)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
            ACOUSTIC SIGNAL PROCESSING // HYDROPHONE ARRAY INTELLIGENCE
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '4px 0 0 0', color: 'var(--color-text-primary)' }}>
            Tactical Ocean Analytics & Hydrophone Spectrogram
          </h1>
        </div>

        <div style={{
          padding: '6px 12px',
          background: 'rgba(0, 242, 254, 0.15)',
          border: '1px solid var(--color-electric-cyan)',
          borderRadius: '4px',
          fontSize: '0.8rem',
          fontFamily: 'monospace',
          color: 'var(--color-electric-cyan)',
        }}>
          ● HYDROPHONE ARRAY ACTIVE // FFT 2048 SAMPLES
        </div>
      </div>

      {/* Sonar Waterfall Spectrogram Card */}
      <div style={{
        background: 'var(--color-surface-navy)',
        border: '1px solid var(--color-slate-border)',
        borderRadius: '6px',
        padding: '1.25rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-electric-cyan)', fontFamily: 'monospace' }}>REAL-TIME 2D CANVAS WATERFALL</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '2px 0 0 0', color: 'var(--color-text-primary)' }}>
              Broadband Acoustic Waterfall Spectrogram (5 kHz – 50 kHz)
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
            <span style={{ color: '#F72585' }}>■ Biological Cluster (26 kHz)</span>
            <span style={{ color: '#00E699' }}>■ PZT Carrier (32 kHz)</span>
            <span style={{ color: '#00F2FE' }}>■ Ocean Ambient Noise</span>
          </div>
        </div>

        <div style={{ position: 'relative', width: '100%', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--color-slate-border)' }}>
          <canvas
            ref={waterfallCanvasRef}
            width={640}
            height={280}
            style={{ width: '100%', height: '280px', display: 'block', background: '#02060D' }}
          />

          {/* Frequency Axis Overlay */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '4px 8px',
            background: 'var(--color-surface-navy)',
            fontSize: '0.7rem',
            fontFamily: 'monospace',
            color: 'var(--color-text-muted)',
            borderTop: '1px solid var(--color-slate-border)',
          }}>
            <span>5 kHz (LF)</span>
            <span>15 kHz</span>
            <span style={{ color: '#F72585', fontWeight: 700 }}>26 kHz (Biomass Target)</span>
            <span style={{ color: '#00E699' }}>32 kHz (Telemetry)</span>
            <span>40 kHz</span>
            <span>50 kHz (HF)</span>
          </div>
        </div>
      </div>

      {/* Sound Velocity Profile (SVP) & SOFAR Channel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        <div style={{
          background: 'var(--color-surface-navy)',
          border: '1px solid var(--color-slate-border)',
          borderRadius: '6px',
          padding: '1.25rem',
        }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--color-electric-cyan)', fontFamily: 'monospace', margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>
            Sound Velocity Profile (Mackenzie Equation)
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 1rem 0' }}>
            Visualizes temperature stratification, the thermocline layer, and the SOFAR channel axis (~140m depth) where acoustic energy is trapped and travels extreme distances.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {svpData?.profile?.map((p: any) => {
              // Normalized sound speed [1500 to 1540 m/s]
              const pct = Math.max(10, Math.min(100, ((p.sound_velocity_ms - 1500) / 40) * 100));
              const isSofar = p.depth_m === 140;

              return (
                <div key={p.depth_m} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  <span style={{ width: '55px', color: isSofar ? 'var(--color-biomass-magenta)' : 'var(--color-text-muted)' }}>
                    {p.depth_m}m {isSofar && '★'}
                  </span>
                  <div style={{ flex: 1, height: '14px', background: 'var(--color-slate-card)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: isSofar ? 'var(--color-biomass-magenta)' : p.depth_m < 80 ? 'var(--color-amber-warning)' : 'var(--color-electric-cyan)',
                      borderRadius: '3px',
                    }} />
                  </div>
                  <span style={{ width: '85px', textAlign: 'right', color: 'var(--color-text-secondary)' }}>
                    {p.sound_velocity_ms} m/s
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Acoustic Noise Spectrum Knudsen Curves */}
        <div style={{
          background: 'var(--color-surface-navy)',
          border: '1px solid var(--color-slate-border)',
          borderRadius: '6px',
          padding: '1.25rem',
        }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--color-electric-cyan)', fontFamily: 'monospace', margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>
            Knudsen Ambient Power Spectral Density (PSD)
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 1rem 0' }}>
            Measures background ocean noise versus localized biological reflection spikes in dB relative to 1 uPa^2 / Hz.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {spectrumData?.bins?.slice(0, 10).map((b: any) => {
              const isBio = b.signalClassification.startsWith('BIO');
              const barWidth = Math.max(15, Math.min(100, (b.powerSpectralDensityDb / 75) * 100));

              return (
                <div key={b.frequencyKhz} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  <span style={{ width: '65px', color: isBio ? 'var(--color-aquamarine)' : 'var(--color-text-muted)' }}>
                    {b.frequencyKhz} kHz
                  </span>
                  <div style={{ flex: 1, height: '14px', background: 'var(--color-slate-card)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${barWidth}%`,
                      height: '100%',
                      background: isBio ? 'var(--color-aquamarine)' : 'var(--color-electric-cyan)',
                      borderRadius: '3px',
                    }} />
                  </div>
                  <span style={{ width: '65px', textAlign: 'right', color: isBio ? 'var(--color-aquamarine)' : 'var(--color-text-muted)' }}>
                    {b.powerSpectralDensityDb} dB
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
