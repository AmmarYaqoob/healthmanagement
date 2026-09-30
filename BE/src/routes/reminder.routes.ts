import { Router } from 'express';
import { createReminder, deleteReminder, getReminder, listReminders, updateReminder } from '../controllers/reminder.controller';

const router = Router();

router.get('/', listReminders);
router.post('/', createReminder);
router.get('/:id', getReminder);
router.patch('/:id', updateReminder);
router.delete('/:id', deleteReminder);

export const reminderRouter = router;
