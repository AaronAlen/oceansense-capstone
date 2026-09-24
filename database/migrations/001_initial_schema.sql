-- ==============================================================================
-- OceanSense — Database Migration 001: Initial Relational Schema
-- Demonstrates: Week 10 Normalized Database Design, Constraints, FKs, ENUMs
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROLES & PERMISSIONS
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 2. USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- 3. OCEAN ZONES
CREATE TABLE IF NOT EXISTS ocean_zones (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'ZONE-A'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    min_latitude NUMERIC(9, 6) NOT NULL,
    max_latitude NUMERIC(9, 6) NOT NULL,
    min_longitude NUMERIC(9, 6) NOT NULL,
    max_longitude NUMERIC(9, 6) NOT NULL,
    depth_min_m NUMERIC(6, 2) NOT NULL,
    depth_max_m NUMERIC(6, 2) NOT NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'WARNING', 'RESTRICTED', 'INACTIVE')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. SURFACE GATEWAY BUOYS
CREATE TABLE IF NOT EXISTS gateways (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'GW-001'
    name VARCHAR(100) NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    cable_status VARCHAR(30) DEFAULT 'NOMINAL' CHECK (cable_status IN ('NOMINAL', 'DEGRADED', 'FAULT', 'OFFLINE')),
    power_status VARCHAR(30) DEFAULT 'SOLAR_ACTIVE' CHECK (power_status IN ('SOLAR_ACTIVE', 'BATTERY_BUFFER', 'CRITICAL')),
    communication_status VARCHAR(30) DEFAULT 'ONLINE' CHECK (communication_status IN ('ONLINE', 'DEGRADED', 'OFFLINE')),
    health_score NUMERIC(5, 2) DEFAULT 100.00 CHECK (health_score >= 0 AND health_score <= 100),
    last_ping_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. UNDERWATER SONAR NODES (1,000 to 100,000 nodes)
CREATE TABLE IF NOT EXISTS sonar_nodes (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'SN-0001'
    zone_id VARCHAR(50) NOT NULL REFERENCES ocean_zones(id) ON DELETE RESTRICT,
    gateway_id VARCHAR(50) NOT NULL REFERENCES gateways(id) ON DELETE RESTRICT,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    depth_m NUMERIC(6, 2) NOT NULL,
    installation_depth_m NUMERIC(6, 2) NOT NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'OFFLINE', 'MAINTENANCE_REQUIRED', 'POWER_CONSERVING', 'POWER_CRITICAL', 'THEFT_SUSPECTED')),
    battery_level NUMERIC(5, 2) DEFAULT 100.00 CHECK (battery_level >= 0 AND battery_level <= 100),
    battery_health NUMERIC(5, 2) DEFAULT 100.00 CHECK (battery_health >= 0 AND battery_health <= 100),
    charging_status VARCHAR(30) DEFAULT 'DISCHARGING' CHECK (charging_status IN ('DISCHARGING', 'TRICKLE_HARVESTING', 'AUV_INDUCTIVE_CHARGING', 'STANDBY')),
    power_source VARCHAR(40) DEFAULT 'PRIMARY_BATTERY' CHECK (power_source IN ('PRIMARY_BATTERY', 'BENTHIC_MICROBIAL', 'MICRO_TURBINE', 'HYBRID_CABLE')),
    tilt_angle_deg NUMERIC(5, 2) DEFAULT 0.00,
    movement_detected BOOLEAN DEFAULT FALSE,
    tamper_status VARCHAR(30) DEFAULT 'SECURE' CHECK (tamper_status IN ('SECURE', 'TAMPER_SUSPECTED', 'ALERT_ACTIVE')),
    firmware_version VARCHAR(30) DEFAULT 'v3.4.1-rc2',
    health_score NUMERIC(5, 2) DEFAULT 98.50,
    last_seen_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    installed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. PERIODIC SONAR TELEMETRY READINGS
