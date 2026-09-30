import { Router } from 'express';
import { createImmunization, deleteImmunization, getImmunization, listImmunizations, updateImmunization } from '../controllers/immunization.controller';

const router = Router();

router.get('/', listImmunizations);
router.post('/', createImmunization);
router.get('/:id', getImmunization);
router.patch('/:id', updateImmunization);
router.delete('/:id', deleteImmunization);

export const immunizationRouter = router;
