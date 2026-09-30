import { Router } from 'express';
import { createDeletionRequest, deleteDeletionRequest, getDeletionRequest, listDeletionRequests, updateDeletionRequest } from '../controllers/deletionRequest.controller';

const router = Router();

router.get('/', listDeletionRequests);
router.post('/', createDeletionRequest);
router.get('/:id', getDeletionRequest);
router.patch('/:id', updateDeletionRequest);
router.delete('/:id', deleteDeletionRequest);

export const deletionRequestRouter = router;
