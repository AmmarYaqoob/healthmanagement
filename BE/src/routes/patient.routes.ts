import { Router } from 'express';
import { createPatient, deletePatient, getPatient, listPatients, updatePatient } from '../controllers/patient.controller';

const router = Router();

router.get('/', listPatients);
router.post('/', createPatient);
router.get('/:id', getPatient);
router.patch('/:id', updatePatient);
router.delete('/:id', deletePatient);

export const patientRouter = router;
