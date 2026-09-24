-- ==============================================================================
-- OceanSense — Database Seed: Initial Operational Data & 1,000 Sonar Nodes
-- Demonstrates: Week 10 PL/pgSQL Procedural Generation, Realistic Distributions
-- ==============================================================================

-- 1. SEED ROLES
INSERT INTO roles (name, description) VALUES
('SUPER_ADMIN', 'Full system access, user management, deployment, and infrastructure control'),
('OPERATIONS_MANAGER', 'Command console monitoring, AUV dispatch, security, and alert management'),
('MARINE_ENGINEER', 'Grid deployment, node servicing, charging hubs, and maintenance scheduling'),
('ANALYST', 'Read-only access to analytics, telemetry trends, and AI query assistant'),
('VIEWER', 'Read-only monitoring of the primary 3D Digital Twin'),
('SUBSCRIBER', 'Commercial vessel intelligence: Biomass locations, watch-zone alerts, 2D mobile view')
ON CONFLICT (name) DO NOTHING;

-- 2. SEED PERMISSIONS
INSERT INTO permissions (slug, description) VALUES
('nodes:read', 'View sonar node inventory and telemetry'),
('nodes:write', 'Modify node state, relocate, or adjust duty cycles'),
('deployment:manage', 'Generate grid, assign gateways, and create zones'),
('security:manage', 'Classify incidents, trigger alarms, and dispatch AUVs'),
('auv:control', 'Command AUV navigation, missions, and camera feeds'),
('maintenance:manage', 'Create, assign, and complete maintenance work orders'),
('analytics:read', 'Access tactical oceanographic charts and reports'),
('subscriber:read', 'Access sanitized commercial biomass feed')
ON CONFLICT (slug) DO NOTHING;

-- Assign permissions to SUPER_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

-- Assign permissions to OPERATIONS_MANAGER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'OPERATIONS_MANAGER' AND p.slug IN ('nodes:read', 'security:manage', 'auv:control', 'analytics:read')
ON CONFLICT DO NOTHING;

-- Assign permissions to SUBSCRIBER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'SUBSCRIBER' AND p.slug IN ('subscriber:read')
ON CONFLICT DO NOTHING;

-- 3. SEED USERS (Passwords hashed with bcrypt: 'Password123!')
-- Hash: $2b$12$e8Y5tGv8qOcfZ8pG.yLw..0eZ0yWzR93K.6R7qPZ0b5b1H6p2O5.y
INSERT INTO users (id, email, password_hash, first_name, last_name) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@oceansense.io', '$2b$12$e8Y5tGv8qOcfZ8pG.yLw..0eZ0yWzR93K.6R7qPZ0b5b1H6p2O5.y', 'Marcus', 'Vance'),
('22222222-2222-2222-2222-222222222222', 'operator@oceansense.io', '$2b$12$e8Y5tGv8qOcfZ8pG.yLw..0eZ0yWzR93K.6R7qPZ0b5b1H6p2O5.y', 'Elena', 'Rostova'),
('33333333-3333-3333-3333-333333333333', 'engineer@oceansense.io', '$2b$12$e8Y5tGv8qOcfZ8pG.yLw..0eZ0yWzR93K.6R7qPZ0b5b1H6p2O5.y', 'Chen', 'Wei'),
('44444444-4444-4444-4444-444444444444', 'analyst@oceansense.io', '$2b$12$e8Y5tGv8qOcfZ8pG.yLw..0eZ0yWzR93K.6R7qPZ0b5b1H6p2O5.y', 'Aria', 'Nakamura'),
('55555555-5555-5555-5555-555555555555', 'subscriber@pacificatrawlers.com', '$2b$12$e8Y5tGv8qOcfZ8pG.yLw..0eZ0yWzR93K.6R7qPZ0b5b1H6p2O5.y', 'Sean', 'Callahan')
ON CONFLICT (id) DO NOTHING;

