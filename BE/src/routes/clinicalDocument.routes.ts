import { Router } from 'express';
import { createClinicalDocument, deleteClinicalDocument, getClinicalDocument, listClinicalDocuments, updateClinicalDocument } from '../controllers/clinicalDocument.controller';

const router = Router();

router.get('/', listClinicalDocuments);
router.post('/', createClinicalDocument);
router.get('/:id', getClinicalDocument);
router.patch('/:id', updateClinicalDocument);
router.delete('/:id', deleteClinicalDocument);

export const clinicalDocumentRouter = router;
