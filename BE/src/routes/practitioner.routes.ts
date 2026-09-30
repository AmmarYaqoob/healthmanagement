import { Router } from 'express';
import { createPractitioner, deletePractitioner, getPractitioner, listPractitioners, updatePractitioner } from '../controllers/practitioner.controller';

const router = Router();

router.get('/', listPractitioners);
router.post('/', createPractitioner);
router.get('/:id', getPractitioner);
router.patch('/:id', updatePractitioner);
router.delete('/:id', deletePractitioner);

export const practitionerRouter = router;
