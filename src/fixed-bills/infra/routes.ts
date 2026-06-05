import { Router } from 'express';

import { authMiddleware } from '@shared/middlewares/auth';

import { FixedBillController } from '@fixed-bills/controllers/fixed-bill.controller';

import { container } from './container';

const fixedBillController = container.resolve(FixedBillController);

const fixedBillsRouter = Router();

fixedBillsRouter.post('/fixed-bills', authMiddleware, (req, res) =>
  fixedBillController.create(req, res),
);
fixedBillsRouter.get('/fixed-bills', authMiddleware, (req, res) =>
  fixedBillController.list(req, res),
);
fixedBillsRouter.put('/fixed-bills/:id', authMiddleware, (req, res) =>
  fixedBillController.update(req, res),
);
fixedBillsRouter.delete('/fixed-bills/:id', authMiddleware, (req, res) =>
  fixedBillController.delete(req, res),
);
fixedBillsRouter.get('/fixed-bills/occurrences', authMiddleware, (req, res) =>
  fixedBillController.listOccurrences(req, res),
);
fixedBillsRouter.patch('/fixed-bills/occurrences/:id', authMiddleware, (req, res) =>
  fixedBillController.updateOccurrence(req, res),
);
fixedBillsRouter.post('/fixed-bills/generate-occurrences', authMiddleware, (req, res) =>
  fixedBillController.generateOccurrences(req, res),
);

export { fixedBillsRouter };
