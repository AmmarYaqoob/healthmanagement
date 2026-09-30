import { Router } from 'express';
import { createAuthChallenge, deleteAuthChallenge, getAuthChallenge, listAuthChallenges, updateAuthChallenge } from '../controllers/authChallenge.controller';

const router = Router();

router.get('/', listAuthChallenges);
router.post('/', createAuthChallenge);
router.get('/:id', getAuthChallenge);
router.patch('/:id', updateAuthChallenge);
router.delete('/:id', deleteAuthChallenge);

export const authChallengeRouter = router;
