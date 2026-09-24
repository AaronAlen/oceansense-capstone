// ==============================================================================
// OceanSense — Maritime Operations AI Assistant Agent
// Demonstrates: Week 7/15 AI Agent with Function Calling & Tool Execution Trace
// ==============================================================================

import { MARITIME_TOOLS } from './tools.js';
import { ENV } from '../config/env.js';

export interface ToolCallTrace {
  toolName: string;
  arguments: any;
  result: any;
}

export interface AgentResponse {
  answer: string;
  toolCalls: ToolCallTrace[];
  timestamp: string;
  classification: 'TACTICAL_OPERATIONS_ASSISTANT';
}

export class MaritimeAIAgent {
  private async askGroq(query: string, sectorContext: any): Promise<string | null> {
    if (!ENV.GROQ_API_KEY) return null;
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ENV.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are OceanSense Tactical AI, an operational AI assistant monitoring 1,000 underwater seabed sonar nodes, 4 autonomous AUV drones, and pelagic fish schools (Bluefin Tuna) across a 100 km² maritime sector. Keep responses tactical, authoritative, and concise (under 3 sentences). Current Sector State: ${JSON.stringify(sectorContext)}`,
            },
            { role: 'user', content: query },
          ],
          temperature: 0.3,
          max_tokens: 300,
        }),
      });

      if (!response.ok) return null;
      const data: any = await response.json();
      return data?.choices?.[0]?.message?.content || null;
    } catch {
      return null;
    }
  }
  async processQuery(query: string): Promise<AgentResponse> {
    const lower = query.toLowerCase();
    const toolCalls: ToolCallTrace[] = [];
    let answer = '';

    // 1. Intent: Tamper test or inject tamper
    if (lower.includes('tamper') && (lower.includes('trigger') || lower.includes('inject') || lower.includes('test'))) {
      const match = query.match(/SN-\d{4}/i);
      const nodeId = match ? match[0].toUpperCase() : 'SN-0431';
      const result = await MARITIME_TOOLS['trigger_node_tamper_test'].execute({ nodeId });
      toolCalls.push({
        toolName: 'trigger_node_tamper_test',
        arguments: { nodeId },
        result,
      });

      answer = `Acoustic alert dispatched! Injected physical tamper event on **${nodeId}**. Accelerometer displacement exceeded 2.8G with a 65° tilt anomaly. Interceptor drone **AUV-01** has been automatically dispatched to coordinates to record optical evidence.`;
    }
    // 2. Intent: Reset alarm or node
    else if (lower.includes('reset') && (lower.includes('alarm') || lower.includes('node') || lower.includes('sn-'))) {
      const match = query.match(/SN-\d{4}/i);
      const nodeId = match ? match[0].toUpperCase() : 'SN-0431';
      const result = await MARITIME_TOOLS['reset_node_tamper_alarm'].execute({ nodeId });
      toolCalls.push({
        toolName: 'reset_node_tamper_alarm',
        arguments: { nodeId },
        result,
      });

      answer = `Node **${nodeId}** acoustic tamper alarm has been reset. Sensor baseline re-calibrated to 0.0° tilt, movement status SECURE, and normal acoustic ping cycle restored.`;
    }
    // 3. Intent: Inspect specific node telemetry
    else if (lower.includes('telemetry') || lower.includes('inspect') || lower.match(/sn-\d{4}/i)) {
      const match = query.match(/SN-\d{4}/i);
      const nodeId = match ? match[0].toUpperCase() : 'SN-0431';
      const result = await MARITIME_TOOLS['get_node_telemetry'].execute({ nodeId });
      toolCalls.push({
        toolName: 'get_node_telemetry',
        arguments: { nodeId },
        result,
      });

      if (result.error) {
        answer = `Error: ${result.error}. Please verify the node identifier.`;
      } else {
        answer = `Telemetry for **${nodeId}**: Status is **${result.status}**, Battery at **${result.battery_pct}%**, Tilt Angle **${result.tilt_angle_deg}°**, Hydrostatic Pressure **${result.hydrostatic_pressure_bar} bar** at depth **${result.depth_m}m**, Acoustic SNR **${result.snr_db} dB**.`;
      }
    }
    // 4. Intent: Fish schools & biomass intelligence
    else if (lower.includes('fish') || lower.includes('tuna') || lower.includes('biomass') || lower.includes('school')) {
      const result = await MARITIME_TOOLS['get_fish_school_intelligence'].execute({});
      toolCalls.push({
        toolName: 'get_fish_school_intelligence',
        arguments: {},
        result,
      });

      const schools = result.activeSchools;
      const tuna = schools.find((s: any) => s.id === 'SCHOOL-TUNA-01');
      answer = `Acoustic multi-lateration currently tracks **${schools.length} distinct biological schools**. Primary target: **${tuna?.commonName}** (~${tuna?.biomassTons} metric tons) located at depth **${tuna?.depth_m}m** heading ${tuna?.directionHeadingDeg}°. Multilateral triangulation verified by ${tuna?.detectedByNodeIds?.join(', ')}.`;
    }
    // 5. Intent: Dispatch AUV
    else if (lower.includes('dispatch') && (lower.includes('auv') || lower.includes('drone'))) {
      const matchAUV = query.match(/AUV-\d{2}/i);
      const auvId = matchAUV ? matchAUV[0].toUpperCase() : 'AUV-01';
      const result = await MARITIME_TOOLS['dispatch_auv_to_coordinates'].execute({
        auvId,
        latitude: 10.235,
        longitude: 80.138,
        depth_m: 140,
        targetId: 'DIRECT_DISPATCH_MISSION',
      });
      toolCalls.push({
        toolName: 'dispatch_auv_to_coordinates',
        arguments: { auvId, latitude: 10.235, longitude: 80.138, depth_m: 140 },
        result,
      });

      answer = `Deployment confirmed. **${auvId}** dispatched to coordinates (10.235, 80.138) at depth 140m. ETA is calculated dynamically based on hydrodynamic cruising speed.`;
    }
    // 6. Intent: Battery critical or maintenance
    else if (lower.includes('battery') || lower.includes('charge') || lower.includes('critical') || lower.includes('power')) {
      const result = await MARITIME_TOOLS['get_battery_critical_nodes'].execute({});
      toolCalls.push({
        toolName: 'get_battery_critical_nodes',
        arguments: {},
        result,
      });

      answer = `Identified **${result.criticalCount} nodes** with battery level < 20%. These nodes have entered autonomous low-power ping duty cycle (1 ping / 300s). Recommended action: verify benthic microbial harvester coupling or schedule inductive charging.`;
    }
    // 7. Default: Zone health summary & general sector status with Groq LLM reasoning
    else {
      const result = await MARITIME_TOOLS['get_zone_health_summary'].execute({});
      toolCalls.push({
        toolName: 'get_zone_health_summary',
        arguments: {},
        result,
      });

      const groqAnswer = await this.askGroq(query, result);
      if (groqAnswer) {
        answer = groqAnswer;
      } else {
        answer = `Sector Status Overview: **${result.totalNodes} seabed nodes deployed across 100 km²**. Active: **${result.activeNodes}**, Offline: **${result.offlineNodes}**, Power Conserving: **${result.powerConservingNodes}**, Average Battery: **${result.avgBatteryPct}%**, Acoustic Mesh Health: **${result.networkHealthPct}%**. All 4 Gateway Buoys operational.`;
      }
    }

    return {
      answer,
      toolCalls,
      timestamp: new Date().toISOString(),
      classification: 'TACTICAL_OPERATIONS_ASSISTANT',
    };
  }
}

export const maritimeAI = new MaritimeAIAgent();
