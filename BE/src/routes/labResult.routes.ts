import express, { Router } from 'express';
import type { IncomingMessage } from 'http';
import {
  createLabResult,
  deleteLabResult,
  extractLabReport,
  getLabResult,
  listLabResults,
  updateLabResult,
} from '../controllers/labResult.controller';

const router = Router();

router.get('/', listLabResults);
router.post(
  '/extract',
  express.raw({
    limit: '10mb',
    type: (req: IncomingMessage) => {
      const header = req.headers['content-type'];
      return typeof header === 'string' && header.toLowerCase().startsWith('application/pdf');
    },
  }),
  extractLabReport,
);
router.post('/', createLabResult);
router.get('/:id', getLabResult);
router.patch('/:id', updateLabResult);
router.delete('/:id', deleteLabResult);

export const labResultRouter = router;
