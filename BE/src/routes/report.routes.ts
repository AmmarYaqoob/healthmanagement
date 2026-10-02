import { Router } from 'express';
import { getSharedReport } from '../controllers/report.controller';

const router = Router();

router.get('/:token', getSharedReport);

export const reportRouter = router;
