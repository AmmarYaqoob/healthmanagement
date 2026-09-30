import { Router } from 'express';
import { createFolder, deleteFolder, getFolder, listFolders, updateFolder } from '../controllers/folder.controller';

const router = Router();

router.get('/', listFolders);
router.post('/', createFolder);
router.get('/:id', getFolder);
router.patch('/:id', updateFolder);
router.delete('/:id', deleteFolder);

export const folderRouter = router;
