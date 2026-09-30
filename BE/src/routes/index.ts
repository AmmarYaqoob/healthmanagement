import { Router } from 'express';
import { sendSuccess } from '../common/utils/response';
import { userRouter } from './user.routes';
import { sessionRouter } from './session.routes';
import { authChallengeRouter } from './authChallenge.routes';
import { patientRouter } from './patient.routes';
import { patientAccessRouter } from './patientAccess.routes';
import { medicationRouter } from './medication.routes';
import { labResultRouter } from './labResult.routes';
import { immunizationRouter } from './immunization.routes';
import { folderRouter } from './folder.routes';
import { fileObjectRouter } from './fileObject.routes';
import { clinicalDocumentRouter } from './clinicalDocument.routes';
import { reminderRouter } from './reminder.routes';
import { organizationRouter } from './organization.routes';
import { practitionerRouter } from './practitioner.routes';
import { accessGrantRouter } from './accessGrant.routes';
import { accessEventRouter } from './accessEvent.routes';
import { consentRouter } from './consent.routes';
import { deletionRequestRouter } from './deletionRequest.routes';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  sendSuccess(res, { message: 'API is running' });
});

apiRouter.use('/users', userRouter);
apiRouter.use('/sessions', sessionRouter);
apiRouter.use('/auth-challenges', authChallengeRouter);
apiRouter.use('/patients', patientRouter);
apiRouter.use('/patient-access', patientAccessRouter);
apiRouter.use('/medications', medicationRouter);
apiRouter.use('/lab-results', labResultRouter);
apiRouter.use('/immunizations', immunizationRouter);
apiRouter.use('/folders', folderRouter);
apiRouter.use('/file-objects', fileObjectRouter);
apiRouter.use('/clinical-documents', clinicalDocumentRouter);
apiRouter.use('/reminders', reminderRouter);
apiRouter.use('/organizations', organizationRouter);
apiRouter.use('/practitioners', practitionerRouter);
apiRouter.use('/access-grants', accessGrantRouter);
apiRouter.use('/access-events', accessEventRouter);
apiRouter.use('/consents', consentRouter);
apiRouter.use('/deletion-requests', deletionRequestRouter);
