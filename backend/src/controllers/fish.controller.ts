import { Request, Response } from 'express';
import { simulationEngine } from '../simulation/engine.js';

export const getFishSchools = async (req: Request, res: Response) => {
  try {
    const schools = simulationEngine.getFishSchools();
    res.json({
      status: 'SUCCESS',
      count: schools.length,
      timestamp: new Date().toISOString(),
      schools,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getFishDetections = async (req: Request, res: Response) => {
  try {
    const detections = simulationEngine.getFishDetections();
    res.json({
      status: 'SUCCESS',
      count: detections.length,
      detections,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Subscriber-facing endpoint: data-shielded (Week 6/8 security rule)
// Removes internal node IDs, raw SNR dB, internal acoustic frequencies
export const getSubscriberBiomassFeed = async (req: Request, res: Response) => {
  try {
    const schools = simulationEngine.getFishSchools();
    const biomassClusters = schools.map(s => ({
      clusterId: s.id,
      species: s.species,
      commonName: s.commonName,
      latitude: +s.latitude.toFixed(4),
      longitude: +s.longitude.toFixed(4),
      depth_zone: s.depth_m < 70 ? 'EPIPELAGIC (0-70m)' : 'MESOPELAGIC (70-200m)',
      estimatedBiomassTons: s.biomassTons,
      confidenceRating: s.confidenceScore > 0.9 ? 'HIGH' : 'MEDIUM',
      advisory: s.biomassTons > 15 ? 'HIGH_YIELD_CLUSTER' : 'MODERATE_DENSITY',
      lastTracked: s.lastDetectedAt,
    }));

    res.json({
      feedTitle: 'OceanSense Commercial Maritime Biomass Feed',
      classification: 'SUBSCRIBER_LICENSED',
      timestamp: new Date().toISOString(),
      clusters: biomassClusters,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
