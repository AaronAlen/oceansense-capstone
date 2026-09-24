// ==============================================================================
// OceanSense — Sonar Node Simulation Model & Battery Kinetics Engine
// Demonstrates: Mathematical State Machine & Maritime Current Kinetics
// ==============================================================================

export type NodeStatus = 
  | 'ACTIVE' 
  | 'OFFLINE' 
  | 'MAINTENANCE_REQUIRED' 
  | 'POWER_CONSERVING' 
  | 'POWER_CRITICAL' 
  | 'THEFT_SUSPECTED';

export type PowerSource = 
  | 'SOLAR_SURFACE_BUOY'
  | 'PRIMARY_BATTERY' 
  | 'BENTHIC_MICROBIAL' 
  | 'MICRO_TURBINE' 
  | 'HYBRID_CABLE';

export type ChargingStatus = 
  | 'DISCHARGING' 
  | 'TRICKLE_HARVESTING' 
  | 'AUV_INDUCTIVE_CHARGING' 
  | 'STANDBY';

export type TamperStatus = 'SECURE' | 'TAMPER_SUSPECTED' | 'ALERT_ACTIVE';

export interface SonarNodeState {
  id: string; // e.g. 'SN-0001'
  zoneId: string; // 'ZONE-A' | 'ZONE-B' | 'ZONE-C' | 'ZONE-D'
  gatewayId: string; // 'GW-001' to 'GW-004'
  latitude: number;
  longitude: number;
  depth_m: number; // Seabed anchor depth
  installation_depth_m: number;
  status: NodeStatus;
  battery_level: number;
  battery_health: number;
  charging_status: ChargingStatus;
  power_source: PowerSource;
  tilt_angle_deg: number;
  movement_detected: boolean;
  tamper_status: TamperStatus;
  firmware_version: string;
  health_score: number;
  
  // Anchored Surface Buoy & Beam Configuration
  node_type?: 'ANCHORED_SURFACE_BUOY';
  mooring_depth_m?: number; // e.g. 300m tether to seabed
  transducer_depth_m?: number; // 10.0m sub-surface keel mount
  horizontal_beam_deg?: number; // 360° omni-directional horizontal
  vertical_beam_deg?: number; // 180° downward vertical hemisphere
  solar_charging?: boolean;
  satellite_uplink?: boolean;

  // Real-time environmental & acoustic sensor telemetry
  water_temp_c: number;
  hydrostatic_pressure_bar: number;
  ambient_noise_db: number;
  signal_strength_db: number;
  snr_db: number;
  fish_detection_count: number;
  last_ping_at: string;
}

export class SonarNodeSimulator {
  node: SonarNodeState;
  private dutyCycleCounter = 0;

  constructor(initialState: SonarNodeState) {
    this.node = { ...initialState };
  }