-- Link User Roles
INSERT INTO user_roles (user_id, role_id)
SELECT '11111111-1111-1111-1111-111111111111'::uuid, id FROM roles WHERE name = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT '22222222-2222-2222-2222-222222222222'::uuid, id FROM roles WHERE name = 'OPERATIONS_MANAGER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT '33333333-3333-3333-3333-333333333333'::uuid, id FROM roles WHERE name = 'MARINE_ENGINEER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT '44444444-4444-4444-4444-444444444444'::uuid, id FROM roles WHERE name = 'ANALYST'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT '55555555-5555-5555-5555-555555555555'::uuid, id FROM roles WHERE name = 'SUBSCRIBER'
ON CONFLICT DO NOTHING;

-- 4. SEED OCEAN ZONES (10 km x 10 km sector centered around Lat 10.200, Lon 80.100)
-- 1 deg lat ~ 111 km -> 10 km ~ 0.090 deg
INSERT INTO ocean_zones (id, name, description, min_latitude, max_latitude, min_longitude, max_longitude, depth_min_m, depth_max_m, status) VALUES
('ZONE-A', 'Abyssal Trench Alpha', 'Deep benthic canyon with complex acoustic propagation and thermal vents', 10.200000, 10.245000, 80.100000, 80.145000, 250.00, 390.00, 'ACTIVE'),
('ZONE-B', 'Pelagic Ridge Bravo', 'Mid-depth submarine ridge with persistent sub-surface currents', 10.245000, 10.290000, 80.100000, 80.145000, 150.00, 275.00, 'ACTIVE'),
('ZONE-C', 'Benthic Shelf Charlie', 'Gradual continental shelf slope optimal for groundfish and pelagic schools', 10.200000, 10.245000, 80.145000, 80.190000, 90.00, 195.00, 'ACTIVE'),
('ZONE-D', 'Sanctuary Transition Delta', 'Ecological marine sanctuary perimeter under restricted surveillance', 10.245000, 10.290000, 80.145000, 80.190000, 45.00, 130.00, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 5. SEED SURFACE GATEWAY BUOYS (4 Cabled Gateway Buoys)
INSERT INTO gateways (id, name, latitude, longitude, cable_status, power_status, communication_status, health_score) VALUES
('GW-001', 'North-West Primary Buoy', 10.222500, 80.122500, 'NOMINAL', 'SOLAR_ACTIVE', 'ONLINE', 99.20),
('GW-002', 'North-East Primary Buoy', 10.267500, 80.122500, 'NOMINAL', 'SOLAR_ACTIVE', 'ONLINE', 98.70),
('GW-003', 'South-West Secondary Buoy', 10.222500, 80.167500, 'NOMINAL', 'SOLAR_ACTIVE', 'ONLINE', 97.40),
('GW-004', 'South-East Cabled Hub', 10.267500, 80.167500, 'NOMINAL', 'SOLAR_ACTIVE', 'ONLINE', 100.00)
ON CONFLICT (id) DO NOTHING;

-- 6. SEED SEABED CHARGING DOCKING STATIONS
INSERT INTO charging_stations (id, name, zone_id, latitude, longitude, depth_m, station_type, power_output_kw, active_docks, available_docks) VALUES
('DOCK-ALPHA', 'Benthic Inductive Garage Alpha', 'ZONE-A', 10.225000, 80.125000, 310.00, 'RESONANT_INDUCTIVE', 12.50, 2, 1),
('DOCK-BRAVO', 'Shelf Recharging Station Bravo', 'ZONE-C', 10.220000, 80.160000, 140.00, 'RESONANT_INDUCTIVE', 10.00, 2, 2)
ON CONFLICT (id) DO NOTHING;

-- 7. SEED 4 AUTONOMOUS UNDERWATER VEHICLES (AUVs)
INSERT INTO auvs (id, name, role, latitude, longitude, depth_m, heading_deg, speed_knots, battery_pct, status, camera_status, spotlight_active, docking_station_id) VALUES
('AUV-01', 'Triton-Security', 'SECURITY_AND_INTERCEPT', 10.225000, 80.125000, 310.00, 045.00, 0.00, 94.50, 'DORMANT', 'STANDBY', FALSE, 'DOCK-ALPHA'),
('AUV-02', 'Nautilus-Biological', 'BIOLOGICAL_PATROL', 10.235000, 80.140000, 160.00, 110.00, 2.80, 82.00, 'PATROL', 'ACTIVE', TRUE, NULL),
('AUV-03', 'Hydra-Surveyor', 'BATHYMETRIC_SURVEY', 10.220000, 80.160000, 140.00, 000.00, 0.00, 98.00, 'RECHARGING', 'STANDBY', FALSE, 'DOCK-BRAVO'),
('AUV-04', 'Proteus-Response', 'STANDBY', 10.250000, 80.155000, 220.00, 270.00, 0.00, 100.00, 'DORMANT', 'STANDBY', FALSE, NULL)
ON CONFLICT (id) DO NOTHING;

-- Seed Drone Feeds
INSERT INTO drone_feeds (id, auv_id, stream_url, resolution, is_live_simulated, night_vision_active, target_identified, ai_confidence) VALUES
('FEED-AUV-01', 'AUV-01', '/streams/simulated/auv-01.mp4', '1080p-30fps', TRUE, FALSE, 'BENTHIC_NODE_SN-0431', 0.920),
('FEED-AUV-02', 'AUV-02', '/streams/simulated/auv-02.mp4', '1080p-30fps', TRUE, TRUE, 'BLUEFIN_TUNA_AGGREGATION', 0.945),
('FEED-AUV-03', 'AUV-03', '/streams/simulated/auv-03.mp4', '720p-30fps', TRUE, FALSE, 'DOCK_CRADLE_ALIGNMENT', 0.990),
('FEED-AUV-04', 'AUV-04', '/streams/simulated/auv-04.mp4', '1080p-30fps', TRUE, FALSE, NULL, 0.000)
ON CONFLICT (id) DO NOTHING;

-- 8. SEED INITIAL FISH SCHOOLS
INSERT INTO fish_schools (id, species, common_name, latitude, longitude, depth_m, estimated_size, biomass_tons, direction_heading_deg, speed_knots, confidence_score, status) VALUES
('SCHOOL-TUNA-01', 'Thunnus thynnus', 'Atlantic Bluefin Tuna', 10.232000, 80.138000, 142.00, 'LARGE', 18.50, 095.00, 4.20, 0.940, 'ACTIVE_TRACK'),
('SCHOOL-MACK-02', 'Scomber scombrus', 'Atlantic Mackerel', 10.260000, 80.115000, 85.00, 'MEDIUM', 8.20, 215.00, 2.60, 0.885, 'ACTIVE_TRACK'),
('SCHOOL-SARD-03', 'Sardinops sagax', 'Pacific Sardine', 10.215000, 80.170000, 52.00, 'MASSIVE', 24.80, 320.00, 1.80, 0.910, 'ACTIVE_TRACK')
ON CONFLICT (id) DO NOTHING;

-- 9. SEED SUBSCRIBER ACCOUNT & WATCH ZONES
INSERT INTO subscriber_accounts (id, user_id, organization_name, tier, max_watch_zones) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'Pacifica Trawlers Fleet LLC', 'COMMERCIAL_FLEET', 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO watch_zones (id, subscriber_id, zone_name, polygon_coordinates, min_biomass_tons, target_species) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Zone Alpha Tuna Watch', '[{"lat": 10.20, "lon": 80.10}, {"lat": 10.25, "lon": 80.10}, {"lat": 10.25, "lon": 80.15}, {"lat": 10.20, "lon": 80.15}]', 10.00, 'Atlantic Bluefin Tuna')
ON CONFLICT (id) DO NOTHING;

-- 10. PROGRAMMATIC GENERATION OF EXACTLY 1,000 SEABED SONAR NODES
-- Distributed across the 10 km x 10 km grid (Grid spacing ~ 316m, with realistic noise and bathymetry)
DO $$
DECLARE
    i INT;
    v_node_id VARCHAR(50);
    v_zone_id VARCHAR(50);
    v_gw_id VARCHAR(50);
    v_row INT;
    v_col INT;
    v_lat NUMERIC(9, 6);
    v_lon NUMERIC(9, 6);
    v_depth NUMERIC(6, 2);
    v_battery NUMERIC(5, 2);
    v_health NUMERIC(5, 2);
    v_power_src VARCHAR(40);
    v_charging VARCHAR(30);
    v_status VARCHAR(30);
    v_tamper VARCHAR(30);
    v_tilt NUMERIC(5, 2);
BEGIN
    FOR i IN 1..1000 LOOP
        v_node_id := 'SN-' || LPAD(i::TEXT, 4, '0');
        
        -- Map 1000 nodes into a ~31 x 32 grid with slight pseudorandom jitter
        v_row := (i - 1) / 32;
        v_col := (i - 1) % 32;
        
        -- Base coordinates across 10 km sector [Lat 10.200 to 10.290, Lon 80.100 to 80.190]
        v_lat := 10.200000 + (v_row * (0.090 / 31.0)) + ((sin(i * 12.34)::NUMERIC * 0.0008));
        v_lon := 80.100000 + (v_col * (0.090 / 31.0)) + ((cos(i * 56.78)::NUMERIC * 0.0008));

        -- Assign Zone based on quadrants
        IF v_lat < 10.245000 AND v_lon < 80.145000 THEN
            v_zone_id := 'ZONE-A';
            v_gw_id := 'GW-001';
            v_depth := 260.00 + (abs(sin(i * 3.14)) * 120.0);
        ELSIF v_lat >= 10.245000 AND v_lon < 80.145000 THEN
            v_zone_id := 'ZONE-B';
            v_gw_id := 'GW-002';
            v_depth := 160.00 + (abs(cos(i * 2.71)) * 110.0);
        ELSIF v_lat < 10.245000 AND v_lon >= 80.145000 THEN
            v_zone_id := 'ZONE-C';
            v_gw_id := 'GW-003';
            v_depth := 95.00 + (abs(sin(i * 1.41)) * 95.0);
        ELSE
            v_zone_id := 'ZONE-D';
            v_gw_id := 'GW-004';
            v_depth := 50.00 + (abs(cos(i * 0.99)) * 75.0);
        END IF;

        -- Default Battery & Health
        v_battery := 65.00 + (abs(sin(i * 9.99)) * 34.00);
        v_health := 92.00 + (abs(cos(i * 8.88)) * 8.00);
        v_power_src := 'PRIMARY_BATTERY';
        v_charging := 'DISCHARGING';
        v_status := 'ACTIVE';
        v_tamper := 'SECURE';
        v_tilt := (abs(sin(i * 5.55)) * 4.0);

        -- Node SN-0431: Specific Capstone Scenario Target (Tamper / Anti-Theft Flow)
        IF v_node_id = 'SN-0431' THEN
            v_battery := 18.00;
            v_status := 'THEFT_SUSPECTED';
            v_tamper := 'ALERT_ACTIVE';
            v_tilt := 44.50;
            v_depth := 142.00;
        ELSIF i IN (45, 112, 532, 874) THEN
            -- Low battery test nodes
            v_battery := 13.50;
            v_status := 'POWER_CRITICAL';
        ELSIF i IN (78, 234, 671) THEN
            -- Energy harvesting demonstration nodes
            v_power_src := 'BENTHIC_MICROBIAL';
            v_charging := 'TRICKLE_HARVESTING';
            v_battery := 88.00;
        ELSIF i IN (301, 789) THEN
            v_status := 'OFFLINE';
            v_health := 42.00;
        END IF;

        INSERT INTO sonar_nodes (
            id, zone_id, gateway_id, latitude, longitude, depth_m, installation_depth_m,
            status, battery_level, battery_health, charging_status, power_source,
            tilt_angle_deg, movement_detected, tamper_status, firmware_version, health_score
        ) VALUES (
            v_node_id, v_zone_id, v_gw_id, v_lat, v_lon, v_depth, v_depth,
            v_status, v_battery, v_health, v_charging, v_power_src,
            v_tilt, (v_tamper != 'SECURE'), v_tamper, 'v3.4.1-rc2', v_health
        )
        ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            battery_level = EXCLUDED.battery_level,
            tamper_status = EXCLUDED.tamper_status;
            
    END LOOP;
END;
$$;
