import { Router } from 'express';
import { getAUVs, getAUVById, dispatchAUV, returnAUVToDock, getSecurityIncidents } from '../controllers/auv.controller.js';

const router = Router();

router.get('/', getAUVs);
router.get('/incidents', getSecurityIncidents);
router.get('/:id', getAUVById);
router.post('/:id/dispatch', dispatchAUV);
router.post('/:id/return-to-dock', returnAUVToDock);

export default router;
