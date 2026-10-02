import { Router } from 'express';
import { createClinic, deleteClinic, getClinic, listClinics, updateClinic } from '../controllers/clinic.controller';

const router = Router();

router.get('/', listClinics);
router.post('/', createClinic);
router.get('/:id', getClinic);
router.patch('/:id', updateClinic);
router.delete('/:id', deleteClinic);

export const clinicRouter = router;
