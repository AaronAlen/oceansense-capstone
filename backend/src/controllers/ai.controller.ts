import { Request, Response } from 'express';
import { maritimeAI } from '../ai/agent.js';

export const handleAIChat = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'A query string is required.' });
    }

    const response = await maritimeAI.processQuery(query);
    res.json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const handleSonarClassification = async (req: Request, res: Response) => {
  try {
    const { nodeId, schoolId, distanceM = 1200, depthM = 22.0, biomassTons = 48.5, frequencyKHz = 800 } = req.body;

    const isHit = distanceM <= 3000;
    if (!isHit) {
      return res.json({
        success: true,
        isHit: false,
        message: 'Water column clear. No acoustic echoes detected within 3km transducer dome.',
        nodeId,
        ambientNoiseDb: 52.0,
      });
    }

    // Determine species profile based on school ID or acoustic depth & target strength
    const isMackerel = schoolId?.includes?.('MACK') || depthM < 16;
    const isSardine = schoolId?.includes?.('SARD');

    let species = 'Yellowfin Tuna';
    let scientificName = 'Thunnus albacares';
    let family = 'Scombridae';
    let confidencePct = +(95.0 + (Math.abs(Math.sin(depthM)) * 4.5)).toFixed(1);
    let targetStrengthDb = -36.4;
    let commercialGrade = 'GRADE_A_EXPORT (HIGH VALUE)';
    let tacticalRecommendation = 'Pelagic school moving southwest with coastal current. Recommended purse-seine net depth: 25 meters.';
    let aiAgentSummary = 'Tactical Acoustic AI confirms mature Yellowfin Tuna cohort with tight school cohesion. Resonant physoclist swim-bladder return detected at 800kHz.';

    if (isMackerel) {
      species = 'Indian Mackerel';
      scientificName = 'Rastrelliger kanagurta';
      family = 'Scombridae';
      confidencePct = 94.2;
      targetStrengthDb = -42.8;
      commercialGrade = 'REGIONAL_COMMERCIAL';
      tacticalRecommendation = 'Fast-moving epipelagic cluster. Deploy surface drift nets between 8m and 18m.';
      aiAgentSummary = 'Acoustic backscatter analysis indicates dense epipelagic Indian Mackerel aggregation feeding on plankton bloom.';
    } else if (isSardine) {
      species = 'Indian Oil Sardine';
      scientificName = 'Sardinella longiceps';
      family = 'Clupeidae';
      confidencePct = 96.1;
      targetStrengthDb = -46.5;
      commercialGrade = 'MASS_BIOMASS_HARVEST';
      tacticalRecommendation = 'High-density bait ball detected near surface. Ring-net harvesting recommended.';
      aiAgentSummary = 'High-frequency scattering layer corresponds to cohesive Sardinella shoal with high oil content.';
    }

    return res.json({
      success: true,
      isHit: true,
      nodeId,
      schoolId: schoolId || 'SCHOOL-TUNA-01',
      species,
      scientificName,
      family,
      confidencePct,
      targetStrengthDb,
      frequencyKHz: frequencyKHz || 800,
      estimatedBiomassTons: biomassTons,
      depthLayerM: `${Math.max(5, depthM - 6).toFixed(1)}m - ${(depthM + 8).toFixed(1)}m`,
      swimVelocityKnots: 3.4,
      commercialGrade,
      tacticalRecommendation,
      aiAgentSummary,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
