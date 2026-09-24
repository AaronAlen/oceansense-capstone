// ==============================================================================
// OceanSense — Inductive Charging Docks & Benthic Microbial Energy Harvesting
// Demonstrates: Week 11 Hardware Telemetry, Wireless Power Transfer & Subsea Renewable Energy
// ==============================================================================

import React, { useState, useEffect } from 'react';

export const ChargingStationsPage: React.FC = () => {
  const [chargingData, setChargingData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCharging = async () => {
    try {
      const res = await fetch('/api/charging/diagnostics');
      const data = await res.json();
      setChargingData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharging();
    const interval = setInterval(fetchCharging, 2000);
    return () => clearInterval(interval);
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
            SUBSEA AUTONOMOUS POWER SYSTEMS // WIRELESS INDUCTIVE & BENTHIC BIOCHEMICAL
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '4px 0 0 0', color: 'var(--color-text-primary)' }}>
            Inductive Docking Cradles & Benthic Energy Harvesting
          </h1>
        </div>

        <div style={{
          padding: '6px 12px',
          background: 'rgba(0, 230, 153, 0.15)',
          border: '1px solid var(--color-aquamarine)',
          borderRadius: '4px',
          fontSize: '0.8rem',
          fontFamily: 'monospace',
          color: 'var(--color-aquamarine)',
        }}>
          ● POWER GRID NOMINAL // 4/4 CRADLES ONLINE
        </div>
      </div>

      {/* 4 Inductive Docking Stations Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem',
      }}>
        {chargingData?.dockingStations?.map((dock: any) => {
          const isOccupied = dock.status.startsWith('OCCUPIED');
          return (
            <div
              key={dock.id}
              style={{
                background: 'var(--color-surface-navy)',
                border: isOccupied ? '1px solid var(--color-aquamarine)' : '1px solid var(--color-slate-border)',
                borderRadius: '6px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '1rem' }}>{dock.name}</span>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  background: isOccupied ? 'rgba(0, 230, 153, 0.2)' : 'rgba(148, 163, 184, 0.1)',
                  color: isOccupied ? 'var(--color-aquamarine)' : 'var(--color-text-muted)',
                  fontFamily: 'monospace',
                }}>
                  {dock.status}
                </span>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Location: <strong>{dock.zoneId}</strong> | Depth: <strong>{dock.depth_m}m</strong>
              </div>

              <div style={{
                padding: '0.75rem',
                background: 'var(--color-slate-card)',
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Docked Drone:</span>
                  <span style={{ color: isOccupied ? 'var(--color-electric-cyan)' : 'var(--color-text-muted)', fontWeight: 700 }}>
                    {dock.dockedAUV || 'EMPTY CRADLE'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Coupling Efficiency:</span>
                  <span style={{ color: 'var(--color-aquamarine)' }}>{dock.couplingEfficiencyPct}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Power Transfer:</span>
                  <span style={{ color: 'var(--color-amber-warning)' }}>{dock.powerDeliveryWatts} Watts</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Coil Offset:</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{dock.coilAlignmentOffsetMm} mm</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Core Temp:</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{dock.transformerTemperatureC}°C</span>
                </div>
              </div>

              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                WPT Standard: SAE J2954 Subsea Magnetic Resonance @ {dock.inductiveWptFrequencyKhz} kHz
              </div>
            </div>
          );
        })}
      </div>

      {/* Benthic Microbial Fuel Cell (BMFC) Deep Harvesting */}
      <div style={{
        background: 'var(--color-surface-navy)',
        border: '1px solid var(--color-slate-border)',
        borderRadius: '6px',
        padding: '1.25rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-electric-cyan)', fontFamily: 'monospace' }}>PERPETUAL BENTHIC POWER</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '2px 0 0 0', color: 'var(--color-text-primary)' }}>
              Benthic Microbial Fuel Cell (BMFC) Anoxic Sediment Harvesters
            </h3>
          </div>
          <span style={{
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            padding: '3px 8px',
            background: 'rgba(0, 242, 254, 0.15)',
            color: 'var(--color-electric-cyan)',
            borderRadius: '4px',
          }}>
            ANEROBIC REDOX ACTIVE
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ padding: '0.85rem', background: 'var(--color-slate-card)', borderRadius: '4px', borderLeft: '3px solid var(--color-electric-cyan)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontFamily: 'monospace' }}>Redox Potential</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-electric-cyan)', fontFamily: 'monospace', marginTop: '2px' }}>
              {chargingData?.benthicHarvesting?.redoxPotentialMillivolts || 742} mV
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Cathode/Anode Delta V</div>
          </div>

          <div style={{ padding: '0.85rem', background: 'var(--color-slate-card)', borderRadius: '4px', borderLeft: '3px solid var(--color-aquamarine)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontFamily: 'monospace' }}>Trickle Current</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-aquamarine)', fontFamily: 'monospace', marginTop: '2px' }}>
              {chargingData?.benthicHarvesting?.averageHarvestCurrentMa || 28.4} mA
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Microbial electron flow</div>
          </div>

          <div style={{ padding: '0.85rem', background: 'var(--color-slate-card)', borderRadius: '4px', borderLeft: '3px solid var(--color-amber-warning)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontFamily: 'monospace' }}>Sediment Acidity</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-amber-warning)', fontFamily: 'monospace', marginTop: '2px' }}>
              pH {chargingData?.benthicHarvesting?.sedimentPh || 7.8}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Optimal bio-electrochemical zone</div>
          </div>

          <div style={{ padding: '0.85rem', background: 'var(--color-slate-card)', borderRadius: '4px', borderLeft: '3px solid var(--color-biomass-magenta)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontFamily: 'monospace' }}>Harvested Today</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-biomass-magenta)', fontFamily: 'monospace', marginTop: '2px' }}>
              {chargingData?.benthicHarvesting?.totalMWhHarvestedToday || 0.142} MWh
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Cumulative energy gathered</div>
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
          Benthic Microbial Fuel Cells (BMFC) harvest electrons generated by microorganisms oxidising organic matter in anoxic subsea sediment. Equipped nodes (e.g. <strong>SN-0078</strong>, <strong>SN-0234</strong>, <strong>SN-0671</strong>) achieve perpetual standby operation without requiring battery recovery replacements.
        </div>
      </div>
    </div>
  );
};
