import { Router } from 'express';
import { createMedication, deleteMedication, getMedication, listMedications, updateMedication } from '../controllers/medication.controller';

const router = Router();

router.get('/', listMedications);
router.post('/', createMedication);
router.get('/:id', getMedication);
router.patch('/:id', updateMedication);
router.delete('/:id', deleteMedication);

export const medicationRouter = router;
