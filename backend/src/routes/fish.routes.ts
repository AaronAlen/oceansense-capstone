import { Router } from 'express';
import { getFishSchools, getFishDetections, getSubscriberBiomassFeed } from '../controllers/fish.controller.js';

const router = Router();

router.get('/schools', getFishSchools);
router.get('/detections', getFishDetections);
router.get('/subscriber-feed', getSubscriberBiomassFeed);

export default router;