CREATE TABLE IF NOT EXISTS sonar_readings (
    id BIGSERIAL PRIMARY KEY,
    node_id VARCHAR(50) NOT NULL REFERENCES sonar_nodes(id) ON DELETE CASCADE,
    water_temp_c NUMERIC(5, 2) NOT NULL,
    hydrostatic_pressure_bar NUMERIC(7, 2) NOT NULL,
    ambient_noise_db NUMERIC(6, 2) NOT NULL,
    signal_strength_db NUMERIC(6, 2) NOT NULL,
    snr_db NUMERIC(6, 2) NOT NULL,
    tilt_angle_deg NUMERIC(5, 2) NOT NULL,
    battery_level NUMERIC(5, 2) NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. SIMULATED FISH SCHOOLS
CREATE TABLE IF NOT EXISTS fish_schools (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'SCHOOL-TUNA-01'
    species VARCHAR(100) NOT NULL, -- 'Thunnus thynnus' (Bluefin Tuna), 'Scomber scombrus' (Mackerel), etc.
    common_name VARCHAR(100) NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    depth_m NUMERIC(6, 2) NOT NULL,
    estimated_size VARCHAR(30) DEFAULT 'LARGE' CHECK (estimated_size IN ('SMALL', 'MEDIUM', 'LARGE', 'MASSIVE')),
    biomass_tons NUMERIC(8, 2) NOT NULL,
    direction_heading_deg NUMERIC(5, 2) NOT NULL,
    speed_knots NUMERIC(5, 2) NOT NULL,
    confidence_score NUMERIC(4, 3) DEFAULT 0.850 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    status VARCHAR(30) DEFAULT 'ACTIVE_TRACK' CHECK (status IN ('ACTIVE_TRACK', 'DISPERSED', 'OUT_OF_BOUNDS')),
    first_detected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_detected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. CORRELATED FISH DETECTIONS
CREATE TABLE IF NOT EXISTS fish_detections (
    id BIGSERIAL PRIMARY KEY,
    school_id VARCHAR(50) NOT NULL REFERENCES fish_schools(id) ON DELETE CASCADE,
    node_id VARCHAR(50) NOT NULL REFERENCES sonar_nodes(id) ON DELETE CASCADE,
    confidence_score NUMERIC(4, 3) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    distance_to_target_m NUMERIC(7, 2) NOT NULL,
    acoustic_frequency_khz NUMERIC(6, 2) NOT NULL,
    signal_return_db NUMERIC(6, 2) NOT NULL,
    detected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. UNDERWATER ACOUSTIC COMMUNICATION MESH LINKS
CREATE TABLE IF NOT EXISTS communication_links (
    id BIGSERIAL PRIMARY KEY,
    source_node_id VARCHAR(50) NOT NULL REFERENCES sonar_nodes(id) ON DELETE CASCADE,
    target_node_id VARCHAR(50) NOT NULL REFERENCES sonar_nodes(id) ON DELETE CASCADE,
    latency_ms NUMERIC(7, 2) NOT NULL,
    packet_loss_pct NUMERIC(5, 2) NOT NULL,
    signal_strength_db NUMERIC(6, 2) NOT NULL,
    snr_db NUMERIC(6, 2) NOT NULL,
    link_status VARCHAR(30) DEFAULT 'OPTIMAL' CHECK (link_status IN ('OPTIMAL', 'DEGRADED', 'BROKEN')),
    hop_count INT DEFAULT 1,
    last_transmission_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. UNDERWATER CHARGING DOCKING STATIONS
CREATE TABLE IF NOT EXISTS charging_stations (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'DOCK-ALPHA'
    name VARCHAR(100) NOT NULL,
    zone_id VARCHAR(50) NOT NULL REFERENCES ocean_zones(id) ON DELETE RESTRICT,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    depth_m NUMERIC(6, 2) NOT NULL,
    station_type VARCHAR(40) DEFAULT 'RESONANT_INDUCTIVE' CHECK (station_type IN ('RESONANT_INDUCTIVE', 'DIRECT_CONTACT', 'SURFACE_TETHER')),
    power_output_kw NUMERIC(6, 2) DEFAULT 5.00,
    active_docks INT DEFAULT 2,
    available_docks INT DEFAULT 2,
    status VARCHAR(30) DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'MAINTENANCE', 'OFFLINE')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. AUTONOMOUS UNDERWATER VEHICLES (AUV DRONES)
CREATE TABLE IF NOT EXISTS auvs (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'AUV-01'
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'SECURITY_AND_INTERCEPT' CHECK (role IN ('SECURITY_AND_INTERCEPT', 'BIOLOGICAL_PATROL', 'BATHYMETRIC_SURVEY', 'STANDBY')),
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    depth_m NUMERIC(6, 2) NOT NULL,
    heading_deg NUMERIC(5, 2) NOT NULL,
    speed_knots NUMERIC(5, 2) NOT NULL,
    battery_pct NUMERIC(5, 2) DEFAULT 100.00 CHECK (battery_pct >= 0 AND battery_pct <= 100),
    status VARCHAR(30) DEFAULT 'DORMANT' CHECK (status IN ('DORMANT', 'RECHARGING', 'PATROL', 'INSPECTION', 'SECURITY_RESPONSE', 'RETURNING', 'OFFLINE')),
    camera_status VARCHAR(30) DEFAULT 'STANDBY' CHECK (camera_status IN ('ACTIVE', 'STANDBY', 'OFFLINE')),
    spotlight_active BOOLEAN DEFAULT FALSE,
    docking_station_id VARCHAR(50) REFERENCES charging_stations(id) ON DELETE SET NULL,
    last_seen_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. AUV MISSIONS
CREATE TABLE IF NOT EXISTS auv_missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auv_id VARCHAR(50) NOT NULL REFERENCES auvs(id) ON DELETE CASCADE,
    mission_type VARCHAR(40) NOT NULL CHECK (mission_type IN ('SECURITY_INTERCEPT', 'FISH_SCHOOL_INSPECTION', 'NODE_MAINTENANCE_SCAN', 'RETURN_TO_DOCK')),
    target_node_id VARCHAR(50) REFERENCES sonar_nodes(id) ON DELETE SET NULL,
    target_school_id VARCHAR(50) REFERENCES fish_schools(id) ON DELETE SET NULL,
    target_latitude NUMERIC(9, 6) NOT NULL,
    target_longitude NUMERIC(9, 6) NOT NULL,
    target_depth_m NUMERIC(6, 2) NOT NULL,
    status VARCHAR(30) DEFAULT 'DISPATCHED' CHECK (status IN ('DISPATCHED', 'EN_ROUTE', 'ON_STATION', 'COMPLETED', 'ABORTED')),
    eta_minutes NUMERIC(5, 2),
    initiated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

-- 13. AUV REAL-TIME TELEMETRY TRACKS
CREATE TABLE IF NOT EXISTS auv_telemetry (
    id BIGSERIAL PRIMARY KEY,
    auv_id VARCHAR(50) NOT NULL REFERENCES auvs(id) ON DELETE CASCADE,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    depth_m NUMERIC(6, 2) NOT NULL,
    heading_deg NUMERIC(5, 2) NOT NULL,
    speed_knots NUMERIC(5, 2) NOT NULL,
    battery_pct NUMERIC(5, 2) NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 14. DRONE SIMULATED VIDEO FEEDS
CREATE TABLE IF NOT EXISTS drone_feeds (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'FEED-AUV-01'
    auv_id VARCHAR(50) UNIQUE NOT NULL REFERENCES auvs(id) ON DELETE CASCADE,
    stream_url VARCHAR(255) NOT NULL,
    resolution VARCHAR(30) DEFAULT '1080p-30fps',
    is_live_simulated BOOLEAN DEFAULT TRUE,
    night_vision_active BOOLEAN DEFAULT FALSE,
    target_identified VARCHAR(100),
    ai_confidence NUMERIC(4, 3) DEFAULT 0.000,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 15. SENSOR TAMPER EVENTS
CREATE TABLE IF NOT EXISTS tamper_events (
    id BIGSERIAL PRIMARY KEY,
    node_id VARCHAR(50) NOT NULL REFERENCES sonar_nodes(id) ON DELETE CASCADE,
    tamper_type VARCHAR(40) NOT NULL CHECK (tamper_type IN ('IMPACT', 'UNAUTHORIZED_TILT', 'ANCHOR_RELEASE', 'TELEMETRY_BLACKOUT', 'GEOPOSITION_DRIFT')),
    tilt_deviation_deg NUMERIC(5, 2) NOT NULL,
    acceleration_g NUMERIC(5, 2),
    severity VARCHAR(30) DEFAULT 'CRITICAL' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    raw_telemetry_snapshot JSONB,
    detected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 16. SECURITY INCIDENTS (THEFT WORKFLOW)
CREATE TABLE IF NOT EXISTS security_incidents (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'SEC-2026-0042'
    affected_node_id VARCHAR(50) NOT NULL REFERENCES sonar_nodes(id) ON DELETE CASCADE,
    status VARCHAR(30) DEFAULT 'SUSPECTED' CHECK (status IN ('SUSPECTED', 'UNDER_INVESTIGATION', 'CONFIRMED', 'FALSE_ALARM', 'RECOVERED')),
    assigned_auv_id VARCHAR(50) REFERENCES auvs(id) ON DELETE SET NULL,
    assigned_mission_id UUID REFERENCES auv_missions(id) ON DELETE SET NULL,
    threat_assessment VARCHAR(50) DEFAULT 'NON_BIOLOGICAL_ANOMALY',
    ai_analysis_summary TEXT,
    operator_notes TEXT,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ
);

-- 17. MAINTENANCE & SERVICING TASKS
CREATE TABLE IF NOT EXISTS maintenance_tasks (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'MAINT-8831'
    node_id VARCHAR(50) NOT NULL REFERENCES sonar_nodes(id) ON DELETE CASCADE,
    task_type VARCHAR(40) NOT NULL CHECK (task_type IN ('BATTERY_REPLACEMENT', 'FIRMWARE_REFLASH', 'ANCHOR_REMOORING', 'TRANSDUCER_CLEANING', 'AUV_SERVICE_DISPATCH')),
    priority VARCHAR(30) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    scheduled_for TIMESTAMPTZ,
    assigned_technician VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

-- 18. NETWORK TOPOLOGY EVENTS
CREATE TABLE IF NOT EXISTS network_events (
    id BIGSERIAL PRIMARY KEY,
    gateway_id VARCHAR(50) REFERENCES gateways(id) ON DELETE SET NULL,
    node_id VARCHAR(50) REFERENCES sonar_nodes(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL, -- 'LINK_FAILURE', 'PACKET_LOSS_SPIKE', 'HOP_RECOUNT', 'GATEWAY_ISOLATION'
    severity VARCHAR(30) DEFAULT 'WARNING' CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    description TEXT NOT NULL,
    affected_downstream_nodes INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 19. AUDIT LOGS (Mutation Tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    old_state JSONB,
    new_state JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 20. SYSTEM HEALTH METRICS
CREATE TABLE IF NOT EXISTS system_metrics (
    id BIGSERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC(10, 4) NOT NULL,
    unit VARCHAR(30),
    tags JSONB,
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 21. SUBSCRIBER ACCOUNTS
CREATE TABLE IF NOT EXISTS subscriber_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_name VARCHAR(150) NOT NULL,
    tier VARCHAR(50) DEFAULT 'COMMERCIAL_FLEET' CHECK (tier IN ('COMMERCIAL_FLEET', 'RESEARCH_INSTITUTE', 'GOVERNMENT_MARITIME')),
    max_watch_zones INT DEFAULT 5,
    subscription_status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (subscription_status IN ('ACTIVE', 'SUSPENDED', 'EXPIRED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 22. SUBSCRIBER WATCH ZONES
CREATE TABLE IF NOT EXISTS watch_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscriber_id UUID NOT NULL REFERENCES subscriber_accounts(id) ON DELETE CASCADE,
    zone_name VARCHAR(100) NOT NULL,
    polygon_coordinates JSONB NOT NULL,
    min_biomass_tons NUMERIC(6, 2) DEFAULT 5.00,
    target_species VARCHAR(100) DEFAULT 'ALL',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 23. SUBSCRIBER BIOMASS NOTIFICATION ALERTS
CREATE TABLE IF NOT EXISTS subscriber_alerts (
    id BIGSERIAL PRIMARY KEY,
    subscriber_id UUID NOT NULL REFERENCES subscriber_accounts(id) ON DELETE CASCADE,
    school_id VARCHAR(50) NOT NULL REFERENCES fish_schools(id) ON DELETE CASCADE,
    alert_title VARCHAR(150) NOT NULL,
    alert_message TEXT NOT NULL,
    target_species VARCHAR(100) NOT NULL,
    estimated_biomass_tons NUMERIC(8, 2) NOT NULL,
    distance_nautical_miles NUMERIC(6, 2) NOT NULL,
    bearing_deg NUMERIC(5, 2) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
