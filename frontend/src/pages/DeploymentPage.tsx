import React, { useState, useEffect } from 'react';

export const DeploymentPage: React.FC = () => {
  const [nodeSpacingM, setNodeSpacingM] = useState<number>(() => {
    const saved = localStorage.getItem('oceansense_grid_spacing');
    return saved ? Number(saved) : 316;
  });
  const [transducerRangeM, setTransducerRangeM] = useState<number>(() => {
    const saved = localStorage.getItem('oceansense_grid_range');
    return saved ? Number(saved) : 600;
  });
  const [selectedScale, setSelectedScale] = useState<number>(() => {
    const saved = localStorage.getItem('oceansense_grid_scale');
    return saved ? Number(saved) : 1000;
  });
  const [isApplying, setIsApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<string | null>(null);

  // Sync with backend on component mount
  useEffect(() => {
    fetch('/api/deployment/config')
      .then((res) => res.json())
      .then((data) => {
        if (data?.status === 'SUCCESS' && data.config) {
          if (!localStorage.getItem('oceansense_grid_spacing')) {
            setNodeSpacingM(data.config.nodeSpacingM);
          }
          if (!localStorage.getItem('oceansense_grid_range')) {
            setTransducerRangeM(data.config.transducerRangeM);
          }
          if (!localStorage.getItem('oceansense_grid_scale')) {
            setSelectedScale(data.config.selectedScale);
          }
        }
      })
      .catch((err) => console.warn('Using local deployment settings:', err));
  }, []);

  // Save to localStorage whenever user changes parameters so leaving and returning preserves all data
  useEffect(() => {
    localStorage.setItem('oceansense_grid_spacing', String(nodeSpacingM));
    localStorage.setItem('oceansense_grid_range', String(transducerRangeM));
    localStorage.setItem('oceansense_grid_scale', String(selectedScale));
  }, [nodeSpacingM, transducerRangeM, selectedScale]);

  // Sector calculations: 10,000m x 10,000m = 100 km²
  const cols = Math.floor(10000 / nodeSpacingM);
  const rows = Math.floor(10000 / nodeSpacingM);
  const calculatedTotalNodes = cols * rows;
  const coverageAreaM2 = Math.PI * transducerRangeM * transducerRangeM;
  const overlapFactor = +((calculatedTotalNodes * coverageAreaM2) / (10000 * 10000)).toFixed(2);
  const blindSpotPct = overlapFactor > 1.2 ? 0.2 : +(Math.max(0.1, (2.0 - overlapFactor) * 4.5)).toFixed(1);

  const handleApplyScale = async (count: number) => {
    setIsApplying(true);
    setApplyResult(null);
    try {
      // Auto-compute harmonious spacing for the chosen node density
      const side = Math.ceil(Math.sqrt(count));
      const autoSpacing = count === 9 ? 3000 : count === 4 ? 5000 : Math.round(10000 / side);
      const range = count === 9 ? 2200 : count === 4 ? 2800 : transducerRangeM;

      const res = await fetch('/api/deployment/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeSpacingM: autoSpacing,
          transducerRangeM: range,
          selectedScale: count,
        }),
      });
      const data = await res.json();
      setSelectedScale(count);
      setNodeSpacingM(autoSpacing);
      setTransducerRangeM(range);
      localStorage.setItem('oceansense_grid_scale', String(count));
      localStorage.setItem('oceansense_grid_spacing', String(autoSpacing));
      localStorage.setItem('oceansense_grid_range', String(range));
      setApplyResult(`Success: Grid scaled to ${count} nodes with ${autoSpacing}m spacing across the 100 km² sector.`);
    } catch (err: any) {
      setApplyResult(`Failed to update grid scale: ${err.message}`);
    } finally {
      setIsApplying(false);
    }
  };

  const handleSaveAndDeployConfig = async () => {
    setIsApplying(true);
    setApplyResult(null);
    try {
      const targetScale = calculatedTotalNodes;
      const res = await fetch('/api/deployment/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeSpacingM,
          transducerRangeM,
          selectedScale: targetScale,
        }),
      });
      const data = await res.json();
      setSelectedScale(targetScale);
      localStorage.setItem('oceansense_grid_scale', String(targetScale));
      localStorage.setItem('oceansense_grid_spacing', String(nodeSpacingM));
      localStorage.setItem('oceansense_grid_range', String(transducerRangeM));
      setApplyResult(`✓ Saved & Deployed: Grid configured at ${nodeSpacingM}m spacing, ${transducerRangeM}m acoustic radius, with ${targetScale} active nodes.`);
    } catch (err: any) {
      setApplyResult(`Failed to persist grid configuration: ${err.message}`);
    } finally {
      setIsApplying(false);
    }
  };

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
      {/* Page Title & Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-electric-cyan)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
            SECTOR 10 × 10 KM // ANCHORED SURFACE BUOY ARRAY
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '4px 0 0 0', color: 'var(--color-text-primary)' }}>
            Deployment Planning & Moored Telemetry Grid
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[9, 100, 500, 1000, 5000, 10000].map((num) => {
            const isMatch = selectedScale === num || calculatedTotalNodes === num;
            return (
              <button
                key={num}
                onClick={() => handleApplyScale(num)}
                disabled={isApplying}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  borderRadius: '4px',
                  border: isMatch ? '1px solid var(--color-electric-cyan)' : '1px solid var(--color-slate-border)',
                  background: isMatch ? 'rgba(0, 242, 254, 0.15)' : 'var(--color-slate-card)',
                  color: isMatch ? 'var(--color-electric-cyan)' : 'var(--color-text-muted)',
                  cursor: 'pointer',
                  fontWeight: isMatch ? 700 : 500,
                }}
              >
                {num === 9 ? '9 (3km Array)' : num >= 1000 ? `${num / 1000}k Nodes` : `${num} Nodes`}
              </button>
            );
          })}
        </div>
      </div>

      {applyResult && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '4px',
          background: applyResult.includes('Success') || applyResult.includes('Saved') ? 'rgba(0, 230, 153, 0.12)' : 'rgba(255, 59, 48, 0.12)',
          border: applyResult.includes('Success') || applyResult.includes('Saved') ? '1px solid #00E699' : '1px solid #FF3B30',
          color: applyResult.includes('Success') || applyResult.includes('Saved') ? '#00E699' : '#FF3B30',
          fontSize: '0.85rem',
          fontFamily: 'monospace',
        }}>
          {applyResult}
        </div>
      )}

      {/* Grid Configuration Sliders & Calculations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Sliders Card */}
        <div style={{
          background: 'var(--color-surface-navy)',
          border: '1px solid var(--color-slate-border)',
          borderRadius: '6px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--color-electric-cyan)', fontFamily: 'monospace', margin: 0, textTransform: 'uppercase' }}>
            Anchored Buoy & Transducer Parameters
          </h3>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Inter-Buoy Mooring Spacing</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--color-electric-cyan)', fontWeight: 700 }}>
                {nodeSpacingM >= 1000 ? `${(nodeSpacingM / 1000).toFixed(1)} km (${nodeSpacingM}m)` : `${nodeSpacingM} meters`}
              </span>
            </div>
            <input
              type="range"
              min="80"
              max="5000"
              step="50"
              value={nodeSpacingM}
              onChange={(e) => setNodeSpacingM(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--color-electric-cyan)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              <span>80m (Dense 10k)</span>
              <span>1000m (Standard 100)</span>
              <span>5000m (Sparse 5 km Array)</span>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Transducer Acoustic Radius</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--color-aquamarine)', fontWeight: 700 }}>{transducerRangeM} meters</span>
            </div>
            <input
              type="range"
              min="200"
              max="3000"
              step="50"
              value={transducerRangeM}
              onChange={(e) => setTransducerRangeM(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--color-aquamarine)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              <span>200m (High-Frequency)</span>
              <span>3000m (Deep Basin MF)</span>
            </div>
          </div>

          <div style={{ padding: '0.75rem', background: 'var(--color-slate-card)', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
            <div>⚓ <strong style={{ color: 'var(--color-text-primary)' }}>Anchored Surface Buoy System:</strong> Floating marine buoys with 300m armored mooring tethers locked to seabed sinker anchors.</div>
            <div style={{ marginTop: '4px' }}>📡 <strong style={{ color: 'var(--color-aquamarine)' }}>Aperture:</strong> 360° Horizontal Azimuth × 180° Downward Vertical Hemisphere. Suspended 10m below waterline to decouple from surface wave aeration bubbles.</div>
          </div>

          {/* Persistent Save & Apply Button */}
          <button
            onClick={handleSaveAndDeployConfig}
            disabled={isApplying}
            style={{
              padding: '10px 16px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: 'var(--color-electric-cyan)',
              color: '#070B14',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: isApplying ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 0 15px rgba(0, 242, 254, 0.25)',
              transition: 'all 0.2s ease',
            }}
          >
            {isApplying ? 'PERSISTING MOORED GRID...' : '💾 SAVE & APPLY BUOY GRID CONFIGURATION'}
          </button>
        </div>

        {/* Calculated Metrics Card */}
        <div style={{
          background: 'var(--color-surface-navy)',
          border: '1px solid var(--color-slate-border)',
          borderRadius: '6px',
          padding: '1.25rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
        }}>
          <div style={{ padding: '1rem', background: 'var(--color-slate-card)', borderRadius: '4px', borderLeft: '3px solid var(--color-electric-cyan)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontFamily: 'monospace' }}>Calculated Grid</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-electric-cyan)', fontFamily: 'monospace', marginTop: '4px' }}>
              {cols} x {rows}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{calculatedTotalNodes} total node positions</div>
          </div>

          <div style={{ padding: '1rem', background: 'var(--color-slate-card)', borderRadius: '4px', borderLeft: '3px solid var(--color-aquamarine)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontFamily: 'monospace' }}>Acoustic Overlap</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-aquamarine)', fontFamily: 'monospace', marginTop: '4px' }}>
              {overlapFactor}x
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Multi-lateration redundancy</div>
          </div>

          <div style={{ padding: '1rem', background: 'var(--color-slate-card)', borderRadius: '4px', borderLeft: '3px solid var(--color-amber-warning)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontFamily: 'monospace' }}>Estimated Blind Spot</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-amber-warning)', fontFamily: 'monospace', marginTop: '4px' }}>
              {blindSpotPct}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Acoustic shadow probability</div>
          </div>

          <div style={{ padding: '1rem', background: 'var(--color-slate-card)', borderRadius: '4px', borderLeft: '3px solid var(--color-biomass-magenta)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontFamily: 'monospace' }}>Zone Distribution</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-biomass-magenta)', fontFamily: 'monospace', marginTop: '4px' }}>
              4 Zones
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>~{Math.round(calculatedTotalNodes / 4)} nodes per gateway</div>
          </div>
        </div>
      </div>

      {/* Zone Depth Gradient & Bathymetry Profiles */}
      <div style={{
        background: 'var(--color-surface-navy)',
        border: '1px solid var(--color-slate-border)',
        borderRadius: '6px',
        padding: '1.25rem',
      }}>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--color-electric-cyan)', fontFamily: 'monospace', margin: '0 0 1rem 0', textTransform: 'uppercase' }}>
          Subsea Zone Topography & Mooring Depth Allocation
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {[
            { zone: 'Zone Alpha', code: 'ZONE-A', depth: '45m – 120m', sediment: 'Coarse Sand & Shell Hash', gateway: 'GW-BUOY-01', nodes: Math.round(calculatedTotalNodes / 4), color: '#00F2FE' },
            { zone: 'Zone Bravo', code: 'ZONE-B', depth: '120m – 220m', sediment: 'Fine Silt & Clay Sediment', gateway: 'GW-BUOY-02', nodes: Math.round(calculatedTotalNodes / 4), color: '#00E699' },
            { zone: 'Zone Charlie', code: 'ZONE-C', depth: '90m – 180m', sediment: 'Basalt Bedrock Outcrop', gateway: 'GW-BUOY-03', nodes: Math.round(calculatedTotalNodes / 4), color: '#FFB703' },
            { zone: 'Zone Delta', code: 'ZONE-D', depth: '150m – 390m', sediment: 'Deep Abyssal Organic Ooze', gateway: 'GW-BUOY-04', nodes: Math.round(calculatedTotalNodes / 4), color: '#F72585' },
          ].map((z) => (
            <div key={z.code} style={{
              padding: '1rem',
              background: 'var(--color-slate-card)',
              borderRadius: '4px',
              borderTop: `3px solid ${z.color}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{z.zone}</span>
                <span style={{ fontSize: '0.7rem', color: z.color, fontFamily: 'monospace' }}>{z.code}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                Depth: <strong style={{ color: 'var(--color-text-primary)' }}>{z.depth}</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Substrate: {z.sediment}
              </div>
              <div style={{
                marginTop: 'auto',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--color-slate-border)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                fontFamily: 'monospace',
              }}>
                <span>Buoy: {z.gateway}</span>
                <span style={{ color: z.color, fontWeight: 700 }}>{z.nodes} Nodes</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
