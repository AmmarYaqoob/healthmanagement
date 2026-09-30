import { Router } from 'express';
import { createAccessEvent, deleteAccessEvent, getAccessEvent, listAccessEvents, updateAccessEvent } from '../controllers/accessEvent.controller';

const router = Router();

router.get('/', listAccessEvents);
router.post('/', createAccessEvent);
router.get('/:id', getAccessEvent);
router.patch('/:id', updateAccessEvent);
router.delete('/:id', deleteAccessEvent);

export const accessEventRouter = router;
