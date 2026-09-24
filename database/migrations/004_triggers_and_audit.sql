-- ==============================================================================
-- OceanSense — Database Migration 004: Triggers, Automated Workflows & Audit
-- Demonstrates: Week 10 Triggers, Procedures, Automated Security & Maintenance
-- ==============================================================================

-- 1. TRIGGER FUNCTION: Universal Audit Logger for Node Mutations
CREATE OR REPLACE FUNCTION trg_fn_audit_sonar_node_mutation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_state,
        new_state,
        created_at
    ) VALUES (
        NULL, -- System/Simulation automation default
        TG_OP || '_SONAR_NODE',
        'sonar_nodes',
        COALESCE(NEW.id, OLD.id),
        row_to_json(OLD)::jsonb,
        row_to_json(NEW)::jsonb,
        CURRENT_TIMESTAMP
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_sonar_nodes ON sonar_nodes;
CREATE TRIGGER trg_audit_sonar_nodes
AFTER UPDATE OR DELETE ON sonar_nodes
FOR EACH ROW
EXECUTE FUNCTION trg_fn_audit_sonar_node_mutation();


-- 2. TRIGGER FUNCTION: Automated Security Incident on Tamper / Theft Detection
CREATE OR REPLACE FUNCTION trg_fn_auto_tamper_security_incident()
RETURNS TRIGGER AS $$
DECLARE
    v_incident_id VARCHAR(50);
BEGIN
    -- Detect transition from SECURE to TAMPER_SUSPECTED or ALERT_ACTIVE
    IF NEW.tamper_status != 'SECURE' AND (OLD.tamper_status = 'SECURE' OR OLD.tamper_status IS NULL) THEN
        v_incident_id := 'SEC-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || SUBSTRING(NEW.id FROM 4);
        
        -- Insert security incident record if not already open
        INSERT INTO security_incidents (
            id,
            affected_node_id,
            status,
            threat_assessment,
            ai_analysis_summary,
            operator_notes,
            created_at
        ) VALUES (
            v_incident_id,
            NEW.id,
            'SUSPECTED',
            'UNAUTHORIZED_DISPLACEMENT_DETECTED',
            'Autonomous acoustic detection: Tilt exceeded threshold (' || NEW.tilt_angle_deg || ' deg). Anchor release suspected.',
            'System automated dispatch pending AUV visual confirmation.',
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO NOTHING;

        -- Update node status to THEFT_SUSPECTED
        NEW.status := 'THEFT_SUSPECTED';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_tamper_security ON sonar_nodes;
CREATE TRIGGER trg_auto_tamper_security
BEFORE UPDATE ON sonar_nodes
FOR EACH ROW
WHEN (NEW.tamper_status != OLD.tamper_status)
EXECUTE FUNCTION trg_fn_auto_tamper_security_incident();


-- 3. TRIGGER FUNCTION: Critical Battery Auto-Maintenance Generation
CREATE OR REPLACE FUNCTION trg_fn_auto_battery_maintenance()
RETURNS TRIGGER AS $$
DECLARE
    v_task_id VARCHAR(50);
BEGIN
    -- If battery drops below 15% and wasn't previously below 15%
    IF NEW.battery_level < 15.00 AND (OLD.battery_level >= 15.00 OR OLD.battery_level IS NULL) THEN
        v_task_id := 'MAINT-BAT-' || SUBSTRING(NEW.id FROM 4) || '-' || EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::INT;

        -- Update node status
        NEW.status := 'POWER_CRITICAL';

        -- Generate automated high-priority maintenance task
        INSERT INTO maintenance_tasks (
            id,
            node_id,
            task_type,
            priority,
            status,
            notes,
            created_at
        ) VALUES (
            v_task_id,
            NEW.id,
            'BATTERY_REPLACEMENT',
            'CRITICAL',
            'PENDING',
            'Automated alert: Cell voltage depleted below operational threshold (15%). Requires AUV service or module swap.',
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_battery_maintenance ON sonar_nodes;
CREATE TRIGGER trg_auto_battery_maintenance
BEFORE UPDATE ON sonar_nodes
FOR EACH ROW
WHEN (NEW.battery_level != OLD.battery_level)
EXECUTE FUNCTION trg_fn_auto_battery_maintenance();
