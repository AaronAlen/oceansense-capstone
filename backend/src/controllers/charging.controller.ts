import { Request, Response } from 'express';
import { simulationEngine } from '../simulation/engine.js';

export const getChargingDiagnostics = async (req: Request, res: Response) => {
  try {
    const auvs = simulationEngine.getAUVs();

    const dockingStations = [
      {
        id: 'DOCK-ALPHA',
        name: 'Inductive Cradle Alpha',
        zoneId: 'ZONE-A',
        latitude: 10.225000,
        longitude: 80.125000,
        depth_m: 110.0,
        status: auvs.find(a => a.dockId === 'DOCK-ALPHA' && a.status === 'DOCKED') ? 'OCCUPIED_CHARGING' : 'AVAILABLE_STANDBY',
        dockedAUV: auvs.find(a => a.dockId === 'DOCK-ALPHA' && a.status === 'DOCKED')?.id || null,
        inductiveWptFrequencyKhz: 85.0,
        couplingEfficiencyPct: 93.4,
        coilAlignmentOffsetMm: 4.2,
        powerDeliveryWatts: 420.0,
        transformerTemperatureC: 18.5,
        magneticInterferenceShieldDb: -42.0,
      },
      {
        id: 'DOCK-BRAVO',
        name: 'Inductive Cradle Bravo',
        zoneId: 'ZONE-B',
        latitude: 10.265000,
        longitude: 80.125000,
        depth_m: 145.0,
        status: auvs.find(a => a.dockId === 'DOCK-BRAVO' && a.status === 'DOCKED') ? 'OCCUPIED_CHARGING' : 'AVAILABLE_STANDBY',
        dockedAUV: auvs.find(a => a.dockId === 'DOCK-BRAVO' && a.status === 'DOCKED')?.id || null,
        inductiveWptFrequencyKhz: 85.0,
        couplingEfficiencyPct: 91.8,
        coilAlignmentOffsetMm: 6.1,
        powerDeliveryWatts: 0.0,
        transformerTemperatureC: 14.1,
        magneticInterferenceShieldDb: -44.5,
      },
      {
        id: 'DOCK-CHARLIE',
        name: 'Inductive Cradle Charlie',
        zoneId: 'ZONE-C',
        latitude: 10.225000,
        longitude: 80.165000,
        depth_m: 95.0,
        status: auvs.find(a => a.dockId === 'DOCK-CHARLIE' && a.status === 'DOCKED') ? 'OCCUPIED_CHARGING' : 'AVAILABLE_STANDBY',
        dockedAUV: auvs.find(a => a.dockId === 'DOCK-CHARLIE' && a.status === 'DOCKED')?.id || null,
        inductiveWptFrequencyKhz: 85.0,
        couplingEfficiencyPct: 94.1,
        coilAlignmentOffsetMm: 3.5,
        powerDeliveryWatts: 450.0,
        transformerTemperatureC: 19.2,
        magneticInterferenceShieldDb: -43.8,
      },
      {
        id: 'DOCK-DELTA',
        name: 'Inductive Cradle Delta',
        zoneId: 'ZONE-D',
        latitude: 10.265000,
        longitude: 80.165000,
        depth_m: 160.0,
        status: auvs.find(a => a.dockId === 'DOCK-DELTA' && a.status === 'DOCKED') ? 'OCCUPIED_CHARGING' : 'AVAILABLE_STANDBY',
        dockedAUV: auvs.find(a => a.dockId === 'DOCK-DELTA' && a.status === 'DOCKED')?.id || null,
        inductiveWptFrequencyKhz: 85.0,
        couplingEfficiencyPct: 92.5,
        coilAlignmentOffsetMm: 5.0,
        powerDeliveryWatts: 410.0,
        transformerTemperatureC: 17.8,
        magneticInterferenceShieldDb: -41.9,
      }
    ];

    const benthicHarvestingDiagnostics = {
      activeMicrobialCells: 24,
      averageHarvestCurrentMa: 28.4,
      redoxPotentialMillivolts: 742.0,
      sedimentPh: 7.8,
      totalMWhHarvestedToday: 0.142,
      harvestingStatus: 'CONTINUOUS_ANEROBIC_REDOX',
      harvestingNodesSample: ['SN-0078', 'SN-0234', 'SN-0671'],
    };

    res.json({
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      dockingStations,
      benthicHarvesting: benthicHarvestingDiagnostics,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
