import { Router } from 'express';
import { getSoundVelocityProfile, getAcousticSpectrum } from '../controllers/analytics.controller.js';

const router = Router();

router.get('/sound-velocity-profile', getSoundVelocityProfile);
router.get('/acoustic-spectrum', getAcousticSpectrum);

export default router;
