import { Router } from 'express';
import { createLabResult, deleteLabResult, getLabResult, listLabResults, updateLabResult } from '../controllers/labResult.controller';

const router = Router();

router.get('/', listLabResults);
router.post('/', createLabResult);
router.get('/:id', getLabResult);
router.patch('/:id', updateLabResult);
router.delete('/:id', deleteLabResult);

export const labResultRouter = router;
