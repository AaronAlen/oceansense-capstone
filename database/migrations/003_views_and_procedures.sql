-- ==============================================================================
-- OceanSense — Database Migration 003: Views, CTEs & Window Functions
-- Demonstrates: Week 10 Advanced SQL (Complex JOINs, Window Functions, CTEs, Views)
-- ==============================================================================

-- 1. VIEW: Latest Telemetry Reading per Sonar Node (Demonstrates Window Function + JOIN)
CREATE OR REPLACE VIEW vw_node_latest_telemetry AS
WITH ranked_readings AS (
    SELECT 
        r.id AS reading_id,
        r.node_id,
        r.water_temp_c,
        r.hydrostatic_pressure_bar,
        r.ambient_noise_db,
        r.signal_strength_db,
        r.snr_db,
        r.tilt_angle_deg,
        r.battery_level AS reading_battery_level,
        r.recorded_at,
        ROW_NUMBER() OVER (
            PARTITION BY r.node_id 
            ORDER BY r.recorded_at DESC
        ) AS rank_order
    FROM sonar_readings r
)
SELECT 
    n.id AS node_id,
    n.zone_id,
    z.name AS zone_name,
    n.gateway_id,
    g.name AS gateway_name,
    n.latitude,
    n.longitude,
    n.depth_m,
    n.status AS operational_status,
    n.battery_level,
    n.battery_health,
    n.power_source,
    n.charging_status,
    n.tamper_status,
    n.firmware_version,
    n.health_score,
    rr.water_temp_c,
    rr.hydrostatic_pressure_bar,
    rr.ambient_noise_db,
    rr.signal_strength_db,
    rr.snr_db,
    rr.recorded_at AS last_telemetry_timestamp
FROM sonar_nodes n
JOIN ocean_zones z ON n.zone_id = z.id
JOIN gateways g ON n.gateway_id = g.id
LEFT JOIN ranked_readings rr ON n.id = rr.node_id AND rr.rank_order = 1;

-- 2. VIEW: Zone Operational Health & Biomass Aggregation (Demonstrates Complex CTEs & Window Functions)
CREATE OR REPLACE VIEW vw_zone_operational_health AS
WITH zone_node_stats AS (
    SELECT 
        zone_id,
        COUNT(*) AS total_nodes,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_nodes,
        COUNT(*) FILTER (WHERE status = 'OFFLINE') AS offline_nodes,
        COUNT(*) FILTER (WHERE status = 'POWER_CRITICAL' OR battery_level < 20.0) AS critical_battery_nodes,
        COUNT(*) FILTER (WHERE tamper_status != 'SECURE') AS tampered_nodes,
        ROUND(AVG(battery_level), 2) AS avg_battery_pct,
        ROUND(AVG(health_score), 2) AS avg_health_score
    FROM sonar_nodes
    GROUP BY zone_id
),
zone_fish_activity AS (
    SELECT 
        n.zone_id,
        COUNT(d.id) AS total_detections_last_24h,
        ROUND(COALESCE(SUM(s.biomass_tons), 0), 2) AS total_detected_biomass_tons
    FROM fish_detections d
    JOIN sonar_nodes n ON d.node_id = n.id
    JOIN fish_schools s ON d.school_id = s.id
    WHERE d.detected_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
    GROUP BY n.zone_id
)
SELECT 
    z.id AS zone_id,
    z.name AS zone_name,
    z.depth_min_m,
    z.depth_max_m,
    COALESCE(ns.total_nodes, 0) AS total_nodes,
    COALESCE(ns.active_nodes, 0) AS active_nodes,
    COALESCE(ns.offline_nodes, 0) AS offline_nodes,
    COALESCE(ns.critical_battery_nodes, 0) AS critical_battery_nodes,
    COALESCE(ns.tampered_nodes, 0) AS tampered_nodes,
    COALESCE(ns.avg_battery_pct, 0.00) AS avg_battery_pct,
    COALESCE(ns.avg_health_score, 0.00) AS avg_health_score,
    COALESCE(fa.total_detections_last_24h, 0) AS total_detections_24h,
    COALESCE(fa.total_detected_biomass_tons, 0.00) AS total_biomass_24h,
    DENSE_RANK() OVER (
        ORDER BY COALESCE(fa.total_detected_biomass_tons, 0) DESC
    ) AS biomass_activity_rank
FROM ocean_zones z
LEFT JOIN zone_node_stats ns ON z.id = ns.zone_id
LEFT JOIN zone_fish_activity fa ON z.id = fa.zone_id;

-- 3. VIEW: Active Correlated Fish Intelligence (Operations & Analytics View)
CREATE OR REPLACE VIEW vw_active_fish_intelligence AS
SELECT 
    s.id AS school_id,
    s.species,
    s.common_name,
    s.latitude,
    s.longitude,
    s.depth_m,
    s.estimated_size,
    s.biomass_tons,
    s.direction_heading_deg,
    s.speed_knots,
    s.confidence_score,
    COUNT(d.id) AS correlating_node_count,
    ROUND(AVG(d.signal_return_db), 2) AS avg_acoustic_return_db,
    MAX(d.detected_at) AS latest_detection_time
FROM fish_schools s
LEFT JOIN fish_detections d ON s.id = d.school_id
WHERE s.status = 'ACTIVE_TRACK'
GROUP BY s.id, s.species, s.common_name, s.latitude, s.longitude, s.depth_m, 
         s.estimated_size, s.biomass_tons, s.direction_heading_deg, s.speed_knots, s.confidence_score;

-- 4. VIEW: Subscriber Processed Intelligence (Strict Data Privacy - No Node IDs or Battery)
CREATE OR REPLACE VIEW vw_subscriber_biomass_feed AS
SELECT 
    s.id AS target_id,
    s.common_name AS target_species,
    s.latitude,
    s.longitude,
    s.depth_m AS estimated_depth_m,
    s.estimated_size AS biomass_scale,
    s.biomass_tons,
    s.direction_heading_deg AS heading_vector,
    s.speed_knots AS travel_speed,
    ROUND(s.confidence_score * 100, 1) AS confidence_percentage,
    s.last_detected_at AS timestamp
FROM fish_schools s
WHERE s.status = 'ACTIVE_TRACK' AND s.confidence_score >= 0.70;

-- 5. RECURSIVE CTE FUNCTION: Multi-Hop Acoustic Route Trace
-- Demonstrates Week 10 Recursive CTEs for acoustic network graphs
CREATE OR REPLACE FUNCTION fn_trace_acoustic_route(p_start_node_id VARCHAR(50))
RETURNS TABLE (
    hop_level INT,
    source_node VARCHAR(50),
    target_node VARCHAR(50),
    cumulative_latency NUMERIC(10, 2),
    link_status VARCHAR(30)
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE route_path AS (
        -- Anchor member: Initial single-hop transmission from target node
        SELECT 
            1 AS hop_level,
            l.source_node_id,
            l.target_node_id,
            l.latency_ms AS cumulative_latency,
            l.link_status
        FROM communication_links l
        WHERE l.source_node_id = p_start_node_id

        UNION ALL

        -- Recursive member: Traverse through connected relay nodes
        SELECT 
            rp.hop_level + 1,
            l.source_node_id,
            l.target_node_id,
            ROUND(rp.cumulative_latency + l.latency_ms, 2),
            l.link_status
        FROM communication_links l
        JOIN route_path rp ON l.source_node_id = rp.target_node_id
        WHERE rp.hop_level < 8 -- Prevent infinite graph cycles
    )
    SELECT * FROM route_path;
END;
$$ LANGUAGE plpgsql;
