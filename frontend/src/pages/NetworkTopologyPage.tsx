// ==============================================================================
// OceanSense — Acoustic Mesh Network Topology & Routing Architecture
// Demonstrates: Week 10 Recursive Path Tracing, Multi-Hop Acoustic Telemetry & SNR Metrics
// ==============================================================================

import React, { useState, useEffect } from 'react';

export const NetworkTopologyPage: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('SN-0431');
  const [routeData, setRouteData] = useState<any>(null);
  const [meshSummary, setMeshSummary] = useState<any>(null);
  const [loadingRoute, setLoadingRoute] = useState<boolean>(false);

  const fetchRoute = async (nodeId: string) => {
    setLoadingRoute(true);
    try {
      const res = await fetch(`/api/topology/route/${nodeId}`);
      const data = await res.json();
      setRouteData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRoute(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/topology/mesh-summary');
      const data = await res.json();
      setMeshSummary(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRoute(selectedNodeId);
    fetchSummary();
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
      {/* Title & Node Route Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-electric-cyan)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
            ACOUSTIC MESH BACKBONE // NO SATELLITE PRIMARY SENSOR ROUTING
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '4px 0 0 0', color: 'var(--color-text-primary)' }}>
            Underwater Acoustic Topology & Multi-Hop Path Trace
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Trace Node:</span>
          {['SN-0431', 'SN-0012', 'SN-0218', 'SN-0842'].map((id) => (
            <button
              key={id}
              onClick={() => {
                setSelectedNodeId(id);
                fetchRoute(id);
              }}
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                borderRadius: '4px',
                border: selectedNodeId === id ? '1px solid var(--color-electric-cyan)' : '1px solid var(--color-slate-border)',
                background: selectedNodeId === id ? 'rgba(0, 242, 254, 0.15)' : 'var(--color-slate-card)',
                color: selectedNodeId === id ? 'var(--color-electric-cyan)' : 'var(--color-text-muted)',
                cursor: 'pointer',
              }}
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {/* Top Architecture Diagram Banner */}
      <div style={{
        background: 'var(--color-surface-navy)',
        border: '1px solid var(--color-slate-border)',
        borderRadius: '6px',
        padding: '1.25rem',
      }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-electric-cyan)', fontFamily: 'monospace', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          Strict Physical Transmission Architecture
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1rem',
          background: 'var(--color-slate-card)',
          borderRadius: '4px',
        }}>
          {[
            { step: '1. Anchored Buoy Array', desc: 'Moored Surface Transducers', medium: 'Acoustic ~24 kHz', color: '#00F2FE' },
            { step: '2. Subsea Relays', desc: 'Acoustic Mesh Routers', medium: 'Acoustic ~32 kHz', color: '#00E699' },
            { step: '3. Surface Gateway Buoys', desc: '4 Solar/Lined Buoys', medium: 'Cabled Downlink', color: '#FFB703' },
            { step: '4. Shoreline Armored Cable', desc: 'Subsea Fiber Optics', medium: 'Light in Glass (Zero Loss)', color: '#F72585' },
            { step: '5. Land Operations Cloud', desc: 'OceanSense Ops Center', medium: 'High-Speed WAN', color: '#38BDF8' },
          ].map((item, idx, arr) => (
            <React.Fragment key={item.step}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: item.color }}>{item.step}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{item.desc}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{item.medium}</div>
              </div>
              {idx < arr.length - 1 && (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', fontWeight: 700 }}>➔</div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Multi-Hop Path Trace for Selected Node */}
      <div style={{
        background: 'var(--color-surface-navy)',
        border: '1px solid var(--color-slate-border)',
        borderRadius: '6px',
        padding: '1.25rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--color-electric-cyan)', fontFamily: 'monospace', margin: 0, textTransform: 'uppercase' }}>
            Active Route Path for {selectedNodeId}
          </h3>
          {routeData && (
            <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--color-aquamarine)' }}>
              Cumulative Latency: <strong>{routeData.cumulativeLatencyMs} ms</strong> | Total Hops: <strong>{routeData.totalHops}</strong>
            </div>
          )}
        </div>

        {loadingRoute ? (
          <div style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace', fontSize: '0.85rem' }}>Tracing acoustic propagation vectors...</div>
        ) : routeData && routeData.hops ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {routeData.hops.map((hop: any) => (
              <div
                key={hop.hopIndex}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1.25rem',
                  background: 'var(--color-slate-card)',
                  borderRadius: '4px',
                  borderLeft: hop.hopIndex === 1 ? '3px solid #00F2FE' : hop.hopIndex === 2 ? '3px solid #00E699' : '3px solid #F72585',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>HOP {hop.hopIndex}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                    {hop.sourceId} ➔ {hop.targetId}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{hop.transmissionMedium}</div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>FREQ: </span>
                    <span style={{ color: 'var(--color-electric-cyan)' }}>{hop.frequencyKhz > 0 ? `${hop.frequencyKhz} kHz` : 'Optical'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>LATENCY: </span>
                    <span style={{ color: 'var(--color-aquamarine)' }}>{hop.latencyMs} ms</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>SNR: </span>
                    <span style={{ color: 'var(--color-amber-warning)' }}>{hop.snrDb} dB</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>PACKET LOSS: </span>
                    <span style={{ color: 'var(--color-crimson-alert)' }}>{hop.packetLossPct}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Gateway Buoys & Acoustic Frequency Bands */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Gateway Buoy Status */}
        <div style={{
          background: 'var(--color-surface-navy)',
          border: '1px solid var(--color-slate-border)',
          borderRadius: '6px',
          padding: '1.25rem',
        }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--color-electric-cyan)', fontFamily: 'monospace', margin: '0 0 1rem 0', textTransform: 'uppercase' }}>
            Surface Gateway Buoy Uplinks
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(() => {
              const totalActive = meshSummary?.totalNodes || Number(localStorage.getItem('oceansense_grid_scale') || 1000);
              const perZone = Math.max(1, Math.round(totalActive / 4));
              return [
                { id: 'GW-BUOY-01', zone: 'ZONE-A (West Sector)', nodes: perZone, rate: '12.4 Hz', snr: '24.1 dB', status: 'ONLINE' },
                { id: 'GW-BUOY-02', zone: 'ZONE-B (North Sector)', nodes: perZone, rate: '11.9 Hz', snr: '22.8 dB', status: 'ONLINE' },
                { id: 'GW-BUOY-03', zone: 'ZONE-C (South Sector)', nodes: perZone, rate: '13.1 Hz', snr: '25.3 dB', status: 'ONLINE' },
                { id: 'GW-BUOY-04', zone: 'ZONE-D (Deep Abyssal)', nodes: perZone, rate: '12.8 Hz', snr: '21.5 dB', status: 'ONLINE' },
              ].map((gw) => (
                <div key={gw.id} style={{
                  padding: '0.75rem',
                  background: 'var(--color-slate-card)',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '0.85rem' }}>{gw.id}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{gw.zone}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    <div style={{ color: 'var(--color-aquamarine)' }}>{gw.status} // {gw.nodes} Buoys</div>
                    <div style={{ color: 'var(--color-text-muted)' }}>Uplink: {gw.rate} | SNR {gw.snr}</div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Acoustic Carriers */}
        <div style={{
          background: 'var(--color-surface-navy)',
          border: '1px solid var(--color-slate-border)',
          borderRadius: '6px',
          padding: '1.25rem',
        }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--color-electric-cyan)', fontFamily: 'monospace', margin: '0 0 1rem 0', textTransform: 'uppercase' }}>
            Acoustic Telemetry Modulation Spectrum
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { band: 'LF Low-Frequency (12–18 kHz)', range: '8.5 km', bitrate: '2,400 bps', modulation: 'FSK / Chirp Spread Spectrum', role: 'Deep Abyssal Zone Telemetry' },
              { band: 'MF Mid-Frequency (24–36 kHz)', range: '3.2 km', bitrate: '9,600 bps', modulation: 'QPSK Acoustic Carrier', role: 'Standard Seabed Node Mesh Routing' },
              { band: 'HF High-Frequency (50–80 kHz)', range: '0.8 km', bitrate: '64,000 bps', modulation: 'OFDM Multi-Carrier', role: 'High-Density Cluster / AUV Uplink' },
            ].map((b) => (
              <div key={b.band} style={{
                padding: '0.75rem',
                background: 'var(--color-slate-card)',
                borderRadius: '4px',
              }}>
                <div style={{ fontWeight: 700, color: 'var(--color-electric-cyan)', fontSize: '0.85rem' }}>{b.band}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Role: {b.role}</div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '4px', fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                  <span>Range: {b.range}</span>
                  <span>Rate: {b.bitrate}</span>
                  <span>Mod: {b.modulation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
