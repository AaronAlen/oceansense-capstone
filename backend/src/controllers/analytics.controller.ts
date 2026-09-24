import { Request, Response } from 'express';

// Computes seawater speed of sound using Mackenzie (1981) formula
function calculateSoundSpeed(tempC: number, salinityPsu: number, depthM: number): number {
  const T = tempC;
  const S = salinityPsu;
  const D = depthM;
  return +(
    1448.96 +
    4.591 * T -
    5.304e-2 * Math.pow(T, 2) +
    2.374e-4 * Math.pow(T, 3) +
    1.340 * (S - 35) +
    1.630e-2 * D +
    1.675e-7 * Math.pow(D, 2) -
    1.025e-2 * T * (S - 35) -
    7.139e-13 * T * Math.pow(D, 3)
  ).toFixed(2);
}

export const getSoundVelocityProfile = async (req: Request, res: Response) => {
  try {
    const depths = [0, 20, 50, 80, 100, 120, 140, 160, 180, 200];
    const profile = depths.map((d) => {
      // Epipelagic warm layer down to thermocline (~80m), then cold deep layer
      const temp = d < 50 ? 24.5 - (d * 0.1) : Math.max(8.0, 19.5 - ((d - 50) * 0.09));
      const salinity = 34.8 + (d * 0.002);
      const c = calculateSoundSpeed(temp, salinity, d);

      return {
        depth_m: d,
        temperature_c: +temp.toFixed(1),
        salinity_psu: +salinity.toFixed(2),
        sound_velocity_ms: c,
      };
    });

    res.json({
      status: 'SUCCESS',
      formula: 'Mackenzie (1981) Equation for Seawater Acoustics',
      location: '10 km x 10 km Bengal Continental Shelf Sector',
      thermoclineDepthM: 75.0,
      sofarChannelAxisM: 140.0,
      profile,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAcousticSpectrum = async (req: Request, res: Response) => {
  try {
    // 16-bin acoustic spectral density array (10 kHz to 50 kHz)
    const bins = [];
    for (let f = 10; f <= 50; f += 2.5) {
      // Typical Knudsen curves for ambient ocean noise (wind, thermal, biological)
      const baseNoiseDb = 62.0 - 0.4 * f;
      // Injected fish biological signal spike around 24-28 kHz
      const bioSpike = (f >= 24 && f <= 28) ? 14.5 : 0;
      bins.push({
        frequencyKhz: f,
        powerSpectralDensityDb: +(baseNoiseDb + bioSpike + (Math.random() * 2 - 1)).toFixed(1),
        signalClassification: (f >= 24 && f <= 28) ? 'BIOLOGICAL_TARGET_RETURNS' : 'BACKGROUND_AMBIENT',
      });
    }

    res.json({
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      fftSize: 2048,
      samplingRateKhz: 120,
      bins,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
