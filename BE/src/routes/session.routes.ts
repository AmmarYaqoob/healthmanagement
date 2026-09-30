import { Router } from 'express';
import { createSession, deleteSession, getSession, listSessions, updateSession } from '../controllers/session.controller';

const router = Router();

router.get('/', listSessions);
router.post('/', createSession);
router.get('/:id', getSession);
router.patch('/:id', updateSession);
router.delete('/:id', deleteSession);

export const sessionRouter = router;
