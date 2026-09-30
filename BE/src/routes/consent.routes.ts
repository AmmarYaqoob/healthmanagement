import { Router } from 'express';
import { createConsent, deleteConsent, getConsent, listConsents, updateConsent } from '../controllers/consent.controller';

const router = Router();

router.get('/', listConsents);
router.post('/', createConsent);
router.get('/:id', getConsent);
router.patch('/:id', updateConsent);
router.delete('/:id', deleteConsent);

export const consentRouter = router;
