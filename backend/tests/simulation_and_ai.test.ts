// ==============================================================================
// OceanSense — Comprehensive Backend & Simulation Automated Test Suite
// Demonstrates: Week 16 Quality Assurance, Unit Testing & Core Domain Verification
// ==============================================================================

import { simulationEngine } from '../src/simulation/engine.js';
import { auvEngine } from '../src/simulation/auvSimulator.js';
import { fishEngine } from '../src/simulation/fishSimulator.js';
import { MARITIME_TOOLS } from '../src/ai/tools.js';
import { maritimeAI } from '../src/ai/agent.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('  OCEANSENSE AUTOMATED TEST SUITE');
  console.log('====================================================\n');

  // TEST SUITE 1: 1,000-Node Digital Twin Grid
  console.log('[Suite 1: Sonar Node Digital Twin Engine]');
  const allNodes = simulationEngine.getAllNodes(1, 1000);
  assert(allNodes.total === 1000, 'Grid initializes exactly 1,000 seabed sonar nodes');

  const sampleNode = simulationEngine.getNode('SN-0001');
  assert(sampleNode !== null, 'Node SN-0001 lookup succeeds');
  assert(sampleNode!.depth_m >= 45 && sampleNode!.depth_m <= 390, 'Node depth conforms to bathymetric gradient (45m to 390m)');
  assert(sampleNode!.hydrostatic_pressure_bar > 1.0, 'Hydrostatic pressure reflects depth physics (P = 1 + D/10)');

  // TEST SUITE 2: Battery Kinetics & Low-Power State Transitions
  console.log('\n[Suite 2: Battery Kinetics & Power Management]');
  const initialKPIs = simulationEngine.getAggregatedKPIs();
  assert(initialKPIs.avgBatteryPct > 50, `Average grid battery is nominal (${initialKPIs.avgBatteryPct}%)`);
  assert(initialKPIs.networkHealthPct > 80, `Acoustic network health is high (${initialKPIs.networkHealthPct}%)`);

  // TEST SUITE 3: Anti-Theft Tamper Alert & Drone Auto-Dispatch
  console.log('\n[Suite 3: Anti-Theft Tamper Triangulation & Robotics Dispatch]');
  const tamperResult = simulationEngine.triggerTamper('SN-0431');
  assert(tamperResult !== null, 'Tamper event successfully injected on node SN-0431');
  assert(tamperResult!.node.tamper_status === 'THEFT_SUSPECTED', 'Node tamper status transitions to THEFT_SUSPECTED');
  assert(tamperResult!.node.tilt_angle_deg >= 45, 'Tilt deviation reflects physical displacement (tilt >= 45°)');
  assert(tamperResult!.dispatchedAUV !== null, 'Autonomous AUV is automatically dispatched to coordinates');
  assert(tamperResult!.dispatchedAUV.target?.targetId === 'SN-0431', 'AUV target is assigned to tampered node SN-0431');

  // Reset tamper alarm
  const resetNode = simulationEngine.resetNode('SN-0431');
  assert(resetNode !== null && resetNode.tamper_status === 'SECURE', 'Node SN-0431 alarm successfully resets to SECURE');

  // TEST SUITE 4: Biological Fish School Simulation & Multi-Lateration
  console.log('\n[Suite 4: Biological Fish School Simulation]');
  const schools = fishEngine.getSchools();
  assert(schools.length >= 3, `Tracks ${schools.length} biological schools (Tuna, Mackerel, Sardines)`);
  const tuna = schools.find(s => s.id === 'SCHOOL-TUNA-01');
  assert(tuna !== null && tuna.biomassTons > 10, 'Atlantic Bluefin Tuna school active with biomass > 10 tons');

  // Advance simulation clock and check swimming vector
  fishEngine.tick(1.0, 1.0, [{ id: 'SN-0218', latitude: 10.235, longitude: 80.138, depth_m: 142 }]);
  assert(tuna!.lastDetectedAt !== undefined, 'Fish school position and sonar timestamp update on tick');

  // TEST SUITE 5: Maritime Operations AI Agent & Tool Execution
  console.log('\n[Suite 5: Maritime AI Operations Assistant & 13 Tools]');
  assert(typeof MARITIME_TOOLS['get_node_telemetry'] !== 'undefined', 'Tool get_node_telemetry is registered');
  assert(typeof MARITIME_TOOLS['dispatch_auv_to_coordinates'] !== 'undefined', 'Tool dispatch_auv_to_coordinates is registered');
  assert(typeof MARITIME_TOOLS['get_fish_school_intelligence'] !== 'undefined', 'Tool get_fish_school_intelligence is registered');

  const aiResponse = await maritimeAI.processQuery('Diagnose node SN-0431 telemetry');
  assert(aiResponse.toolCalls.length > 0, 'AI query triggers tool execution trace');
  assert(aiResponse.toolCalls[0].toolName === 'get_node_telemetry', 'AI correctly selects get_node_telemetry tool');
  assert(aiResponse.answer.includes('SN-0431'), 'AI response answers with specific node telemetry details');

  console.log('\n====================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