  tick(deltaSeconds: number, speedMultiplier: number = 1.0) {
    if (this.node.status === 'OFFLINE') return;

    const dt = deltaSeconds * speedMultiplier;
    this.dutyCycleCounter += dt;

    // 1. Calculate Discharge Kinetics based on operational state
    let idleRate = 0.0003; // % per second base RTC and sleep current
    let listenRate = 0.0008; // % per second passive hydrophone monitoring
    let pingRate = 0.0020; // % per second active acoustic ping burst

    // Power conserving mode throttles acoustic duty cycle
    if (this.node.status === 'POWER_CONSERVING') {
      listenRate *= 0.3;
      pingRate *= 0.1;
    }

    let dischargePct = (idleRate + listenRate + pingRate) * dt;

    // 2. In-Situ Energy Harvesting (Solar Surface Buoy deck, Benthic Microbial, or Micro-Turbine)
    let harvestPct = 0;
    if (this.node.power_source === 'SOLAR_SURFACE_BUOY' || this.node.solar_charging) {
      // Surface Buoy High-Efficiency Photovoltaic Solar Deck: Generates steady surplus power
      harvestPct = 0.0035 * dt;
      this.node.charging_status = 'TRICKLE_HARVESTING';
    } else if (this.node.power_source === 'BENTHIC_MICROBIAL') {
      // Continuous benthic mud redox trickle charge: 15-30 mW (~0.0012% per second)
      harvestPct = 0.0012 * dt;
      this.node.charging_status = 'TRICKLE_HARVESTING';
    } else if (this.node.power_source === 'MICRO_TURBINE') {
      // Sub-surface current kinetic conversion: fluctuating with tidal current
      harvestPct = (0.0015 + Math.sin(Date.now() / 10000) * 0.0008) * dt;
      this.node.charging_status = 'TRICKLE_HARVESTING';
    } else if (this.node.charging_status === 'AUV_INDUCTIVE_CHARGING') {
      // High-speed resonant inductive wireless power transfer from docked AUV
      harvestPct = 0.05 * dt; // Rapid charge: ~5% per 100s
    } else {
      this.node.charging_status = 'DISCHARGING';
    }

    // Update battery level clamped between 0 and 100
    this.node.battery_level = Math.max(
      0,
      Math.min(100, this.node.battery_level - dischargePct + harvestPct)
    );

    // 3. State Transitions based on Battery Level
    if (this.node.battery_level < 15.0 && this.node.status !== 'POWER_CRITICAL' && this.node.status !== 'THEFT_SUSPECTED') {
      this.node.status = 'POWER_CRITICAL';
      this.node.health_score = Math.min(this.node.health_score, 45.0);
    } else if (this.node.battery_level < 40.0 && this.node.battery_level >= 15.0 && this.node.status === 'ACTIVE') {
      this.node.status = 'POWER_CONSERVING';
    } else if (this.node.battery_level >= 45.0 && this.node.status === 'POWER_CONSERVING') {
      this.node.status = 'ACTIVE';
    }

    // 4. Update Environmental Telemetry (Depth pressure & Thermocline drift)
    // Hydrostatic pressure: ~1 bar per 10m depth + 1 atm (1.013 bar)
    this.node.hydrostatic_pressure_bar = +(1.013 + (this.node.depth_m / 9.8)).toFixed(2);
    // Water temperature: thermocline drop with depth (surface ~24°C, 400m ~6°C)
    const baseTemp = 24.0 - (this.node.depth_m / 400.0) * 18.0;
    this.node.water_temp_c = +(baseTemp + Math.sin(this.dutyCycleCounter * 0.1) * 0.3).toFixed(2);

    // Ambient noise & Acoustic Signal-to-Noise Ratio (SNR)
    this.node.ambient_noise_db = +(48.0 + Math.sin(this.dutyCycleCounter * 0.2) * 4.5).toFixed(1);
    this.node.snr_db = +(this.node.signal_strength_db - this.node.ambient_noise_db).toFixed(1);

    // Update timestamp every second
    if (this.dutyCycleCounter >= 1.0) {
      this.node.last_ping_at = new Date().toISOString();
      this.dutyCycleCounter = 0;
    }
  }

  private originalLat: number = 0;
  private originalLon: number = 0;

  // Trigger tamper / anti-theft simulation event
  triggerTamperEvent(tiltAngle: number = 48.5) {
    if (!this.originalLat) {
      this.originalLat = this.node.latitude;
      this.originalLon = this.node.longitude;
    }
    this.node.tamper_status = 'ALERT_ACTIVE';
    this.node.status = 'THEFT_SUSPECTED';
    this.node.tilt_angle_deg = tiltAngle;
    this.node.movement_detected = true;
    this.node.health_score = 30.0;
    // Simulate mooring tether break: buoy drifts 200m northeast
    this.node.latitude = +(this.originalLat + 0.0018).toFixed(6);
    this.node.longitude = +(this.originalLon + 0.0022).toFixed(6);
  }

  // Reset node to nominal state
  resetToNominal() {
    this.node.tamper_status = 'SECURE';
    this.node.status = 'ACTIVE';
    this.node.movement_detected = false;
    this.node.tilt_angle_deg = 1.2;
    this.node.battery_level = 95.0;
    this.node.health_score = 98.0;
    if (this.originalLat) {
      this.node.latitude = this.originalLat;
      this.node.longitude = this.originalLon;
    }
  }
}
