import { Router } from 'express';
import { createFileObject, deleteFileObject, getFileObject, listFileObjects, updateFileObject } from '../controllers/fileObject.controller';

const router = Router();

router.get('/', listFileObjects);
router.post('/', createFileObject);
router.get('/:id', getFileObject);
router.patch('/:id', updateFileObject);
router.delete('/:id', deleteFileObject);

export const fileObjectRouter = router;
