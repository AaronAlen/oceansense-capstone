-- ==============================================================================
-- OceanSense — Database Migration 002: Indexes & Performance Optimization
-- Demonstrates: Week 10 B-Tree, Composite, Partial Indexes & Geospatial Lookups
-- ==============================================================================

-- 1. Sonar Nodes: High-Frequency Filters & Partial Indexes
CREATE INDEX IF NOT EXISTS idx_sonar_nodes_zone_id ON sonar_nodes(zone_id);
CREATE INDEX IF NOT EXISTS idx_sonar_nodes_gateway_id ON sonar_nodes(gateway_id);
CREATE INDEX IF NOT EXISTS idx_sonar_nodes_status ON sonar_nodes(status);

-- Composite Index for fast zone-level operational filtering
CREATE INDEX IF NOT EXISTS idx_sonar_nodes_zone_status ON sonar_nodes(zone_id, status);

-- Partial Index: Critical low battery alert querying (< 20%)
CREATE INDEX IF NOT EXISTS idx_sonar_nodes_low_battery 
ON sonar_nodes(id, battery_level, zone_id) 
WHERE battery_level < 20.00;

-- Partial Index: Fast retrieval of active nodes
CREATE INDEX IF NOT EXISTS idx_sonar_nodes_active_only 
ON sonar_nodes(id, latitude, longitude, depth_m) 
WHERE status = 'ACTIVE';

-- Partial Index: Tampered / Security alert nodes
CREATE INDEX IF NOT EXISTS idx_sonar_nodes_tamper_alert 
ON sonar_nodes(id, tamper_status, tilt_angle_deg) 
WHERE tamper_status != 'SECURE';

-- 2. Telemetry Readings: Composite Time-Series Clustered Queries
CREATE INDEX IF NOT EXISTS idx_sonar_readings_node_time 
ON sonar_readings(node_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_sonar_readings_time 
ON sonar_readings(recorded_at DESC);

-- 3. Fish Schools & Correlated Detections
CREATE INDEX IF NOT EXISTS idx_fish_schools_status ON fish_schools(status);
CREATE INDEX IF NOT EXISTS idx_fish_schools_active_track 
ON fish_schools(id, species, biomass_tons, depth_m) 
WHERE status = 'ACTIVE_TRACK';

CREATE INDEX IF NOT EXISTS idx_fish_detections_school_time 
ON fish_detections(school_id, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_fish_detections_node_time 
ON fish_detections(node_id, detected_at DESC);

-- 4. Communication Mesh Routing Lookups
CREATE INDEX IF NOT EXISTS idx_comm_links_src_dst 
ON communication_links(source_node_id, target_node_id, link_status);

CREATE INDEX IF NOT EXISTS idx_comm_links_status 
ON communication_links(link_status) 
WHERE link_status != 'OPTIMAL';

-- 5. AUV Drone & Mission Real-Time Tracking
CREATE INDEX IF NOT EXISTS idx_auv_missions_status ON auv_missions(status);
CREATE INDEX IF NOT EXISTS idx_auv_telemetry_auv_time ON auv_telemetry(auv_id, recorded_at DESC);

-- 6. Security Incidents & Maintenance Tasks
CREATE INDEX IF NOT EXISTS idx_sec_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_sec_incidents_node ON security_incidents(affected_node_id);
CREATE INDEX IF NOT EXISTS idx_maint_tasks_status_priority ON maintenance_tasks(status, priority);

-- 7. Audit Logs & System Metrics
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity 
ON audit_logs(entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_metrics_name_time 
ON system_metrics(metric_name, recorded_at DESC);
