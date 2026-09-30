import { Router } from 'express';
import { createAccessGrant, deleteAccessGrant, getAccessGrant, listAccessGrants, updateAccessGrant } from '../controllers/accessGrant.controller';

const router = Router();

router.get('/', listAccessGrants);
router.post('/', createAccessGrant);
router.get('/:id', getAccessGrant);
router.patch('/:id', updateAccessGrant);
router.delete('/:id', deleteAccessGrant);

export const accessGrantRouter = router;
