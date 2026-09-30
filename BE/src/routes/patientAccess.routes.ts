import { Router } from 'express';
import { createPatientAccess, deletePatientAccess, getPatientAccess, listPatientAccess, updatePatientAccess } from '../controllers/patientAccess.controller';

const router = Router();

router.get('/', listPatientAccess);
router.post('/', createPatientAccess);
router.get('/:id', getPatientAccess);
router.patch('/:id', updatePatientAccess);
router.delete('/:id', deletePatientAccess);

export const patientAccessRouter = router;
