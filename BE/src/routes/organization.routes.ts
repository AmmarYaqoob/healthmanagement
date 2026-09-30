import { Router } from 'express';
import { createOrganization, deleteOrganization, getOrganization, listOrganizations, updateOrganization } from '../controllers/organization.controller';

const router = Router();

router.get('/', listOrganizations);
router.post('/', createOrganization);
router.get('/:id', getOrganization);
router.patch('/:id', updateOrganization);
router.delete('/:id', deleteOrganization);

export const organizationRouter = router;
