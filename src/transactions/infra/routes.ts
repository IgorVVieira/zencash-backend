import multer from 'multer';

import { authMiddleware } from '@shared/middlewares/auth';
import { hasSubscriptionMiddleware } from '@shared/middlewares/has-subscription';

import { CategoryController } from '@transactions/controllers/category.controller';
import { DashboardController } from '@transactions/controllers/dashboard.controller';
import { TransactionImportController } from '@transactions/controllers/transaction-import.controller';
import { Router } from 'express';

import { container } from './container';
import { TransactionController } from '../controllers/transaction.controller';

const transactionController = container.resolve(TransactionController);
const categoryController = container.resolve(CategoryController);
const dashboardController = container.resolve(DashboardController);
const transactionImportController = container.resolve(TransactionImportController);

const transactionRouter = Router();

transactionRouter.post(
  '/transactions/import',
  authMiddleware,
  hasSubscriptionMiddleware,
  multer().single('statement'),
  (req, res) => transactionController.importOfx(req, res),
);

transactionRouter.get(
  '/transactions/dashboard/last-six-months/:month/:year',
  authMiddleware,
  (req, res) => dashboardController.listByLastSixMonths(req, res),
);

transactionRouter.get(
  '/transactions/dashboard/fixed-bills/:month/:year',
  authMiddleware,
  (req, res) => dashboardController.getFixedBillsSummary(req, res),
);

transactionRouter.put('/transactions/:id', authMiddleware, hasSubscriptionMiddleware, (req, res) =>
  transactionController.update(req, res),
);
transactionRouter.get('/transactions/:month/:year', authMiddleware, (req, res) =>
  transactionController.getTransactionsByDate(req, res),
);

transactionRouter.post('/categories', authMiddleware, hasSubscriptionMiddleware, (req, res) =>
  categoryController.create(req, res),
);
transactionRouter.put('/categories/:id', authMiddleware, hasSubscriptionMiddleware, (req, res) =>
  categoryController.update(req, res),
);
transactionRouter.get('/categories', authMiddleware, (req, res) =>
  categoryController.list(req, res),
);
transactionRouter.delete('/categories/:id', authMiddleware, hasSubscriptionMiddleware, (req, res) =>
  categoryController.delete(req, res),
);

transactionRouter.get(
  '/transactions/dashboard/payment-methods/:month/:year',
  authMiddleware,
  (req, res) => dashboardController.listByPaymentMethod(req, res),
);
transactionRouter.get(
  '/transactions/dashboard/categories/:month/:year/:transactionType',
  authMiddleware,
  (req, res) => dashboardController.listByCategory(req, res),
);

transactionRouter.get('/transaction-imports/get-pending', authMiddleware, (req, res) =>
  transactionImportController.getPendingImport(req, res),
);

export { transactionRouter };
